import { describe, expect, it } from 'vitest';
import { openDatabase } from '../src/db';
import { TelemetryService, type IncomingBatch } from '../src/services/telemetry';
import { S } from '../src/telemetry/codes';

const ids = { visitorId: 'v_abcdefghij', sessionId: 's_abcdefghij' };
const ev = (code: number, name: string, props?: Record<string, any>, level: 'info' | 'warn' | 'error' = 'info') =>
  ({ code, name, level, ts: Date.now(), props });

function boot(overrides: Partial<{ enabled: boolean; retentionDays: number; now: () => Date }> = {}) {
  const db = openDatabase(':memory:');
  const lines: string[] = [];
  const svc = new TelemetryService({
    db,
    enabled: overrides.enabled ?? true,
    retentionDays: overrides.retentionDays ?? 90,
    now: overrides.now,
    out: l => lines.push(l),
  });
  return { db, svc, lines };
}

describe('TelemetryService', () => {
  it('migration creates the table and the view', () => {
    const { db } = boot();
    const names = db
      .prepare(`SELECT name FROM sqlite_master WHERE name IN ('telemetry_events','telemetry_sessions')`)
      .all()
      .map((r: any) => r.name)
      .sort();
    expect(names).toEqual(['telemetry_events', 'telemetry_sessions']);
  });

  it('ingest stores scrubbed rows with the right columns', () => {
    const { db, svc, lines } = boot();
    const batch: IncomingBatch = { v: 1, ...ids, events: [ev(1103, 'wizard.step.completed', { step: 2, employeeName: 'Jane' })] };
    const r = svc.ingest(batch, 'Mozilla/5.0 test');
    expect(r).toEqual({ stored: 1, scrubbed: ['employeeName'] });
    const row: any = db.prepare('SELECT * FROM telemetry_events').get();
    expect(row).toMatchObject({
      source: 'client',
      visitor_id: ids.visitorId,
      session_id: ids.sessionId,
      code: 1103,
      name: 'wizard.step.completed',
      level: 'info',
      user_agent: 'Mozilla/5.0 test',
    });
    expect(JSON.parse(row.props_json)).toEqual({ step: 2 });
    expect(lines.some(l => l.startsWith('[2003] telemetry.scrubbed'))).toBe(true);
  });

  it('ingest stores nothing when disabled but still reports', () => {
    const { db, svc } = boot({ enabled: false });
    expect(svc.ingest({ v: 1, ...ids, events: [ev(1001, 'app.loaded')] })).toEqual({ stored: 0, scrubbed: [] });
    expect(db.prepare('SELECT COUNT(*) AS n FROM telemetry_events').get()).toEqual({ n: 0 });
  });

  it('log prints every code but only persists 21xx', () => {
    const { db, svc, lines } = boot();
    svc.log(S.TELEMETRY_BATCH_ACCEPTED, { count: 3 }, ids);
    svc.log(S.PAYMENTS_ORDER_CAPTURED, { orderId: 'O1', captureId: 'C1', capturedCents: 899 }, ids);
    expect(lines).toEqual([
      '[2001] telemetry.batch.accepted {"count":3}',
      '[2102] payments.order.captured {"orderId":"O1","captureId":"C1","capturedCents":899}',
    ]);
    const rows: any[] = db.prepare('SELECT source, code, session_id FROM telemetry_events').all();
    expect(rows).toEqual([{ source: 'server', code: 2102, session_id: ids.sessionId }]);
  });

  it('view reports a paid session after a declined-then-captured order', () => {
    const { db, svc } = boot();
    svc.ingest({
      v: 1,
      ...ids,
      events: [
        ev(1101, 'wizard.entered', { draftRestored: false }),
        ev(1103, 'wizard.step.completed', { step: 0, name: 'Company' }),
        ev(1103, 'wizard.step.completed', { step: 3, name: 'Earnings' }),
        ev(1201, 'template.selected', { templateId: 4 }),
        ev(1302, 'payment.order_created', { orderId: 'O1' }),
      ],
    });
    svc.log(S.PAYMENTS_CAPTURE_FAILED, { orderId: 'O1', code: 'INSTRUMENT_DECLINED' }, ids);
    svc.log(S.PAYMENTS_ORDER_CAPTURED, { orderId: 'O1', captureId: 'C1', capturedCents: 899 }, ids);
    svc.ingest({
      v: 1,
      ...ids,
      events: [
        ev(1304, 'payment.succeeded', { orderId: 'O1', amountCents: 899, currency: 'USD', stubCount: 1, templateId: 4 }),
        ev(1401, 'print.clicked'),
      ],
    });
    const s: any = db.prepare('SELECT * FROM telemetry_sessions WHERE session_id = ?').get(ids.sessionId);
    expect(s).toMatchObject({
      visitor_id: ids.visitorId,
      events: 9,
      entered_wizard: 1,
      max_step_completed: 3,
      picked_template: 1,
      started_payment: 1,
      paid: 1,
      order_id: 'O1',
      printed_or_downloaded: 1,
      errors: 1,
    });
  });

  it('prune deletes only rows older than the retention window', () => {
    let t = new Date('2026-01-01T00:00:00Z');
    const { db, svc } = boot({ retentionDays: 90, now: () => t });
    svc.ingest({ v: 1, ...ids, events: [ev(1001, 'app.loaded')] });
    t = new Date('2026-06-01T00:00:00Z');
    svc.ingest({ v: 1, ...ids, events: [ev(1001, 'app.loaded')] });
    expect(svc.prune()).toBe(1);
    expect(db.prepare('SELECT COUNT(*) AS n FROM telemetry_events').get()).toEqual({ n: 1 });
  });
});
