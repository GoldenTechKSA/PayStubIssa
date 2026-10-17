import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { PayPalError } from '../src/services/paypal';
import { makeService, makeTelemetry, testConfig } from './helpers';

const H = { 'X-Telemetry-Session': 's_abcdefghij', 'X-Telemetry-Visitor': 'v_abcdefghij' };

function boot() {
  const { service, db, paypal } = makeService();
  const { telemetry, lines } = makeTelemetry(db);
  return { app: createApp({ config: testConfig, orders: service, telemetry }), db, paypal, lines };
}
const serverRows = (db: any) =>
  db.prepare(`SELECT code, session_id, visitor_id, props_json FROM telemetry_events WHERE source='server' ORDER BY id`).all();

describe('payment milestones', () => {
  it('logs 2101 and 2102 under the browser session id', async () => {
    const { app, db } = boot();
    const created = await request(app).post('/api/payments/orders').set(H).send({ items: [{ type: 'paystub', qty: 2 }] });
    expect(created.status).toBe(201);
    const cap = await request(app).post(`/api/payments/orders/${created.body.orderId}/capture`).set(H);
    expect(cap.status).toBe(200);

    const rows: any[] = serverRows(db);
    expect(rows.map(r => r.code)).toEqual([2101, 2102]);
    expect(rows[0]).toMatchObject({ session_id: 's_abcdefghij', visitor_id: 'v_abcdefghij' });
    expect(JSON.parse(rows[0].props_json)).toEqual({ orderId: created.body.orderId, totalCents: 1798 });
    expect(JSON.parse(rows[1].props_json)).toMatchObject({ orderId: created.body.orderId, capturedCents: 1798 });
  });

  it('logs 2103 with the error code when capture fails, and the response is unchanged', async () => {
    const { app, db, paypal } = boot();
    const created = await request(app).post('/api/payments/orders').set(H).send({ items: [{ type: 'paystub', qty: 1 }] });
    paypal.nextCapture = new PayPalError('declined', 422, 'INSTRUMENT_DECLINED');
    const cap = await request(app).post(`/api/payments/orders/${created.body.orderId}/capture`).set(H);
    expect(cap.status).toBeGreaterThanOrEqual(400);

    const rows: any[] = serverRows(db);
    expect(rows.map(r => r.code)).toEqual([2101, 2103]);
    expect(JSON.parse(rows[1].props_json)).toEqual({ orderId: created.body.orderId, code: cap.body.error.code });
  });

  it('stores NULL ids when the headers are missing or malformed', async () => {
    const { app, db } = boot();
    const created = await request(app)
      .post('/api/payments/orders')
      .set({ 'X-Telemetry-Session': 'garbage' })
      .send({ items: [{ type: 'paystub', qty: 1 }] });
    expect(created.status).toBe(201);
    expect(serverRows(db)[0]).toMatchObject({ session_id: null, visitor_id: null });
  });
});
