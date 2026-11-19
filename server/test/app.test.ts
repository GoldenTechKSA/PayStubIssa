import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { issueCorrectionCode } from '../src/services/correction-codes';
import { makeService, makeTelemetry, testConfig } from './helpers';

function boot() {
  const { service, paypal, db } = makeService();
  const app = createApp({ config: testConfig, orders: service, telemetry: makeTelemetry(db).telemetry });
  return { app, paypal, service };
}

describe('HTTP API', () => {
  it('GET /api/health', async () => {
    const { app } = boot();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, env: 'test', paypalEnv: 'sandbox' });
  });

  it('GET /api/payments/config exposes only public settings', async () => {
    const { app } = boot();
    const res = await request(app).get('/api/payments/config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      paypalEnv: 'sandbox',
      clientId: 'test-client-id',
      currency: 'USD',
      unitCents: { paystub: 899 },
      tiers: [
        { minQty: 1, maxQty: 1, unitCents: 899 },
        { minQty: 2, maxQty: 4, unitCents: 799 },
        { minQty: 5, maxQty: 8, unitCents: 699 },
        { minQty: 9, maxQty: 12, unitCents: 599 },
      ],
      maxQty: 12,
    });
    expect(JSON.stringify(res.body)).not.toContain('test-secret');
  });

  it('POST /api/payments/quote validates and prices', async () => {
    const { app } = boot();
    const ok = await request(app).post('/api/payments/quote').send({ items: [{ type: 'paystub', qty: 2 }] });
    expect(ok.status).toBe(200);
    expect(ok.body.quote.totalCents).toBe(1598);

    const bad = await request(app).post('/api/payments/quote').send({ items: [{ type: 'paystub', qty: '2' }] });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION');

    const tooMany = await request(app).post('/api/payments/quote').send({ items: [{ type: 'paystub', qty: 13 }] });
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.error.code).toBe('INVALID_QTY');

    const notJson = await request(app).post('/api/payments/quote').set('Content-Type', 'application/json').send('{nope');
    expect(notJson.status).toBe(400);
    expect(notJson.body.error.code).toBe('BAD_JSON');
  });

  it('runs the full create → capture → verify flow', async () => {
    const { app, paypal } = boot();

    const created = await request(app)
      .post('/api/payments/orders')
      .send({ items: [{ type: 'paystub', qty: 1 }], meta: { attestedAt: '2026-10-10T10:00:00Z', templateId: 0, termsVersion: '2026-11-01' } });
    expect(created.status).toBe(201);
    expect(created.body.orderId).toBe('ORDER1');
    expect(created.body.quote.totalCents).toBe(899);
    expect(paypal.created.get('ORDER1')!.quote.totalCents).toBe(899);

    const captured = await request(app).post('/api/payments/orders/ORDER1/capture');
    expect(captured.status).toBe(200);
    expect(captured.body.status).toBe('COMPLETED');
    expect(captured.body.token).toBeTypeOf('string');

    const verified = await request(app).post('/api/payments/unlock/verify').send({ token: captured.body.token });
    expect(verified.status).toBe(200);
    expect(verified.body).toMatchObject({ valid: true, orderId: 'ORDER1', qty: 1 });

    const forged = await request(app).post('/api/payments/unlock/verify').send({ token: captured.body.token + 'x' });
    expect(forged.status).toBe(401);
    expect(forged.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rejects a malformed fingerprint with VALIDATION', async () => {
    const { app } = boot();
    const res = await request(app).post('/api/payments/orders').send({ items: [{ type: 'paystub', qty: 1 }], fingerprint: 'xyz' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('rejects unknown meta fields and bad order ids', async () => {
    const { app } = boot();
    const extra = await request(app).post('/api/payments/orders').send({ items: [{ type: 'paystub', qty: 1 }], meta: { amount: 0.01 } });
    expect(extra.status).toBe(400);

    const weird = await request(app).post('/api/payments/orders/../../etc/capture');
    expect([400, 404]).toContain(weird.status);

    const missing = await request(app).post('/api/payments/orders/NOPE/capture');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  describe('a free corrected order', () => {
    async function bootWithCode() {
      const { service, paypal, db } = makeService();
      const app = createApp({ config: testConfig, orders: service, telemetry: makeTelemetry(db).telemetry });
      const { orderId } = await service.createOrder({ items: [{ type: 'paystub', qty: 2 }] });
      await service.captureOrder(orderId);
      const { code } = issueCorrectionCode(db, orderId, { now: new Date(), ttlDays: 14 });
      return { app, db, paypal, code };
    }
    const codes = (db: any) =>
      (db.prepare(`SELECT code FROM telemetry_events WHERE source='server' ORDER BY id`).all() as Array<{ code: number }>).map(r => r.code);

    it('completes with a fingerprint: returns `completed`, stores content_fp and logs [2105]', async () => {
      const { app, db, code } = await bootWithCode();
      const fp = 'd'.repeat(64);
      const res = await request(app).post('/api/payments/orders')
        .send({ items: [{ type: 'paystub', qty: 2 }], couponCode: code, fingerprint: fp });
      expect(res.status).toBe(201);
      expect(res.body.completed).toMatchObject({ orderId: res.body.orderId, status: 'COMPLETED', fingerprint: fp });
      expect(res.body.completed.token).toBeTypeOf('string');
      expect(db.prepare('SELECT content_fp FROM orders WHERE id = ?').get(res.body.orderId)).toEqual({ content_fp: fp });
      expect(codes(db)).toEqual([2101, 2105]);
    });

    it('is refused without a fingerprint, and the code stays unused', async () => {
      const { app, db, code } = await bootWithCode();
      const res = await request(app).post('/api/payments/orders')
        .send({ items: [{ type: 'paystub', qty: 2 }], couponCode: code });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('FINGERPRINT_REQUIRED');
      expect(db.prepare('SELECT used_at FROM correction_codes WHERE code = ?').get(code)).toEqual({ used_at: null });
      expect(codes(db)).not.toContain(2105);
    });
  });

  it('404s unknown routes as JSON', async () => {
    const { app } = boot();
    const res = await request(app).get('/api/nothing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
