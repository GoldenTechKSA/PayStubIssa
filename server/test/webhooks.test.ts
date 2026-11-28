import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { createPayPalClient } from '../src/services/paypal';
import { FakePayPal, makeService, makeTelemetry, makeWebhooks, testConfig } from './helpers';

const HEADERS = {
  'paypal-transmission-id': 'tx-1',
  'paypal-transmission-time': '2026-11-27T10:00:00Z',
  'paypal-transmission-sig': 'sig==',
  'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1',
  'paypal-auth-algo': 'SHA256withRSA',
};

function boot(opts: { webhookId?: string } = { webhookId: 'WH-TEST' }) {
  const { service, paypal, db } = makeService();
  const { telemetry, lines } = makeTelemetry(db);
  const app = createApp({ config: testConfig, orders: service, telemetry, webhooks: makeWebhooks(db, paypal, opts) });
  const post = (event: unknown, headers: Record<string, string> = HEADERS) =>
    request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set(headers).send(JSON.stringify(event));
  const order = (id: string) => db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  const events = () => db.prepare('SELECT * FROM paypal_webhook_events ORDER BY received_at, id').all() as any[];
  return { app, service, paypal, db, lines, post, order, events };
}

/** One paid order through the normal browser flow: 2 stubs, 1598 cents, capture CAP-ORDER1. */
async function paidOrder(b: ReturnType<typeof boot>) {
  const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
  await b.service.captureOrder(orderId);
  return orderId;
}

let seq = 0;
const event = (type: string, resource: object) => ({ id: `WH-EVT-${++seq}`, event_type: type, resource_type: 'x', resource });
const completed = (orderId: string, value = '15.98', currency = 'USD') =>
  event('PAYMENT.CAPTURE.COMPLETED', {
    id: `CAP-${orderId}`,
    status: 'COMPLETED',
    amount: { currency_code: currency, value },
    supplementary_data: { related_ids: { order_id: orderId } },
  });
const refund = (captureId: string, value: string, total?: string) =>
  event('PAYMENT.CAPTURE.REFUNDED', {
    id: `REF-${++seq}`,
    status: 'COMPLETED',
    amount: { currency_code: 'USD', value },
    ...(total ? { seller_payable_breakdown: { total_refunded_amount: { currency_code: 'USD', value: total } } } : {}),
    links: [
      { rel: 'self', href: 'https://api.sandbox.paypal.com/v2/payments/refunds/REF-1' },
      { rel: 'up', href: `https://api.sandbox.paypal.com/v2/payments/captures/${captureId}` },
    ],
  });

describe('PayPal webhook: refusing what is not PayPal', () => {
  it('is refused while no webhook id is configured, without asking PayPal', async () => {
    const b = boot({ webhookId: undefined });
    const res = await b.post(completed('ORDER1'));
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('WEBHOOK_NOT_CONFIGURED');
    expect(b.paypal.verifyCalls).toHaveLength(0);
    expect((await request(b.app).get('/api/health')).body.webhook).toBe(false);
  });

  it('reports itself as configured on /api/health', async () => {
    expect((await request(boot().app).get('/api/health')).body.webhook).toBe(true);
  });

  it('refuses a request without the signature headers, without asking PayPal', async () => {
    const b = boot();
    const { 'paypal-transmission-sig': _sig, ...missing } = HEADERS;
    const res = await b.post(completed('ORDER1'), missing);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WEBHOOK_HEADERS');
    expect(b.paypal.verifyCalls).toHaveLength(0);
  });

  it('refuses a body that is not JSON or not an event', async () => {
    const b = boot();
    const notJson = await request(b.app).post('/api/payments/webhook').set(HEADERS).set('Content-Type', 'application/json').send('{nope');
    expect(notJson.status).toBe(400);
    expect(notJson.body.error.code).toBe('BAD_JSON');
    const notEvent = await b.post({ hello: 'world' });
    expect(notEvent.status).toBe(400);
    expect(notEvent.body.error.code).toBe('WEBHOOK_SHAPE');
    expect(b.paypal.verifyCalls).toHaveLength(0);
  });

  it('refuses an event PayPal does not vouch for, and changes nothing', async () => {
    const b = boot();
    const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
    b.paypal.verifyResult = false;
    const res = await b.post(completed(orderId));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('WEBHOOK_SIGNATURE');
    expect(b.order(orderId).status).toBe('CREATED');
    expect(b.events()).toHaveLength(0);
    expect(b.lines.some(l => l.includes('[2107] payments.webhook.rejected') && l.includes('WEBHOOK_SIGNATURE'))).toBe(true);
  });

  it('answers 502 when PayPal cannot be asked, so PayPal sends the event again', async () => {
    const b = boot();
    b.paypal.verifyResult = new Error('network down');
    const res = await b.post(completed('ORDER1'));
    expect(res.status).toBe(502);
    expect(b.events()).toHaveLength(0);
  });

  it('hands PayPal the body exactly as it arrived, with the configured webhook id', async () => {
    const b = boot();
    // Spacing and number formatting a re-serialisation would not preserve.
    const raw = '{ "id":"WH-RAW-1",  "event_type":"SOMETHING.ELSE", "resource":{"amount":{"value":"1.50"},"n":1.0} }';
    const res = await request(b.app).post('/api/payments/webhook').set(HEADERS).set('Content-Type', 'application/json').send(raw);
    expect(res.status).toBe(200);
    expect(b.paypal.verifyCalls[0].rawBody).toBe(raw);
    expect(b.paypal.verifyCalls[0].webhookId).toBe('WH-TEST');
    expect(b.paypal.verifyCalls[0].signature).toEqual({
      transmissionId: 'tx-1',
      transmissionTime: '2026-11-27T10:00:00Z',
      transmissionSig: 'sig==',
      certUrl: HEADERS['paypal-cert-url'],
      authAlgo: 'SHA256withRSA',
    });
  });
});

describe('PayPal webhook: payment completed', () => {
  it('completes an order the browser never reported', async () => {
    const b = boot();
    const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] }, {}, 'a'.repeat(64));
    const res = await b.post(completed(orderId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, outcome: 'completed' });
    const row = b.order(orderId);
    expect(row).toMatchObject({ status: 'COMPLETED', capture_id: `CAP-${orderId}`, captured_cents: 1598 });
    expect(row.captured_at).toBeTruthy();
    expect(b.lines.some(l => l.includes('[2106] payments.webhook.processed') && l.includes(orderId))).toBe(true);

    // The customer can still come back: a capture call now just hands out the unlock.
    const captures = b.paypal.captureCalls;
    const again = await b.service.captureOrder(orderId);
    expect(again.status).toBe('COMPLETED');
    expect(again.fingerprint).toBe('a'.repeat(64));
    expect(b.paypal.captureCalls).toBe(captures);
  });

  it('changes nothing for an order the browser flow already completed', async () => {
    const b = boot();
    const orderId = await paidOrder(b);
    const before = b.order(orderId);
    const res = await b.post(completed(orderId));
    expect(res.body.outcome).toBe('already_completed');
    expect(b.order(orderId)).toEqual(before);
  });

  it('does not complete an order for a different amount or currency', async () => {
    const b = boot();
    const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
    expect((await b.post(completed(orderId, '1.00'))).body.outcome).toBe('amount_mismatch');
    expect((await b.post(completed(orderId, '15.98', 'EUR'))).body.outcome).toBe('amount_mismatch');
    expect(b.order(orderId).status).toBe('CREATED');
    expect(b.lines.some(l => l.includes('[2108] payments.webhook.attention') && l.includes('amount_mismatch'))).toBe(true);
  });

  it('does not revive an order already marked FAILED', async () => {
    const b = boot();
    const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
    b.paypal.nextCapture = { capturedCents: 1 };
    await expect(b.service.captureOrder(orderId)).rejects.toMatchObject({ code: 'PAYMENT_NOT_VERIFIED' });
    expect((await b.post(completed(orderId))).body.outcome).toBe('order_failed');
    expect(b.order(orderId).status).toBe('FAILED');
  });

  it('acknowledges a payment this ledger does not know', async () => {
    const b = boot();
    const res = await b.post(completed('SOMEONE-ELSES-ORDER'));
    expect(res.status).toBe(200);
    expect(res.body.outcome).toBe('no_order');
    expect(b.events()[0]).toMatchObject({ event_type: 'PAYMENT.CAPTURE.COMPLETED', outcome: 'no_order', order_id: null, amount_cents: 1598 });
  });

  it('marks a pending order FAILED when PayPal denies the capture', async () => {
    const b = boot();
    const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
    const res = await b.post(event('PAYMENT.CAPTURE.DENIED', { id: 'CAP-X', supplementary_data: { related_ids: { order_id: orderId } } }));
    expect(res.body.outcome).toBe('denied');
    expect(b.order(orderId)).toMatchObject({ status: 'FAILED', failure_reason: 'capture denied by PayPal (webhook)' });
  });

  it('treats PAYMENT.CAPTURE.DECLINED the same as DENIED', async () => {
    const b = boot();
    const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
    const res = await b.post(event('PAYMENT.CAPTURE.DECLINED', { id: 'CAP-X', supplementary_data: { related_ids: { order_id: orderId } } }));
    expect(res.body.outcome).toBe('denied');
    expect(b.order(orderId).status).toBe('FAILED');
  });
});

describe('PayPal webhook: after the sale', () => {
  it('records a refund on the order, and the running total across partial refunds', async () => {
    const b = boot();
    const orderId = await paidOrder(b);
    expect((await b.post(refund(`CAP-${orderId}`, '5.00', '5.00'))).body.outcome).toBe('refunded');
    expect(b.order(orderId)).toMatchObject({ status: 'COMPLETED', refunded_cents: 500 });
    await b.post(refund(`CAP-${orderId}`, '10.98', '15.98'));
    expect(b.order(orderId).refunded_cents).toBe(1598);
    expect(b.order(orderId).refunded_at).toBeTruthy();
  });

  it('adds refunds up itself when PayPal sends no running total', async () => {
    const b = boot();
    const orderId = await paidOrder(b);
    await b.post(refund(`CAP-${orderId}`, '5.00'));
    await b.post(refund(`CAP-${orderId}`, '2.50'));
    expect(b.order(orderId).refunded_cents).toBe(750);
  });

  it('records a reversal and a dispute, and flags both for attention', async () => {
    const b = boot();
    const orderId = await paidOrder(b);
    const reversed = await b.post(
      event('PAYMENT.CAPTURE.REVERSED', {
        id: 'REV-1',
        amount: { currency_code: 'USD', value: '15.98' },
        links: [{ rel: 'up', href: `https://api.sandbox.paypal.com/v2/payments/captures/CAP-${orderId}` }],
      }),
    );
    expect(reversed.body.outcome).toBe('reversed');
    const disputed = await b.post(
      event('CUSTOMER.DISPUTE.CREATED', {
        dispute_id: 'PP-D-1',
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        dispute_amount: { currency_code: 'USD', value: '15.98' },
        disputed_transactions: [{ seller_transaction_id: `CAP-${orderId}`, buyer: { name: 'Jane Private' } }],
        messages: [{ content: 'a private message from the buyer' }],
      }),
    );
    expect(disputed.body.outcome).toBe('disputed');
    const row = b.order(orderId);
    expect(row.reversed_at).toBeTruthy();
    expect(row.disputed_at).toBeTruthy();
    expect(row.status).toBe('COMPLETED');
    expect(b.lines.filter(l => l.includes('[2108] payments.webhook.attention'))).toHaveLength(2);

    // Nothing of the buyer's is kept: not in the event log, not on the order, not in telemetry.
    const everything = JSON.stringify([b.events(), row, b.lines, b.db.prepare('SELECT * FROM telemetry_events').all()]);
    expect(everything).not.toContain('Jane Private');
    expect(everything).not.toContain('private message');
  });

  it('a refund for a capture this ledger does not know is acknowledged', async () => {
    const b = boot();
    expect((await b.post(refund('CAP-UNKNOWN', '5.00'))).body.outcome).toBe('no_order');
  });

  it('a refund or dispute does not take the paid stub away', async () => {
    // Deliberate for now: revoking access after a refund is a business decision that has
    // not been made. The ledger records the refund; the unlock keeps working.
    const b = boot();
    const { orderId } = await b.service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
    const paid = await b.service.captureOrder(orderId);
    await b.post(refund(`CAP-${orderId}`, '15.98', '15.98'));
    expect(b.service.verifyUnlock(paid.token).orderId).toBe(orderId);
  });
});

describe('PayPal webhook: bookkeeping', () => {
  it('applies an event once, however often PayPal sends it', async () => {
    const b = boot();
    const orderId = await paidOrder(b);
    const evt = refund(`CAP-${orderId}`, '5.00');
    expect((await b.post(evt)).body.outcome).toBe('refunded');
    const again = await b.post(evt);
    expect(again.status).toBe(200);
    expect(again.body.outcome).toBe('duplicate');
    expect(b.order(orderId).refunded_cents).toBe(500);
    expect(b.events()).toHaveLength(1);
  });

  it('records an event type it does not act on', async () => {
    const b = boot();
    const res = await b.post(event('CHECKOUT.ORDER.APPROVED', { id: 'ORDER9' }));
    expect(res.body).toEqual({ ok: true, outcome: 'ignored' });
    expect(b.events()[0]).toMatchObject({ event_type: 'CHECKOUT.ORDER.APPROVED', outcome: 'ignored' });
  });

  it('is not behind the payments rate limit or the 16 kB JSON limit', async () => {
    const b = boot();
    const big = event('CHECKOUT.ORDER.APPROVED', { id: 'ORDER9', padding: 'x'.repeat(40_000) });
    expect((await b.post(big)).status).toBe(200);
    for (let i = 0; i < 70; i += 1) await b.post(event('CHECKOUT.ORDER.APPROVED', { id: `O${i}` }));
    expect((await b.post(event('CHECKOUT.ORDER.APPROVED', { id: 'LAST' }))).status).toBe(200);
  });

  it('is deleted with the orders when the retention period ends', async () => {
    let now = new Date('2026-01-01T00:00:00Z');
    const { service, paypal, db } = makeService({ now: () => now, retentionDays: 30 });
    const webhooks = makeWebhooks(db, paypal, { webhookId: 'WH-TEST', now: () => now });
    await webhooks.receive(JSON.stringify(event('CHECKOUT.ORDER.APPROVED', { id: 'O1' })), {
      transmissionId: 't', transmissionTime: 't', transmissionSig: 's', certUrl: 'c', authAlgo: 'a',
    });
    const count = () => (db.prepare('SELECT COUNT(*) AS n FROM paypal_webhook_events').get() as any).n;
    now = new Date('2026-01-20T00:00:00Z');
    service.prune();
    expect(count()).toBe(1);
    now = new Date('2026-02-15T00:00:00Z');
    service.prune();
    expect(count()).toBe(0);
  });
});

describe('PayPal client: verify-webhook-signature', () => {
  function client(answer: { status: number; body: unknown }) {
    const calls: { url: string; init: any }[] = [];
    const fetchImpl = (async (url: string, init: any) => {
      calls.push({ url, init });
      if (url.endsWith('/v1/oauth2/token')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 });
      return new Response(JSON.stringify(answer.body), { status: answer.status });
    }) as unknown as typeof fetch;
    return { paypal: createPayPalClient({ env: 'sandbox', clientId: 'id', clientSecret: 'secret', fetchImpl }), calls };
  }
  const signature = { transmissionId: 'tx', transmissionTime: 'time', transmissionSig: 'sig', certUrl: 'https://cert', authAlgo: 'algo' };
  const rawBody = '{ "id":"WH-1",  "resource":{"n":1.0} }';

  it('posts the event untouched inside the verify request and reads SUCCESS', async () => {
    const { paypal, calls } = client({ status: 200, body: { verification_status: 'SUCCESS' } });
    expect(await paypal.verifyWebhookSignature({ signature, webhookId: 'WH-ID', rawBody })).toBe(true);
    const call = calls.find(c => c.url.endsWith('/v1/notifications/verify-webhook-signature'))!;
    expect(call.init.method).toBe('POST');
    expect(call.init.body).toContain(`"webhook_event":${rawBody}}`);
    expect(JSON.parse(call.init.body)).toMatchObject({
      auth_algo: 'algo', cert_url: 'https://cert', transmission_id: 'tx', transmission_sig: 'sig', transmission_time: 'time', webhook_id: 'WH-ID',
      webhook_event: { id: 'WH-1' },
    });
  });

  it('reads FAILURE as not verified, and throws when PayPal answers with an error', async () => {
    expect(await client({ status: 200, body: { verification_status: 'FAILURE' } }).paypal.verifyWebhookSignature({ signature, webhookId: 'WH-ID', rawBody })).toBe(false);
    await expect(client({ status: 500, body: { name: 'INTERNAL_SERVER_ERROR' } }).paypal.verifyWebhookSignature({ signature, webhookId: 'WH-ID', rawBody })).rejects.toThrow();
  });
});

// Keeps FakePayPal honest about the interface it stands in for.
const _typecheck: FakePayPal['verifyWebhookSignature'] extends (...a: any[]) => Promise<boolean> ? true : never = true;
void _typecheck;
