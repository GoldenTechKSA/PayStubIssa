import { describe, expect, it } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { openDatabase } from '../src/db';
import { TelemetryService } from '../src/services/telemetry';
import { scrubProps } from '../src/telemetry/scrub';
import { makeService, makeTelemetry, testConfig } from './helpers';

const ids = { visitorId: 'v_abcdefghij', sessionId: 's_abcdefghij' };
const H = { 'X-Telemetry-Session': ids.sessionId, 'X-Telemetry-Visitor': ids.visitorId };

describe('telemetry never blocks a payment', () => {
  it('capture still returns 200 when the telemetry insert fails', async () => {
    const { service, db, paypal } = makeService();
    const { telemetry, lines } = makeTelemetry(db);
    const app = createApp({ config: testConfig, orders: service, telemetry });
    const created = await request(app).post('/api/payments/orders').set(H).send({ items: [{ type: 'paystub', qty: 1 }] });
    expect(created.status).toBe(201);

    db.exec('DROP TABLE telemetry_events');
    const cap = await request(app).post(`/api/payments/orders/${created.body.orderId}/capture`).set(H);
    expect(cap.status).toBe(200);
    expect(cap.body.token).toBeTruthy();
    expect(paypal.captureCalls).toBe(1);
    expect(lines.some(l => l.startsWith('[2102] payments.order.captured'))).toBe(true);
  });
});

describe('table ceiling', () => {
  it('prune keeps only the newest maxRows rows', () => {
    const db = openDatabase(':memory:');
    const svc = new TelemetryService({ db, enabled: true, retentionDays: 90, maxRows: 5, out: () => {} });
    const ev = (i: number) => ({ code: 1002, name: 'page.viewed', level: 'info' as const, ts: Date.now(), props: { path: `/${i}` } });
    svc.ingest({ v: 1, ...ids, events: Array.from({ length: 8 }, (_, i) => ev(i)) });
    expect(svc.prune()).toBe(3);
    const rows: any[] = db.prepare('SELECT props_json FROM telemetry_events ORDER BY id').all();
    expect(rows.map(r => JSON.parse(r.props_json).path)).toEqual(['/3', '/4', '/5', '/6', '/7']);
  });
});

describe('scrub treats `name` as a step label only', () => {
  it('keeps the six wizard step labels and drops anything else', () => {
    for (const label of ['Company', 'Employee', 'Pay period', 'Earnings', 'Template', 'Review']) {
      expect(scrubProps({ name: label }).props).toEqual({ name: label });
    }
    const { props, removed } = scrubProps({ name: 'Jane Doe', step: 1 });
    expect(props).toEqual({ step: 1 });
    expect(removed).toEqual(['name']);
  });
});

describe('TELEMETRY_ENABLED parsing', () => {
  const base = {
    PAYSTUB_ENV_FILE: path.join('test', 'does-not-exist.env'),
    PAYPAL_CLIENT_ID: 'id',
    PAYPAL_CLIENT_SECRET: 'secret',
    JWT_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
  };
  it.each([
    ['false', false], ['FALSE', false], ['0', false], ['no', false], ['off', false],
    ['true', true], ['TRUE', true], ['1', true], ['yes', true], ['on', true],
  ])('%s → %s', (raw, expected) => {
    expect(loadConfig({ ...base, TELEMETRY_ENABLED: raw }).TELEMETRY_ENABLED).toBe(expected);
  });
  it('defaults to true and rejects nonsense', () => {
    expect(loadConfig({ ...base }).TELEMETRY_ENABLED).toBe(true);
    expect(() => loadConfig({ ...base, TELEMETRY_ENABLED: 'maybe' })).toThrow(/TELEMETRY_ENABLED/);
  });
});
