# Telemetry Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every user journey through the site lands as `[NNNN]`-coded rows in a `telemetry_events` SQLite table the owner can query, including server-side payment milestones under the same session id.

**Architecture:** A code registry on each side (client 1000–1999, server 2000–2999) is the single source of event identity. The browser service batches `emit(SITE, props)` calls to `POST /api/telemetry`; the Express route validates with zod, scrubs PII, and inserts. The payments router logs its milestones through the same service using session/visitor ids the client sends as request headers. A `telemetry_sessions` SQL view turns rows into one funnel line per visit.

**Tech Stack:** React 19 + CRA/jest (client), Express 5 + better-sqlite3 + zod + vitest/supertest (server). New client devDependencies: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`.

**Spec:** `docs/superpowers/specs/2026-10-17-telemetry-pipeline-design.md`

## Global Constraints

- **No git commits in this plan.** The owner's rule: commit locally only when explicitly asked. Each task ends at "tests pass"; the owner decides when to commit.
- Code ranges: client `1000–1999`, server `2000–2999`; one emit site per code; registry entry shape `{ code, name, level }`, `name` matches `^[a-z0-9_.]{1,64}$`, `level ∈ info | warn | error`.
- Console line format everywhere: `[1103] wizard.step.completed {"step":2}`.
- Id format: `^[vs]_[A-Za-z0-9_-]{8,48}$` (`v_` visitor, `s_` session).
- Wire: `{ v: 1, visitorId, sessionId, events: [{ code, name, level, ts, props? }] }`, 1–100 events, `ts` within ±7 days of server time, `props` flat (string ≤ 500 chars / number / boolean / null), ≤ 32 keys, JSON ≤ 2 KB. Body limit 64 KB. Rate limit 600 / 15 min / IP. Success is `204`.
- Headers on payment calls: `X-Telemetry-Session`, `X-Telemetry-Visitor`.
- Browser: batch size 10, flush every 10 s, queue cap 200, session idle rollover 30 min, `emit` is a no-op when `process.env.NODE_ENV === 'test'`.
- Server: `TELEMETRY_ENABLED` (default `true`), `TELEMETRY_RETENTION_DAYS` (default `90`), prune at boot and every 24 h.
- Privacy: client never emits form values; server scrub always on; scrub never drops the event itself.
- Server files use single quotes and 2-space indent like the existing `server/src`; client files follow the file they are in.
- `localStorage` / `sessionStorage` access is wrapped in try/catch everywhere (private mode throws).

## Review Focus

1. A `400` or `429` from the server must **drop** the batch, not re-queue it; only a network failure or `5xx` re-queues. Otherwise one bad event (e.g. a skewed clock) loops forever. Test in Task 7.
2. Storage throws (Safari private mode): ids fall back to in-memory values and emitting still works. Test in Task 7.
3. A declined card followed by a successful retry on the same order yields `2103` then `2102`; the view must report `paid = 1` and `order_id` for that session. Test in Task 2.
4. The beacon on unload arrives as `text/plain`; it must be parsed and stored like JSON. Test in Task 3.
5. A string prop longer than 500 chars (a window error message) is truncated client-side so the server never rejects the batch. Test in Task 7.

---

### Task 1: Server site-code registry

**Files:**
- Create: `server/src/telemetry/codes.ts`
- Test: `server/test/telemetry-codes.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Level = 'info' | 'warn' | 'error';
  export interface SiteCode { readonly code: number; readonly name: string; readonly level: Level }
  export const CLIENT_CODE_MIN = 1000, CLIENT_CODE_MAX = 1999, SERVER_CODE_MIN = 2000, SERVER_CODE_MAX = 2999;
  export const S: { TELEMETRY_BATCH_ACCEPTED, TELEMETRY_BATCH_REJECTED, TELEMETRY_SCRUBBED,
                    PAYMENTS_ORDER_CREATED, PAYMENTS_ORDER_CAPTURED, PAYMENTS_CAPTURE_FAILED,
                    PAYMENTS_ORDER_CREATE_FAILED }  // each a SiteCode, `as const`
  export const NAME_RE = /^[a-z0-9_.]{1,64}$/;
  export function formatLine(site: SiteCode, props?: Record<string, unknown>): string; // "[2102] payments.order.captured {"orderId":"X"}"
  ```
  Codes/names/levels exactly as the spec's "Server events" table: 2001 `telemetry.batch.accepted` info, 2002 `telemetry.batch.rejected` warn, 2003 `telemetry.scrubbed` warn, 2101 `payments.order.created` info, 2102 `payments.order.captured` info, 2103 `payments.capture.failed` error, 2104 `payments.order.create_failed` error.

- [ ] **Step 1: Write the failing test**

```ts
// server/test/telemetry-codes.test.ts
import { describe, expect, it } from 'vitest';
import { S, SERVER_CODE_MIN, SERVER_CODE_MAX, NAME_RE, formatLine } from '../src/telemetry/codes';

describe('server site codes', () => {
  const all = Object.values(S);
  it('are unique, in range, and well named', () => {
    expect(new Set(all.map(s => s.code)).size).toBe(all.length);
    expect(new Set(all.map(s => s.name)).size).toBe(all.length);
    for (const s of all) {
      expect(s.code).toBeGreaterThanOrEqual(SERVER_CODE_MIN);
      expect(s.code).toBeLessThanOrEqual(SERVER_CODE_MAX);
      expect(s.name).toMatch(NAME_RE);
      expect(['info', 'warn', 'error']).toContain(s.level);
    }
  });
  it('formats a console line', () => {
    expect(formatLine(S.PAYMENTS_ORDER_CAPTURED, { orderId: 'X' })).toBe('[2102] payments.order.captured {"orderId":"X"}');
    expect(formatLine(S.TELEMETRY_BATCH_ACCEPTED)).toBe('[2001] telemetry.batch.accepted');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run test/telemetry-codes.test.ts`
Expected: FAIL, cannot find module `../src/telemetry/codes`

- [ ] **Step 3: Implement `server/src/telemetry/codes.ts`** with the interface above.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run test/telemetry-codes.test.ts`
Expected: PASS (2 tests)

---

### Task 2: Storage migration, scrubber, and TelemetryService

**Files:**
- Modify: `server/src/db.ts` (append migration 2 to `MIGRATIONS`)
- Create: `server/src/telemetry/scrub.ts`
- Create: `server/src/services/telemetry.ts`
- Test: `server/test/telemetry-scrub.test.ts`, `server/test/telemetry-service.test.ts`

**Interfaces:**
- Consumes: `S`, `SiteCode`, `Level`, `formatLine` from Task 1; `openDatabase` from `db.ts`.
- Produces:
  ```ts
  // server/src/telemetry/scrub.ts
  export type Primitive = string | number | boolean | null;
  export type Props = Record<string, Primitive>;
  export const DENY_SUBSTRINGS: readonly string[]; // ssn ein name email phone address street city zip salary wage rate pay gross net bonus overtime hours tax
  export const ALLOW_KEYS: ReadonlySet<string>;    // templateId amountCents stubCount step name path ms orderId code message pages attested draftRestored from to lastStep component count keys reason totalCents captureId capturedCents currency
  export const REDACTED = '[redacted]';
  export function scrubProps(props: Props | undefined): { props: Props | undefined; removed: string[] };
  //  removed lists dropped keys as "key" and redacted values as "key:value"

  // server/src/services/telemetry.ts
  export interface TelemetryIds { sessionId?: string; visitorId?: string }
  export interface IncomingEvent { code: number; name: string; level: Level; ts: number; props?: Props }
  export interface IncomingBatch { v: 1; visitorId: string; sessionId: string; events: IncomingEvent[] }
  export interface TelemetryServiceDeps { db: Database.Database; enabled: boolean; retentionDays: number; now?: () => Date; out?: (line: string) => void }
  export class TelemetryService {
    constructor(deps: TelemetryServiceDeps);
    ingest(batch: IncomingBatch, userAgent?: string): { stored: number; scrubbed: string[] }; // one transaction; stored=0 when disabled
    log(site: SiteCode, props?: Props, ids?: TelemetryIds): void; // always prints formatLine via out (default console.log/warn/error by level); inserts a source='server' row only when site.code >= 2100 and enabled
    prune(): number;            // DELETE rows with received_at older than retentionDays; returns count
    startPruneTimer(): void;    // prune now, then setInterval 24h (.unref())
    stopPruneTimer(): void;
  }
  ```
- Migration 2 (verbatim from the spec, table + three indexes + `telemetry_sessions` view). In the view, `max_step_completed` uses `json_extract(props_json, '$.step')`; `paid` is `MAX(code IN (1304, 2102))`; `order_id` prefers the 2102 row's `$.orderId` and falls back to 1304's.
- `ingest` stores `ts` as ISO from the client millisecond timestamp, `received_at` as `now().toISOString()`, `user_agent` truncated to 256, `props_json` = JSON of scrubbed props or NULL. Scrub removals across the batch are concatenated into `scrubbed`; when non-empty, `ingest` calls `this.log(S.TELEMETRY_SCRUBBED, { keys: scrubbed.join(',') }, ids)`.

- [ ] **Step 1: Write the failing scrub test**

```ts
// server/test/telemetry-scrub.test.ts
import { describe, expect, it } from 'vitest';
import { scrubProps, REDACTED } from '../src/telemetry/scrub';

describe('scrubProps', () => {
  it('drops keys that look like PII or wages', () => {
    const { props, removed } = scrubProps({ employeeName: 'Jane', hourlyRate: 20, ssn: '1', step: 2 });
    expect(props).toEqual({ step: 2 });
    expect(removed.sort()).toEqual(['employeeName', 'hourlyRate', 'ssn']);
  });
  it('keeps allow-listed keys even when they match a deny substring', () => {
    const { props, removed } = scrubProps({ templateId: 3, amountCents: 899, stubCount: 1, name: 'Pay period' });
    expect(props).toEqual({ templateId: 3, amountCents: 899, stubCount: 1, name: 'Pay period' });
    expect(removed).toEqual([]);
  });
  it('redacts SSN, EIN and long digit runs inside strings', () => {
    const { props, removed } = scrubProps({ message: 'ssn 123-45-6789 ein 12-3456789 card 4111111111111111' });
    expect(props?.message).toBe(`ssn ${REDACTED} ein ${REDACTED} card ${REDACTED}`);
    expect(removed).toEqual(['message:value']);
  });
  it('passes undefined through', () => {
    expect(scrubProps(undefined)).toEqual({ props: undefined, removed: [] });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && npx vitest run test/telemetry-scrub.test.ts`
Expected: FAIL, module not found

- [ ] **Step 3: Implement `server/src/telemetry/scrub.ts`.** Deny test is case-insensitive substring on the key; allow list wins. Redaction regexes: `/\b\d{3}-?\d{2}-?\d{4}\b/g`, `/\b\d{2}-?\d{7}\b/g`, `/\d{9,}/g`.

- [ ] **Step 4: Run to verify it passes**

Run: `cd server && npx vitest run test/telemetry-scrub.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the failing service test**

```ts
// server/test/telemetry-service.test.ts
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
  const svc = new TelemetryService({ db, enabled: overrides.enabled ?? true, retentionDays: overrides.retentionDays ?? 90, now: overrides.now, out: l => lines.push(l) });
  return { db, svc, lines };
}

describe('TelemetryService', () => {
  it('migration creates the table and the view', () => {
    const { db } = boot();
    const names = db.prepare(`SELECT name FROM sqlite_master WHERE name IN ('telemetry_events','telemetry_sessions')`).all().map((r: any) => r.name).sort();
    expect(names).toEqual(['telemetry_events', 'telemetry_sessions']);
  });

  it('ingest stores scrubbed rows with the right columns', () => {
    const { db, svc, lines } = boot();
    const batch: IncomingBatch = { v: 1, ...ids, events: [ev(1103, 'wizard.step.completed', { step: 2, employeeName: 'Jane' })] };
    const r = svc.ingest(batch, 'Mozilla/5.0 test');
    expect(r).toEqual({ stored: 1, scrubbed: ['employeeName'] });
    const row: any = db.prepare('SELECT * FROM telemetry_events').get();
    expect(row).toMatchObject({ source: 'client', visitor_id: ids.visitorId, session_id: ids.sessionId, code: 1103, name: 'wizard.step.completed', level: 'info', user_agent: 'Mozilla/5.0 test' });
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
    expect(lines).toEqual(['[2001] telemetry.batch.accepted {"count":3}', '[2102] payments.order.captured {"orderId":"O1","captureId":"C1","capturedCents":899}']);
    const rows: any[] = db.prepare('SELECT source, code, session_id FROM telemetry_events').all();
    expect(rows).toEqual([{ source: 'server', code: 2102, session_id: ids.sessionId }]);
  });

  it('view reports a paid session after a declined-then-captured order', () => {
    const { db, svc } = boot();
    svc.ingest({ v: 1, ...ids, events: [ev(1101, 'wizard.entered', { draftRestored: false }), ev(1103, 'wizard.step.completed', { step: 0, name: 'Company' }), ev(1103, 'wizard.step.completed', { step: 3, name: 'Earnings' }), ev(1201, 'template.selected', { templateId: 4 }), ev(1302, 'payment.order_created', { orderId: 'O1' })] });
    svc.log(S.PAYMENTS_CAPTURE_FAILED, { orderId: 'O1', code: 'INSTRUMENT_DECLINED' }, ids);
    svc.log(S.PAYMENTS_ORDER_CAPTURED, { orderId: 'O1', captureId: 'C1', capturedCents: 899 }, ids);
    svc.ingest({ v: 1, ...ids, events: [ev(1304, 'payment.succeeded', { orderId: 'O1', amountCents: 899, currency: 'USD', stubCount: 1, templateId: 4 }), ev(1401, 'print.clicked')] });
    const s: any = db.prepare('SELECT * FROM telemetry_sessions WHERE session_id = ?').get(ids.sessionId);
    expect(s).toMatchObject({ visitor_id: ids.visitorId, events: 9, entered_wizard: 1, max_step_completed: 3, picked_template: 1, started_payment: 1, paid: 1, order_id: 'O1', printed_or_downloaded: 1, errors: 1 });
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
```

- [ ] **Step 6: Run to verify it fails**

Run: `cd server && npx vitest run test/telemetry-service.test.ts`
Expected: FAIL, module not found

- [ ] **Step 7: Add migration 2 to `server/src/db.ts` and implement `server/src/services/telemetry.ts`.** Note the view's `events` count includes `source='server'` rows (the test expects 9 = 7 client + 2 server). `prune` compares `received_at < now - retentionDays` using ISO strings. `log` writes the `ts` and `received_at` of a server row from `now()`.

- [ ] **Step 8: Run the whole server suite**

Run: `cd server && npm test`
Expected: PASS, all files including the existing 28 cases

---

### Task 3: `POST /api/telemetry` route, header ids, config, app wiring

**Files:**
- Modify: `server/src/config.ts` (two env vars), `server/.env.example`
- Modify: `server/src/routes/schemas.ts` (`telemetryBatchSchema`)
- Create: `server/src/routes/telemetry.ts`
- Create: `server/src/telemetry/request-ids.ts`
- Modify: `server/src/app.ts` (`AppDeps.telemetry`, mount the route before the global JSON parser), `server/src/index.ts` (construct service, start prune timer, stop on shutdown)
- Modify: `server/test/helpers.ts` (`testConfig` gains the two vars; `boot()` helper builds a `TelemetryService`)
- Test: `server/test/telemetry-route.test.ts`

**Interfaces:**
- Consumes: `TelemetryService`, `IncomingBatch` (Task 2); `S` (Task 1).
- Produces:
  ```ts
  // config.ts additions
  TELEMETRY_ENABLED: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
  TELEMETRY_RETENTION_DAYS: z.coerce.number().int().positive().default(90),

  // schemas.ts
  export const telemetryIdRe = /^[vs]_[A-Za-z0-9_-]{8,48}$/;
  export const telemetryBatchSchema: z.ZodType<IncomingBatch>; // enforces every Global Constraint on the wire format; ts within ±7 days uses Date.now()

  // telemetry/request-ids.ts
  export function readTelemetryIds(req: Request): TelemetryIds; // from X-Telemetry-Session / X-Telemetry-Visitor, each only if it matches telemetryIdRe

  // routes/telemetry.ts
  export function telemetryRouter(telemetry: TelemetryService): Router;
  //  router.use(express.json({ limit: '64kb' }), express.text({ type: 'text/plain', limit: '64kb' }))
  //  text bodies are JSON.parse'd; a parse failure → badRequest('BAD_JSON', ...)
  //  rate limit 600 / 15 min, message shape as payments
  //  invalid → telemetry.log(S.TELEMETRY_BATCH_REJECTED, { reason }) then badRequest('VALIDATION', 'Invalid telemetry batch', flatten)
  //  valid → ingest(batch, req.get('user-agent')) → telemetry.log(S.TELEMETRY_BATCH_ACCEPTED, { count }, ids) → 204

  // app.ts
  export interface AppDeps { config: Config; orders: OrderService; telemetry: TelemetryService }
  ```

- [ ] **Step 1: Update `helpers.ts`** — add `TELEMETRY_ENABLED: true, TELEMETRY_RETENTION_DAYS: 90` to `testConfig`; add
  ```ts
  export function makeTelemetry(db: Database.Database, overrides: Partial<{ enabled: boolean }> = {}) {
    const lines: string[] = [];
    const telemetry = new TelemetryService({ db, enabled: overrides.enabled ?? true, retentionDays: 90, out: l => lines.push(l) });
    return { telemetry, lines };
  }
  ```
  and change `app.test.ts`'s `boot()` to pass `telemetry: makeTelemetry(db).telemetry` (makeService already returns `db`).

- [ ] **Step 2: Write the failing route test**

```ts
// server/test/telemetry-route.test.ts
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { makeService, makeTelemetry, testConfig } from './helpers';

const ids = { visitorId: 'v_abcdefghij', sessionId: 's_abcdefghij' };
const good = () => ({ v: 1, ...ids, events: [{ code: 1103, name: 'wizard.step.completed', level: 'info', ts: Date.now(), props: { step: 1, name: 'Employee' } }] });
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
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd server && npx vitest run test/telemetry-route.test.ts`
Expected: FAIL (module not found / 404)

- [ ] **Step 4: Implement** `schemas.ts` additions, `request-ids.ts`, `routes/telemetry.ts`, the `config.ts` vars, and wire `app.ts` so `app.use('/api/telemetry', telemetryRouter(telemetry))` is registered **before** `app.use(express.json({ limit: '16kb' }))`. Update `index.ts` to build `new TelemetryService({ db, enabled: config.TELEMETRY_ENABLED, retentionDays: config.TELEMETRY_RETENTION_DAYS })`, call `startPruneTimer()` after listen, and `stopPruneTimer()` in `shutdown`. Append to `.env.example`:
  ```
  # --- Telemetry ---------------------------------------------------------------
  # Store anonymous usage events from the client in telemetry_events (same DB). false = accept and discard.
  TELEMETRY_ENABLED=true
  # Rows older than this are deleted at boot and daily.
  TELEMETRY_RETENTION_DAYS=90
  ```

- [ ] **Step 5: Run the whole server suite and typecheck**

Run: `cd server && npm test && npm run typecheck`
Expected: PASS; no type errors

---

### Task 4: Payment milestones from the payments router

**Files:**
- Modify: `server/src/routes/payments.ts` (signature `paymentsRouter(config, orders, telemetry)`; try/catch around `createOrder` and `captureOrder`)
- Modify: `server/src/app.ts` (pass `telemetry`)
- Test: `server/test/telemetry-payments.test.ts`

**Interfaces:**
- Consumes: `readTelemetryIds` (Task 3), `TelemetryService.log`, `S`.
- Behaviour: on `POST /orders` success → `log(S.PAYMENTS_ORDER_CREATED, { orderId, totalCents }, ids)`; on throw → `log(S.PAYMENTS_ORDER_CREATE_FAILED, { code }, ids)` then rethrow, where `code` is `err.code` for an `HttpError` else `'INTERNAL'`. On capture success → `log(S.PAYMENTS_ORDER_CAPTURED, { orderId, captureId: result.captureId ?? null, capturedCents: result.quote.totalCents }, ids)`; on throw → `log(S.PAYMENTS_CAPTURE_FAILED, { orderId, code }, ids)` then rethrow. (`CapturedOrderResult` has no `captureId`; read it from the `orders` row via `db` only if the service exposes it, otherwise omit the key. Builder's call; the test below does not assert on `captureId`.)

- [ ] **Step 1: Write the failing test**

```ts
// server/test/telemetry-payments.test.ts
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
const serverRows = (db: any) => db.prepare(`SELECT code, session_id, visitor_id, props_json FROM telemetry_events WHERE source='server' ORDER BY id`).all();

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
    const created = await request(app).post('/api/payments/orders').set({ 'X-Telemetry-Session': 'garbage' }).send({ items: [{ type: 'paystub', qty: 1 }] });
    expect(created.status).toBe(201);
    expect(serverRows(db)[0]).toMatchObject({ session_id: null, visitor_id: null });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && npx vitest run test/telemetry-payments.test.ts`
Expected: FAIL, no server rows

- [ ] **Step 3: Implement** the router changes and pass `telemetry` from `app.ts`.

- [ ] **Step 4: Run the whole server suite**

Run: `cd server && npm test && npm run typecheck`
Expected: PASS

---

### Task 5: Query script, starter SQL, README, deploy rsync

**Files:**
- Create: `server/sql/telemetry-queries.sql`
- Create: `server/scripts/query.js` (plain CommonJS; runs on the VPS with only production deps)
- Modify: `server/README.md` (Endpoints table row; new "Telemetry" section under Data)
- Modify: `.github/workflows/deploy-staging.yml:96` and `.github/workflows/deploy.yml:101` (add `server/scripts server/sql` to the rsync source list)
- Test: `server/test/query-script.test.ts`

**Interfaces:**
- `telemetry-queries.sql` holds named blocks separated by lines `-- name: <id>`; ids and intent: `sessions` (last 7 days from `telemetry_sessions`, newest first), `timeline` (one session: `SELECT ts, source, printf('[%04d] %s', code, name) AS event, props_json FROM telemetry_events WHERE session_id = ? ORDER BY ts, id`), `funnel` (per day: sessions, entered_wizard, reached_review = `max_step_completed >= 4`, started_payment, paid), `errors` (last 24 h grouped by code, name, count), `paid` (paid sessions joined to `orders` on `order_id = orders.id` showing `orders.status`).
- `query.js` usage: `node scripts/query.js <name> [args…]` binds positional args to `?`; `node scripts/query.js --sql "SELECT …"` runs raw SQL; `--json` prints JSON instead of `console.table`. Reads `DATABASE_PATH` via `dotenv` from `server/.env`, resolving relative to the server folder. Exports `loadNamedQueries(file): Record<string, string>` and `run(db, sql, params): unknown[]` for the test; only executes `main()` when `require.main === module`.

- [ ] **Step 1: Write the failing test**

```ts
// server/test/query-script.test.ts
import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { openDatabase } from '../src/db';
import { TelemetryService } from '../src/services/telemetry';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { loadNamedQueries, run } = require('../scripts/query.js');

describe('scripts/query.js', () => {
  const queries = loadNamedQueries(path.join(__dirname, '..', 'sql', 'telemetry-queries.sql'));
  it('ships the five starter queries', () => {
    expect(Object.keys(queries).sort()).toEqual(['errors', 'funnel', 'paid', 'sessions', 'timeline']);
  });
  it('every starter query runs against an empty database', () => {
    const db = openDatabase(':memory:');
    new TelemetryService({ db, enabled: true, retentionDays: 90, out: () => {} });
    for (const [name, sql] of Object.entries(queries)) {
      const params = name === 'timeline' ? ['s_abcdefghij'] : [];
      expect(() => run(db, sql as string, params), name).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && npx vitest run test/query-script.test.ts`
Expected: FAIL, module not found

- [ ] **Step 3: Write `telemetry-queries.sql` and `scripts/query.js`.** Check `server/tsconfig.json` `include` covers `test`; `require` of a `.js` outside `src` is fine under CommonJS.

- [ ] **Step 4: Run to verify it passes**

Run: `cd server && npx vitest run test/query-script.test.ts`
Expected: PASS

- [ ] **Step 5: README and workflows.** Add the Endpoints row `POST /api/telemetry — Store a batch of anonymous client events; 204`. Add a "Telemetry" section after "Data": what is stored, retention, the two env vars, and the owner's exact commands:
  ```
  ssh paystubissa@<vps>
  cd ~/apps/production/server     # or ~/apps/staging/server
  node scripts/query.js sessions
  node scripts/query.js timeline s_xxxxxxxx
  node scripts/query.js funnel
  node scripts/query.js errors
  node scripts/query.js paid
  node scripts/query.js --sql "SELECT * FROM telemetry_sessions WHERE paid = 1"
  ```
  (Confirm the production `API_PATH` in `deploy.yml` and use it verbatim.) In both workflows change the rsync source line to `server/dist server/scripts server/sql server/package.json server/package-lock.json server/ecosystem.config.cjs \`.

- [ ] **Step 6: Verify**

Run: `cd server && npm test && node scripts/query.js --sql "SELECT 1 AS ok"`
Expected: tests PASS; the script prints a one-row table with `ok = 1` (it opens `server/data/orders.sqlite` locally and the migration creates the tables).

---

### Task 6: Client site-code registry

**Files:**
- Create: `src/telemetry/codes.ts`
- Test: `src/__test__/telemetry-codes.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Level = 'info' | 'warn' | 'error';
  export interface SiteCode { readonly code: number; readonly name: string; readonly level: Level; readonly props?: readonly string[] }
  export const CLIENT_CODE_MIN = 1000, CLIENT_CODE_MAX = 1999;
  export const NAME_RE = /^[a-z0-9_.]{1,64}$/;
  export const ALLOWED_PROP_KEYS: ReadonlySet<string>; // same list as server ALLOW_KEYS (Task 2)
  export const T = { APP_LOADED, PAGE_VIEWED, PERF_PAGE_LOAD, WIZARD_ENTERED, WIZARD_STEP_VIEWED, WIZARD_STEP_COMPLETED,
    WIZARD_STEP_BACK, WIZARD_STEP_JUMPED, WIZARD_EXITED, TEMPLATE_SELECTED, REVIEW_ATTESTED, PAYMENT_ORDER_CREATED,
    PAYMENT_CAPTURE_STARTED, PAYMENT_SUCCEEDED, PAYMENT_FAILED, PAYMENT_CANCELLED, PAYMENT_BUTTONS_FAILED, UNLOCK_RESTORED,
    PRINT_CLICKED, PDF_CLICKED, PDF_GENERATED, PDF_FAILED, ERROR_WINDOW, ERROR_UNHANDLED_REJECTION, ERROR_BOUNDARY } as const;
  export function formatLine(site: SiteCode, props?: Record<string, unknown>): string;
  ```
  Codes, names, levels and `props` lists exactly as the spec's "Client events" table (1001–1003, 1101–1106, 1201, 1301–1308, 1401–1404, 1901–1903).

- [ ] **Step 1: Write the failing test**

```ts
// src/__test__/telemetry-codes.test.ts
import { T, CLIENT_CODE_MIN, CLIENT_CODE_MAX, NAME_RE, ALLOWED_PROP_KEYS, formatLine } from '../telemetry/codes';

describe('client site codes', () => {
  const all = Object.values(T);
  it('are unique, in range, and well named', () => {
    expect(new Set(all.map(s => s.code)).size).toBe(all.length);
    expect(new Set(all.map(s => s.name)).size).toBe(all.length);
    for (const s of all) {
      expect(s.code).toBeGreaterThanOrEqual(CLIENT_CODE_MIN);
      expect(s.code).toBeLessThanOrEqual(CLIENT_CODE_MAX);
      expect(s.name).toMatch(NAME_RE);
    }
  });
  it('declare only props the server scrubber allows', () => {
    for (const s of all) for (const k of s.props ?? []) expect(ALLOWED_PROP_KEYS.has(k)).toBe(true);
  });
  it('pin the journey codes the SQL view depends on', () => {
    expect(T.WIZARD_ENTERED.code).toBe(1101);
    expect(T.WIZARD_STEP_COMPLETED.code).toBe(1103);
    expect(T.TEMPLATE_SELECTED.code).toBe(1201);
    expect(T.PAYMENT_ORDER_CREATED.code).toBe(1302);
    expect(T.PAYMENT_SUCCEEDED.code).toBe(1304);
    expect(T.PRINT_CLICKED.code).toBe(1401);
    expect(T.PDF_GENERATED.code).toBe(1403);
  });
  it('formats a console line', () => {
    expect(formatLine(T.WIZARD_STEP_COMPLETED, { step: 2 })).toBe('[1103] wizard.step.completed {"step":2}');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- --watchAll=false telemetry-codes`
Expected: FAIL, cannot find module

- [ ] **Step 3: Implement `src/telemetry/codes.ts`.**

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- --watchAll=false telemetry-codes`
Expected: PASS (4 tests)

---

### Task 7: Client telemetry service rewrite

**Files:**
- Rewrite: `src/services/telemetry-service.ts`
- Rewrite: `src/types/telemetry.ts`
- Test: `src/__test__/telemetry-service.test.ts`

**Interfaces:**
- Consumes: `SiteCode`, `T`, `formatLine` (Task 6).
- Produces:
  ```ts
  // src/types/telemetry.ts
  export type Primitive = string | number | boolean | null;
  export type Props = Record<string, Primitive>;
  export interface TelemetryEvent { code: number; name: string; level: Level; ts: number; props?: Props }
  export interface TelemetryConfig { endpoint: string; batchSize: number; flushIntervalMs: number; consoleEcho: boolean; enabled: boolean }
  export interface TelemetryIds { visitorId: string; sessionId: string }

  // src/services/telemetry-service.ts
  export const VISITOR_KEY = 'paystubissa.telemetry.visitor';
  export const SESSION_KEY = 'paystubissa.telemetry.session';   // JSON { id, lastSeen }
  export const LEGACY_VISITOR_KEY = 'telemetry_user_id';
  export const SESSION_IDLE_MS = 30 * 60 * 1000;
  export const MAX_QUEUE = 200;
  export const MAX_STRING = 500;
  export interface TelemetryDeps { local?: Storage | null; session?: Storage | null; now?: () => number; fetch?: typeof fetch; sendBeacon?: (url: string, data: Blob) => boolean; setInterval?: typeof setInterval; clearInterval?: typeof clearInterval; echo?: (line: string) => void }
  export class TelemetryService {
    constructor(deps?: TelemetryDeps);              // defaults: window.localStorage / sessionStorage / Date.now / window.fetch / navigator.sendBeacon / console.log
    start(config?: Partial<TelemetryConfig>): void; // idempotent; installs timer + pagehide handler once; default enabled = process.env.NODE_ENV !== 'test'
    stop(): void;                                   // tests only
    emit(site: SiteCode, props?: Props): void;      // no-op when !enabled; truncates strings to MAX_STRING; echo when consoleEcho
    ids(): TelemetryIds;
    flush(): Promise<void>;                         // POST; on network error or 5xx re-queue at front (cap MAX_QUEUE, drop oldest); on 4xx drop; warn once per session on failure
    queueLength(): number;
    installGlobalErrorHandlers(target: Window): void; // window 'error' → T.ERROR_WINDOW {message}; 'unhandledrejection' → T.ERROR_UNHANDLED_REJECTION {message}
  }
  export const telemetry: TelemetryService;        // singleton, not started
  ```
  Visitor id: `v_` + 16 chars of `[A-Za-z0-9_-]` from `crypto.getRandomValues` when available else `Math.random`; migrated from `LEGACY_VISITOR_KEY` if present (stored as-is after prefixing `v_` and stripping chars outside the class, then the legacy key is removed). Session: read `SESSION_KEY`; reuse `id` if `now - lastSeen < SESSION_IDLE_MS`, else mint `s_…`; write `lastSeen = now` on every `emit`. Any storage throw → in-memory fallback.

- [ ] **Step 1: Write the failing test**

```ts
// src/__test__/telemetry-service.test.ts
import { TelemetryService, VISITOR_KEY, SESSION_KEY, LEGACY_VISITOR_KEY, SESSION_IDLE_MS, MAX_QUEUE, MAX_STRING } from '../services/telemetry-service';
import { T } from '../telemetry/codes';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}
const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } } as unknown as Storage;

function make(over: Partial<{ local: Storage | null; session: Storage | null; now: () => number; fetch: jest.Mock }> = {}) {
  const local = over.local === undefined ? new MemStorage() : over.local;
  const session = over.session === undefined ? new MemStorage() : over.session;
  const fetch = over.fetch ?? jest.fn().mockResolvedValue({ ok: true, status: 204 });
  const timers: Array<() => void> = [];
  const svc = new TelemetryService({ local, session, now: over.now ?? (() => 1_700_000_000_000), fetch: fetch as any,
    setInterval: ((fn: () => void) => { timers.push(fn); return 1; }) as any, clearInterval: (() => {}) as any, echo: () => {} });
  svc.start({ enabled: true, batchSize: 10, flushIntervalMs: 10_000, consoleEcho: false, endpoint: '/api/telemetry' });
  return { svc, local, session, fetch, tick: () => timers.forEach(f => f()) };
}

describe('TelemetryService', () => {
  it('mints v_/s_ ids and persists them', () => {
    const { svc, local, session } = make();
    const { visitorId, sessionId } = svc.ids();
    expect(visitorId).toMatch(/^v_[A-Za-z0-9_-]{8,48}$/);
    expect(sessionId).toMatch(/^s_[A-Za-z0-9_-]{8,48}$/);
    expect(local!.getItem(VISITOR_KEY)).toBe(visitorId);
    expect(JSON.parse(session!.getItem(SESSION_KEY)!).id).toBe(sessionId);
  });
  it('migrates the legacy visitor key', () => {
    const local = new MemStorage(); local.setItem(LEGACY_VISITOR_KEY, 'user_1700000000000_abc123xyz');
    const { svc } = make({ local });
    expect(svc.ids().visitorId).toBe('v_user_1700000000000_abc123xyz');
    expect(local.getItem(LEGACY_VISITOR_KEY)).toBeNull();
  });
  it('keeps the session across a reload and rolls it after 30 idle minutes', () => {
    const session = new MemStorage();
    let t = 1_700_000_000_000;
    const a = make({ session, now: () => t }).svc.ids().sessionId;
    t += 5 * 60 * 1000;
    expect(make({ session, now: () => t }).svc.ids().sessionId).toBe(a);
    t += SESSION_IDLE_MS + 1;
    expect(make({ session, now: () => t }).svc.ids().sessionId).not.toBe(a);
  });
  it('works when storage throws', () => {
    const { svc, fetch } = make({ local: throwing, session: throwing });
    expect(svc.ids().visitorId).toMatch(/^v_/);
    svc.emit(T.APP_LOADED, { path: '/' });
    expect(svc.queueLength()).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('flushes at batch size with the wire format', async () => {
    const { svc, fetch } = make();
    for (let i = 0; i < 10; i++) svc.emit(T.WIZARD_STEP_VIEWED, { step: i, name: 'x' });
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/telemetry');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ v: 1, visitorId: svc.ids().visitorId, sessionId: svc.ids().sessionId });
    expect(body.events).toHaveLength(10);
    expect(body.events[0]).toMatchObject({ code: 1102, name: 'wizard.step.viewed', level: 'info', props: { step: 0, name: 'x' } });
    expect(svc.queueLength()).toBe(0);
  });
  it('flushes on the timer', async () => {
    const { svc, fetch, tick } = make();
    svc.emit(T.APP_LOADED, { path: '/' });
    tick(); await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('re-queues on network failure and 5xx, drops on 4xx, caps the queue', async () => {
    const fetch = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce({ ok: false, status: 400 });
    const { svc } = make({ fetch });
    svc.emit(T.APP_LOADED, { path: '/' });
    await svc.flush(); expect(svc.queueLength()).toBe(1);
    await svc.flush(); expect(svc.queueLength()).toBe(1);
    await svc.flush(); expect(svc.queueLength()).toBe(0);
    for (let i = 0; i < MAX_QUEUE + 50; i++) svc.emit(T.PAGE_VIEWED, { path: '/x' });
    expect(svc.queueLength()).toBeLessThanOrEqual(MAX_QUEUE);
  });
  it('truncates long strings and is a no-op when disabled', () => {
    const { svc } = make();
    svc.emit(T.ERROR_WINDOW, { message: 'm'.repeat(2000) });
    expect((svc as any).queue[0].props.message).toHaveLength(MAX_STRING);
    const off = new TelemetryService({ local: new MemStorage(), session: new MemStorage(), echo: () => {} });
    off.start({ enabled: false });
    off.emit(T.APP_LOADED, { path: '/' });
    expect(off.queueLength()).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- --watchAll=false telemetry-service`
Expected: FAIL (exports missing)

- [ ] **Step 3: Rewrite `src/types/telemetry.ts` and `src/services/telemetry-service.ts`** per the interface. Keep the private queue field named `queue` (the truncation test peeks at it). The flush uses `fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })`. The `pagehide` handler calls `sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))` and clears the queue when it returns `true`.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- --watchAll=false telemetry-service`
Expected: PASS (8 tests). Typecheck: `npx tsc --noEmit -p tsconfig.json` reports errors only in files Task 8 rewrites (`telemetry-context.tsx`, `telemetry-error-boundary.tsx`, `app.tsx`, `ReviewStep.tsx`). That is expected until Task 8.

---

### Task 8: Provider, route tracking, error boundary, payment headers

**Files:**
- Rewrite: `src/contexts/telemetry-context.tsx`
- Create: `src/components/common/route-telemetry.tsx`
- Modify: `src/components/app.tsx:13-16,28-40` (module-level `TELEMETRY_CONFIG` constant; render `<RouteTelemetry />` inside the provider)
- Modify: `src/components/common/telemetry-error-boundary.tsx:3,30-45,55` (use `telemetry.emit(T.ERROR_BOUNDARY, …)`; drop the `error_boundary_triggered` and retry string events)
- Modify: `src/services/payments-api.ts:96-101` (add the two headers from `telemetry.ids()`)
- Modify: `src/components/wizard/steps/ReviewStep.tsx:18` (import `telemetry` + `T`; temporarily keep the two existing emits compiling by switching them to `T.PAYMENT_SUCCEEDED` / `T.PAYMENT_FAILED`; Task 9 finishes the props)
- Test: `src/__test__/route-telemetry.test.tsx`

**Interfaces:**
- Consumes: `telemetry`, `TelemetryConfig` (Task 7); `T` (Task 6).
- Produces:
  ```ts
  // telemetry-context.tsx
  export const TelemetryProvider: React.FC<{ children: ReactNode; config?: Partial<TelemetryConfig> }>;
  //   useEffect once: telemetry.start(config); telemetry.installGlobalErrorHandlers(window);
  //   emit T.APP_LOADED { path: window.location.pathname }; on window 'load' (or immediately if document.readyState === 'complete')
  //   emit T.PERF_PAGE_LOAD { ms: Math.round(nav.loadEventEnd - nav.fetchStart) } when a PerformanceNavigationTiming exists. No cleanup that stops the service.
  export function useTelemetry(): { emit: TelemetryService['emit']; ids: TelemetryService['ids'] };

  // route-telemetry.tsx
  export const RouteTelemetry: React.FC; // useLocation(); skip the first render; emit T.PAGE_VIEWED { path: location.pathname } on change; renders null

  // app.tsx
  const TELEMETRY_CONFIG: Partial<TelemetryConfig> = { endpoint: '/api/telemetry', batchSize: 10, flushIntervalMs: 10_000, consoleEcho: process.env.NODE_ENV === 'development' };

  // payments-api.ts request(): headers gain
  //   'X-Telemetry-Session': telemetry.ids().sessionId, 'X-Telemetry-Visitor': telemetry.ids().visitorId
  ```

- [ ] **Step 1: Install test tooling**

Run: `npm install --save-dev @testing-library/react@^16.3.0 @testing-library/user-event@^14.6.1 @testing-library/jest-dom@^6.6.3`
Expected: installs cleanly (`.npmrc` already sets legacy-peer-deps). Create `src/setupTests.ts` containing `import '@testing-library/jest-dom';` (CRA picks it up automatically).

- [ ] **Step 2: Write the failing test**

```tsx
// src/__test__/route-telemetry.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { RouteTelemetry } from '../components/common/route-telemetry';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';

test('emits page.viewed on navigation but not on first render', async () => {
  const emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
  render(
    <MemoryRouter initialEntries={['/']}>
      <RouteTelemetry />
      <Routes>
        <Route path="/" element={<Link to="/create">go</Link>} />
        <Route path="/create" element={<div>wizard</div>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(emit).not.toHaveBeenCalled();
  await userEvent.click(screen.getByText('go'));
  expect(emit).toHaveBeenCalledWith(T.PAGE_VIEWED, { path: '/create' });
  emit.mockRestore();
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- --watchAll=false route-telemetry`
Expected: FAIL, module not found

- [ ] **Step 4: Implement** `route-telemetry.tsx`, rewrite `telemetry-context.tsx`, update `app.tsx`, the error boundary, `payments-api.ts`, and the two ReviewStep imports/emits.

- [ ] **Step 5: Verify**

Run: `npm test -- --watchAll=false && npx tsc --noEmit -p tsconfig.json`
Expected: all jest suites PASS; zero type errors.

- [ ] **Step 6: Manual check in dev** — in one terminal `npm run api`, in another `npm start`; open `http://localhost:3000`, click "Create". The browser console shows `[1001] app.loaded {"path":"/"}` then `[1002] page.viewed {"path":"/create"}`; the API terminal shows `[2001] telemetry.batch.accepted {"count":N}` within 10 s; the CRA terminal shows no proxy error.

---

### Task 9: Emit sites in the wizard, template, review, PayPal, and PDF

**Files:**
- Modify: `src/components/wizard/PaystubWizard.tsx` (1101–1106)
- Modify: `src/components/wizard/steps/TemplateStep.tsx:83-85` (1201)
- Modify: `src/components/wizard/steps/ReviewStep.tsx:97-110,116-146,148-160` (1301, 1304 props, 1305 props, 1308, 1401)
- Modify: `src/components/common/paypal-payment.tsx:67-90` (1302, 1303, 1306 via a new `onCancel`, 1307 in the outer catch)
- Modify: `src/components/pdf/pdf-button-comp.tsx:20-74` (1402, 1403 `{ pages: pages.length }`, 1404)
- Modify: `src/redux/store.tsx` (export `createAppStore(preloaded?)`)
- Create: `src/__test__/test-utils.tsx` (render helper wrapping Provider + MemoryRouter + ThemeProvider)
- Test: `src/__test__/wizard-telemetry.test.tsx`

**Interfaces:**
- Consumes: `telemetry.emit`, `T`.
- Wizard emits: in the hydrate effect `emit(T.WIZARD_ENTERED, { draftRestored: !!raw })`; an effect on `[active]` emits `T.WIZARD_STEP_VIEWED { step: active, name: STEPS[active] }`; `goNext` emits `T.WIZARD_STEP_COMPLETED { step: active, name: STEPS[active] }` before advancing; `goBack` emits `T.WIZARD_STEP_BACK { step: active }`; a new `jumpTo(to: number)` emits `T.WIZARD_STEP_JUMPED { from: active, to }` then `setActive(to)` and replaces both the stepper-label `setActive(i)` and the `onEdit={setActive}` prop; an unmount effect emits `T.WIZARD_EXITED { lastStep }` from a ref that tracks `active`.
- ReviewStep: `handleAttestChange` → `T.REVIEW_ATTESTED { attested: checked }`; the unlock-restore `.then` → `T.UNLOCK_RESTORED { orderId: stored.orderId }`; `handlePaymentSuccess` → `T.PAYMENT_SUCCEEDED { orderId, amountCents: result.quote.totalCents, currency, stubCount: paidQty, templateId: appSettings.templateId }`; `handlePaymentError` → `T.PAYMENT_FAILED { code: code ?? null, message }`; `handlePrint` → `T.PRINT_CLICKED`. Remove the `try { … } catch { /* best-effort */ }` wrappers: `emit` never throws.
- PayPal: after `createOrder` resolves → `T.PAYMENT_ORDER_CREATED { orderId }`; at the top of `onApprove` → `T.PAYMENT_CAPTURE_STARTED { orderId: data.orderID }`; new `onCancel: (data) => emit(T.PAYMENT_CANCELLED, { orderId: data?.orderID ?? null })`; in the outer catch that sets `status = failed` → `T.PAYMENT_BUTTONS_FAILED { message }`.
- `createAppStore(preloaded?: Partial<PayStubDetails>)` returns `createStore(rootReducer, { ...getInitialState(), ...preloaded })`; the default export stays `createAppStore()`.

- [ ] **Step 1: Write the test helper and the failing test**

```tsx
// src/__test__/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../theme/theme';
import { createAppStore } from '../redux/store';

export function renderWithApp(ui: React.ReactElement, { route = '/create' } = {}) {
  const store = createAppStore();
  return { store, ...render(<Provider store={store}><ThemeProvider theme={theme}><MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter></ThemeProvider></Provider>) };
}
```

```tsx
// src/__test__/wizard-telemetry.test.tsx
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import PaystubWizard from '../components/wizard/PaystubWizard';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';

describe('wizard telemetry', () => {
  let emit: jest.SpyInstance;
  beforeEach(() => { emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {}); window.scrollTo = jest.fn(); });
  afterEach(() => emit.mockRestore());

  it('reports entering, viewing, completing and going back', async () => {
    const { unmount } = renderWithApp(<PaystubWizard />);
    expect(emit).toHaveBeenCalledWith(T.WIZARD_ENTERED, { draftRestored: false });
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_VIEWED, { step: 0, name: 'Company' });
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_COMPLETED, { step: 0, name: 'Company' });
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_VIEWED, { step: 1, name: 'Employee' });
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_BACK, { step: 1 });
    unmount();
    expect(emit).toHaveBeenCalledWith(T.WIZARD_EXITED, { lastStep: 0 });
  });

  it('reports a stepper jump', async () => {
    renderWithApp(<PaystubWizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(screen.getByText('Company'));
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_JUMPED, { from: 1, to: 0 });
  });
});
```

(The dev initial state pre-fills the Company step, so Next passes validation under jest's `NODE_ENV=test`. If the Company "Continue" button has a different accessible name, read it from `CompanyStep.tsx` and adjust the regex, not the assertion.)

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- --watchAll=false wizard-telemetry`
Expected: FAIL (`createAppStore` missing / no emits)

- [ ] **Step 3: Implement** every emit site listed in Interfaces, `createAppStore`, and delete the now-unused `handlePaymentError` try/catch wrappers. MUI's `useMediaQuery` returns `false` in jsdom, so the desktop stepper renders and the label click test is valid.

- [ ] **Step 4: Verify**

Run: `npm test -- --watchAll=false && npx tsc --noEmit -p tsconfig.json`
Expected: all suites PASS; zero type errors.

- [ ] **Step 5: Manual end-to-end in dev** — with `npm run api` and `npm start` running, walk the wizard to Review and pay with a sandbox account. Then in `server/`: `node scripts/query.js sessions` shows one row with `entered_wizard = 1`, `max_step_completed = 4`, `picked_template = 1`, `paid = 1`, `order_id` set; `node scripts/query.js timeline <session_id>` lists `[1101] … [1103] … [1201] … [1302] … [2101] … [1303] … [2102] … [1304]` in order. Record the actual output in the session notes.

---

### Task 10: Privacy policy wording

**Files:**
- Modify: `src/components/common/privacy-policy.tsx:104-110` (§4 table) and `:152-178` (§7)

**Interfaces:** none (copy only). Exact copy:

- §4: add a row after "Technical data":
  `<td>Usage analytics</td><td>A random identifier stored in your browser, the pages you visit, which steps of the pay stub wizard you complete (never what you type), whether a payment succeeded or failed and its PayPal order id, your browser type, and timestamps</td><td><strong>Yes</strong> — on our server, for up to 90 days.</td>`
- §7 Local storage paragraph: replace the second sentence with
  `That draft is functional storage that makes the app work; it is not tracking, and it is never sent to us. The only other thing we keep in your browser is a random analytics identifier (see below), which is sent to us.`
- §7 Analytics paragraph: replace with
  `The Service records anonymous usage events so we can see where people get stuck: page views, which wizard steps were completed, template selection, whether a payment succeeded, failed or was cancelled (with its PayPal order id), print and PDF actions, JavaScript errors, and page load time. Each event carries a random identifier stored in your browser so that repeat visits can be grouped; it is not linked to your name or email. Events are kept on our server for up to 90 days and then deleted.`
- §7 Your controls: append `Clearing site data also resets the analytics identifier.`

- [ ] **Step 1: Apply the copy.**
- [ ] **Step 2: Verify** — `npm test -- --watchAll=false && npx tsc --noEmit -p tsconfig.json` PASS; open `http://localhost:3000/privacy` and confirm the three passages read as above.

---

### Task 11: Project docs

**Files:**
- Modify: `CLAUDE.md` ("Telemetry" bullet in *Review, payment, PDF/print, telemetry*; "Commands" gets `npm run api`)
- Modify: `docs/BACKEND-PLAN.md` (§6 status: implemented 2026-10-17, pointer to the spec; Phase 3 row in the timeline table)
- Modify: `server/README.md` only if Task 5 left anything out

- [ ] **Step 1: CLAUDE.md** — replace the Telemetry bullet with: the registry location (`src/telemetry/codes.ts`, `server/src/telemetry/codes.ts`), the `[NNNN]` rule (one emit site per code; client 1000–1999, server 2000–2999; add a new code to the registry before emitting), the endpoint, the table and view names, the retention/kill-switch env vars, the privacy rule (never emit form values; server scrubs; a `[2003]` line means a client leak), and `node scripts/query.js sessions|timeline|funnel|errors|paid` as the way to read it. Replace "not yet implemented server-side" everywhere it appears.
- [ ] **Step 2: BACKEND-PLAN.md** — update §6 and the header status line (keep the owner's existing pending diff intact).
- [ ] **Step 3: Verify** — `node scripts/format-template-configs.js --check` still passes (unrelated, sanity); `git diff --stat` lists only the files this plan names.
