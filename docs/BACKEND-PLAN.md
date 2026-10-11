# Backend Implementation Plan

Status: **Phase 1 code complete — sandbox test next** · Target host: **Hostinger VPS — KVM2** · Last updated: 2026-10-10

> **Resume here (2026-10-10):** `server/` is scaffolded and tested (28 vitest cases), the
> client is wired to it, and `staging.paystubissa.com` + the PayPal sandbox/live apps exist.
> **Next action:** local end-to-end sandbox test (`server/.env` with sandbox creds →
> `npm run api` + `npm start` → pay with the sandbox buyer on the Review step), then deploy
> `paystub-api-staging` to the VPS (see [server/README.md](../server/README.md) "Deploy")
> and repeat on staging. Production cutover (live creds, prod vhost `ProxyPass`, extend
> `deploy.yml` to build + reload the server) comes after staging passes.

This plan introduces a server-side component to PayStubIssa, which has until now been a
client-only static SPA. It is sequenced in phases so each phase ships independently and the
site keeps working throughout.

---

## 1. Goals & non-goals

**Goals (in priority order, per product decision):**
1. **Secure the payment gate** — printing/PDF can no longer be unlocked for free by editing
   client state or replaying the client-side PayPal capture.
2. **Server-side PDF generation** — the paid paystub artifact only materializes after a
   verified payment.
3. **Telemetry endpoint** — actually collect the events the client already emits to the
   (currently missing) `POST /api/telemetry`.

**Explicit non-goals (this round):**
- **Tax calculation stays client-side.** Per decision, the browser remains the source of
  truth for the math. The server renders the numbers the client supplies. See the tradeoff
  note in Phase 2.
- **No user accounts / login.** Verify-and-forget model to start.
- **No persistent paystub storage.** (One small exception is *recommended* below — an orders
  audit row — but it's optional and called out.)

**Forward-looking (not built now, but designed for):** dynamic pricing, coupon codes, and
multi-paystub quantity discounts. Phase 1 makes pricing **server-authoritative**, which is
the prerequisite for all of that.

---

## 2. Architecture overview

> **Host reality (confirmed 2026-06-27):** the VPS is a **shared Apache 2.4 box** running 6
> sites (paystubissa.com already has its own Apache vhost). **nginx is not used** — adding it
> would collide with Apache on port 80. We integrate via Apache `mod_proxy`, touching **only**
> `paystubissa.com.conf`. There is currently **no HTTPS** on the box (Apache listens on `:80`
> only); adding TLS for paystubissa.com is part of Phase 0.

```
        Hostinger VPS (KVM2, Ubuntu 24.04, 2 vCPU / 8 GB) — SHARED, 6 sites
   ┌───────────────────────────────────────────────────────────────┐
   │  Apache 2.4 (existing)  :80 + :443 (TLS via Let's Encrypt)     │
   │    ├── 5 other vhosts ............................ UNTOUCHED   │
   │    └── paystubissa.com.conf  (the only file we edit)           │
   │          ├── /        → DocumentRoot = React build + SPA       │
   │          │              fallback (RewriteRule → index.html)    │
   │          └── /api/*   → mod_proxy → 127.0.0.1:4000             │
   │                                                                │
   │  Node service (Express + TypeScript, PM2) — bound to localhost │
   │    ├── POST /api/payments/orders            (create order)     │
   │    ├── POST /api/payments/orders/:id/capture(capture+verify)   │
   │    ├── POST /api/payments/webhook           (PayPal webhook)   │
   │    ├── POST /api/paystub/pdf                (Phase 2)          │
   │    ├── POST /api/telemetry                  (Phase 3)          │
   │    └── GET  /api/health                                        │
   │                                                                │
   │  PayPal REST API (server-to-server, secret credentials)        │
   └───────────────────────────────────────────────────────────────┘
```

**Why this shape:**
- **Same-origin** (`paystubissa.com` serves both the SPA and `/api`) → no CORS, and the
  unlock token can ride as a normal response. Simpler and safer than a separate API domain.
- **Reuse the existing Apache**, don't introduce nginx — one vhost change, zero risk to the
  other 5 sites, no port-80 conflict.
- **Node + PM2** behind Apache gives auto-restart, boot persistence, and log rotation. The
  Node service binds to `127.0.0.1:4000` (never public); Apache `mod_proxy` is the only way in.
- KVM2's RAM headroom (8 GB, shared) makes the Phase 2 headless-Chromium PDF path viable, but
  we cap its concurrency so it can't starve the neighbor sites.

### Assumptions (call out if any is wrong)
- **A1.** Root/SSH confirmed. Apache, Node LTS install, PM2, certbot all available. We enable
  Apache mods `proxy`, `proxy_http`, `rewrite`, `headers`, `ssl`.
- **A2.** **This is a migration.** paystubissa.com currently runs on a *different* shared host
  (which is why it had to be client-only); DNS still points there. The VPS has a placeholder
  vhost but no live traffic. We build + test on `staging.paystubissa.com` → VPS, then cut DNS
  over to the VPS. See "Migration & DNS cutover" below.
- **A3.** Hostinger hPanel firewall must allow inbound **443** before certbot (nothing listens
  there today).
- **A4.** You have (or can create) a **PayPal REST app** to obtain a client-id + secret for
  both **sandbox** and **live**. The secret lives only in the server `.env`.
- **A5.** Backend language is **Node + TypeScript** (matches the frontend; lets us reuse
  types and, later, the pure calc utilities). Framework: **Express** for familiarity;
  **Fastify** is a reasonable alternative if you want built-in schema validation.

---

## 3. Repository & deployment structure

**Decision: add a self-contained `server/` directory to the existing repo** (not a separate
repo, not a full workspace refactor).

```
/ (CRA app stays at root — unchanged)
  src/ ...
  public/ ...
  server/                 ← new
    src/
      index.ts            app bootstrap
      routes/
      services/paypal.ts
      lib/token.ts        JWT issue/verify
      config.ts           env loading + validation
    package.json          own deps (express, @paypal/..., zod, jsonwebtoken)
    tsconfig.json
    .env.example          documented; real .env is gitignored
  shared/                 ← optional, added when duplication appears
    types/paystub.ts
  docs/BACKEND-PLAN.md
```

**Why a sibling folder, not a monorepo refactor:** CRA pins `baseUrl: src` and dislikes
imports outside `src/`. A standalone `server/` with its own `package.json`/`tsconfig` avoids
fighting react-scripts. The few shared types we need in Phase 1 are trivial; we extract a
`shared/` package only once duplication actually hurts (likely Phase 2, when the server needs
`PaystubModel`).

**Deployment:** the static client is already deployed by GitHub Actions (build →
rsync `build/` to `/var/www/paystubissa.com`, Apache `FallbackResource` for the SPA) —
see [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md). Adding the backend means:
- Build server (`tsc`) → `pm2 reload paystub-api` (Node bound to `127.0.0.1:4000`).
- Uncomment the `/api` `ProxyPass` block in the Apache vhost and `a2enmod proxy proxy_http`.
- Extend the deploy flow (or a `deploy.sh`) to also build + reload the server over SSH.
- Secrets via `server/.env` on the VPS only (already gitignored pattern in this repo).

### Migration & DNS cutover (old shared host → VPS)

The site currently lives on a different shared host. There is **no data to migrate** (static
client app), so migration = deploy the build to the VPS + flip DNS. The only subtlety is a
**DNS/TLS chicken-and-egg**: Let's Encrypt HTTP-01 needs the name resolving to the VPS, but it
still resolves to the old host. Path:

1. **Lower TTL** on `paystubissa.com` A/AAAA records (e.g. 300s) now, so cutover is fast/reversible.
2. **Staging:** `staging.paystubissa.com` → VPS IP; own vhost + docroot + its own Let's Encrypt
   cert. Build and test the entire stack (static + backend + PayPal sandbox) here, zero prod risk.
3. **Cutover:** point apex + `www` A/AAAA at the VPS → run `certbot --apache` for the apex
   (HTTP-01 now validates) → enable HTTP→HTTPS redirect → switch PayPal to **live**.
4. **Rollback:** keep the old host live and untouched until propagation is confirmed; reverting
   is just pointing DNS back.

**Only touch the web records** (A/AAAA apex, A/CNAME `www`). Leave **MX/TXT/email** records as-is.

---

## 4. Phase 1 — Secure the payment gate  *(highest value)*

### Problem (confirmed in code)
In [paypal-payment.tsx](../src/components/common/paypal-payment.tsx), `createOrder` builds the
`$8.99` order **in the browser** and `actions.order.capture()` captures **in the browser**;
success just flips `appSettings.canPrint`. No server ever sees the transaction, so the gate is
trivially bypassable (DevTools, Redux edit, or calling the success path directly).

### Target flow (server-authoritative)
1. **Create order** — the SDK's `createOrder` calls `POST /api/payments/orders` with a cart
   (`{ items: [{ type: 'paystub', qty: 1 }], couponCode?: string }`). The server computes the
   price from a server-side price config, calls PayPal **Orders v2** (`POST /v2/checkout/orders`)
   with its **secret**, and returns the PayPal `orderId`. The client never decides the amount.
2. **Capture** — `onApprove` calls `POST /api/payments/orders/:id/capture`. The server calls
   PayPal capture, asserts `status === "COMPLETED"` **and** the captured amount equals what it
   quoted, then issues a **signed unlock token** (JWT, ~30 min TTL, bound to the order id).
3. **Unlock** — the client stores the token; `canPrint` (and Phase 2's PDF call) require a
   valid token. Because it's server-signed, the client can't forge it.

### Why this design
- **Server decides price** → this is also the seam for future coupons/quantity discounts; the
  API shape already carries `items`/`couponCode`, so the later work is "fill in the pricing
  function + coupons table," not "re-architect payments."
- **JWT unlock token** keeps us in the chosen *verify-only, no-DB* model while still being
  tamper-proof: the proof of payment is a signature, not a client boolean.

### Recommended small addition (optional, flagged)
Even in verify-only mode, a **single `orders` table** (SQLite to start, or Postgres) is cheap
and buys: idempotent capture (prevent double-capture/replay), a payment audit trail, and a
basis for refunds/support. My recommendation is to include it now; it's ~an afternoon and
avoids a migration later. If you'd rather stay strictly stateless for v1, the JWT-only path
works — note the tradeoff that we then have no server record of sales.

### Hardening
- **PayPal webhook** (`PAYMENT.CAPTURE.COMPLETED`) as an independent server-side source of
  truth, verified via PayPal's webhook-signature API. Optional in Phase 1, recommended soon.
- `helmet`, `express-rate-limit` on payment routes, `zod` request validation, HTTPS-only.

### Client changes
- `PayPal` component: swap inline `createOrder`/`capture` for `createOrder`/`onApprove`
  callbacks that hit our two endpoints.
- Gate `canPrint` (and PDF) on the returned token; keep the existing PREVIEW watermark until
  unlocked.

### Phase 1 task list
- [x] Provision: TLS for paystubissa.com done; `staging.paystubissa.com` vhost live (2026-10-10). Still to do on the VPS: `a2enmod proxy proxy_http headers`, install Node LTS + PM2.
- [x] Scaffold `server/` (Express 5 + TS + zod + jsonwebtoken + plain-fetch PayPal REST client). See [server/README.md](../server/README.md).
- [x] `config.ts` loads & validates env (PayPal id/secret/env, JWT secret, price, DB path).
- [x] `paypal.ts`: OAuth + create-order + capture (+ `ORDER_ALREADY_CAPTURED` reconcile) against sandbox/live.
- [x] Routes: config, quote, create-order, capture, unlock/verify, health. Issue/verify unlock JWT.
- [x] `orders` table (SQLite) + idempotent, serialized capture + amount/currency verification.
- [x] Wire client `PayPal` component to the new endpoints; SDK loaded with the server's client id; gate on token, re-verified after reload; unlock bound to paid stub count.
- [x] Local sandbox end-to-end with real sandbox credentials — passed 2026-10-11 (order COMPLETED, captured 899 = quoted 899, print unlocked).
- [ ] VPS: PM2 `paystub-api-staging` on :4001, uncomment `/api` `ProxyPass` in the staging vhost, deploy a client build to staging, sandbox purchase on staging.
- [ ] Production: PM2 `paystub-api` on :4000 with live creds, uncomment `ProxyPass` in prod vhost, extend `deploy.yml` to build + reload the server, one live purchase.
- [ ] Soon after: PayPal webhook (`PAYMENT.CAPTURE.COMPLETED`) as an independent source of truth.

---

## 5. Phase 2 — Server-side PDF generation

### Goal
The paid PDF only exists server-side, after a verified payment — removing the client-side
`html2canvas`/`jspdf` artifact as the thing being "unlocked."

### Approach: headless Chromium (Puppeteer)
- New `POST /api/paystub/pdf` accepts `{ model, configPath, token }`. Server validates the
  unlock token, then renders the **existing** XML/template pipeline in headless Chromium
  (e.g. by loading a dedicated `/print` route of the SPA with the data injected) and returns
  `application/pdf`.
- **Why Puppeteer:** it reuses the current renderer verbatim (XML config → React), so the PDF
  matches the on-screen preview exactly with minimal divergence. KVM2 has the RAM for it.

### Tradeoff to acknowledge (because tax calc stays client-side)
The server renders **the numbers the client sends**; it does not recompute taxes. So Phase 2
gates the *artifact*, not the *math*. That's consistent with your decision. If you later want
integrity on the numbers too, note that `buildPaystubModel` / `tax-calculator` are **pure TS
utilities** and could be moved into `shared/` and run server-side from raw inputs — a clean
future upgrade that doesn't change the UX.

### Notes
- Keep the client `html2canvas` path as **preview/watermarked** only, or retire it once the
  server path is solid.
- Cache the Chromium instance / use a small pool; cap concurrency to protect RAM.

---

## 6. Phase 3 — Telemetry endpoint

### Goal
Implement the missing `POST /api/telemetry` that
[telemetry-service.ts](../src/services/telemetry-service.ts) already posts batches to (today
every flush fails and re-queues).

### Approach
- Accept `{ events, session }`, validate with `zod`, enforce a payload-size limit and rate
  limit (the client also uses `navigator.sendBeacon` on unload — handle that content type).
- Storage: start by appending to a DB table or structured log; pipe to a real analytics store
  later if needed.

### Privacy gate (important — this is financial data)
- `anonymizeData` is currently **off** and only strips `email`/`phone`. Before this goes live,
  **audit what the client sends** and guarantee telemetry never carries SSN/EIN, employee
  names, or wage figures. Add server-side scrubbing as a backstop regardless of client config.

---

## 7. Cross-cutting concerns

- **Secrets/config:** PayPal id/secret, JWT secret, webhook id live in `server/.env` on the
  VPS only. `.env.example` documents them. Never in git or the client bundle.
- **Environments:** PayPal **sandbox** for dev/staging, **live** for prod; branch on
  `NODE_ENV` as the app already does.
- **Security baseline:** TLS-only, `helmet`, rate limiting, `zod` validation on every route,
  short-TTL tokens, server-side amount verification on capture.
- **Observability:** `/api/health`, PM2 logs, an external uptime check.
- **Backups:** only relevant once a DB exists (Phase 1 optional table / Phase 3 telemetry).

---

## 8. Suggested sequence & rough effort

| Phase | Outcome | Rough effort |
|------|----------|--------------|
| 0 | Apache vhost + TLS serving the existing build via the VPS (no behavior change) | 0.5 day |
| 1 | Server-authoritative PayPal + tamper-proof unlock | 2–4 days |
| 2 | Server-side gated PDF (Puppeteer) | 2–3 days |
| 3 | Telemetry endpoint + privacy scrub | 1 day |
| later | Dynamic pricing, coupons, multi-paystub quantity | scoped separately |

Recommend shipping **Phase 0 + 1** first as one milestone — that closes the revenue leak and
lays all the foundations (host, deploy, token model, server-authoritative pricing) that the
rest builds on.

---

## 9. Open questions — RESOLVED 2026-10-09

1. **Orders table in Phase 1?** **Yes.** SQLite on the VPS disk (`server/data/orders.sqlite`,
   gitignored, included in backups). Buys idempotent capture, a sales audit trail, and a
   lookup for refunds/support. Postgres only if traffic ever warrants it.
2. **PayPal app:** REST apps (sandbox + live) still need to be created in the PayPal Developer
   Dashboard. Server secrets go in `server/.env` only. Walkthrough given to owner 2026-10-09.
3. **Domain cutover:** **done** — production already serves from the VPS over HTTPS (the deploy
   workflow smoke-tests `https://paystubissa.com/`). A **`staging.paystubissa.com`** vhost is
   being added so Phase 1 can be tested with PayPal sandbox before touching production.
4. **Price:** **confirmed $8.99 per pay stub**, 1–12 stubs, USD. **Volume discounts and coupon
   codes are coming soon**, so the Phase 1 pricing function must accept
   `{ items: [{ type: 'paystub', qty }], couponCode? }` and return an itemized quote
   (unit price, qty, discounts applied, total) from day one — even though only the flat
   per-stub rule ships in Phase 1.
