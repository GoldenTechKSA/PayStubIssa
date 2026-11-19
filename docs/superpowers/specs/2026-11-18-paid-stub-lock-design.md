# Paid stub lock: one payment, one document

Date: 2026-11-18. Status: awaiting owner approval.

## Intent

A payment should buy the pay stubs the customer reviewed at checkout, and only those.

Today the payment unlocks a **count**. The server's signed unlock token carries the order id,
the quantity and the amount, and nothing about the content. After paying, the customer can
press Edit, change any detail, and print or download again, for as long as the token lives
(`UNLOCK_TOKEN_TTL_MINUTES`, default 60, restored from `sessionStorage` on reload) and the
stub count stays at or under the paid quantity. One payment buys an hour of unlimited
different stubs.

The owner's decision (2026-11-18): **a paid stub is strictly final.** Any change after
payment needs a new purchase. No free corrections; a typo is handled by support.

## Goals

- After payment, Print and Download PDF work only for the exact content that was paid for.
- Changing anything that affects the printed stub puts the watermark and the pay gate back.
- An honest customer never loses a paid stub by accident: reloading, leaving the Review step,
  or starting to edit and thinking better of it must all lead back to the paid stub while the
  unlock is alive.
- Pay stub data still never reaches the server.
- The customer is told before paying that the stub is final.

## Non-goals

- Limiting copies. Once the customer holds the PDF they can print it any number of times.
- Defeating someone who tampers with the page's code. The PDF is built in the browser, so a
  browser-side check stops ordinary customers, not a determined one. Closing that needs the
  server-made PDF (backend Phase 2), which is a separate project.
- Self-service corrections after payment, customer accounts, or downloading again on a
  later day.
- Changing how long the unlock lives. It stays at `UNLOCK_TOKEN_TTL_MINUTES`.

## Anti-goals

- A customer who paid and cannot get their stub because of a false mismatch (for example a
  draft that hashes differently after a save and reload). This is worse than the abuse.
- Any pay stub field, or anything the server could turn back into one, leaving the browser.

## Approaches considered

| | What it is | Why not / why |
|---|---|---|
| A | Freeze the wizard after payment, browser only | Editing the saved draft in browser storage and reloading gets round it, because the token still only knows the count. Kept as the UX layer of B. |
| **B** | **Tie the payment to a fingerprint of the content** | **Picked. Closes the real hole, keeps the privacy promise, medium cost.** |
| C | B plus one free correction per order | Owner chose strictly final. |
| D | Server builds the PDF and counts downloads | Only fully enforceable option, but large, and stub data would reach the server. Stays the later upgrade. |

## Design

### The fingerprint

- A SHA-256 hash (Web Crypto, hex) computed in the browser over a canonical form of
  everything that determines the printed output: `companyInfo`, `employeeInfo`,
  `incomeDetails` (including `stubOverrides`), `generalInfo` (including `payStubCount` and
  any logo), and the chosen template (`appSettings.configPath` / `templateId`). The template
  is part of "final" (design call, not an owner decision).
- Not part of it: `generalInfo.extraNotes` (an internal reference that no template prints;
  it stays editable after payment), which stub the pager shows, `canPrint`, the unlock
  itself, coupon state.
- **Salted.** The browser generates a random salt per checkout and hashes `salt + content`.
  The salt never leaves the browser, so the server cannot test guesses against the hash. The
  salt is kept with the unlock in `sessionStorage`.
- Canonical form: keys sorted, and values normalised so that a state that went through the
  draft autosave (`paystubissa.draft.v1`) and came back hashes the same as before. This
  round trip must be covered by a test; it is the anti-goal above.

### Server

- `POST /api/payments/orders` accepts an optional top-level `fingerprint` (64 hex chars). It
  is top-level, not inside `meta`, because `meta` is `.strict()` and an API older than this
  change must ignore the field rather than reject the order (the client is deployed before
  the API is replaced).
- Stored on the order row in a new nullable column, added as a new entry in `MIGRATIONS`
  (`server/src/db.ts`). Written once at creation, never updated.
- The unlock token gains an `fp` claim. `captureOrder` (including the replay path for an
  already completed order) and `POST /unlock/verify` return it as `fingerprint`.
- An order with no fingerprint (old client) behaves exactly as today.
- No new endpoint. The existing rule stands that a completed order can be re-captured for a
  fresh token; after this change that only ever unlocks the same content.

### Client

- At "pay", the Review step generates the salt, computes the fingerprint and sends it with
  `createOrder`. On success it saves, in `sessionStorage` next to the token: the salt, the
  fingerprint, and a **snapshot of the paid draft**.
- Print and Download are enabled only when an unlock is present **and** the fingerprint of
  the current state (with the stored salt) equals the unlock's. This replaces the present
  `unlock.qty >= stubCount` test, which the fingerprint subsumes (keep the quantity check as
  a second condition; it is free).
- **Reload.** Today the wizard always restarts on step 1 with every field editable, the
  unlock is only restored when the Review step mounts, and the template is not in the draft
  (a reload silently falls back to `template-simple`, which would be a false mismatch). So
  the restore moves up into `PaystubWizard`: on load, if `sessionStorage` holds an unlock,
  the wizard verifies it with `/unlock/verify`, loads the paid snapshot (template included)
  into the store and the draft, and opens directly on the Review step in the paid state. The
  fingerprint in the server's answer is the authoritative one; if the server returns none
  (older API), the locally stored one is used. If verification fails or the unlock has
  expired, the unlock and snapshot are cleared and the wizard starts as it does today. A
  customer who had pressed "Make another pay stub" (below) is not pulled back: that choice is
  remembered with the unlock, and the wizard starts normally with their draft.
- `?dev=unlock` keeps working: it sets `canPrint` with no unlock object and stays gated by
  `isDevUnlock`.

### What the customer sees

Before paying, beside the attestation box and the PayPal buttons:

> Pay stubs are final once paid. Check every detail now; a change after payment needs a new
> purchase.

After paying, the Review step is in a paid state:

```
┌ Payment complete: your 3 pay stubs are ready ──────────────┐
│  [ Print ]   [ Download PDF ]                              │
│  This is your final document. Save the PDF now; it stays   │
│  available in this browser tab for about an hour.          │
│                                    Make another pay stub → │
└────────────────────────────────────────────────────────────┘
```

- The summary cards' Edit buttons, the Back button and the coupon field are hidden, and the
  stepper does not navigate. The lock is enforced by the wizard, not only by the Review step.
- **Make another pay stub** asks for confirmation, then leaves the paid state with the
  customer's details kept, so a repeat customer does not retype them. Editing is open again.
  This "released" choice is stored with the unlock and only reopens editing: Print and
  Download keep following the fingerprint alone, so until something is actually changed the
  paid stub still prints.
- From then on the Review step compares fingerprints. If the content differs from what was
  paid for, the watermark and pay gate return with a notice:

```
┌ This is not the pay stub you paid for ─────────────────────┐
│  You changed it after payment. Pay again for the new       │
│  version, or go back to the one you bought.                │
│                                  [ Restore my paid stub ]  │
└────────────────────────────────────────────────────────────┘
```

- **Restore my paid stub** loads the snapshot back into the store and the draft, which
  returns the Review step to the paid state. It is offered while the unlock has not expired.
- Paying again for the changed version replaces the unlock, the salt and the snapshot.

### Correction codes (how support keeps the "free corrected document" promise)

Terms §8 and the FAQ promise that a customer who made a data-entry error "will always" get
"a free corrected document". Today they can do it themselves; after the lock they cannot.
Owner's decision (2026-11-18): the promise stays, and support delivers it with a one-time
code.

- The owner runs a script on the VPS, in the style of `scripts/query.js`:
  `node scripts/correction-code.js <orderId>`. It checks the order is COMPLETED, stores a
  new random code in a new table, and prints it. The owner emails it to the customer.
- A correction code is single-use, covers at most the stub count of the order it was issued
  for, and expires (default 14 days; design call).
- The customer fixes the mistake, enters the code in the existing "Coupon code" field, and
  the quote comes to zero.
- **It is 100% off, with no PayPal step** (design call). The Terms say "free", and legal copy
  has to be literally true, so a 99% code that still charges a few cents does not do. A
  zero-total order therefore completes on the server at creation, without PayPal, and returns
  the unlock token directly; the Review step shows a "Get my corrected pay stub" button in
  place of the PayPal buttons. The clickwrap box still has to be ticked first.
- This zero-total path exists only for correction codes. `COUPONS` env codes stay 1–99%.
- The new order records the code and the order it corrects. The code is marked used when
  that order completes. Fingerprint binding applies to it like any other order.
- Telemetry reports that a correction code was applied or rejected, never the code.

### Copy and legal (owner to approve wording)

- Terms of Use: one sentence in the section on delivery that a purchased document is final
  once paid. §8's free-correction promise stays; add how to get it (email support for a
  correction code).
- FAQ: three answers describe the old behaviour and must change: "correct it and print
  again" after downloading; "Edits are unlimited and free right up until you download or
  print" (now: until you pay); and the unlock answer, which gains the "final once paid" line.
- Privacy Policy: the order record now also holds "a one-way fingerprint of the document,
  which cannot be turned back into its contents"; the session-storage sentence now also
  covers the copy of the paid document kept in the browser tab.
- Privacy Policy also: a corrected order records which earlier order it corrects.
- Both policies change materially, so bump `POLICIES_LAST_UPDATED` and `POLICIES_VERSION`.
- The clickwrap box itself is unchanged; `review-attestation.test.tsx` must still pass.

### Telemetry

New client codes (one emit site each, added to the registry first): stub re-locked because
the content changed after payment; paid stub restored; "make another" confirmed. Never emit
the fingerprint or the salt.

## Tests

- Fingerprint: stable across a draft save and reload; changes when any printed field,
  the stub count, a per-stub override, the notes or the template changes; differs with a
  different salt.
- Review step: unlocked on a match; locked with the notice on a mismatch; Restore brings
  back the paid state; the paid state hides the edit paths.
- Server: the migration; the order stores the fingerprint; the token, capture, replayed
  capture and verify all return it; an order without one works as before; a malformed
  fingerprint is a validation error.
- Reload: with a valid unlock the wizard opens on Review in the paid state with the paid
  template; with an expired or rejected one it starts normally.
- Correction codes: issued only for a completed order; one use; quantity cap; expiry; a
  zero-total order completes without PayPal and only with a correction code.
- Existing suites still pass: `review-attestation`, `price-context` (no amount spelled out in
  `src/`), telemetry registry tests.

## Left to the builder

- The exact canonical form and normalisation rules.
- Whether editing is blocked while the PayPal window is open (the fingerprint is fixed when
  the order is created, so a change made in that gap simply shows the mismatch notice).
- Component structure, wording of the confirmation dialog, telemetry code numbers.
