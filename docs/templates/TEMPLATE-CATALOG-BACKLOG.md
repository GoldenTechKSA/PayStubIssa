# Template catalog backlog

Gallery titles and descriptions preserved from the 26 placeholder templates retired on
2026-10-18 (see git history before that date for their XML). They were all one page
skeleton with cosmetic skins, so the layouts were dropped, but the audience list is still
the product catalog we want to cover. Reuse these titles and descriptions when a real
template for that audience is designed; see CLAUDE.md for how templates are built.

Still shipping: Standard Employee Paystub (simple), Modern, Earnings Statement — Classic
Ruled / Banded Panels / Payroll Register, Statement of Earnings and Deductions — Typewriter,
and Independent Contractor Invoice & Earnings Statement (kept as a stopgap: it is the only
no-withholding layout).

Each entry notes the retired template id, the visual skin it used, and the audience
specific block it tried to add. Those blocks were static placeholders (rendered as dashes)
because the data model has no such fields; a real template for that audience needs the
model extended first.

## Temporary Assignment Paystub

- Retired id: `template-temporary`
- Skin: INVOICE / EARNINGS header with FROM, sans
- Audience block: Assignment Details (staffing agency, client company, assignment, supervisor)

This paystub is tailored for employees hired through a staffing agency or for a specific, short-term assignment. It may include details about the hiring agency, client company, and the assignment period.

## On-Call / Casual Labor Paystub

- Retired id: `template-oncall`
- Skin: Dark band header, sans
- Audience block: On-Call Earnings

For employees with irregular, on-call hours. This template is structured to clearly list callback periods, standby premiums, and varying hourly rates that are common in on-call or casual work arrangements.

## Salaried (Exempt) Employee Paystub

- Retired id: `template-exempt`
- Skin: Plain left-title header, sans
- Audience block: Salary Earnings (salary, bonus); FLSA exempt footnote

For employees exempt from overtime pay. This template shows a consistent salary amount per pay period, regardless of hours worked, and does not include an overtime calculation field.

## Fixed-Term Contract Paystub

- Retired id: `template-contract`
- Skin: Serif, plain header
- Audience block: Contract Details

Used for employees on a specific contract with a defined end date (e.g., a 12-month project). This stub often references the contract details and may track remaining contract value or milestone-based payments.

## Hourly (Non-Exempt) Employee Paystub

- Retired id: `template-nonexempt`
- Skin: Dark band header, sans (full-width NET PAY band)
- Audience block: Hourly Earnings incl. overtime 1.5x and double-time 2x rows; FLSA footnote

Designed for employees eligible for overtime. This template features detailed sections for regular hours, overtime hours (at 1.5x or 2x the rate), double-time, and other premium pays, ensuring FLSA compliance.

## Full-Time Employment Paystub

- Retired id: `template-fulltime`
- Skin: Plain left-title header, sans
- Audience block: Benefits & PTO (PTO accrued/used/balance, holidays remaining)

Reflects the earnings and deductions for an employee working full-time hours (typically 35+ per week). This template often includes a comprehensive breakdown of full-time benefits like health insurance, retirement contributions, and paid time off (PTO) accruals.

## Part-Time Employment Paystub

- Retired id: `template-parttime`
- Skin: Plain left-title header, sans
- Audience block: Pro-rated benefits notice

For employees working less than full-time hours. This paystub clearly shows pro-rated benefits (if any) and is structured for variable hours that are still expected to be consistent each period.

## Volunteer Stipend & Reimbursement Summary

- Retired id: `template-volunteer`
- Skin: Serif centered title, thick rules
- Audience block: Stipends & Reimbursements; summary reads TOTAL DISBURSED; not-a-wage-statement notice

This is not a traditional paystub but a summary of any stipends, allowances, or expense reimbursements provided to a volunteer. It explicitly states that these are not wages for services and are not subject to standard payroll taxes (unless required by law).

## Draw Against Commission Paystub

- Retired id: `template-draw-commission`
- Skin: Serif, two-cell boxed header
- Audience block: Draw Reconciliation (draw paid, commission earned, draw recovered, remaining balance)

For sales employees who receive a regular draw that is later reconciled against earned commission. This stub clearly shows the draw amount, commission earned, and the remaining draw balance.

## Commission-Only Earnings Statement

- Retired id: `template-commission-only`
- Skin: Plain left-title header, sans
- Audience block: Sales Summary (gross sales, commission rate, units/deals)

A paystub for employees compensated solely on commission. It itemizes sales, commission rates, and gross earnings without any base salary or hourly wage.

## Base Salary + Bonus Paystub

- Retired id: `template-salary-bonus`
- Skin: Dark band header, sans
- Audience block: Bonus (supplemental bonus, bonus YTD)

Details a regular salary plus a discrete bonus payment. It separates the bonus amount and may show a different withholding calculation for supplemental income.

## Profit-Sharing Distribution Statement

- Retired id: `template-profit-sharing`
- Skin: Plain left-title header, sans
- Audience block: Distribution Details

Outlines an employee share of company profits distributed as part of a compensation package. This is often a separate payment from regular wages.

## Royalty Earnings Statement

- Retired id: `template-royalties`
- Skin: INVOICE / EARNINGS header with FROM, serif
- Audience block: Royalty Details (royalty period, units sold/licensed, rate per unit, work/title)

For authors, artists, or inventors receiving royalty payments. It details the royalty period, units sold/licensed, rate, and gross royalty income.

## Retainer Fee Paystub

- Retired id: `template-retainer`
- Skin: INVOICE / EARNINGS header with FROM, sans
- Audience block: Retainer Usage

For consultants or professionals on a monthly retainer. This stub shows the fixed retainer fee and may track hours used against the retainer balance.

## Milestone Bonus Paystub

- Retired id: `template-milestone`
- Skin: Serif centered title, thick rules
- Audience block: Milestone

Issued for achieving specific project or performance milestones. The description field links the bonus to a particular goal.

## Stock Option Exercise Statement

- Retired id: `template-stock-options`
- Skin: Serif, plain header
- Audience block: Option Exercise

Details the transaction and associated taxes when an employee exercises their company stock options.

## RSU (Restricted Stock Unit) Vesting Statement

- Retired id: `template-rsu`
- Skin: Serif centered title, thick rules
- Audience block: RSU Vesting

Shows the value of vested RSUs and the taxes withheld upon vesting, which is considered taxable income.

## Hospitality & Tips Paystub

- Retired id: `template-hospitality-tips`
- Skin: Dark band header, sans
- Audience block: Tips & Gratuities

For restaurant and hotel staff. This template has detailed sections for reporting cash tips, credit card tips, tip pooling, and tip credit claimed by the employer.

## Hospitality - Tip Credit Reconciliation Stub

- Retired id: `template-tip-credit`
- Skin: Serif, two-cell boxed header
- Audience block: Tip Credit Reconciliation (direct cash wage, tip credit claimed, tips reported, minimum wage check)

A specific stub for jurisdictions where employers claim a tip credit, showing the direct wage, tip credit amount, and ensuring the total meets minimum wage.

## Freelance Creative Project Paystub

- Retired id: `template-freelance-creative`
- Skin: INVOICE / EARNINGS header with FROM, sans
- Audience block: Project Details (project, PO #, deliverables); summary reads TOTAL DUE

Tailored for freelance designers, writers, etc. It includes project names, purchase order numbers, and can itemize deliverables.

## Construction Payroll - Certified Paystub

- Retired id: `template-construction-certified`
- Skin: Serif centered title, thick rules
- Audience block: Labor Classification (classification, project/contract, prevailing wage rate, work performed) + Fringe Benefits (health & welfare, pension, training) + certified payroll attestation line

Used for public works projects, this certified report includes detailed labor classifications, prevailing wages, and fringe benefit contributions as required by law.

## Day Rate Paystub (e.g., Film, Oil & Gas)

- Retired id: `template-day-rate`
- Skin: Dark band header, sans
- Audience block: Day-Rate Earnings

For industries that pay a fixed rate per day worked. It lists the day rate, number of days, and any special allowances (e.g., hazard pay).

## Per Diem Employee Paystub

- Retired id: `template-per-diem`
- Skin: Plain left-title header, sans
- Audience block: Taxable Wages + Per Diem (non-taxable); summary reads TOTAL PAY

For employees receiving a daily allowance for meals and incidentals while traveling. This clearly separates non-taxable per diem from taxable wages.

## Travel Nurse / Allied Health Paystub

- Retired id: `template-travel-nurse`
- Skin: Dark band header, sans
- Audience block: Taxable Wages + Stipends & Reimbursements (housing, meals & incidentals, travel); summary reads TOTAL PAY

For traveling healthcare professionals. Includes hourly wages, overtime, and detailed breakdowns of travel reimbursements, housing stipends, and bonuses.

## Non-Profit Grant-Funded Position Paystub

- Retired id: `template-grant-funded`
- Skin: Serif centered title, thick rules
- Audience block: Grant Information (grant name, grant number, funding source, award period)

For employees whose salary is funded by a specific grant. The stub may include the grant name and number for accounting purposes.

## Seasonal Employment Paystub

- Retired id: `template-seasonal`
- Skin: Dark band header, sans
- Audience block: Seasonal Assignment (season, assignment start/end)

Ideal for workers employed during specific seasons or peaks (e.g., holiday, harvest). This paystub can note the seasonal period and is configured for potentially intense, short-duration work schedules.

