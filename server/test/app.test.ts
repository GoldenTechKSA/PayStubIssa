import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { makeService, testConfig } from './helpers';

function boot() {
  const { service, paypal } = makeService();
  const app = createApp({ config: testConfig, orders: service });
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
      maxQty: 12,
    });
    expect(JSON.stringify(res.body)).not.toContain('test-secret');
  });

  it('POST /api/payments/quote validates and prices', async () => {
    const { app } = boot();
    const ok = await request(app).post('/api/payments/quote').send({ items: [{ type: 'paystub', qty: 2 }] });
    expect(ok.status).toBe(200);
    expect(ok.body.quote.totalCents).toBe(1798);

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
      .send({ items: [{ type: 'paystub', qty: 1 }], meta: { attestedAt: '2026-10-10T10:00:00Z', templateId: 0 } });
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

  it('404s unknown routes as JSON', async () => {
    const { app } = boot();
    const res = await request(app).get('/api/nothing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
