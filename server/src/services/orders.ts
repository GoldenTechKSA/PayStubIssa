/**
 * OrderService — the payment state machine.
 *
 *   createOrder   quote the cart → create the PayPal order → CREATED row
 *   captureOrder  capture at PayPal → verify status + amount → COMPLETED row → unlock token
 *   verifyUnlock  check a token's signature and that its order really completed
 *
 * Capture is idempotent: a repeated call for a COMPLETED order re-issues a token
 * instead of touching PayPal again, and concurrent calls for the same id are
 * serialized in-process.
 */
import type Database from 'better-sqlite3';
import type { OrderRow, OrderStatus } from '../db';
import { conflict, notFound, paymentRequired, badGateway, badRequest, unauthorized } from '../lib/errors';
import { issueUnlockToken, verifyUnlockToken, TokenError, type IssuedToken, type VerifiedUnlock } from '../lib/token';
import { quoteCart, PricingError, normalizeCouponCode, type CartInput, type Quote, type PricingRules } from './pricing';
import { PayPalError, type PayPalClient } from './paypal';

export interface ClientMeta {
  attestedAt?: string;
  templateId?: number | string;
  userAgent?: string;
  ip?: string;
}

export interface CreatedOrderResult {
  orderId: string;
  quote: Quote;
}

export interface CapturedOrderResult extends IssuedToken {
  orderId: string;
  status: 'COMPLETED';
  quote: Quote;
}

export interface OrderServiceDeps {
  db: Database.Database;
  paypal: PayPalClient;
  pricing: PricingRules;
  jwtSecret: string;
  tokenTtlMinutes: number;
  now?: () => Date;
}

export class OrderService {
  private readonly inFlight = new Map<string, Promise<CapturedOrderResult>>();
  private readonly now: () => Date;

  constructor(private readonly deps: OrderServiceDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  quote(cart: CartInput): Quote {
    try {
      return quoteCart(cart, this.deps.pricing);
    } catch (err) {
      if (err instanceof PricingError) throw badRequest(err.code, err.message);
      throw err;
    }
  }

  async createOrder(cart: CartInput, meta: ClientMeta = {}): Promise<CreatedOrderResult> {
    const quote = this.quote(cart);
    const description = quote.lines.map(l => l.description).join(', ');

    let created;
    try {
      created = await this.deps.paypal.createOrder({ quote, description });
    } catch (err) {
      throw this.wrapPayPal(err, 'We could not start the PayPal checkout. Please try again.');
    }

    const ts = this.now().toISOString();
    this.deps.db
      .prepare(
        `INSERT INTO orders (id, status, paypal_env, currency, total_cents, quote_json, coupon_code,
                             client_meta_json, created_at, updated_at)
         VALUES (@id, 'CREATED', @env, @currency, @total, @quote, @coupon, @meta, @ts, @ts)`,
      )
      .run({
        id: created.id,
        env: this.deps.paypal.env,
        currency: quote.currency,
        total: quote.totalCents,
        quote: JSON.stringify(quote),
        coupon: normalizeCouponCode(cart.couponCode) ?? null,
        meta: Object.keys(meta).length ? JSON.stringify(meta) : null,
        ts,
      });

    return { orderId: created.id, quote };
  }

  captureOrder(orderId: string): Promise<CapturedOrderResult> {
    const existing = this.inFlight.get(orderId);
    if (existing) return existing;
    const p = this.doCapture(orderId).finally(() => this.inFlight.delete(orderId));
    this.inFlight.set(orderId, p);
    return p;
  }

  private async doCapture(orderId: string): Promise<CapturedOrderResult> {
    const row = this.getRow(orderId);
    if (!row) throw notFound('ORDER_NOT_FOUND', 'Unknown order');
    const quote = JSON.parse(row.quote_json) as Quote;

    if (row.status === 'COMPLETED') {
      // Replay-safe: the money already moved; just hand back a fresh unlock.
      return { orderId, status: 'COMPLETED', quote, ...this.issue(row) };
    }
    if (row.status === 'FAILED') {
      throw conflict('ORDER_FAILED', row.failure_reason ?? 'This order can no longer be captured');
    }

    let result;
    try {
      result = await this.deps.paypal.captureOrder(orderId);
    } catch (err) {
      if (err instanceof PayPalError && err.issue === 'INSTRUMENT_DECLINED') {
        // Buyer can pick another funding source; leave the order CREATED.
        throw paymentRequired('INSTRUMENT_DECLINED', 'Your payment method was declined. Please try another one.');
      }
      throw this.wrapPayPal(err, 'We could not confirm the payment with PayPal. Please try again.');
    }

    const problems: string[] = [];
    if (result.status !== 'COMPLETED') problems.push(`order status ${result.status || 'unknown'}`);
    if (result.captureStatus !== 'COMPLETED') problems.push(`capture status ${result.captureStatus || 'missing'}`);
    if (result.currency !== row.currency) problems.push(`currency ${result.currency} != ${row.currency}`);
    if (result.capturedCents !== row.total_cents) problems.push(`amount ${result.capturedCents} != ${row.total_cents}`);

    if (problems.length > 0) {
      const reason = problems.join('; ');
      // PENDING captures (e.g. eCheck) are not failures — leave the order CREATED so a later
      // capture call can reconcile once PayPal settles it.
      const pending = result.captureStatus === 'PENDING' && problems.length === 2 && result.capturedCents === row.total_cents;
      if (!pending) this.setStatus(orderId, 'FAILED', { failure_reason: reason, capture_json: JSON.stringify(result.raw) });
      throw paymentRequired(pending ? 'PAYMENT_PENDING' : 'PAYMENT_NOT_VERIFIED',
        pending
          ? 'PayPal is still processing this payment. Please try again in a few minutes.'
          : `The payment could not be verified (${reason}).`);
    }

    const ts = this.now().toISOString();
    this.deps.db
      .prepare(
        `UPDATE orders SET status = 'COMPLETED', capture_id = @captureId, captured_cents = @cents,
                           capture_json = @raw, captured_at = @ts, updated_at = @ts
         WHERE id = @id`,
      )
      .run({ id: orderId, captureId: result.captureId, cents: result.capturedCents, raw: JSON.stringify(result.raw), ts });

    return { orderId, status: 'COMPLETED', quote, ...this.issue(this.getRow(orderId)!) };
  }

  verifyUnlock(token: string): VerifiedUnlock {
    let claims: VerifiedUnlock;
    try {
      claims = verifyUnlockToken(token, this.deps.jwtSecret);
    } catch (err) {
      if (err instanceof TokenError) throw unauthorized(err.reason === 'expired' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID', err.message);
      throw err;
    }
    const row = this.getRow(claims.orderId);
    if (!row || row.status !== 'COMPLETED') throw unauthorized('TOKEN_INVALID', 'Unlock token does not match a completed order');
    return claims;
  }

  getRow(orderId: string): OrderRow | undefined {
    return this.deps.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
  }

  private issue(row: OrderRow): IssuedToken {
    const quote = JSON.parse(row.quote_json) as Quote;
    const qty = quote.lines.reduce((sum, l) => sum + l.qty, 0);
    return issueUnlockToken(
      { orderId: row.id, qty, currency: row.currency, totalCents: row.total_cents },
      { secret: this.deps.jwtSecret, ttlMinutes: this.deps.tokenTtlMinutes, now: this.now() },
    );
  }

  private setStatus(orderId: string, status: OrderStatus, extra: Partial<Pick<OrderRow, 'failure_reason' | 'capture_json'>> = {}): void {
    this.deps.db
      .prepare(
        `UPDATE orders SET status = @status, failure_reason = COALESCE(@failure_reason, failure_reason),
                           capture_json = COALESCE(@capture_json, capture_json), updated_at = @ts
         WHERE id = @id`,
      )
      .run({ id: orderId, status, failure_reason: extra.failure_reason ?? null, capture_json: extra.capture_json ?? null, ts: this.now().toISOString() });
  }

  private wrapPayPal(err: unknown, userMessage: string) {
    if (err instanceof PayPalError) {
      console.error(`[paypal] ${err.httpStatus} ${err.issue ?? ''} debug_id=${err.debugId ?? '-'}: ${err.message}`);
      return badGateway('PAYPAL_ERROR', userMessage, { issue: err.issue, debugId: err.debugId });
    }
    console.error('[paypal] unexpected error', err);
    return badGateway('PAYPAL_ERROR', userMessage);
  }
}
