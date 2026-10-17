import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { makeService, makeTelemetry, testConfig } from './helpers';

const ids = { visitorId: 'v_abcdefghij', sessionId: 's_abcdefghij' };
const good = () => ({
  v: 1,
  ...ids,
  events: [{ code: 1103, name: 'wizard.step.completed', level: 'info', ts: Date.now(), props: { step: 1, name: 'Employee' } }],
});

function boot(enabled = true) {
  const { service, db } = makeService();
  const { telemetry, lines } = makeTelemetry(db, { enabled });
  return { app: createApp({ config: testConfig, orders: service, telemetry }), db, lines };
}
const count = (db: any) => (db.prepare('SELECT COUNT(*) AS n FROM telemetry_events').get() as any).n;

describe('POST /api/telemetry', () => {
  it('stores a valid JSON batch and answers 204', async () => {
    const { app, db, lines } = boot();
    const res = await request(app).post('/api/telemetry').send(good());
    expect(res.status).toBe(204);
    expect(count(db)).toBe(1);
    expect(lines).toContain('[2001] telemetry.batch.accepted {"count":1}');
  });

  it('accepts a text/plain beacon body', async () => {
    const { app, db } = boot();
    const res = await request(app).post('/api/telemetry').set('Content-Type', 'text/plain').send(JSON.stringify(good()));
    expect(res.status).toBe(204);
    expect(count(db)).toBe(1);
  });

  it.each([
    ['wrong version', { ...good(), v: 2 }],
    ['bad session id', { ...good(), sessionId: 'nope' }],
    ['server code from client', { ...good(), events: [{ ...good().events[0], code: 2101 }] }],
    ['empty events', { ...good(), events: [] }],
    ['stale ts', { ...good(), events: [{ ...good().events[0], ts: Date.now() - 8 * 86400000 }] }],
    ['nested props', { ...good(), events: [{ ...good().events[0], props: { a: { b: 1 } } }] }],
    ['long string', { ...good(), events: [{ ...good().events[0], props: { message: 'x'.repeat(501) } }] }],
  ])('rejects %s with 400', async (_label, body) => {
    const { app, db, lines } = boot();
    const res = await request(app).post('/api/telemetry').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
    expect(count(db)).toBe(0);
    expect(lines.some(l => l.startsWith('[2002] telemetry.batch.rejected'))).toBe(true);
  });

  it('rejects 101 events', async () => {
    const { app } = boot();
    const e = good().events[0];
    const res = await request(app).post('/api/telemetry').send({ ...good(), events: Array.from({ length: 101 }, () => e) });
    expect(res.status).toBe(400);
  });

  it('accepts a 60 KB body that the global 16 KB parser would refuse', async () => {
    const { app } = boot();
    const e = { ...good().events[0], props: { message: 'y'.repeat(500) } };
    const res = await request(app).post('/api/telemetry').send({ ...good(), events: Array.from({ length: 100 }, () => e) });
    expect(res.status).toBe(204);
  });

  it('answers 204 without storing when TELEMETRY_ENABLED=false', async () => {
    const { app, db } = boot(false);
    const res = await request(app).post('/api/telemetry').send(good());
    expect(res.status).toBe(204);
    expect(count(db)).toBe(0);
  });
});
