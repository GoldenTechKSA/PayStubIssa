# Paid Stub Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A payment unlocks only the exact pay stubs reviewed at checkout; any later change re-locks them, and support can issue a one-time free correction code.

**Architecture:** The browser sends a salted SHA-256 fingerprint of the stub content with the order; the server stores it and signs it into the unlock token. The client enables Print/Download only while the current content's fingerprint matches, keeps a snapshot of the paid content in `sessionStorage` so the paid stub can always be restored, and freezes the wizard while paid. Correction codes are single-use 100%-off codes in a new table; a zero-total order completes on the server without PayPal.

**Tech Stack:** React 18 + Redux (CRA 5, Jest), MUI 7, `@noble/hashes` v1 (new client dependency), Node/Express, zod, better-sqlite3, jsonwebtoken, vitest.

**Spec:** [docs/superpowers/specs/2026-11-18-paid-stub-lock-design.md](../specs/2026-11-18-paid-stub-lock-design.md)

## Global Constraints

- Pay stub data never reaches the server. Only the 64-hex fingerprint does. The salt never leaves the browser.
- `fingerprint` is a **top-level** field of `POST /api/payments/orders`, never inside `meta` (`meta` is `.strict()`; an older API must ignore the field).
- An order or stored unlock with no fingerprint behaves exactly as today (quantity rule).
- `generalInfo.extraNotes` is not part of the fingerprint and stays editable after payment.
- The template (`appSettings.configPath`, `templateId`) is part of the fingerprint.
- `?dev=unlock` keeps working and stays gated by `isDevUnlock`.
- `COUPONS` env codes stay 1–99%. Only correction codes are 100% and only they may produce a zero-total order.
- Correction code: single use, covers at most the stub count of the order it was issued for, expires after `CORRECTION_CODE_TTL_DAYS` (default 14).
- Telemetry: one emit site per code, registry entry first; never emit the fingerprint, the salt, a coupon or correction code, or any form value.
- No dollar amount may be spelled anywhere in `src/` (`price-context.test.tsx`).
- The clickwrap box is unchanged; `review-attestation.test.tsx` must still pass.
- Style with MUI `sx`/theme values. Phone numbers and addresses stay plain text.
- `@noble/hashes` must be v1 (`^1`), which ships CommonJS; v2 is ESM-only and CRA's Jest will not load it.
- Commits: the owner's rule is that nothing is committed unless they ask. Ask once before the first commit step; if they decline, skip every commit step and leave the work in the tree.
- Run client tests as `npm test -- --watchAll=false <pattern>` and server tests as `npm run api:test -- <pattern>`.

## Review Focus

1. **A reload after paying with a non-default template.** Expected: the wizard opens on Review in the paid state with the paid template, not `template-simple`. Pinned in Task 5.
2. **The customer edits a field while the PayPal window is open.** Expected: after payment they see the mismatch notice and "Restore my paid stub" returns exactly what was fingerprinted when the order was created. Pinned in Task 4.
3. **`/unlock/verify` fails on reload because the network is down, not because the token is bad.** Expected: the stored unlock and snapshot are kept (only a 401 clears them) and the next reload can restore the purchase. Pinned in Task 5.
4. **`sessionStorage` refuses the write (private mode, quota with a large logo).** Expected: no crash; the stub stays unlocked for this visit. Pinned in Task 4.
5. **The same correction code is submitted twice at once.** Expected: exactly one order completes; the other gets `INVALID_COUPON`. Pinned in Task 2.

---

## File Structure

| File | Responsibility |
|---|---|
| `server/src/db.ts` | Migration 3: `orders.content_fp`, `orders.corrects_order_id`, table `correction_codes` |
| `server/src/lib/token.ts` | `fp` claim on the unlock token |
| `server/src/services/orders.ts` | Store fingerprint; correction-aware quote; zero-total completion |
| `server/src/services/correction-codes.ts` (new) | Issue, look up and redeem correction codes |
| `server/src/routes/schemas.ts`, `routes/payments.ts` | `fingerprint` field; create response for a completed order |
| `server/src/config.ts` | `CORRECTION_CODE_TTL_DAYS` |
| `server/scripts/correction-code.js` (new) | Owner's CLI to issue a code for an order |
| `src/utils/paid-lock.ts` (new) | `contentOf`, `fingerprintOf`, `newSalt`, `lockStatus` — all pure |
| `src/services/payments-api.ts` | `Unlock` shape, `createOrder` fingerprint argument, storage |
| `src/components/common/paypal-payment.tsx` | Ask for a fingerprint at order creation |
| `src/components/wizard/steps/ReviewStep.tsx` | Gate by `lockStatus`; paid card; mismatch notice; free-correction button |
| `src/components/wizard/PaystubWizard.tsx` | Restore on load, freeze while paid, template in the draft |
| `src/constants/business-info.ts`, legal pages, FAQ | Copy |

---

### Task 1: Server stores the fingerprint and signs it into the token

**Files:**
- Modify: `server/src/db.ts`, `server/src/lib/token.ts`, `server/src/services/orders.ts`, `server/src/routes/schemas.ts`, `server/src/routes/payments.ts`
- Test: `server/test/token.test.ts`, `server/test/orders.test.ts`, `server/test/app.test.ts`

**Interfaces:**
- Produces:
  - Migration 3 (appended to `MIGRATIONS`): `ALTER TABLE orders ADD COLUMN content_fp TEXT; ALTER TABLE orders ADD COLUMN corrects_order_id TEXT; CREATE TABLE correction_codes (code TEXT PRIMARY KEY, order_id TEXT NOT NULL, max_qty INTEGER NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, used_by_order_id TEXT);` and `OrderRow` gains `content_fp: string | null; corrects_order_id: string | null`.
  - `UnlockClaims.fingerprint?: string` (JWT claim `fp`); `VerifiedUnlock` carries it.
  - `OrderService.createOrder(cart: CartInput, meta?: ClientMeta, fingerprint?: string)`.
  - `CapturedOrderResult.fingerprint?: string`; `POST /unlock/verify` answers `{ valid, orderId, qty, ..., fingerprint? }`.
  - `createOrderSchema` gains `fingerprint: z.string().regex(/^[0-9a-f]{64}$/).optional()`.

- [ ] **Step 1: Write failing tests**

```ts
// token.test.ts
it('round-trips the fingerprint claim', () => {
  const fp = 'a'.repeat(64);
  const { token } = issueUnlockToken({ orderId: 'O1', qty: 2, currency: 'USD', totalCents: 1598, fingerprint: fp }, opts);
  expect(verifyUnlockToken(token, opts.secret).fingerprint).toBe(fp);
});
it('omits the fingerprint when the order has none', () => {
  const { token } = issueUnlockToken({ orderId: 'O1', qty: 1, currency: 'USD', totalCents: 899 }, opts);
  expect(verifyUnlockToken(token, opts.secret).fingerprint).toBeUndefined();
});

// orders.test.ts (use the file's existing fake PayPal + in-memory db helpers)
it('stores the fingerprint and returns it from capture, replayed capture and verify', async () => {
  const fp = 'b'.repeat(64);
  const { orderId } = await svc.createOrder(cart, {}, fp);
  expect(svc.getRow(orderId)!.content_fp).toBe(fp);
  const first = await svc.captureOrder(orderId);
  const replay = await svc.captureOrder(orderId);
  expect(first.fingerprint).toBe(fp);
  expect(replay.fingerprint).toBe(fp);
  expect(svc.verifyUnlock(first.token).fingerprint).toBe(fp);
});
it('an order without a fingerprint behaves as before', async () => {
  const { orderId } = await svc.createOrder(cart);
  const r = await svc.captureOrder(orderId);
  expect(r.fingerprint).toBeUndefined();
});

// app.test.ts
it('rejects a malformed fingerprint with VALIDATION', async () => {
  const res = await request(app).post('/api/payments/orders').send({ items: [{ type: 'paystub', qty: 1 }], fingerprint: 'xyz' });
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('VALIDATION');
});
```

Also add a migration test in `orders.test.ts`: a database opened at schema version 2 (create it with the first two statements, set `schema_version` to 2, insert one order) opens through `openDatabase` with the order intact, `content_fp` null, and `correction_codes` present.

- [ ] **Step 2: Run to verify they fail** — `npm run api:test -- token orders app`. Expected: FAIL (unknown property / column).
- [ ] **Step 3: Implement** the migration, the claim (write `fp` only when present), the third `createOrder` parameter (INSERT `content_fp`), `issue(row)` passing `row.content_fp ?? undefined`, the schema field, and the route passing `body.fingerprint`.
- [ ] **Step 4: Run to verify they pass** — same command, then `npm run api:test` for the whole suite. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(payments): store a content fingerprint on the order and sign it into the unlock`

---

### Task 2: Correction codes and the zero-total order

**Files:**
- Create: `server/src/services/correction-codes.ts`, `server/scripts/correction-code.js`, `server/test/correction-codes.test.ts`
- Modify: `server/src/services/orders.ts`, `server/src/routes/payments.ts`, `server/src/config.ts`, `server/src/index.ts`, `server/src/telemetry/codes.ts`, `server/README.md`
- Test: `server/test/correction-codes.test.ts`, `server/test/orders.test.ts`, `server/test/query-script.test.ts` (pattern to copy for the script test)

**Interfaces:**
- Consumes: Task 1's migration and `createOrder(cart, meta, fingerprint)`.
- Produces:
  - `issueCorrectionCode(db, orderId: string, opts: { now: Date; ttlDays: number }): { code: string; maxQty: number; expiresAt: string }` — throws `Error('ORDER_NOT_COMPLETED')` unless the order row is `COMPLETED`. Code format: `FIX-` plus 10 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` drawn with `crypto.randomInt`. `maxQty` is the summed `qty` of the order's quote lines.
  - `findCorrectionCode(db, code: string): CorrectionCodeRow | undefined` (code already normalised upper-case).
  - `OrderService.quote(cart)`: when the normalised coupon code is a row in `correction_codes`, validate it and quote with a synthetic coupon `{ code, description: 'Correction', kind: 'percent', value: 100 }`. Failures are `badRequest('INVALID_COUPON', …)` with these messages: used → `That correction code has already been used`; expired → `That correction code has expired`; cart quantity over `max_qty` → `That correction code covers at most N pay stub(s)`.
  - `CreatedOrderResult.completed?: CapturedOrderResult`. When the quote total is 0, `createOrder` makes no PayPal call and, in one transaction: marks the code used (`UPDATE correction_codes SET used_at=?, used_by_order_id=? WHERE code=? AND used_at IS NULL`; if `changes !== 1` throw `badRequest('INVALID_COUPON', 'That correction code has already been used')`), inserts the order as `COMPLETED` with id `C-` + 16 random characters of the same alphabet, `paypal_env = 'none'`, `captured_cents = 0`, `captured_at` set, `corrects_order_id` = the code's `order_id`, `content_fp`. Returns `{ orderId, quote, completed: { orderId, status: 'COMPLETED', quote, token, expiresAt, fingerprint } }`.
  - A zero total reached any other way throws `badRequest('INVALID_COUPON', …)` (defensive; env coupons cap at 99).
  - `OrderServiceDeps.correctionCodeTtlDays: number`; config `CORRECTION_CODE_TTL_DAYS: z.coerce.number().int().positive().default(14)`.
  - `prune()` also deletes `correction_codes` rows whose `expires_at` is older than the order cutoff.
  - Server telemetry `PAYMENTS_CORRECTION_REDEEMED: { code: 2105, name: 'payments.correction.redeemed', level: 'info' }`, logged from the `/orders` route with `{ orderId }` when `result.completed` is set.
  - CLI: `node scripts/correction-code.js <orderId>` prints the code, the stub count it covers and the expiry date; exits 1 with a one-line message for an unknown or uncompleted order. Follow `scripts/query.js` for how the database file is located and how `query-script.test.ts` runs it; reuse the compiled service if `query.js` loads compiled code, otherwise keep the SQL in the script.

- [ ] **Step 1: Write failing tests** (`correction-codes.test.ts` unless noted)

```ts
it('issues a code only for a completed order', …);            // CREATED order → throws ORDER_NOT_COMPLETED
it('code matches /^FIX-[A-HJ-NP-Z2-9]{10}$/ and covers the order quantity', …);
it('quotes a cart to zero with a valid code', …);             // quote.totalCents === 0, discounts[0].description === 'Correction'
it('refuses a code for more stubs than the original order', …); // message contains 'covers at most 2 pay stubs'
it('refuses an expired code', …);                             // now = issue + 15 days
it('completes a zero-total order without calling PayPal', async () => {
  const r = await svc.createOrder({ items, couponCode: code }, {}, 'c'.repeat(64));
  expect(paypal.createOrder).not.toHaveBeenCalled();
  expect(r.completed!.status).toBe('COMPLETED');
  expect(svc.verifyUnlock(r.completed!.token).fingerprint).toBe('c'.repeat(64));
  const row = svc.getRow(r.orderId)!;
  expect(row.corrects_order_id).toBe(originalOrderId);
  expect(row.captured_cents).toBe(0);
});
it('a code works once', …);                                   // second createOrder → INVALID_COUPON 'already been used'
it('two simultaneous redemptions complete exactly one order', async () => {
  const results = await Promise.allSettled([svc.createOrder(c, {}), svc.createOrder(c, {})]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
});
it('an env coupon can never produce a zero-total order', …);  // rules with a forged 100% coupon → INVALID_COUPON
```

Script test, modelled on `query-script.test.ts`: against a temp database with one completed order, the script exits 0 and prints a `FIX-` code; with an unknown id it exits 1.

- [ ] **Step 2: Run to verify they fail** — `npm run api:test -- correction-codes orders`.
- [ ] **Step 3: Implement** per the Interfaces block. Wire `correctionCodeTtlDays` in `server/src/index.ts` next to `tokenTtlMinutes`. Add a "Correction codes" section to `server/README.md` (what the command does, when to use it, that the code is emailed to the customer by hand).
- [ ] **Step 4: Run to verify they pass** — `npm run api:test`. Expected: PASS, including the telemetry registry test.
- [ ] **Step 5: Commit** — `feat(payments): one-time correction codes and a no-PayPal path for a free corrected order`

---

### Task 3: Client fingerprint module

**Files:**
- Create: `src/utils/paid-lock.ts`, `src/__test__/paid-lock.test.ts`
- Modify: `package.json` (`npm install @noble/hashes@^1`), `src/assets/data/pay-stub-details.ts`, `src/services/payments-api.ts`

**Interfaces:**
- Produces (all in `src/utils/paid-lock.ts` unless noted):

```ts
export interface PaidSnapshot {
  companyInfo: any; employeeInfo: any; incomeDetails: any; generalInfo: any;
  configPath: string; templateId: number | string;
}
/** Everything that decides the printed stub, in the form it is fingerprinted and stored. */
export function contentOf(state: PayStubDetails): PaidSnapshot;
export function fingerprintOf(content: PaidSnapshot, salt: string): string; // 64 lower-case hex
export function newSalt(): string;                                          // 32 hex chars
export type LockStatus = 'unpaid' | 'match' | 'mismatch';
export function lockStatus(state: PayStubDetails, unlock: Unlock | undefined): LockStatus;
```

  - `contentOf` returns `JSON.parse(JSON.stringify(...))` of the four slices plus the template, with `generalInfo.extraNotes` removed. The JSON round trip is the point: the snapshot stored in `sessionStorage` and the live state then normalise identically.
  - `fingerprintOf` hashes `salt + '\n' + canonical(content)` with `sha256` from `@noble/hashes/sha256`, where `canonical` serialises with object keys sorted at every depth and drops keys whose value is `null`, `undefined` or `''`. `generalInfo.payStubCount` is passed through `normalizeStubCount` first so `"3"` and `3` hash the same.
  - `newSalt` uses `globalThis.crypto.getRandomValues`; if that is missing it falls back to `Math.random` (the salt only has to be unguessable to the server, and it never sees it).
  - `lockStatus`: no unlock → `'unpaid'`. Unlock with `fingerprint` and `salt` → `'match'` when `fingerprintOf(contentOf(state), salt) === fingerprint` and `unlock.qty >= normalizeStubCount(payStubCount)`, else `'mismatch'`. Unlock without a fingerprint (stored by an older build) → `'match'` when `unlock.qty >= stubCount`, else `'mismatch'`.
  - `Unlock` (in `payments-api.ts`) gains `fingerprint?: string; salt?: string; snapshot?: PaidSnapshot; released?: boolean`. Mirror the same optional fields on `appSettings.unlock` in `pay-stub-details.ts`.
  - `unlockStorage.save` returns `boolean` (false when storage refused the write).

- [ ] **Step 1: Write failing tests** (`paid-lock.test.ts`; build states from `production-initial-state` filled with a realistic example and a three-stub run with `stubOverrides`)

```ts
it('is stable across a draft save and reload', () => {
  // dispatch the JSON-round-tripped four slices into a fresh store exactly as PaystubWizard hydrates a draft
  expect(fingerprintOf(contentOf(reloaded), SALT)).toBe(fingerprintOf(contentOf(original), SALT));
});
it.each([
  ['an employee name', s => { s.employeeInfo.employeeFirstName = 'Jon'; }],
  ['an hourly rate', s => { s.incomeDetails.hourlyRate = 31; }],
  ['a pay date', s => { s.incomeDetails.periodPayDate = '2026-11-20'; }],
  ['the stub count', s => { s.generalInfo.payStubCount = 4; }],
  ['a per-stub override', s => { s.incomeDetails.stubOverrides[1] = { bonus: 100 }; }],
  ['the template', s => { s.appSettings.configPath = '/configs/template-modern/paystub-config.xml'; }],
])('changes when %s changes', (_n, mutate) => { … expect(after).not.toBe(before); });
it('ignores the internal notes', …);                       // extraNotes edit → same fingerprint
it('treats a cleared field and a missing field alike', …); // '' vs undefined vs absent
it('is independent of key order', …);
it('differs with a different salt', …);
it('is 64 lower-case hex characters', …);
it('lockStatus: unpaid without an unlock; match; mismatch after an edit', …);
it('lockStatus: an unlock with no fingerprint follows the quantity rule', …);
it('lockStatus: mismatch when the count exceeds the paid quantity', …);
```

- [ ] **Step 2: Run to verify they fail** — `npm test -- --watchAll=false paid-lock`.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run to verify they pass** — same command.
- [ ] **Step 5: Commit** — `feat(lock): fingerprint of the printed content and the lock status that follows from it`

---

### Task 4: Pay with a fingerprint; gate Print and Download on it

**Files:**
- Modify: `src/services/payments-api.ts`, `src/components/common/paypal-payment.tsx`, `src/components/wizard/steps/ReviewStep.tsx`, `src/telemetry/codes.ts`
- Test: `src/__test__/review-paid-lock.test.tsx` (new; copy the render harness and API mocks from `review-attestation.test.tsx`)

**Interfaces:**
- Consumes: Task 3's module; Task 1's `fingerprint` in capture and verify answers.
- Produces:
  - `paymentsApi.createOrder(cart, meta?, fingerprint?)` sends `fingerprint` top-level. `CreatedOrder.completed?: CapturedOrder`; `CapturedOrder.fingerprint?: string`; `verifyUnlock` result gains `fingerprint?: string`.
  - `<PayPal>` gains `getFingerprint?: () => string`, called inside `createOrder` at click time (through a ref, like `cart`).
  - In `ReviewStep`: `beginCheckout(): string` generates a salt, takes `contentOf(fullState)`, computes the fingerprint, keeps `{ salt, fingerprint, snapshot }` in a ref and returns the fingerprint. `handlePaymentSuccess` builds the unlock from that ref (`fingerprint: result.fingerprint ?? pending.fingerprint`), saves it and dispatches it. **The snapshot is the one taken in `beginCheckout`, not the state at success.**
  - `const status = useMemo(() => lockStatus(fullState, unlock), […slices, unlock])`; `canPrint = status === 'match' || (isDevUnlock(location.search) && !!appSettings.canPrint)`. Remove `paidForFewer` and its Alert (the mismatch notice replaces it).
  - Mismatch notice (shown when `status === 'mismatch'`, above "Pay to unlock"): title `This is not the pay stub you paid for`, body `You changed it after payment. Pay again for the new version, or go back to the one you bought.`, button `Restore my paid stub` (only when `unlock.snapshot` exists). Restore dispatches the four `save*` actions and `updateAppSettings({ configPath, templateId, unlock: { ...unlock, released: false } })`, and saves the unlock.
  - Final-once-paid line, rendered directly above the PayPal buttons, text from `FINAL_ONCE_PAID` (Task 7 adds the constant; until then define it in `business-info.ts` here): `Pay stubs are final once paid. Check every detail now; a change after payment needs a new purchase.`
  - Client telemetry: `UNLOCK_CONTENT_MISMATCH: { code: 1311, name: 'unlock.content_mismatch', level: 'info', props: ['orderId'] }`, emitted once each time `status` turns to `'mismatch'`; `UNLOCK_PAID_RESTORED: { code: 1312, name: 'unlock.paid_restored', level: 'info', props: ['orderId'] }`.

- [ ] **Step 1: Write failing tests**

```tsx
it('sends a 64-hex fingerprint with the order', …);            // createOrder mock called with (cart, meta, expect.stringMatching(/^[0-9a-f]{64}$/))
it('unlocks Print and Download after payment', …);
it('re-locks when a field changes after payment and shows the notice', …); // dispatch saveEmployeeInfo → watermark chip back, notice text present, Print absent
it('unlocks again when the change is undone', …);
it('Restore my paid stub brings back the paid content and the buttons', …);
it('an edit made between order creation and capture is not what was paid for', async () => {
  // call getFingerprint, then dispatch an edit, then deliver the capture result
  // expect the notice; click Restore; expect the pre-edit employee name in the store and Print enabled
});
it('still unlocks when sessionStorage refuses the write', …);  // setItem throws → Print enabled, no error thrown
it('uses the server fingerprint when the capture answer carries one', …);
it('shows the final-once-paid line before payment', …);
it('dev unlock still enables Print with no unlock object', …);
```

- [ ] **Step 2: Run to verify they fail** — `npm test -- --watchAll=false review-paid-lock`.
- [ ] **Step 3: Implement** per the Interfaces block. Leave the reload-restore effect in `ReviewStep` alone; Task 5 moves it.
- [ ] **Step 4: Run to verify they pass** — `npm test -- --watchAll=false review-paid-lock review-attestation price-context codes`.
- [ ] **Step 5: Commit** — `feat(review): the payment unlocks the stub that was reviewed, and only that one`

---

### Task 5: The wizard restores a paid stub on load and freezes while paid

**Files:**
- Modify: `src/components/wizard/PaystubWizard.tsx`, `src/components/wizard/steps/ReviewStep.tsx`, `src/telemetry/codes.ts`
- Test: `src/__test__/wizard-paid-state.test.tsx` (new)

**Interfaces:**
- Consumes: `lockStatus`, `Unlock.snapshot`, `Unlock.released`, `unlockStorage`, `paymentsApi.verifyUnlock`.
- Produces:
  - Draft (`paystubissa.draft.v1`) gains `template: { configPath, templateId }`; hydration applies it before the `DEFAULT_CONFIG` fallback; the autosave effect also depends on those two values. (Fixes today's bug: a reload falls back to `template-simple`.)
  - On mount, after draft hydration, if `unlockStorage.load()` returns an unlock and the store has none: render a `LinearProgress` in place of the step until `verifyUnlock(token)` settles.
    - Success, `released` falsy, snapshot present: dispatch the snapshot (four slices + template), `updateAppSettings({ canPrint: true, unlock: { ...stored, qty: v.qty, expiresAt: v.expiresAt, fingerprint: v.fingerprint ?? stored.fingerprint } })`, `setActive(5)`, emit `UNLOCK_RESTORED` (code 1308 moves here; delete the effect and the emit in `ReviewStep`).
    - Success, `released` true or no snapshot: dispatch only the unlock; the wizard starts normally.
    - `PaymentsApiError` with `status === 401`: `unlockStorage.clear()`, start normally.
    - Any other failure: keep the stored unlock, start normally, do not unlock.
  - `frozen = lockStatus(state, unlock) === 'match' && !unlock?.released && !isDevUnlock(location.search)`. While frozen: `active` is forced to 5; `goBack` and `jumpTo` do nothing; stepper labels are not clickable (cursor `default`). `ReviewStep` receives `frozen: boolean`.
  - `ReviewStep` when `frozen`: `SummarySection` Edit buttons and the bottom Back button are not rendered. The paid card reads:
    - Alert (success): `Payment complete: your pay stub is ready.` / `Payment complete: your N pay stubs are ready.`
    - Print and Download buttons as today.
    - Caption: `This is your final document. Save the PDF now; it stays available in this browser tab for about an hour.`
    - Text button `Make another pay stub`.
  - `Make another pay stub` opens an MUI `Dialog`: title `Make another pay stub?`, body `Your details stay filled in so you can change them. A changed pay stub needs a new purchase. You can come back to the one you just bought for as long as it is available in this tab.`, actions `Cancel` / `Continue`. Continue sets `unlock.released = true` in the store and in `unlockStorage`, and emits `UNLOCK_RELEASED: { code: 1313, name: 'unlock.released', level: 'info', props: ['orderId'] }`.
  - When `status === 'match'` and `released` is true (nothing changed yet), the paid card still shows Print and Download; the Edit and Back controls are back.

- [ ] **Step 1: Write failing tests** (mount `PaystubWizard` in a `MemoryRouter` with a real store; seed `sessionStorage` / `localStorage`; mock `paymentsApi`)

```tsx
it('opens on Review in the paid state after a reload', …);          // stored unlock + snapshot, verify resolves → Print visible, no Edit buttons
it('restores the paid template, not the default one', …);           // snapshot.configPath = template-modern → store.appSettings.configPath is template-modern
it('keeps the template of an unpaid draft across a reload', …);     // draft.template applied
it('a rejected token clears the unlock and starts at step 1', …);   // verify rejects with status 401 → storage empty
it('a network failure keeps the stored unlock', …);                 // verify rejects with status 0 → storage still holds it, step 1 shown, Print not offered
it('does not pull a released customer back to Review', …);
it('while paid, the stepper and Back do not navigate', …);
it('Make another pay stub reopens editing after confirmation', …);  // Continue → Edit buttons present, storage unlock.released === true
it('Cancel in the dialog changes nothing', …);
it('an unlock stored by an older build still unlocks by quantity', …); // no fingerprint, qty 2, draft count 2 → Print visible
it('?dev=unlock is not frozen', …);
```

- [ ] **Step 2: Run to verify they fail** — `npm test -- --watchAll=false wizard-paid-state`.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run to verify they pass** — `npm test -- --watchAll=false wizard-paid-state review-paid-lock review-attestation codes`.
- [ ] **Step 5: Commit** — `feat(wizard): a paid stub survives a reload and is frozen until the customer chooses to make another`

---

### Task 6: Free corrected order in the Review step

**Files:**
- Modify: `src/components/wizard/steps/ReviewStep.tsx`
- Test: `src/__test__/review-correction-code.test.tsx` (new)

**Interfaces:**
- Consumes: Task 2's `completed` in the create answer; Task 4's `beginCheckout` and `handlePaymentSuccess`.
- Produces: when `quote?.totalCents === 0` and the box is ticked, the PayPal block is replaced by a contained button `Get my corrected pay stub` and the sentence `Your correction code covers this order. Nothing will be charged.` Click: `beginCheckout()`, then `paymentsApi.createOrder(cart, meta, fingerprint)`; a `completed` answer goes to `handlePaymentSuccess`; an error goes to `handlePaymentError`; an answer without `completed` is treated as an error with the message `This code could not be applied. Please try again.` The button is disabled while the request is in flight. `<PayPal>` is not mounted in this state. No new telemetry code: a correction code goes through the coupon field, so the existing `COUPON_APPLIED` / `COUPON_REJECTED` sites already report it (without the code text), and `PAYMENT_SUCCEEDED` fires from `handlePaymentSuccess`.

- [ ] **Step 1: Write failing tests**

```tsx
it('offers the free button instead of PayPal when the total is zero', …);
it('still requires the clickwrap box', …);                       // unticked → no button, the "Confirm the statement above" alert
it('completes without PayPal and unlocks the stub', …);          // createOrder resolves { completed } → Print visible, captureOrder never called
it('shows the server message when the code was already used', …); // quote rejects INVALID_COUPON → message under the coupon field
it('disables the button while the order is being created', …);
```

- [ ] **Step 2: Run to verify they fail** — `npm test -- --watchAll=false review-correction-code`.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run to verify they pass** — same command plus `review-paid-lock price-context`.
- [ ] **Step 5: Commit** — `feat(review): redeem a correction code without a PayPal step`

---

### Task 7: Copy, legal pages and project docs

The wording below is a draft for the owner to approve before this task is committed; the Terms and Privacy text was reviewed by a lawyer, so show the owner the diff of those two files.

**Files:**
- Modify: `src/constants/business-info.ts`, `src/components/common/terms-of-use.tsx` (delivery paragraph near line 227, §8 near line 239), `src/components/common/faq-page.tsx` (near lines 238, 312, 357, 371), `src/components/common/privacy-policy.tsx` (near lines 152 and 183), `CLAUDE.md`
- Test: `src/__test__/legal-copy.test.tsx` (new, or extend an existing legal-page test if one exists)

**Interfaces:**
- Produces: `FINAL_ONCE_PAID` exported from `business-info.ts` (the sentence in Task 4), used by the Review step and the FAQ; `POLICIES_LAST_UPDATED` and `POLICIES_VERSION` bumped together.

Draft copy:
- **Terms, delivery:** after "Once payment succeeds, the Service unlocks the download and print functions in your browser." add: "The unlock applies to the document as it was when you paid. A document is final once paid: if you change it afterwards, the changed document is a new purchase."
- **Terms §8:** keep "we will always give you a free corrected document" and replace "Just tell us what was wrong." with: "Email us what was wrong and we will send you a one-time correction code that lets you fix the document and download it again at no charge."
- **FAQ, unlock answer:** append `FINAL_ONCE_PAID`.
- **FAQ, typo/refund answer:** same replacement as Terms §8.
- **FAQ, mistake after downloading:** replace "correct it and print again" with: "email us; we will send you a correction code so you can fix it and download it again free of charge."
- **FAQ, how long can I edit:** "Edits are unlimited and free right up until you pay" (was "until you download or print"), then: "Once you pay, the document is final."
- **Privacy, order record:** add "a one-way fingerprint of your document, which lets us confirm that what you download is what you paid for and cannot be turned back into its contents" and "if an order is a free correction, which earlier order it corrects".
- **Privacy, session storage:** the sentence now reads that the browser keeps the unlock token "and a copy of the paid document" in session storage, which is cleared when the tab closes.
- **CLAUDE.md:** in "Review, payment, PDF/print, telemetry", replace the payment-gating description with the fingerprint rule, the paid/frozen state, the snapshot and restore, correction codes and the zero-total path, and the `correction-code.js` command.

- [ ] **Step 1: Write failing tests**

```tsx
it('the Terms say a document is final once paid', …);                 // /final once paid/i on the Terms page
it('the Terms still promise a free corrected document and say how', …); // /free corrected document/ and /correction code/
it('the FAQ no longer says to correct it and print again', …);        // queryByText(/correct it and print again/) is null
it('the FAQ says edits are free until you pay', …);
it('the Privacy Policy describes the fingerprint and the paid copy in session storage', …);
```

- [ ] **Step 2: Run to verify they fail** — `npm test -- --watchAll=false legal-copy`.
- [ ] **Step 3: Implement** the copy and the version bump; update `CLAUDE.md`.
- [ ] **Step 4: Run to verify they pass** — `npm test -- --watchAll=false legal-copy price-context review-attestation`.
- [ ] **Step 5: Show the owner the Terms, FAQ and Privacy diff and get their approval of the wording.**
- [ ] **Step 6: Commit** — `docs(legal): a paid document is final; corrections come by one-time code`

---

### Task 8: Whole-change verification

- [ ] **Step 1:** `npm test -- --watchAll=false` — every client suite passes.
- [ ] **Step 2:** `npm run api:test` — every server suite passes.
- [ ] **Step 3:** `npm run build` — builds with no new ESLint warnings.
- [ ] **Step 4:** `node scripts/snapshot-templates.js template-simple` — one stub is one page, and `review-shell` and `review-shell-run` still report one and three sheets (the paid card changed inside the Review step's ancestor chain).
- [ ] **Step 5: Manual run against the PayPal sandbox** (`npm run api` + `npm start`), reporting each result:
  1. Pay for one stub with a non-default template. Print and Download work.
  2. Reload: lands on Review, paid, same template.
  3. "Make another pay stub", change the employee name: watermark and pay gate return with the notice. Undo the change by hand: unlocked again.
  4. Change it again, click "Restore my paid stub": paid state returns.
  5. In the browser's storage, edit the draft and reload: the stub is locked.
  6. Run `node scripts/correction-code.js <orderId>` in `server/`, enter the code with a corrected name: total is zero, "Get my corrected pay stub" unlocks it with no PayPal window. Entering the code a second time is refused.
- [ ] **Step 6:** Tell the owner what is left for them: the deploy order (the client tolerates the old API, so either order is safe), setting `CORRECTION_CODE_TTL_DAYS` only if 14 days is not wanted, and the lawyer's look at the Terms and Privacy wording.
