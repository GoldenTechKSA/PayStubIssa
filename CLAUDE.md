# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PayStubIssa (`pay-stub`) is a Create React App (react-scripts) + TypeScript single-page app for generating, previewing, and printing/PDF-exporting US pay stubs, gated behind a PayPal payment. It is deployed via plain FTP to paystubissa.com (`webspace > httpdocs > paystubissa.com`); `homepage: "."` in package.json makes the build use relative asset paths for that static hosting.

## Commands

```bash
npm install            # install deps (run after pulling new changes)
npm start              # dev server on http://localhost:3000
npm run build          # production build to ./build
npm test               # CRA/Jest watch mode (run a single file: npm test -- buildPaystubModel)
```

A committed `.npmrc` sets `legacy-peer-deps=true` so a plain `npm install` works: react-scripts 5 declares a stale peer dependency on TypeScript 4, but the project runs on TypeScript 5 (which CRA 5 builds and tests fine). Don't remove `.npmrc` without addressing that conflict.

There is **no separate lint script**; ESLint runs through `react-scripts` (`eslintConfig`: `react-app`, `react-app/jest`). Debugging: `npm start`, then use the "Launch Chrome against localhost" config in VS Code Run & Debug (`.vscode/launch.json`).

## Data flow

State lives in a plain Redux store (`redux/store.tsx`, classic `createStore` + `combineReducers` — not Redux Toolkit slices despite RTK being a dependency). Five slices: `appSettings`, `companyInfo`, `employeeInfo`, `incomeDetails`, `generalInfo` (shapes in [pay-stub-details.ts](src/assets/data/pay-stub-details.ts)).

- The store is **seeded with different initial state per environment**: `production-initial-state` in production, `initial-state` (pre-filled dev data) otherwise — selected in [store.tsx](src/redux/store.tsx) via `NODE_ENV`.
- Each reducer responds to a single `SAVE_*` / `UPDATE_APP_SETTINGS` action ([action-types.tsx](src/constants/action-types.tsx), [actions.tsx](src/redux/actions.tsx)) and merges its payload (`{...state, ...payload}`). Actions are untyped (`data` is `any`).
- The wizard is a tab flow ([input-tabs.tsx](src/components/input-tabs/input-tabs.tsx)) driven by `appSettings.nextTabStep` (`template → company → employee → income → general`). Each step dispatches its save action and advances `nextTabStep`; tabs are disabled unless they are the current step.
- Routing is in [app.tsx](src/components/app.tsx). The `/printTemplate/:templateId` route hides the header/footer (detected via `useLocation().pathname.startsWith("/printTemplate/")`).

**Gotcha:** several components (e.g. [details.tsx](src/components/paystub-details/details.tsx), [print-preview.tsx](src/components/paystub-details/print-preview.tsx)) read state via `store.getState()` at render time instead of `useSelector`, so they capture a snapshot and do **not** re-render on store changes. Mixing in `useSelector` for the fields that must stay live is the existing pattern. Prefer `useSelector` for new code.

## Paystub rendering — XML config system

The rendered pay stub is **data-driven from XML**, not hard-coded React. This is the single rendering path:

1. Template selection ([template-selection.tsx](src/components/carousel/template-selection.tsx)) reads [public/configs/template-configs.json](public/configs/template-configs.json) — an array where each entry has a `configFile` path (e.g. `/configs/template-simple/paystub-config.xml`) plus image/title/description. Selecting a template dispatches `{ configPath, templateId }` into `appSettings`.
2. [print-preview.tsx](src/components/paystub-details/print-preview.tsx) renders `<TemplateManager configPath={configPath} store={state} />`.
3. [templatemanager.tsx](src/templates/components/templatemanager.tsx) builds the data model via `buildPaystubModel(store)` (see Tax & data model below), fetches the XML via `loadPaystubConfig`, validates it, and renders `<PaystubRenderer config data />`.
4. [xmlParser.ts](src/templates/components/paystub/xmlParser.ts) parses XML → `PaystubConfig` (`sections → columns → tables → cells`). It resolves `<include href="...">` elements recursively (depth-limited, cycle-guarded) so a `paystub-config.xml` composes many partial XML files under the same template folder.
5. [PaystubRenderer.tsx](src/templates/components/PaystubRenderer.tsx) → `Section` → `Column` → `Table` → `TableCell` ([src/templates/components/paystub/](src/templates/components/paystub/)) render the parsed config; per-element inline `<style>` from the XML becomes React inline styles.

**Cell binding & formatting** ([TableCell.tsx](src/templates/components/paystub/TableCell.tsx)). A cell has a `type` and an optional `format`:
- `type="static"` — literal label text.
- `type="substitute"` — `{path.to.field}` placeholders resolved against the data model (e.g. `{incomeDetails.hourlyRate}`, `{grossPay}`, `{federalTaxYTD}`).
- `type="calculated"` — `{field}` placeholders resolved, then the arithmetic expression is safely evaluated.
- `format="currency | number | date | text"` — presentation applied by the renderer to the resolved value. The data model holds **raw numbers**; templates decide display. `currency` → `$1,234.56`, `number` → `1,234.56`, `date` → `MM/DD/YYYY`. `calculated` cells default to `currency` when `format` is omitted.

XML config files live in [public/configs/](public/configs/). `template-simple` is the maintained reference template; `template-prof` and `template-temporary` exist but are less complete, and `template-configs.json` lists 27 template types, most pointing at not-yet-created folders. Each template folder mirrors the section structure (`header/`, `company/`, `employee/`, `earnings/`, `deductions/`, `taxes/`, `footer/`), with `*-section.xml` files that `<include>` `*-column.xml` / `*-table.xml` partials. When changing a template, keep cell `{paths}` in sync with the `PaystubModel` contract.

## Tax & data model

The renderer consumes a single computed model assembled by [buildPaystubModel.ts](src/templates/utils/buildPaystubModel.ts) — `buildPaystubModel(store) → PaystubModel`. This is the only data the XML binds to, so it is the contract: extend `PaystubModel` ([pay-stub-details.ts](src/assets/data/pay-stub-details.ts)) and `buildPaystubModel` together, and templates reference those field names. `PaystubModel` spreads the raw store (so `{incomeDetails.*}` etc. still resolve) and adds period-current numbers plus a `*YTD` sibling for each: earnings (`regularPay`, `overtimePay`, `otherEarnings`, `grossPay`), taxes (`federalTax`, `stateTax`, `socialSecurity`, `medicare`, `totalTaxes`), deductions (`medical`, `dental`, `vision`, `retirement401k`, `otherDeductions`, `totalDeductions`), and `netPay`. All values are raw numbers — never pre-formatted.

`buildPaystubModel` reuses the calculation utilities rather than duplicating logic:
- [tax-calculator.ts](src/utils/tax-calculator.ts) (`taxCalculator` singleton) — federal income tax (progressive brackets), Social Security (wage-base capped), Medicare (+ additional Medicare over a filing-status threshold), and state income tax (flat/bracket) from [state-tax-data.ts](src/assets/data/state-tax-data.ts). Federal/FICA rates are read from the `'AL'` entry since they are identical across states.
- `calculateOvertime` ([overtime-calculator.ts](src/utils/overtime-calculator.ts)) and the period helpers `periodsPerYear` / `periodsToDateThisYear` ([date-calculator.ts](src/utils/date-calculator.ts)).

Key model behaviors:
- **Gross basis**: full earnings — regular + overtime + bonus, or `annualSalary / periodsPerYear` when `wageType === 'Salary'`.
- **Annualize for tax, then de-annualize**: the tax engine expects annual income (annual standard deduction + annual brackets), so the period gross is multiplied by `periodsPerYear`, taxed, then divided back to the period. Without this, federal/state withholding comes out ~0.
- **Filing status**: `employeeMarriedStatus` is passed through as the IRS `FilingStatus` (`single | marriedFilingJointly | marriedFilingSeparately | headOfHousehold`, matching [filing-status.json](src/assets/data/filing-status.json)), with legacy "Married" normalized. `FilingStatus` is **not** `'single' | 'married'` — using `'married'` produces `NaN`.
- **YTD** is a simple proportional estimate: `current × periodsToDateThisYear`, not a real payroll-history accumulation.

## PDF, payment, telemetry

- **PDF export**: [src/components/pdf/](src/components/pdf/) + [use-pdf-download.ts](src/hooks/use-pdf-download.ts) use `html2canvas` + `jspdf` to snapshot a DOM node by id (`targetId="pdf-content"`).
- **Payment gating**: printing/PDF buttons in `print-preview.tsx` are gated by `appSettings.canPrint`, flipped to `true` on PayPal success (`handlePaymentSuccess`). The "Enable Defaults for Company" checkbox in template selection can pre-set `canPrint`.
- **Telemetry**: `TelemetryProvider` wraps the whole app ([app.tsx](src/components/app.tsx)); `telemetryService` ([telemetry-service.ts](src/services/telemetry-service.ts)) batches events to a `POST /api/telemetry` endpoint that is **not yet implemented** server-side. Config (batch size, flush interval, console logging) is set inline in `app.tsx`.

## Conventions

- TypeScript `strict` is on, but `noImplicitAny: false` — Redux actions/reducers and many event handlers are intentionally untyped `any`. `baseUrl: "src"` enables absolute imports like `import { ... } from 'assets/data/pay-stub-details'`.
- File naming is **kebab-case** for most code (`tax-calculator.ts`, `print-preview.tsx`), but the `src/templates/` tree uses lowercase-no-separator (`templatemanager.tsx`, `buildPaystubModel.ts`).
- `process.env.NODE_ENV` is used directly to branch dev vs prod behavior (initial state, dev-mode flags). There is no committed `.env` (`.env.development` / `.env.production` are gitignored).
- Reference data (states, filing statuses, pay-period/payment/employment types) lives in `src/assets/data/*.json` and is re-exported through [globals.tsx](src/constants/globals.tsx).
