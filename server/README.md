# PayStubIssa API (`server/`)

Phase 1 backend: server-authoritative PayPal checkout, an orders ledger, and signed
unlock tokens. See [docs/BACKEND-PLAN.md](../docs/BACKEND-PLAN.md) for the full plan.

Express 5 + TypeScript, SQLite (better-sqlite3), zod, jsonwebtoken. Self-contained:
its own `package.json`, independent of the CRA app at the repo root.

## Run locally

```bash
cd server
cp .env.example .env        # fill in PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (sandbox) and JWT_SECRET
npm install
npm run dev                 # http://127.0.0.1:4000, restarts on change
```

From the repo root, `npm run api` does the same, and `npm start` for the React app
proxies `/api/*` to port 4000 (`"proxy"` in the root package.json), so the wizard's
Review step talks to this server with no CORS or extra config.

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Other scripts: `npm test` (vitest, no network), `npm run typecheck`, `npm run build`
(to `dist/`), `npm start` (runs `dist/`).

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness: env, PayPal env, uptime |
| GET | `/api/payments/config` | Public client config: PayPal client id + env, currency, unit price, max qty |
| POST | `/api/payments/quote` | Price a cart `{ items: [{ type: "paystub", qty }], couponCode? }` |
| POST | `/api/payments/orders` | Quote the cart, create the PayPal order, record it. Returns `{ orderId, quote }` |
| POST | `/api/payments/orders/:id/capture` | Capture at PayPal, verify status + amount, mark COMPLETED, return `{ token, expiresAt, quote }` |
| POST | `/api/payments/unlock/verify` | Validate an unlock token and that its order completed |
| POST | `/api/telemetry` | Store a batch of anonymous client events (`204`); see Telemetry below |

Errors are JSON: `{ error: { code, message, details? } }`. Codes the client acts on:
`VALIDATION`, `INVALID_QTY`, `INVALID_COUPON`, `ORDER_NOT_FOUND`, `INSTRUMENT_DECLINED`
(buyer may retry with another funding source), `PAYMENT_PENDING`, `PAYMENT_NOT_VERIFIED`,
`ORDER_FAILED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `PAYPAL_ERROR`, `RATE_LIMITED`.

## How a payment flows

1. The browser's PayPal button calls `POST /orders`. The server prices the cart from
   `PRICE_PER_STUB_CENTS` (never from the client), creates the PayPal order with its
   secret, and inserts a `CREATED` row.
2. After the buyer approves, the browser calls `POST /orders/:id/capture`. The server
   captures, then checks that PayPal reports `COMPLETED` **and** the captured amount and
   currency equal the quote. Only then does the row become `COMPLETED` and an HS256 JWT
   (subject = order id, `UNLOCK_TOKEN_TTL_MINUTES`) is issued.
3. Capture is idempotent: a repeat call on a `COMPLETED` order re-issues a token without
   touching PayPal; concurrent calls for one order are serialized. A mismatched amount
   marks the order `FAILED` permanently. A `PENDING` capture (eCheck) leaves it `CREATED`
   so a later capture can reconcile.
4. The browser keeps the token in `sessionStorage` and re-verifies it on reload.

## Pricing and coupons

`src/services/pricing.ts` is the only place money is computed (integer cents). It
accepts `couponCode` and returns an itemized quote (lines, discounts, subtotal, total).

Coupons come from the `COUPONS` env var, parsed at boot by `parseCoupons` in
`src/config.ts`: `COUPONS=FRIEND:25,LAUNCH:10` is two percent-off codes. Percent only,
whole numbers 1–99 — a 100% code is refused at startup because a $0 order cannot go
through PayPal. Codes are matched case-insensitively, an unknown code is a `400
INVALID_COUPON`, and the applied code is stored on the order row (`coupon_code`). The
Review step has a "Coupon code" field that re-quotes with the code and sends it with the
order. Adding or revoking a code is a `.env` edit plus `pm2 restart <app> --update-env`;
a fixed-amount kind and a coupons table can slot into the same registry later.

## Data

`DATABASE_PATH` (default `server/data/orders.sqlite`, gitignored). One table, `orders`,
holding the quote, PayPal order/capture ids, captured amount, raw capture JSON and the
client's attestation timestamp. Back this file up with the VPS; it is the sales ledger.

A second table, `telemetry_events`, and the `telemetry_sessions` view hold the usage
telemetry described next.

## Telemetry

The web app reports anonymous usage events (page views, wizard steps completed, template
choice, payment outcome, print/PDF, JavaScript errors) to `POST /api/telemetry`. The
payments router adds its own milestones (order created / captured / failed) under the same
session id, which the browser sends as `X-Telemetry-Session` / `X-Telemetry-Visitor` headers.

Every row carries a **site code** `[NNNN]` that identifies the one place in the code that
emitted it: client codes `1000–1999` live in `src/telemetry/codes.ts` of the web app, server
codes `2000–2999` in `src/telemetry/codes.ts` here. Console/PM2 lines use the same format,
e.g. `[2102] payments.order.captured {"orderId":"…"}`.

Privacy: the client never sends form values, and `src/telemetry/scrub.ts` drops or redacts
anything that looks like a name, SSN/EIN, address or wage before insert. A `[2003]
telemetry.scrubbed` line in the logs means the client leaked something — treat it as a bug.

| Env var | Default | Meaning |
| --- | --- | --- |
| `TELEMETRY_ENABLED` | `true` | `false` accepts batches and discards them (kill switch) |
| `TELEMETRY_RETENTION_DAYS` | `90` | Rows older than this are deleted at boot and daily |
| `TELEMETRY_MAX_ROWS` | `2000000` | Hard ceiling on stored rows; the oldest are deleted beyond it (daily and every 1000 batches) |

### Reading it

`scripts/query.js` runs SQL through the already-installed `better-sqlite3`, so the VPS does
not need the `sqlite3` CLI. The starter queries live in `sql/telemetry-queries.sql`.

```bash
ssh paystubissa@<vps>
cd /home/paystubissa/apps/production/server     # or /home/paystubissa/apps/staging/server
node scripts/query.js sessions                  # last 7 days, one row per visit with funnel flags
node scripts/query.js timeline s_xxxxxxxx       # everything one session did, in order
node scripts/query.js funnel                    # per day: sessions → wizard → review → payment → paid
node scripts/query.js errors                    # error-level events in the last 24 h by code
node scripts/query.js paid                      # paid sessions cross-checked against orders
node scripts/query.js --sql "SELECT * FROM telemetry_sessions WHERE paid = 1"
node scripts/query.js --json funnel             # JSON output
```

`telemetry_sessions` columns: `session_id, visitor_id, started_at, last_seen_at, events,
entered_wizard, max_step_completed (0–5), picked_template, started_payment, paid, order_id,
printed_or_downloaded, errors`.

## Deploy (per environment)

Two PM2 processes, each its own checkout and `.env`:

| Env | PM2 name | Port | PayPal | Apache vhost |
| --- | --- | --- | --- | --- |
| staging | `paystub-api-staging` | 4001 | sandbox | `staging.paystubissa.com.conf` |
| production | `paystub-api` | 4000 | live | `paystubissa.com.conf` |

`ecosystem.config.cjs` defines both. The GitHub Actions workflows build here and ship
`dist/` plus the manifests to the VPS, run `npm ci --omit=dev` there, and
`pm2 startOrReload`. One-time VPS setup (Node, PM2, `.env`, Apache proxy include) is
in [docs/deploy/BACKEND-DEPLOY.md](../docs/deploy/BACKEND-DEPLOY.md).

Deploy order matters: the API must be proxied **before** a client build that calls it
goes live, otherwise the SPA fallback answers `/api/*` with HTML and checkout shows
"temporarily unavailable".
