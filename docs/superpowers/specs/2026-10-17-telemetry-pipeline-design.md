# Telemetry pipeline — design

Date: 2026-10-17 · Status: approved in conversation, pending builder check

## Intent

The owner wants to read a visitor's journey through paystubissa.com end to end: landed, entered
the wizard, which steps they passed, whether they picked a template, reached Review, paid (or
failed, or walked away), and whether they printed or downloaded. The purpose is to see where the
funnel leaks and to confirm that paying customers really got their stub.

Every record carries a numeric **site code** written `[NNNN]` that identifies the one place in the
code that emitted it. The code, not the message text, is the stable identity of a log line. When
the owner sees `[1012]` in the database they can grep the registry and land on the emit site.

The reading side is **SQL against the SQLite database** on the VPS. No dashboard, no page in the
site. That was the owner's choice for now.

## What exists today

- Client: `src/services/telemetry-service.ts` batches events and POSTs `{ events, session }` to
  `/api/telemetry`, keeps an anonymous visitor id in localStorage (`telemetry_user_id`) and a
  per-page-load session id, auto-tracks page load timing, web vitals, and uncaught errors.
  A React context (`src/contexts/telemetry-context.tsx`) wraps the app; an error boundary
  (`src/components/common/telemetry-error-boundary.tsx`) reports render crashes.
- Only two business events exist: `PaymentSuccess` and `PaymentError` in
  `src/components/wizard/steps/ReviewStep.tsx`.
- Server (`server/`): Express 5 + better-sqlite3 + zod + vitest. No telemetry route, so every
  client flush fails (ECONNREFUSED in dev, 404 in prod) and re-queues forever.
- Known defect to fix on the way: `App` builds `telemetryConfig` as a new object literal on every
  render and the provider's effect depends on `[config]`, so each `App` re-render runs the cleanup,
  which calls `telemetryService.destroy()`: the flush timer is cleared and never restarted, and a
  page view is re-tracked. (The app is React 19 with no StrictMode wrapper; this is not a
  double-mount issue.) Fix: never destroy on cleanup, idempotent `start`, and a module-level
  config constant.
- The live privacy policy (`src/components/common/privacy-policy.tsx` §4 and §7) says analytics
  is limited to page views, JS errors and timings, and that local storage is never sent to us.
  This pipeline goes beyond that, so the policy text is updated in the same change (see
  "Privacy policy" below).
- `docs/BACKEND-PLAN.md` §6 already names this as Phase 3 and sets the privacy rule: telemetry
  must never carry SSN, EIN, employee names, or wage figures.

## Goals

1. One row per event in a `telemetry_events` table, queryable by session, by code, by day.
2. A complete, ordered wizard journey per session, including payment outcome and print/PDF.
3. Every event has a `[NNNN]` code; codes are declared once, in a registry, and are unique.
4. Server-side payment milestones (order created, captured, capture failed) land in the same
   table under the same session id, so the owner can confirm a sale from the authoritative side.
5. Privacy by construction on the client (emit ids, counts, amounts, codes; never form values)
   plus a server-side scrub as a backstop.
6. A set of ready-made SQL queries and a `telemetry_sessions` view so the funnel question
   ("how many reached step 4, how many paid") is a single `SELECT`.
7. Runs in dev (`npm start` + `npm run dev` in `server/`) and in staging/prod via the existing
   GitHub Actions deploys, with no manual VPS steps beyond what the deploy does today.

## Non-goals

- No dashboard or admin UI. No charts.
- No third-party analytics vendor.
- No real-user identity. The visitor id is a random token in localStorage; nothing links it
  to a person unless they pay, and then only through the PayPal order id.
- No replay of form contents. We log *that* a step was completed, never *what* was typed.
- Web vitals (LCP/FID/CLS) are dropped. They are noise for the journey question. Page load time
  stays as one event because it is cheap and occasionally explains a drop-off.

## Anti-goals (what would make this a failure)

- A single SSN, EIN, name, address, or dollar wage figure appearing in `telemetry_events`.
- Telemetry failures that affect the user: a failed flush must never throw into React, block
  payment, or spam the console on every tick.
- Unbounded growth: the queue in the browser and the table on disk both need a ceiling.

## Site codes

- A code is a 4-digit integer. Ranges: **1000–1999 client**, **2000–2999 server**. Within each
  range, the hundreds digit groups by area (10xx app/page, 11xx wizard, 12xx template, 13xx
  payment, 14xx print/PDF, 19xx errors; 20xx telemetry intake, 21xx payments).
- **One emit site per code.** Two call sites must not share a code even if they log the same
  thing; give each its own code so the number alone locates the line.
- The client registry lives in `src/telemetry/codes.ts` as a const object mapping
  `NAME → { code, name, level }`, where `name` is a dotted lowercase event name
  (`wizard.step.completed`) and `level` is `info | warn | error`. A jest test asserts codes are
  unique, in range, and that names are unique.
- The server registry lives in `server/src/telemetry/codes.ts` with the same shape and a vitest
  test with the same assertions.
- Console output format everywhere is `[1012] wizard.step.completed {…props}` so terminal, PM2
  logs, and the table all read the same way.

### Client events (initial set)

| Code | Name | When | Props |
|------|------|------|-------|
| 1001 | app.loaded | TelemetryProvider mount | `path` |
| 1002 | page.viewed | route change (react-router location) | `path` |
| 1003 | perf.page_load | window load | `ms` |
| 1101 | wizard.entered | PaystubWizard mount | `draftRestored` (bool) |
| 1102 | wizard.step.viewed | active step changes (incl. first) | `step` (0–5), `name` |
| 1103 | wizard.step.completed | a step's Next passes validation | `step`, `name` |
| 1104 | wizard.step.back | Back clicked | `step` |
| 1105 | wizard.step.jumped | stepper label or Review "Edit" click | `from`, `to` |
| 1106 | wizard.exited | PaystubWizard unmount | `lastStep` |
| 1201 | template.selected | TemplateStep selection | `templateId` |
| 1301 | review.attested | attestation checkbox toggled | `attested` |
| 1302 | payment.order_created | PayPal `createOrder` returned | `orderId` |
| 1303 | payment.capture_started | PayPal `onApprove` fired | `orderId` |
| 1304 | payment.succeeded | capture returned token | `orderId`, `amountCents`, `currency`, `stubCount`, `templateId` |
| 1305 | payment.failed (error) | capture or SDK error | `orderId?`, `code?`, `message` |
| 1306 | payment.cancelled | PayPal `onCancel` | `orderId?` |
| 1307 | payment.buttons_failed (error) | PayPal SDK could not load/render | `message` |
| 1308 | unlock.restored | existing unlock token found in storage on Review mount | `orderId` |
| 1401 | print.clicked | Print button | — |
| 1402 | pdf.clicked | Download PDF button | — |
| 1403 | pdf.generated | html2canvas/jspdf succeeded | `pages` |
| 1404 | pdf.failed (error) | PDF generation threw | `message` |
| 1901 | error.window (error) | `window.onerror` | `message` |
| 1902 | error.unhandled_rejection (error) | unhandledrejection | `message` |
| 1903 | error.boundary (error) | React error boundary | `component`, `message` |

`stubCount`, `amountCents`, `templateId`, `orderId`, step indexes, and error codes are the only
business values ever emitted. Payment error `message` comes from `PaymentsApiError` (server-
crafted) or the PayPal SDK, never from form state. Window/rejection messages are truncated to
500 chars.

### Server events (initial set)

| Code | Name | When |
|------|------|------|
| 2001 | telemetry.batch.accepted | a batch was stored (`count`) |
| 2002 | telemetry.batch.rejected (warn) | validation failed (`reason`) |
| 2003 | telemetry.scrubbed (warn) | the scrubber removed something (`keys`) — signals a client leak |
| 2101 | payments.order.created | `POST /orders` succeeded (`orderId`, `totalCents`) |
| 2102 | payments.order.captured | capture completed (`orderId`, `captureId`, `capturedCents`) |
| 2103 | payments.capture.failed (error) | capture failed (`orderId`, `code`) |
| 2104 | payments.order.create_failed (error) | PayPal create failed (`code`) |

Server events are written through one helper, `audit.log(req, code, props)`, which prints
`[2102] payments.order.captured {…}` to stdout (so PM2 logs carry it) and, for the 21xx payment
codes, also inserts a row with `source = 'server'` and the session/visitor ids taken from request
headers (below). The 20xx intake codes (2001–2003) are **stdout only**; storing a bookkeeping row
per accepted batch would inflate every session's event count.

`OrderService.createOrder` / `captureOrder` do not see the request. The payments router wraps
each `await` in try/catch, calls `audit.log` with the outcome, and rethrows so the existing error
handler still shapes the response. 2103 fires for any capture failure the client would see as an
error, including `INSTRUMENT_DECLINED` (the client may retry; a later 2102 on the same order id
tells the story).

## Data contract

### Wire format (client → server)

`POST /api/telemetry`, `Content-Type: application/json` (also accepted as `text/plain` because
`navigator.sendBeacon` with a Blob is used on unload):

```json
{
  "v": 1,
  "visitorId": "v_k3j…",
  "sessionId": "s_9ab…",
  "events": [
    { "code": 1103, "name": "wizard.step.completed", "level": "info", "ts": 1760700000000,
      "props": { "step": 2, "name": "Pay period" } }
  ]
}
```

Validation (zod): `v === 1`; ids match `^[a-z]_[A-Za-z0-9_-]{8,48}$`; 1–100 events; `code` is an
integer in 1000–1999 (client may only send client codes); `name` is `^[a-z0-9_.]{1,64}$`;
`level` ∈ info/warn/error; `ts` is a number within ±7 days of now; `props` is a flat object
(string/number/boolean/null values, ≤ 32 keys, strings ≤ 500 chars) whose JSON is ≤ 2 KB.
Body limit 64 KB on this route. Rate limit 600 requests / 15 min / IP (one active user flushing
every 10 s is 90; a 429 would re-queue and make things worse). Invalid batch → 400 with the usual
`{ error: { code, message } }` and a `[2002]` log. Valid → `204 No Content`.

`app.ts` mounts `express.json({ limit: '16kb' })` globally before the routers. The telemetry
route's own parsers (`express.json({ limit: '64kb' })` and `express.text({ type: 'text/plain',
limit: '64kb' })`) must be mounted on `/api/telemetry` **before** the global one, otherwise the
beacon body is never parsed and the limit is 16 KB.

### Session linking on payment calls

`src/services/payments-api.ts` adds two headers to every request:
`X-Telemetry-Session: <sessionId>` and `X-Telemetry-Visitor: <visitorId>`. A tiny Express
middleware validates them against the same id regex and attaches `req.telemetryIds`. The
payments router passes `req` to `audit.log`, so server milestones carry the browser's session id.
Missing or malformed headers are fine: the row stores NULL.

### Storage (`server/src/db.ts`, migration 2)

```sql
CREATE TABLE telemetry_events (
  id          INTEGER PRIMARY KEY,
  received_at TEXT    NOT NULL,          -- server clock, ISO 8601
  ts          TEXT    NOT NULL,          -- event clock, ISO 8601 (client ts or server now)
  source      TEXT    NOT NULL CHECK (source IN ('client','server')),
  visitor_id  TEXT,
  session_id  TEXT,
  code        INTEGER NOT NULL,
  name        TEXT    NOT NULL,
  level       TEXT    NOT NULL CHECK (level IN ('info','warn','error')),
  props_json  TEXT,                      -- scrubbed, may be NULL
  user_agent  TEXT                       -- first 256 chars, client batches only
);
CREATE INDEX telemetry_events_session ON telemetry_events (session_id, ts);
CREATE INDEX telemetry_events_code    ON telemetry_events (code, ts);
CREATE INDEX telemetry_events_time    ON telemetry_events (received_at);
```

Plus a view that answers the funnel question directly:

```sql
CREATE VIEW telemetry_sessions AS
SELECT session_id,
       MIN(visitor_id)                                   AS visitor_id,
       MIN(ts)                                           AS started_at,
       MAX(ts)                                           AS last_seen_at,
       COUNT(*)                                          AS events,
       MAX(CASE WHEN code = 1101 THEN 1 ELSE 0 END)      AS entered_wizard,
       MAX(CASE WHEN code = 1103 THEN json_extract(props_json,'$.step') END) AS max_step_completed,
       MAX(CASE WHEN code = 1201 THEN 1 ELSE 0 END)      AS picked_template,
       MAX(CASE WHEN code = 1302 THEN 1 ELSE 0 END)      AS started_payment,
       MAX(CASE WHEN code IN (1304, 2102) THEN 1 ELSE 0 END) AS paid,
       MAX(CASE WHEN code = 2102 THEN json_extract(props_json,'$.orderId') END) AS order_id,
       MAX(CASE WHEN code IN (1401, 1403) THEN 1 ELSE 0 END) AS printed_or_downloaded,
       SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END)  AS errors
FROM telemetry_events
WHERE session_id IS NOT NULL
GROUP BY session_id;
```

(Exact column list is the builder's to refine; the intent is one row per session with the
funnel flags.)

### Retention

`TELEMETRY_RETENTION_DAYS` (default 90). On startup and every 24 h the server deletes rows older
than that. `TELEMETRY_ENABLED` (default true) lets the route return 204 without storing, as a
kill switch.

## Privacy scrub (server, always on)

Applied to every incoming `props` before insert, regardless of client config:

- Drop any key whose lowercase form contains one of: `ssn`, `ein`, `name`, `email`, `phone`,
  `address`, `street`, `city`, `zip`, `salary`, `wage`, `rate`, `pay`, `gross`, `net`, `bonus`,
  `overtime`, `hours`, `tax`. Exception list of keys that are allowed despite matching
  (`templateId`, `amountCents`, `stubCount`, `step`, `name` when the parent event is a wizard
  step and the value is one of the six step labels).
- Replace any string value matching `\d{3}-?\d{2}-?\d{4}` (SSN shape) or `\d{2}-?\d{7}` (EIN
  shape) or 9+ consecutive digits with `[redacted]`.
- If anything was dropped or redacted, store the event anyway and emit `[2003]` with the key
  list, so a client leak shows up as a warning instead of silently persisting.

The client side is designed so the scrub should never fire; a test asserts that the client
registry's declared props for every event are on the allow list.

## Client service changes

Rewrite `src/services/telemetry-service.ts` around the registry:

- Public API: `telemetry.emit(EVENT, props?)` where `EVENT` is a registry entry; plus
  `telemetry.ids()` returning `{ visitorId, sessionId }` for the payments headers.
  Keep `trackError` for the boundary. Remove `track(stringName)`, `trackUserAction`,
  `trackPageView`, `setUserId`, `anonymizeData`, and the web-vitals observers.
- Ids: visitor id in localStorage under `paystubissa.telemetry.visitor` (migrate: if the old
  `telemetry_user_id` key exists, reuse its value under the new key, then delete the old key, so
  returning visitors keep their id). **Session id is a visit, not a page load**: it is kept in
  `sessionStorage` under `paystubissa.telemetry.session` as `{ id, lastSeen }`, so a reload or an
  in-tab navigation keeps the same id and one wizard journey stays one row in
  `telemetry_sessions`. A new id is minted when the tab is new or when `lastSeen` is older than
  30 minutes. Prefixes: `v_` and `s_`.
- Batching: flush when 10 events are queued or every 10 s, whichever first; `sendBeacon` with
  `Blob([...], { type: 'application/json' })` on `pagehide`/`beforeunload`. Queue is capped at
  200 events; when a flush fails the batch is re-queued at the front and the oldest beyond the
  cap are dropped. The failure is logged to the console once per session, not every tick.
- Lifecycle: `start(config)` is idempotent and `stop()` is only used by tests. The provider no
  longer destroys the service on cleanup (fixes the StrictMode double-mount bug).
- Environment: when `process.env.NODE_ENV === 'test'`, `emit` is a no-op and no timers are
  installed, so existing jest tests are untouched. In development, console echo is on
  (`[1103] wizard.step.completed {step: 2}`); in production it is off.
- `TelemetryConfig` keeps `endpoint`, `batchSize`, `flushInterval`, `consoleEcho`.

Emit sites (each is one line, one code): `TelemetryProvider` (1001, 1003), a new
`RouteTelemetry` component rendered inside the router (1002), `PaystubWizard` (1101–1106),
`TemplateStep` (1201), `ReviewStep` (1301, 1304, 1305, 1308, 1401), `paypal-payment.tsx`
(1302, 1303, 1306, 1307), `pdf-button-comp.tsx` (1402–1404), service internals (1901, 1902),
error boundary (1903). The existing `PaymentSuccess` / `PaymentError` string events are replaced
by 1304 / 1305.

## Server route

`server/src/routes/telemetry.ts` → `POST /api/telemetry`. Dependencies injected the same way the
payments router gets `orders`: `createApp({ config, orders, telemetry })` where `telemetry` is a
`TelemetryService` (`server/src/services/telemetry.ts`) owning the prepared insert statement,
the scrubber, `audit.log`, and `prune(days)`. The route parses JSON from both
`application/json` and `text/plain` bodies (beacon), validates, scrubs, inserts in one
transaction, and responds 204.

## Reading the data

`server/README.md` gains a "Telemetry" section and `server/sql/telemetry-queries.sql` ships
the owner's starter queries:

1. Sessions in the last 7 days with funnel flags (`SELECT * FROM telemetry_sessions WHERE
   started_at > datetime('now','-7 days') ORDER BY started_at DESC`).
2. One session's full timeline, ordered, with `[code] name props` formatted in SQL.
3. Daily funnel: sessions, entered wizard, reached Review, started payment, paid.
4. Errors in the last 24 h grouped by code.
5. Paid sessions with their order id, cross-joined to `orders` to confirm `status = 'COMPLETED'`.

Because the VPS may not have the `sqlite3` CLI, a small plain-JS script
`server/scripts/query.js` runs any SQL (or a named query from the `.sql` file) through the
already-installed better-sqlite3 and prints a table: `node scripts/query.js sessions`,
`node scripts/query.js "SELECT …"`. Both deploy workflows add `server/scripts` and `server/sql`
to the rsync list. The README shows the exact SSH + command the owner runs.

## Privacy policy

`src/components/common/privacy-policy.tsx` is updated so it states what this pipeline does:

- §4 table, "Technical data" row: add a row (or extend it) for "Usage analytics": an anonymous
  random identifier stored in your browser, which pages you visit, which wizard steps you complete
  (never what you type), whether a payment succeeded or failed and its PayPal order id, browser
  type, timestamps; kept on our server for up to 90 days.
- §7 "Local storage": say the draft is not sent to us, but a random analytics identifier is.
- §7 "Analytics": replace "limited to those categories" with the true list above. Keep the
  "what analytics never contains" paragraph as is; it remains true and is now enforced server-side.
- §7 "Your controls": clearing site data also resets the analytics identifier.

The owner reviews this wording before merge; it is user-facing.

## Dev and deploy

- Dev: `npm start` (client, proxy to :4000) and `cd server && npm run dev`. The console echo
  shows every code as it fires. If the API is down, the client logs one warning and keeps
  buffering; the proxy error line in the CRA terminal is expected in that case.
- `.env.example` documents `TELEMETRY_ENABLED` and `TELEMETRY_RETENTION_DAYS`.
- No Apache change: `/api` is already proxied in staging and prod.
- Deploy: unchanged flow (push branch → PR → owner merges). The migration runs on server boot.

## Testing

TDD throughout. Server (vitest + supertest): validation matrix, text/plain beacon body, scrub
drops and redacts and logs 2003, rows land with the right columns, server `audit.log` row
carries the header session id, prune deletes only old rows, the view returns correct flags for
a scripted session, kill switch. Client (jest): registry uniqueness/range/allow-list, service
batching and queue cap and re-queue on failure, no-op under test env, id migration from the old
localStorage key and session rollover after 30 min, emit-site smoke tests for the wizard
(render, click Next, assert 1103 was emitted with the right step).

The client has no component-test tooling today (three non-DOM jest tests). The wizard smoke
tests need `@testing-library/react` + `@testing-library/user-event` + `@testing-library/jest-dom`
as devDependencies and a small harness that wraps a component in the Redux store, a
`MemoryRouter`, and the MUI theme. Because `emit` is a no-op under `NODE_ENV=test`, those tests
spy on `telemetry.emit` (`jest.spyOn`) rather than inspecting the queue; the service's own
batching tests set the config explicitly to force it on.

`paypal-payment.tsx` has no `onCancel` handler today; 1306 adds one.

## Left to the builder

- Exact zod schemas, exact scrub allow/deny wording, exact view columns.
- Whether `RouteTelemetry` is a component or a hook in `App`.
- Table formatting of `scripts/query.js` output.
- How the wizard reports "validation passed" for a step (likely: each step already calls
  `onNext()` only after its own validation; emit from `goNext` in the wizard shell).

## Decisions made by the assistant (owner can overrule)

- SQLite table in the existing orders database rather than a separate file or flat log, so one
  query joins sessions to orders.
- Web vitals removed; single page-load timing event kept.
- Codes are 4-digit integers in fixed ranges, declared in a registry per side, not derived from
  file/line (file:line changes on every edit; a registry code is stable).
- Server milestones write to the same table (source = 'server') rather than only to stdout.
- 90-day retention default and a 200-event browser queue cap.
- The `telemetry_sessions` view is created by migration so it is available to every query tool.
- A session is a visit (sessionStorage, 30-minute inactivity rollover), not a page load, so one
  wizard journey with a reload in the middle is still one funnel row.
- The privacy policy is updated in this change rather than narrowing the pipeline to what the
  policy currently says. The anonymous visitor id and the user agent are kept.

Date: 2026-10-17 · Status: approved in conversation; builder check applied
