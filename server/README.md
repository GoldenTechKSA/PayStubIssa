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

`src/services/pricing.ts` is the only place money is computed (integer cents). It already
accepts `couponCode` and returns an itemized quote (lines, discounts, subtotal, total).
Coupons are an empty registry in Phase 1; adding one is filling `coupons` in
`src/index.ts` (or a table later), not changing the routes or the client.

## Data

`DATABASE_PATH` (default `server/data/orders.sqlite`, gitignored). One table, `orders`,
holding the quote, PayPal order/capture ids, captured amount, raw capture JSON and the
client's attestation timestamp. Back this file up with the VPS; it is the sales ledger.

## Deploy (per environment)

Two PM2 processes, each its own checkout and `.env`:

| Env | PM2 name | Port | PayPal | Apache vhost |
| --- | --- | --- | --- | --- |
| staging | `paystub-api-staging` | 4001 | sandbox | `staging.paystubissa.com.conf` |
| production | `paystub-api` | 4000 | live | `paystubissa.com.conf` |

`ecosystem.config.cjs` defines both. On the VPS: `npm ci && npm run build`, then
`pm2 start ecosystem.config.cjs --only <name>` and `pm2 save`. Uncomment the `/api`
`ProxyPass` block in the matching vhost (`a2enmod proxy proxy_http headers` first),
`apache2ctl configtest`, `systemctl reload apache2`.

Deploy order matters: the API must be proxied **before** a client build that calls it
goes live, otherwise the SPA fallback answers `/api/*` with HTML and checkout shows
"temporarily unavailable".
