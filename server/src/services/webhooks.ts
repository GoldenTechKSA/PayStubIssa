/**
 * WebhookService — what PayPal tells the server directly, without the customer's browser.
 *
 * The browser drives the normal flow (create → capture). A webhook is PayPal calling
 * POST /api/payments/webhook on its own when something happens to a payment, including things
 * no browser ever reports: a refund issued from the PayPal dashboard, a chargeback, a dispute,
 * or a pending payment (eCheck) that settles hours later.
 *
 *   receive   verify the signature with PayPal → record the event once → apply it to the order
 *
 * Nothing here is trusted until PayPal's own verify API says the message is theirs. An event is
 * applied at most once (PayPal re-sends until it gets a 2xx), and an event for a payment that is
 * not in the ledger is recorded and acknowledged, never an error.
 *
 * What is stored about an event is ids, the event type, an amount and what was done. The body
 * itself is not kept: a dispute carries the buyer's name and messages.
 */
import type Database from 'better-sqlite3';
import type { OrderRow } from '../db';
import { badGateway, badRequest, HttpError } from '../lib/errors';
import { moneyToCents } from './pricing';
import type { PayPalClient, WebhookSignature } from './paypal';

export type WebhookOutcome =
  | 'completed' // a CREATED order was marked paid from the webhook
  | 'already_completed' // the browser flow had already recorded it
  | 'amount_mismatch' // PayPal captured a different amount or currency than was quoted
  | 'order_failed' // PayPal says paid, the ledger says FAILED: needs a look
  | 'denied' // a pending capture was denied; the order is marked FAILED
  | 'refunded'
  | 'reversed' // chargeback or bank reversal
  | 'disputed'
  | 'no_order' // a payment this ledger does not know (another integration, or pruned)
  | 'ignored' // an event type that needs no action
  | 'duplicate'; // already processed

/** Outcomes someone should look at; logged at warn level. */
export const ATTENTION_OUTCOMES: readonly WebhookOutcome[] = ['amount_mismatch', 'order_failed', 'reversed', 'disputed', 'denied'];

export interface WebhookResult {
  eventId: string;
  eventType: string;
  outcome: WebhookOutcome;
  orderId?: string;
}

export interface WebhookServiceDeps {
  db: Database.Database;
  paypal: PayPalClient;
  /** The id PayPal gave the webhook when it was created in the dashboard. Unset = not configured. */
  webhookId?: string;
  now?: () => Date;
}

/** PayPal sends these five headers with every webhook; all are needed to verify it. */
export function readSignature(header: (name: string) => string | undefined): WebhookSignature | null {
  const sig = {
    transmissionId: header('paypal-transmission-id'),
    transmissionTime: header('paypal-transmission-time'),
    transmissionSig: header('paypal-transmission-sig'),
    certUrl: header('paypal-cert-url'),
    authAlgo: header('paypal-auth-algo'),
  };
  return Object.values(sig).every(v => typeof v === 'string' && v.length > 0 && v.length <= 2048)
    ? (sig as WebhookSignature)
    : null;
}

const cents = (amount: any): number | null => {
  try {
    return amount?.value != null ? moneyToCents(String(amount.value)) : null;
  } catch {
    return null;
  }
};

/** A refund or reversal points at its capture through a link: .../v2/payments/captures/<id>. */
const captureIdFromLinks = (resource: any): string | null => {
  const links: any[] = Array.isArray(resource?.links) ? resource.links : [];
  for (const link of links) {
    const m = /\/captures\/([A-Za-z0-9_-]+)/.exec(String(link?.href ?? ''));
    if (m && (link?.rel === 'up' || link?.rel === 'capture')) return m[1];
  }
  return null;
};

const text = (v: unknown, max = 128): string | null => (typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null);

interface Applied {
  outcome: WebhookOutcome;
  orderId?: string;
  captureId?: string | null;
  amountCents?: number | null;
}

export class WebhookService {
  private readonly now: () => Date;

  constructor(private readonly deps: WebhookServiceDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  get configured(): boolean {
    return Boolean(this.deps.webhookId);
  }

  /**
   * Verify, record and apply one webhook delivery. `rawBody` is the request body exactly as
   * received: PayPal signs those bytes, so it is passed to the verify call untouched.
   */
  async receive(rawBody: string, signature: WebhookSignature | null): Promise<WebhookResult> {
    const webhookId = this.deps.webhookId;
    if (!webhookId) throw new HttpError(503, 'WEBHOOK_NOT_CONFIGURED', 'Webhooks are not configured on this server');
    if (!signature) throw badRequest('WEBHOOK_HEADERS', 'Missing PayPal signature headers');

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw badRequest('BAD_JSON', 'Request body is not valid JSON');
    }
    const eventId = text(event?.id);
    const eventType = text(event?.event_type);
    if (!eventId || !eventType || typeof event?.resource !== 'object' || event.resource === null) {
      throw badRequest('WEBHOOK_SHAPE', 'Not a PayPal webhook event');
    }

    let verified: boolean;
    try {
      verified = await this.deps.paypal.verifyWebhookSignature({ signature, webhookId, rawBody });
    } catch (err) {
      // PayPal re-sends on a non-2xx, so a verify outage only delays the event.
      console.error('[paypal] webhook verification call failed', err);
      throw badGateway('PAYPAL_ERROR', 'Could not verify the webhook with PayPal');
    }
    if (!verified) throw badRequest('WEBHOOK_SIGNATURE', 'Webhook signature could not be verified');

    return this.apply(eventId, eventType, event.resource);
  }

  /** Record the event and act on it in one transaction, so a crash leaves neither half behind. */
  private apply(eventId: string, eventType: string, resource: any): WebhookResult {
    const { db } = this.deps;
    const ts = this.now().toISOString();

    return db.transaction((): WebhookResult => {
      const inserted = db
        .prepare(
          `INSERT OR IGNORE INTO paypal_webhook_events (id, event_type, received_at, outcome)
           VALUES (?, ?, ?, 'ignored')`,
        )
        .run(eventId, eventType, ts);
      if (inserted.changes !== 1) return { eventId, eventType, outcome: 'duplicate' };

      const applied = this.act(eventType, resource, ts);
      db.prepare(
        `UPDATE paypal_webhook_events
         SET outcome = @outcome, order_id = @orderId, capture_id = @captureId, amount_cents = @amount
         WHERE id = @id`,
      ).run({
        id: eventId,
        outcome: applied.outcome,
        orderId: applied.orderId ?? null,
        captureId: applied.captureId ?? null,
        amount: applied.amountCents ?? null,
      });
      return { eventId, eventType, outcome: applied.outcome, ...(applied.orderId ? { orderId: applied.orderId } : {}) };
    })();
  }

  private act(eventType: string, resource: any, ts: string): Applied {
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        return this.captureCompleted(resource, ts);
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': // the name PayPal's Payments v2 event list uses
        return this.captureDenied(resource, ts);
      case 'PAYMENT.CAPTURE.REFUNDED':
        return this.captureRefunded(resource, ts);
      case 'PAYMENT.CAPTURE.REVERSED':
        return this.captureReversed(resource, ts);
      case 'CUSTOMER.DISPUTE.CREATED':
        return this.disputeCreated(resource, ts);
      default:
        return { outcome: 'ignored' };
    }
  }

  /** The order a capture belongs to: PayPal names the order id; fall back to the capture id. */
  private orderForCapture(resource: any): OrderRow | undefined {
    const orderId = text(resource?.supplementary_data?.related_ids?.order_id);
    const byOrder = orderId ? this.byId(orderId) : undefined;
    if (byOrder) return byOrder;
    const captureId = text(resource?.id);
    return captureId ? this.byCaptureId(captureId) : undefined;
  }

  private captureCompleted(resource: any, ts: string): Applied {
    const captureId = text(resource?.id);
    const amountCents = cents(resource?.amount);
    const row = this.orderForCapture(resource);
    if (!row) return { outcome: 'no_order', captureId, amountCents };
    const base = { orderId: row.id, captureId, amountCents };

    if (row.status === 'COMPLETED') return { outcome: 'already_completed', ...base };
    if (row.status === 'FAILED') return { outcome: 'order_failed', ...base };
    if (amountCents !== row.total_cents || resource?.amount?.currency_code !== row.currency) {
      return { outcome: 'amount_mismatch', ...base };
    }
    // The browser never reported this payment (closed tab, lost connection, or a pending
    // payment that settled later). `status = 'CREATED'` guards against a capture that the
    // browser flow records at the same moment.
    this.deps.db
      .prepare(
        `UPDATE orders SET status = 'COMPLETED', capture_id = @captureId, captured_cents = @cents,
                           capture_json = @raw, captured_at = @ts, updated_at = @ts
         WHERE id = @id AND status = 'CREATED'`,
      )
      .run({ id: row.id, captureId, cents: amountCents, raw: JSON.stringify(resource), ts });
    return { outcome: 'completed', ...base };
  }

  private captureDenied(resource: any, ts: string): Applied {
    const captureId = text(resource?.id);
    const row = this.orderForCapture(resource);
    if (!row) return { outcome: 'no_order', captureId };
    if (row.status === 'CREATED') {
      this.deps.db
        .prepare(`UPDATE orders SET status = 'FAILED', failure_reason = ?, updated_at = ? WHERE id = ? AND status = 'CREATED'`)
        .run('capture denied by PayPal (webhook)', ts, row.id);
    }
    return { outcome: 'denied', orderId: row.id, captureId };
  }

  private captureRefunded(resource: any, ts: string): Applied {
    const captureId = captureIdFromLinks(resource);
    const amountCents = cents(resource?.amount);
    const row = captureId ? this.byCaptureId(captureId) : undefined;
    if (!row) return { outcome: 'no_order', captureId, amountCents };
    // PayPal reports the running total across partial refunds; without it, add this one up.
    const total = cents(resource?.seller_payable_breakdown?.total_refunded_amount);
    const refunded = total ?? (row.refunded_cents ?? 0) + (amountCents ?? 0);
    this.deps.db
      .prepare('UPDATE orders SET refunded_cents = ?, refunded_at = ?, updated_at = ? WHERE id = ?')
      .run(refunded, ts, ts, row.id);
    return { outcome: 'refunded', orderId: row.id, captureId, amountCents };
  }

  private captureReversed(resource: any, ts: string): Applied {
    const captureId = captureIdFromLinks(resource) ?? text(resource?.id);
    const amountCents = cents(resource?.amount);
    const row = captureId ? this.byCaptureId(captureId) : undefined;
    if (!row) return { outcome: 'no_order', captureId, amountCents };
    this.deps.db.prepare('UPDATE orders SET reversed_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, row.id);
    return { outcome: 'reversed', orderId: row.id, captureId, amountCents };
  }

  private disputeCreated(resource: any, ts: string): Applied {
    const transactions: any[] = Array.isArray(resource?.disputed_transactions) ? resource.disputed_transactions : [];
    const amountCents = cents(resource?.dispute_amount);
    for (const tx of transactions) {
      const captureId = text(tx?.seller_transaction_id);
      const row = captureId ? this.byCaptureId(captureId) : undefined;
      if (row) {
        this.deps.db.prepare('UPDATE orders SET disputed_at = ?, updated_at = ? WHERE id = ?').run(ts, ts, row.id);
        return { outcome: 'disputed', orderId: row.id, captureId, amountCents };
      }
    }
    return { outcome: 'no_order', captureId: text(transactions[0]?.seller_transaction_id), amountCents };
  }

  private byId(orderId: string): OrderRow | undefined {
    return this.deps.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
  }

  private byCaptureId(captureId: string): OrderRow | undefined {
    return this.deps.db.prepare('SELECT * FROM orders WHERE capture_id = ?').get(captureId) as OrderRow | undefined;
  }
}
