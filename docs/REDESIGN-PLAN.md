# PayStubIssa — Website Redesign Plan

> Design intelligence sourced from the UI/UX Pro Max plugin (v2.5.0). This plan is the agreed direction before implementation; sections marked **Confirm** still need a decision.

## Decisions locked in

| Area | Decision |
|------|----------|
| Component/styling stack | **Standardize on MUI 7** (emotion already installed); remove React-Bootstrap + Bootstrap CSS |
| Visual style | **Clean professional, light** (trust/clarity for a financial document tool) |
| Data-entry flow | **Stepper wizard** with progress indicator, Back/Next, and a final Review step |
| Scope | **Full site** (landing, wizard, preview/print, supporting + legal pages) |
| Template selection | **Last** — after data entry, with an instantly-populated live preview |
| Palette | **Trust Blue + Profit Green** (light) |
| Typography | **IBM Plex Sans** (financial/trustworthy); IBM Plex Mono for tabular figures |
| Baseline | Mobile-first responsive, WCAG AA |

---

## 1. Goals & principles

1. **Trust first.** This product creates financial documents; the UI must feel credible and accurate (clear labels, visible validation, security signals, no clutter).
2. **One clear path.** Each screen has a single primary action. The wizard never leaves the user wondering "what's next."
3. **Show, don't promise.** Move template selection to the end so users pick a layout against their *real* data in a live preview.
4. **One design language.** A single MUI theme drives every surface (no MUI/Bootstrap mix), so spacing, color, and typography are consistent everywhere.
5. **Accessible by construction.** Labels on every field, inline validation, keyboard/focus support, 4.5:1 contrast, `prefers-reduced-motion` respected.

---

## 2. Design system (tokens)

### Color — "Trust Blue + Profit Green" (light)

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#2563EB` | Primary actions, active step, links |
| `on-primary` | `#FFFFFF` | Text/icons on primary |
| `secondary` | `#3B82F6` | Secondary emphasis |
| `accent` / `success` | `#059669` | Success, "paid"/"valid", positive amounts |
| `background` | `#F8FAFC` | App background |
| `card` / `surface` | `#FFFFFF` | Cards, inputs, sheets |
| `foreground` | `#0F172A` | Primary text (slate-900) |
| `muted-foreground` | `#64748B` | Helper text, captions |
| `border` | `#E4ECFC` | Dividers, input borders |
| `destructive` | `#DC2626` | Errors, destructive actions |
| `ring` | `#2563EB` | Focus ring |

Define these as MUI theme palette entries + CSS variables so the XML paystub renderer can share the same tokens for print/preview parity. No raw hex in components.

### Typography

- **Family:** IBM Plex Sans (300/400/500/600/700) via `font-display: swap`; preload the 400/600 weights only.
- **Figures:** IBM Plex Mono with tabular numbers for all currency/amount columns (prevents column jitter on the paystub and in summaries).
- **Scale:** 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40. Body 16px (mobile-safe), line-height 1.5–1.6, headings 600–700.

### Spacing, radius, elevation

- 4/8px spacing rhythm (MUI default spacing unit = 8).
- Radius: 8px inputs/cards, 12px modals; consistent.
- Elevation scale used consistently (cards low, sheets/modals higher); avoid ad-hoc shadows. Light, soft shadows only.

### Motion

- 150–300ms micro-interactions, ease-out on enter / ease-in on exit; transform/opacity only; respect reduced-motion. Step transitions slide in the navigation direction (forward = left, back = right).

---

## 3. Information architecture

```
/                     Landing / hero (marketing + start CTA)
/create               Wizard (stepper) — the core flow
    step 1  Company
    step 2  Employee
    step 3  Pay period
    step 4  Earnings (salary/hourly, OT, bonus, deductions)
    step 5  Template & live preview
    step 6  Review & payment  → unlock → print / PDF
/faq  /about  /contact
/privacy  /terms  /accessibility
/404
```

Notes:
- Each wizard step is **deep-linkable** (`/create/company`, …) so progress survives refresh and steps are shareable/recoverable.
- The current `appSettings.nextTabStep` tab-gating is replaced by stepper state + route.

---

## 4. Redesigned flows

### 4.1 Landing / hero — pattern: "Trust & Authority + Conversion"

Section order (from the plugin's landing recommendations):
1. **Hero** — value proposition ("Generate an accurate, professional pay stub in minutes"), single primary CTA ("Create your pay stub"), a clean product visual (sample stub).
2. **Proof / credibility** — trust signals (accurate tax calc, secure, instant PDF), sample templates strip, simple stats.
3. **How it works** — 3–4 steps mirroring the wizard (Enter details → Pick a template → Pay → Download).
4. **Pricing / value** — transparent price, what's included.
5. **FAQ teaser + final CTA.**

CTA strategy: one accent-colored primary CTA (sticky in nav on scroll); secondary actions visually subordinate. Social proof before the final CTA.

### 4.2 The wizard (stepper)

- **Persistent progress** — horizontal stepper on desktop, compact "Step 2 of 6" + progress bar on mobile. Completed steps are clickable to jump back; future steps locked until valid.
- **Per-step card** — grouped fieldsets (`field-grouping`), visible labels (never placeholder-only), required-field markers, helper text under complex inputs.
- **Validation** — inline on blur (not per keystroke); errors below the field; on Next, focus the first invalid field; summary if multiple.
- **Mobile keyboards & autofill** — semantic input types (`tel`, `email`, `number`, date pickers) and `autocomplete`/`autoComplete` attributes; inputs ≥44px tall.
- **Autosave draft** — persist wizard state (Redux + localStorage) so an accidental refresh/close doesn't lose data.
- **Navigation** — Back/Next; Next shows loading→success on async; never blocks input.

**Step → data mapping** (current Redux slices stay; fields regrouped):

| Step | Fields | Source slice |
|------|--------|--------------|
| 1 Company | name, EIN, address, city/state/zip, phone, email, logo | `companyInfo` |
| 2 Employee | name, address, SSN, ID, filing status, hire date, contact | `employeeInfo` |
| 3 Pay period | period type/frequency, start/end/pay dates, paystub #, check #, count | `incomeDetails` + parts of `generalInfo` |
| 4 Earnings | wage type (salary/hourly), rate/hours, OT, bonus, 401k/medical/dental/vision/other, union dues | `incomeDetails` |
| 5 Template & preview | template choice (live preview via XML renderer) | `appSettings.configPath/templateId` |
| 6 Review & payment | read-only summary, notes, employment type/payment method, PayPal gate | `generalInfo` + all |

> **Confirm:** the current "General Information" tab (employment type, payment method, payment frequency, paystub count, paystub number, check number, notes) is dissolved into the steps above. Confirm that grouping, or tell me to keep a dedicated "Options" step.

### 4.3 Template selection + live preview (step 5)

- Replace the Bootstrap **Carousel** with a responsive **template gallery** (cards/grid, filter by employment type using the existing `template-configs.json` metadata).
- Selecting a template renders it **immediately populated** with the user's data via the consolidated XML renderer (`buildPaystubModel` → `PaystubRenderer`), shown side-by-side on desktop / stacked on mobile.
- This reuses the rendering engine as-is — no XML/template changes required for the redesign.

### 4.4 Review → payment gate → print/PDF (step 6)

- **Review** — read-only, well-grouped summary with "Edit" links back to each step (preserving the existing edit-jump behavior, but via stepper navigation).
- **Payment gate** — keep the PayPal model. Show a **watermarked preview**; the primary CTA is Pay; on success, unlock **Download PDF** and **Print** with a clear success state (`success-feedback`). Add trust/security copy near payment.
- **Print/PDF** — keep `html2canvas` + `jspdf`; ensure the print stylesheet matches the new tokens so the printed stub looks identical to the preview.

> **Confirm — multiple pay stubs:** the app supports `payStubCount > 1`. Proposed: after Review, if count > 1, offer a "customize each stub" view (auto-incrementing pay periods + check numbers, per-stub overrides) then batch-generate. Confirm scope, or keep single-stub for v1 of the redesign.

### 4.5 Supporting & legal pages

FAQ (accordion), About, Contact (form with validation + success state), Privacy/Terms/Accessibility — all restyled to the MUI theme with consistent typography and a shared page shell (header/footer). Accessibility page should reflect the actual AA conformance after the redesign.

---

## 5. Component migration map (React-Bootstrap → MUI 7)

| Today (React-Bootstrap) | Redesign (MUI 7) |
|---|---|
| `Container` / `Row` / `Col` | `Container` + `Grid` / `Stack` |
| `Form`, `Form.Control`, `Form.Select`, `Form.Check` | `TextField`, `Select`/`MenuItem`, `Checkbox`/`Switch`, `FormControl`+`FormLabel` |
| `Button` | `Button` (variants: contained primary / outlined secondary / text) |
| `Tabs` / `Tab` (wizard) | `Stepper` / `Step` + step content |
| `Carousel` (templates) | Template gallery (`Card` grid / `ImageList`) |
| `Modal` | `Dialog` |
| `bootstrap/dist/css/bootstrap.min.css` imports | Removed; MUI `ThemeProvider` + `CssBaseline` at app root |

Cleanups bundled in:
- Remove `react-bootstrap` + `bootstrap` from dependencies once migration is complete.
- Replace the `store.getState()`-at-render snapshots ([details.tsx](../src/components/paystub-details/details.tsx), [print-preview.tsx](../src/components/paystub-details/print-preview.tsx)) with `useSelector` so screens stay live. **Confirm:** optionally introduce typed RTK hooks (RTK is already a dependency) — small lift, big DX/type win.

---

## 6. UX guardrails (applied from the plugin)

- **Progress indicator** on the multi-step flow (Step N of 6) — Medium severity if missing.
- **Form labels** visible & associated (High) — no placeholder-only inputs.
- **Inline validation** on blur; **submit feedback** loading→success/error (High).
- **Focus management** — focus first invalid field on error; move focus to main on route change.
- **Touch targets** ≥44px, 8px spacing; `cursor: pointer` on clickables; tap feedback <100ms.
- **Performance** — lazy-load route chunks; optimize hero/sample images (WebP, width/height set to avoid CLS); `font-display: swap`.
- **Color not the only signal** — pair success/error color with icon/text.

---

## 7. Phased delivery

Even though scope is the full site, execution is milestoned so each phase is shippable/reviewable:

- **Phase 0 — Foundation:** MUI theme (tokens above), typography, `ThemeProvider`/`CssBaseline`, app shell (header/footer), remove Bootstrap. Establish shared primitives (Page, Section, FormField wrappers).
- **Phase 1 — Wizard core:** stepper shell + routing, the 4 data-entry steps as MUI forms with validation + autosave; migrate Redux reads to `useSelector`.
- **Phase 2 — Template & preview:** gallery + live preview wired to `buildPaystubModel`/`PaystubRenderer`.
- **Phase 3 — Review + payment + output:** review screen, PayPal gate, PDF/print parity with new tokens.
- **Phase 4 — Marketing & content:** landing/hero, FAQ/about/contact, legal pages.
- **Phase 5 — QA pass:** responsive (375/768/1024/1440), accessibility audit, reduced-motion, print check. (Dark mode deferred — can be added later since tokens are semantic.)

---

## 8. Risks & considerations

- **Print/preview parity** — the printed PDF must match the on-screen preview; sharing tokens between MUI and the XML renderer mitigates drift.
- **Payment gate correctness** — don't unlock download/print before confirmed payment; keep the existing `canPrint` gating logic, just restyle.
- **Multiple-paystub flow** — adds real complexity; needs the scope decision above.
- **State model** — migrating off `store.getState()` snapshots is necessary for a reactive wizard; doing it during Phase 1 avoids rework.
- **Dependency conflict** — install currently relies on the committed `.npmrc` (`legacy-peer-deps=true`) due to react-scripts 5 vs TS 5; unaffected by the redesign but note for any new deps (e.g., a date-picker).

---

## 9. Open questions to confirm before build

1. **General-info regrouping** (§4.2) — dissolve into steps as proposed, or keep a dedicated "Options" step?
2. **Multiple pay stubs** (§4.4) — full multi-stub customization in this redesign, or single-stub v1?
3. **Typed RTK hooks / `useSelector` migration** (§5) — proceed (recommended), or keep current store access?
4. **Pricing display** — is there a fixed price/copy for the landing pricing section, or placeholder for now?
5. **Brand assets** — any existing logo/wordmark to use, or should the redesign include a simple logotype using IBM Plex?
