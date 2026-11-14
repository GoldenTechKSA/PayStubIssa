# Offers Page and Tiered Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Charge less per pay stub as the order grows (four server-defined tiers) and sell it on a new `/offers` page plus orange "Bundle and Save" buttons on the home page.

**Architecture:** The server owns a tier table (`PRICE_TIERS`), uses it in `quoteCart`, and publishes it on `GET /api/payments/config`. The client stamps the table into the build and confirms it live through the existing `price-context`; every page reads prices from that context only.

**Tech Stack:** Node/Express + zod + vitest (server); CRA + TypeScript + MUI 7 + Jest/RTL (client).

**Spec:** `docs/superpowers/specs/2026-11-13-offers-tiered-pricing-design.md` — read it first; "Settled after the builder check" overrides earlier lines where they differ.

## Global Constraints

- Tiers: `1:899,2:799,5:699,9:599` (min qty : cents). Every stub in the order pays the tier price.
- No price number hand-typed in `src/` or `public/index.html`.
- Copy must be literally true; never "authentic", "realistic", "sent to you", "proof of income".
- Page heading "Our Great Offers!" ("Offers!" in `primary.main`), subtitle "Select the best fit for you", card button "Make yours now!", home button "Bundle and Save" — verbatim.
- MUI `sx` and theme tokens only; no raw hex outside `src/theme/theme.ts`.
- Telemetry: registry entry before each new emit site; ids/counts only.
- **No commits.** The owner commits by asking; leave the tree uncommitted and do not push.
- Do not edit `.github/workflows/*`.

## Review Focus

1. `PRICE_TIERS` with spaces, a trailing comma, or lower/upper-case noise → parsed if unambiguous, otherwise the API refuses to boot with a message naming the bad entry (Task 1).
2. `/config` answered by an older API with no `tiers` → stamp script uses the `config.ts` default; live client keeps its stamped tiers rather than collapsing to one (Tasks 3, 4).
3. `/create?stubs=abc`, `?stubs=0`, `?stubs=99` → ignored or clamped to 1–12, never NaN in the store; a saved draft keeps every other field (Task 6).
4. Stale `paystubissa.price.v1` cache or a malformed `v2` entry in localStorage → ignored, stamp used (Task 4).
5. Live tiers that are not 1/2/5/9 → generic cards, no named copy, no negative "Save" line (Task 5).

---

### Task 1: Server tier table and tiered quote

**Files:**
- Modify: `server/src/config.ts`, `server/src/services/pricing.ts`, `server/src/index.ts`, `server/src/routes/payments.ts`, `server/.env.example`, `server/README.md`, `docs/deploy/BACKEND-DEPLOY.md`
- Test: `server/test/config-price-tiers.test.ts` (new), `server/test/pricing.test.ts`, `server/test/app.test.ts`, `server/test/helpers.ts`

**Interfaces — produces:**
- `export interface PriceTier { minQty: number; unitCents: number }` in `pricing.ts`
- `export function parsePriceTiers(raw: string | undefined, maxQty: number): PriceTier[]` in `config.ts`; `Config.priceTiers: PriceTier[]`
- `export function unitCentsFor(tiers: PriceTier[], qty: number): number` in `pricing.ts`
- `PricingRules.unitCents` replaced by `tiers: Record<ItemType, PriceTier[]>`
- `/config` JSON gains `tiers: Array<{ minQty: number; maxQty: number; unitCents: number }>`; `unitCents.paystub` stays = tier-1 price.

- [ ] **Step 1: Failing tests.** `config-price-tiers.test.ts`: default (undefined/empty) → the four tiers; `" 1:899, 2:799 ,5:699,9:599, "` parses; each of these throws with the entry in the message: first tier not 1 (`2:799`), non-ascending min (`1:899,5:699,2:799`), duplicate min, min > maxQty (`1:899,13:500` with maxQty 12), non-descending price (`1:899,2:899` and `1:899,2:999`), zero/negative/fractional cents, malformed entry (`1-899`). `pricing.test.ts`: `unitCentsFor` at qty 1, 2, 4, 5, 8, 9, 12 → 899, 799, 799, 699, 699, 599, 599; `quoteCart` qty 4 → subtotal 3196, qty 9 → 5391; two cart lines `[{paystub,2},{paystub,3}]` merge to qty 5 at 699; 25% coupon on qty 5 → discount `Math.round(3495*0.25)` = 874, total 2621. `app.test.ts`: `/config` returns `unitCents.paystub === 899` and `tiers` equal to `[{1,1,899},{2,4,799},{5,8,699},{9,12,599}]`.
- [ ] **Step 2:** `npm run api:test` → the new tests fail.
- [ ] **Step 3: Implement.** `PRICE_TIERS` zod string transformed via `parsePriceTiers` (same try/`ctx.addIssue` pattern as `COUPONS`); it needs `MAX_STUBS_PER_ORDER`, so parse in the same post-schema step that builds `coupons`/`databasePath` if the transform cannot see sibling fields. Remove `PRICE_PER_STUB_CENTS` from the schema; if `process.env.PRICE_PER_STUB_CENTS` is set, `console.warn` once at boot that it is ignored in favour of `PRICE_TIERS`. `quoteCart`: `unitCents = unitCentsFor(rules.tiers[type], qty)` after the max-qty check. Both `/config` builders (`payments.ts`, and the `pricing` rules in `index.ts`) read `config.priceTiers`; derive `maxQty` per tier as next tier's `minQty - 1`, last = `MAX_STUBS_PER_ORDER`. Update `helpers.ts` fixtures and every test that set `unitCents`.
- [ ] **Step 4:** Docs: `.env.example`, `server/README.md`, `BACKEND-DEPLOY.md` — replace `PRICE_PER_STUB_CENTS` with `PRICE_TIERS`, its format, the descending-price rule, and "restart the API to apply".
- [ ] **Step 5:** `npm run api:test` → all pass. `cd server && npx tsc --noEmit` → clean.

### Task 2: Telemetry codes

**Files:** `src/telemetry/codes.ts`, `server/src/telemetry/scrub.ts`, their registry tests if they enumerate keys.

**Interfaces — produces:** `T.OFFERS_TIER_SELECTED` (`offers.tier_selected`, props `['stubCount']`) and `T.OFFERS_BUNDLE_CLICKED` (`offers.bundle_clicked`, props `['from']`, values `'hero' | 'pricing_card'`), in a free block of the 10xx/12xx range (pick unused codes). Both prop keys already exist in `ALLOWED_PROP_KEYS`; add nothing to `scrub.ts` unless a registry test demands it.

- [ ] **Step 1:** Add the two entries. **Step 2:** `CI=true npm test -- --watchAll=false telemetry` and `npm run api:test` → pass.

### Task 3: Stamp the tier table

**Files:** `scripts/stamp-price.js`, `public/index.html`, `src/__test__/stamp-price.test.ts` (new)

**Interfaces — produces:** env vars `REACT_APP_PRICE_TIERS` (JSON `[{"minQty":1,"maxQty":1,"unitCents":899},…]`), `REACT_APP_STUB_PRICE` (tier-1 dollars, kept), `REACT_APP_STUB_PRICE_FROM` (lowest tier dollars, `5.99`). `REACT_APP_STUB_PRICE_CENTS` is dropped. Export pure helpers for the test: `module.exports = { tiersFromConfigBody(body), tiersFromServerDefault(configTsText, maxQtyDefault) }`, and run `main()` only when `require.main === module`.

- [ ] **Step 1: Failing test.** `tiersFromConfigBody({unitCents:{paystub:899}, maxQty:12})` → `null` (no tiers: caller falls back to the default); with a valid `tiers` array → that array; with malformed tiers (missing field, non-integer) → `null`. `tiersFromServerDefault(fs.readFileSync('server/src/config.ts'))` → the four tiers with `maxQty` 1/4/8/12 (reads the `PRICE_TIERS` default string and the `MAX_STUBS_PER_ORDER` default).
- [ ] **Step 2: Implement.** Source order unchanged (PRICE_SOURCE_URL → `--dev` localhost → config.ts default); a source answering without tiers counts as a miss and logs `stamp-price: <url> has no tiers yet; using the server default` (plain line, not `::warning::`). Strip old `REACT_APP_STUB_PRICE*` and `REACT_APP_PRICE_TIERS` lines before writing. `index.html`: both descriptions say `from $%REACT_APP_STUB_PRICE_FROM% per stub`.
- [ ] **Step 3:** `node scripts/stamp-price.js` → prints the four tiers and "from server/src/config.ts default"; `.env.production.local` holds the three vars. Test passes.

### Task 4: Price context with tiers

**Files:** `src/contexts/price-context.tsx`, `src/services/payments-api.ts`, `src/__test__/price-context.test.tsx`

**Interfaces — produces:**
```ts
export interface PriceTier { minQty: number; maxQty: number; unitCents: number }
export interface PriceState {
  tiers: PriceTier[];                 // [] when unknown
  unitCents: number | null;           // tier-1 (single stub) price
  label: string | null;               // "$8.99"
  fromCents: number | null;           // lowest tier
  fromLabel: string | null;           // "$5.99"
  priceFor: (qty: number) => number | null; // per-stub cents for that count
}
export const STAMPED_TIERS: PriceTier[] | null
<PriceProvider stampedTiers?: PriceTier[] | null, loadLive?: () => Promise<PriceTier[]>>
<Price from? fallback?>   // from → fromLabel
```
`PaymentConfig` gains `tiers?: PriceTier[]`. Cache key `paystubissa.price.v2`, value `{ tiers, stamp }` where `stamp` is `JSON.stringify(stampedTiers)`.

- [ ] **Step 1: Rewrite the provider tests** for tiers: stamped first paint; live swap; server down keeps stamp; live answer without `tiers` or with an invalid table (empty, non-integers, first minQty ≠ 1) is ignored; returning visitor uses cache only under the same stamp; a `v1` entry and a malformed `v2` entry are ignored; unknown → `tiers: []`, all nulls, `priceFor(3) === null`; `priceFor` at 1/4/5/8/9/12 and out of range (0, 13 → clamp to first/last tier). Keep the `formatPrice` test. Replace the "no hard-coded price" guard: no `.ts/.tsx` under `src/` outside `__test__` matches `/\$\d+\.\d{2}/` or `UNIT_PRICE`, and `public/index.html` has no `$` followed by a digit.
- [ ] **Step 2:** Run → fail. **Step 3:** Implement; `defaultLoadLive` rejects when the config has no valid `tiers`. Existing callers of `usePrice().unitCents/label` keep working.
- [ ] **Step 4:** `CI=true npm test -- --watchAll=false price-context` → provider tests pass (page tests in this file are updated in Tasks 5–7).

### Task 5: Offers page

**Files:** Create `src/components/common/offers-page.tsx`, `src/components/common/offer-cards.ts` (card metadata), `src/__test__/offers-page.test.tsx`. Modify `src/components/app.tsx` (route `/offers`), `src/components/common/app-header.tsx` (nav item `{ label: "Offers", to: "/offers" }` first in the list), `src/theme/theme.ts`.

**Interfaces:** consumes `usePrice()`, `T.OFFERS_TIER_SELECTED`, `TEMPLATE_COUNT`. Produces `NAMED_OFFERS` in `offer-cards.ts`: four entries keyed by `minQty` 1/2/5/9 with `{ minQty, maxQty, name, description, bullets: string[], bestValue?: true }` (names/descriptions from the spec; 4 bullets each from the spec's list, the multi-stub tiers including "Consecutive pay periods filled in for you" and "Year-to-date totals carried across the run"; every card ends with "No subscription, no recurring charge"). Theme: add an orange `bundle` colour to the palette (`main` with a `contrastText` meeting WCAG AA 4.5:1) with the MUI module augmentation so `<Button color="bundle">` type-checks.

- [ ] **Step 1: Failing tests** (render with `PriceProvider stampedTiers`): heading "Our Great Offers!" and the subtitle; with the default tiers → four cards named Single Stub / Starter Pack / Quarter Pack / Full Run, prices `$8.99`, `$7.99`, `$6.99`, `$5.99` each followed by "/each", ranges "1 pay stub", "2–4 pay stubs", "5–8", "9–12", "Save $1.00 per stub" / "$2.00" / "$3.00" on cards 2–4 and none on card 1, "Best value" only on Full Run; four "Make yours now!" links with `href` `/create?stubs=1|2|5|9`; with tiers changed in price only (e.g. 999/899/799/699) the cards show the new numbers; with tiers `1:899,3:799` → two generic cards "1–2 pay stubs" and "3–12 pay stubs", none of the four names, "Best value" on the last; with `stampedTiers={null}` → four named cards, no `$` followed by a digit anywhere, buttons still present; page text contains none of "authentic", "realistic", "sent to you".
- [ ] **Step 2: Implement.** Named cards when the live `minQty` list is exactly `[1,2,5,9]` or tiers are unknown; otherwise generic. MUI `Grid` 4/2/1 columns (`md`/`sm`/`xs`), cards as flex columns so price rows and buttons line up; buttons `component={RouterLink}`, `color="primary"`, `color="success"` on the best-value card; emit `T.OFFERS_TIER_SELECTED { stubCount: minQty }` on click. Page `<h1>` and document title consistent with the other pages.
- [ ] **Step 3:** Tests pass; `npx tsc --noEmit` clean.

### Task 6: Wizard preset from `?stubs=`

**Files:** `src/components/wizard/PaystubWizard.tsx`, `src/__test__/wizard-stub-preset.test.tsx` (new)

- [ ] **Step 1: Failing tests.** Mount the wizard at `/create?stubs=5` → store `generalInfo.payStubCount === 5` and the location no longer has `stubs`; with a saved draft (`payStubCount: 3`, a company name) → count 5, company name kept; `?stubs=99` → 12; `?stubs=0`, `?stubs=abc`, no param → count untouched (draft/initial value).
- [ ] **Step 2: Implement** in the hydration effect after the draft dispatches: read `stubs` from `location.search`; if it is a finite integer ≥ 1, `dispatch(saveGeneralInfo({ payStubCount: normalizeStubCount(n) }))` (match the stored type the Pay period step uses), then `navigate` with `replace: true` to the same path minus `stubs` (other params such as `dev=unlock` preserved).
- [ ] **Step 3:** Tests pass; `pay-period-step` suite still passes.

### Task 7: Home page, Review, FAQ, About, Terms

**Files:** `src/components/common/hero-page.tsx`, `faq-page.tsx`, `about-us-page.tsx`, `terms-of-use.tsx`, `src/components/wizard/steps/ReviewStep.tsx`, tests in `src/__test__/price-context.test.tsx` (page sections) and `review-attestation.test.tsx` if affected.

- [ ] **Step 1: Failing tests.** Hero with default tiers: two "Bundle and Save" links, both `href="/offers"`; badge still labelled "$8.99 per pay stub, no subscription"; subtitle contains "$8.99 for one stub, less each when you bundle"; pricing card text contains "from $5.99 each"; with unknown price the page has no `$digit` and both orange buttons still render. Terms §8 contains "The price per pay stub depends on how many pay stubs are in your order." and no `$digit`. FAQ rendered with default tiers contains no "× 4" at the single price: the four-stub example reads `$7.99 × 4 = $31.96`.
- [ ] **Step 2: Implement.** Hero: orange `<Button color="bundle" variant="contained" component={RouterLink} to="/offers">` after the badge in the top row and beside "Create your pay stub" in the card (row on `sm+`, stacked on `xs`); each emits `T.OFFERS_BUNDLE_CLICKED { from }`. Terms §8: the exact paragraph in spec item 4 (do not change `POLICIES_VERSION`; `git log origin/master -1 -- src/constants/business-info.ts` shows whether 2026-11-13 is on master — if it is, stop and report instead of bumping). FAQ/About: per spec item 4, examples via `priceFor(n)` and `formatPrice`, a link to `/offers`. Review step: fallback unit price = `priceFor(stubCount)`.
- [ ] **Step 3:** `CI=true npm test -- --watchAll=false` → all suites pass.

### Task 8: Docs and whole-change verification

**Files:** `CLAUDE.md` (price bullet → tiers/`PRICE_TIERS`, routes list adds `/offers`, stamp vars), spec status line → "approved 2026-11-13, built".

- [ ] `npm run api:test` → pass. `CI=true npm test -- --watchAll=false` → pass. `npx tsc --noEmit` → clean. `CI=true npm run build` → compiles, stamp line shows four tiers; `build/index.html` says "from $5.99 per stub".
- [ ] Serve `build/` with an SPA fallback and `/api/*` → 503 (the stamp must carry the pages) and screenshot `/` and `/offers` in headless Chrome at 1280 px and 390 px into the session scratchpad; look at them: four cards aligned on desktop, one per row on phone, both orange buttons visible, nothing clipped.
- [ ] Report results with the test output; leave everything uncommitted.
