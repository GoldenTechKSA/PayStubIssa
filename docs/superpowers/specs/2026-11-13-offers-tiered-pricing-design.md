# Offers page and tiered per-stub pricing — design

Date: 2026-11-13. Status: approved by the owner 2026-11-13, built. Builds on commit `f521981`
(server-only price, stamped-plus-live).

## Intent

Today every pay stub costs the same. The owner wants customers who buy several stubs in
one order to pay less per stub, and a page that sells that: four offer cards laid out
like a reference pricing page the owner supplied (heading, subtitle, four equal cards
each with a title, a short description, a large price with "/each", a ticked bullet
list and a full-width button). The reference sold four different products; this site
sells one, so the cards are four **quantity tiers** of the same product.

## Decided by the owner

- **Tiers** (stubs in one order → price per stub). Every stub in the order is charged
  at the tier's price (not graduated).

  | Card name | Stubs | Price each | Button |
  |---|---|---|---|
  | Single Stub | 1 | $8.99 | blue |
  | Starter Pack | 2–4 | $7.99 | blue |
  | Quarter Pack | 5–8 | $6.99 | blue |
  | Full Run, tagged "Best value" | 9–12 | $5.99 | green |

- 8 stubs ($55.92) cost more than 9 ($53.91). Accepted; the site says nothing about it.
- Page heading "Our Great **Offers!**" (last word in the primary blue) and subtitle
  "Select the best fit for you", verbatim.
- Card button label "Make yours now!". It opens the wizard with the tier's lowest count
  preset (1, 2, 5, 9); the customer can still change the count in the wizard.
- New page at `/offers`, linked in the header.
- **The home page keeps its current pricing card where it is** (single price). An
  **orange "Bundle and Save" button** that goes to `/offers` is added in two places:
  the top hero row (with "Get started today" and the green price badge) and inside the
  pricing card beside "Create your pay stub".
- Card headings, descriptions and bullets are ours to write, about pay stubs.

## Goals

- One source of prices: the server. Cards, home page, Review step, quote and PayPal
  charge can never disagree.
- Changing a tier price is a server setting plus an API restart, no code change.
- All copy literally true (see CLAUDE.md "Legal copy").

## Non-goals

- No new products (W-2, 1099, invoices), no subscriptions, no accounts.
- No graduated pricing, no fixed-amount coupons, no change to the 1–12 stub limit.
- No "add one more and save" nudges in the wizard.

## Anti-goals

- A price number hand-typed anywhere in `src/` or `public/index.html`
  (`price-context.test.tsx` must keep failing on that).
- A card price that differs from what checkout charges.
- Copying the reference's wording or look: no "authentic", "realistic", "sent to you",
  no orange card buttons, no foreign fonts.

## Server (builder's call unless marked)

- New env var `PRICE_TIERS`, format `MINQTY:CENTS,...`, default
  `1:899,2:799,5:699,9:599`. Parsed at boot like `COUPONS` (`parsePriceTiers` in
  `server/src/config.ts`): first tier must start at 1, min quantities strictly
  ascending and ≤ `MAX_STUBS_PER_ORDER`, cents positive integers; a bad value stops
  the API. `PRICE_PER_STUB_CENTS` is retired (ignored if still present in a `.env`);
  note this in `server/README.md` and the deployment doc.
- `server/src/services/pricing.ts`: the pay stub unit price for a line is the price of
  the highest tier whose min quantity ≤ the line's qty; subtotal = unit × qty. The
  quote line carries that unit price, so PayPal's `unit_amount` follows unchanged.
  Coupons still take their percent off the resulting subtotal.
- `GET /api/payments/config` (and the copy in `server/src/index.ts`): keep
  `unitCents.paystub` = the tier-1 price for compatibility, add
  `tiers: [{ minQty, maxQty, unitCents }]` (`maxQty` derived; last tier ends at
  `MAX_STUBS_PER_ORDER`).
- Tests: tier parsing (good and bad input), tier lookup at every edge (1, 2, 4, 5, 8,
  9, 12), quote totals, coupon on a tiered total, `/config` shape.

## Client

- `scripts/stamp-price.js`: stamp the whole tier table
  (`REACT_APP_PRICE_TIERS` as JSON) plus `REACT_APP_STUB_PRICE_FROM` (lowest tier, for
  `index.html`). Fallback order unchanged: source URL → server default parsed from
  `config.ts`. An older API that returns no `tiers` yields a single tier from
  `unitCents.paystub`.
- `price-context.tsx`: state becomes the tier list. `usePrice()` returns
  `{ tiers, unitCents (single-stub price), label, fromCents, fromLabel,
  priceFor(qty) }`; all null/empty when unknown. Cache key bumped to `...price.v2`,
  still keyed to the build stamp. `<Price>` keeps printing the single-stub price;
  add `<Price from />` for "from $5.99" wording.
- New `src/components/common/offers-page.tsx`, route `/offers` in `app.tsx`, header
  link "Offers". Card metadata (name, description, bullets, button colour, best-value
  tag) lives in the client keyed by tier position; quantity ranges and prices come
  only from the context. If the server returns a tier count other than four, render
  one card per tier with generic names ("N–M pay stubs"). With no price known, cards
  show no number and the button still works.
- Layout: MUI Grid, 4 across ≥ md, 2 at sm, 1 at xs; equal-height cards with the
  price row and button aligned across cards; theme tokens only.
- Card copy (owner approved the direction; exact wording is the builder's draft and
  must be literally true):
  - Single Stub — "One pay period, one stub. For a one-off record."
  - Starter Pack — "A month or two of pay periods in one order."
  - Quarter Pack — "Covers a quarter of bi-weekly pay, with year-to-date figures
    carried across every stub."
  - Full Run — "Our lowest per-stub price, for a long run of consecutive pay periods."
  - Bullets drawn from: download as PDF or print right after payment; federal, state,
    Social Security and Medicare withholding calculated for you; choose from
    `TEMPLATE_COUNT` templates; fits one US Letter page, no special paper;
    (multi-stub tiers) consecutive pay periods filled in for you; year-to-date totals
    carried across the run; no subscription, no recurring charge.
  - Tiers 2–4 show "Save $X.XX per stub" computed against tier 1.
- "Make yours now!" navigates to `/create?stubs=N`. The wizard applies N to
  `generalInfo.payStubCount` (through `normalizeStubCount`) on arrival, overriding only
  that one field of a saved draft, then drops the query param.
- Home page (`hero-page.tsx`): pricing card stays in place with the single price; its
  "Need several?" line becomes bundles "from {fromLabel} each"; button row becomes blue
  "Create your pay stub" + orange "Bundle and Save" (stacked on xs). Hero top row gets
  the same orange button. The green badge keeps the single-stub price.
- Orange is a new theme token in `src/theme/theme.ts` (builder picks a shade that
  passes WCAG AA contrast with its text); used only for "Bundle and Save".
- Review step: unit-price fallback uses `priceFor(count)`; the server quote stays the
  authority.
- FAQ / About: price mentions say the single price and add "less per stub when you
  order more" with a link to `/offers`. `index.html` descriptions: "from
  $%REACT_APP_STUB_PRICE_FROM% per stub".
- Terms of Use §8: add one sentence — the per-stub price depends on how many pay stubs
  are in the order. Keep `POLICIES_VERSION` `2026-11-13` only if that version has still
  not been merged to `master` when this ships; otherwise bump date and version.
- Telemetry: one new client code for an offer card click (props: tier min quantity
  only), one for "Bundle and Save" clicks (prop: which placement). Registry entries
  first; no form values.
- Tests: provider with tiers (stamped, live, cache, unknown), offers page renders
  ranges/prices from the context and none hard-coded, card button target, wizard
  preset from `?stubs=`, hero shows both orange buttons, Terms still name no dollar
  amount, hard-coded-price guard still passes.
- Update `CLAUDE.md` (price bullet, routes) in the same change.

## Settled after the builder check (author's calls, not owner decisions)

1. **First deploy stamps from an API that has no tiers yet.** The deploy workflows build
   the client before they deploy the API. When the source URL answers without `tiers`,
   `stamp-price.js` uses the tier default parsed from `server/src/config.ts` (the
   server code about to be deployed) instead of a single tier. This replaces the
   "older API yields a single tier" rule above. No workflow change.
2. **Tier edits must not make the page false.** `parsePriceTiers` also requires prices
   to strictly descend as quantity rises; a bad value stops the API. The client uses
   the named cards and their copy only when the min quantities are exactly 1/2/5/9;
   any other table renders generic cards ("N–M pay stubs", common bullets only, no
   "Best value" unless it is the last tier, which the server guarantees is cheapest).
3. **No tiers known** (unstamped build with no answer, and every Jest test by default):
   `/offers` renders the four named cards with their quantity ranges, no price row and
   no "Save" line; buttons still carry `?stubs=1/2/5/9`. Quantities in the client are
   card metadata, not prices.
4. **Existing copy that becomes false.** FAQ and About may be rewritten freely: worked
   examples use `priceFor(n)`, "One flat price" fallbacks become "priced per pay stub,
   less per stub when you order more". The hero subtitle keeps the single-stub price
   and its wording becomes "{label} for one stub, less each when you bundle" (update
   the test that pins the old sentence). Terms §8 becomes, in full: "The Service is
   charged per pay stub. The price per pay stub depends on how many pay stubs are in
   your order. The price for each pay stub, and the total for your order, are shown to
   you at checkout before you pay, and that is the amount you are charged. You may
   generate between {MIN_STUBS} and {MAX_STUBS} pay stubs in a single order. There is
   no subscription and no recurring charge." This wording goes to the owner's lawyer
   with the rest of the 2026-11-13 Terms.
5. Widen the hard-coded-price guard to any `$d.dd` amount in `src/` (outside
   `__test__`). Log a boot warning when `PRICE_PER_STUB_CENTS` is still set, and
   update `server/.env.example` and `docs/deploy/BACKEND-DEPLOY.md`. Add a telemetry
   prop key for button placement on both sides (`codes.ts`, `scrub.ts`) if no existing
   key fits.

## Left to the builder

File/component split, exact bullet selection per card, the orange shade, icon choice,
telemetry code numbers, and how the wizard consumes `?stubs=`.

## Verification

`npm run api:test`, `CI=true npm test -- --watchAll=false`, `npx tsc --noEmit`,
`CI=true npm run build`, and screenshots of `/offers` and `/` at desktop and phone
widths from the built site.
