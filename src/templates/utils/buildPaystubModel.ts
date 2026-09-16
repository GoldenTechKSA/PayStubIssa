/**
 * buildPaystubModel
 * -----------------
 * The single data-assembly layer for the XML paystub renderer. It takes the raw Redux
 * store and produces a flat PaystubModel of RAW NUMBERS that templates bind to via
 * {field} placeholders. Presentation (currency/number/date) is applied in the renderer
 * through the cell `format` attribute — never here.
 *
 * Reuses the existing calculation components rather than duplicating logic:
 *   - taxCalculator (utils/tax-calculator)      -> the authoritative tax engine
 *   - calculateOvertime (utils/overtime-calculator)
 *   - periodsPerYear / periodsToDateThisYear (utils/date-calculator)
 */

import { PayStubDetails, PaystubModel } from 'assets/data/pay-stub-details';
import { taxCalculator } from '../../utils/tax-calculator';
import { calculateOvertime } from '../../utils/overtime-calculator';
import { periodsPerYear, periodsElapsedAt, buildPayPeriods, PayPeriod } from '../../utils/date-calculator';
import { normalizeStubCount } from 'constants/pricing';
import states from 'assets/data/states.json';
import filingStatuses from 'assets/data/filing-status.json';
import { formatDate } from '../components/paystub/utils';
import { FilingStatus, TaxCalculationResult } from '../../types/tax-rate-types';

// Coerce possibly-stringy form values to a finite number.
const num = (value: unknown): number => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : 0;
};

const VALID_FILING_STATUSES: FilingStatus[] = [
  'single',
  'marriedFilingJointly',
  'marriedFilingSeparately',
  'headOfHousehold',
];

// Map the stored employee status to a valid IRS FilingStatus.
// The form stores filing-status.json ids (already valid); legacy free-text is normalized.
const resolveFilingStatus = (raw: string | undefined): FilingStatus => {
  if (raw && VALID_FILING_STATUSES.includes(raw as FilingStatus)) {
    return raw as FilingStatus;
  }
  return (raw ?? '').toLowerCase() === 'married' ? 'marriedFilingJointly' : 'single';
};

// Renderer placeholders resolve a path and nothing more — they cannot slice, join or
// reformat. Anything a template needs as *prose* is assembled here instead, and never
// returns '' (getNestedValue coerces an empty string to '0', which would print as data).
const EMPTY = '—';

// The wizard stores full state NAMES ('Washington'); labels and addresses want 'WA'.
const STATE_CODE_BY_NAME: Record<string, string> = states.states.reduce(
  (acc: Record<string, string>, state: { code: string; name: string }) => {
    acc[state.name.toLowerCase()] = state.code.toUpperCase();
    return acc;
  },
  {},
);

const FILING_STATUS_NAME_BY_ID: Record<string, string> = filingStatuses.status.reduce(
  (acc: Record<string, string>, status: { id: string; name: string }) => {
    acc[status.id] = status.name;
    return acc;
  },
  {},
);

const resolveStateCode = (raw: string | undefined): string => {
  const value = (raw ?? '').trim();
  if (!value) return '';
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  return STATE_CODE_BY_NAME[value.toLowerCase()] ?? '';
};

// "123-45-6789" -> "***-**-6789". A partial entry is masked to whatever is there.
const maskSSN = (raw: string | undefined): string => {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return EMPTY;
  return `***-**-${digits.slice(-4).padStart(4, '*')}`;
};

const formatPeriodDate = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value);
  return Number.isNaN(new Date(raw).getTime()) ? '' : formatDate(raw);
};

/**
 * Build the model for ONE pay period.
 *
 * `store` is expected to already carry that period's dates and check/stub numbers — see
 * buildPaystubModels, which derives a per-stub store before calling this.
 */
const buildModelForPeriod = (store: PayStubDetails, stubIndex: number, stubCount: number): PaystubModel => {
  const { incomeDetails, employeeInfo, generalInfo } = store;

  // The wizard stores a full state NAME; STATE_TAX_DATA is keyed by postal code, so the
  // engine must be handed the code — passing 'Virginia' misses the table and silently
  // yields 0 state tax.
  const stateCode = resolveStateCode(employeeInfo.employeeState);

  const perYear = periodsPerYear(incomeDetails.periodType);
  // YTD is measured against THIS stub's pay date, not today — so a run of stubs shows YTD growing.
  const periodsToDate = periodsElapsedAt(incomeDetails.periodType, new Date(incomeDetails.periodPayDate));

  // --- Earnings (current period) ---
  const regularPay =
    incomeDetails.wageType === 'Salary'
      ? num(incomeDetails.annualSalary) / perYear
      : num(incomeDetails.hourlyRate) * num(incomeDetails.hoursWorked);
  const overtimePay = calculateOvertime(num(incomeDetails.overtimeRate), num(incomeDetails.overtimeHours));
  const otherEarnings = num(incomeDetails.bonusAmount);
  const grossPay = regularPay + overtimePay + otherEarnings;

  // --- Taxes (current period) ---
  // The tax engine works on ANNUAL income (annual standard deduction + annual brackets),
  // so we annualize the period gross, compute annual tax, then divide back to this period.
  // FICA is flat-rate so this is neutral for it; it is required for federal/state accuracy.
  const annualGross = grossPay * perYear;
  const annualTaxes: TaxCalculationResult = taxCalculator.calculateTaxes({
    grossIncome: annualGross,
    filingStatus: resolveFilingStatus(employeeInfo.employeeMarriedStatus),
    stateCode,
    additionalDeductions: 0,
  });

  const perPeriod = (annualAmount: number) => (perYear > 0 ? annualAmount / perYear : 0);
  const federalTax = perPeriod(annualTaxes.federalIncomeTax);
  const stateTax = perPeriod(annualTaxes.stateIncomeTax);
  const socialSecurity = perPeriod(annualTaxes.socialSecurityTax);
  const medicare = perPeriod(annualTaxes.medicareTax);
  // Employee share of a state paid-leave premium (0 in most states); part of totalTaxes.
  const paidLeave = perPeriod(annualTaxes.paidLeave);
  const totalTaxes = federalTax + stateTax + socialSecurity + medicare + paidLeave;

  // --- Deductions (current period) ---
  const medical = num(incomeDetails.medicalDeduction);
  const dental = num(incomeDetails.dentalDeduction);
  const vision = num(incomeDetails.visionDeduction);
  const retirement401k = num(incomeDetails.deduction401k);
  const otherDeductions = num(incomeDetails.otherDeduction);
  const unionDues = num(incomeDetails.unionDues); // passthrough; interpretation left to template
  const totalDeductions = medical + dental + vision + retirement401k + otherDeductions;

  // --- Net (current period) ---
  const netPay = grossPay - totalTaxes - totalDeductions;

  // --- Year-to-date: simple proportional estimate (current * periods elapsed) ---
  const ytd = (current: number) => current * periodsToDate;

  // --- Presentation strings (see the helpers above) ---
  const periodStart = formatPeriodDate(incomeDetails.periodStartDate);
  const periodEnd = formatPeriodDate(incomeDetails.periodEndDate);
  const { companyAddress1, companyCity, companyState, companyZipCode } = store.companyInfo;
  const cityStateZip = [companyCity, resolveStateCode(companyState) || companyState]
    .filter(Boolean)
    .join(', ');
  const employeeCityStateZip = [
    employeeInfo.employeeCity,
    resolveStateCode(employeeInfo.employeeState) || employeeInfo.employeeState,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    ...store,

    employeeSSNMasked: maskSSN(employeeInfo.employeeSSN),
    payPeriodLabel:
      periodStart && periodEnd ? `${periodStart} - ${periodEnd}` : periodStart || periodEnd || EMPTY,
    stateTaxLabel: stateCode ? `${stateCode} ST TAX` : 'ST TAX',
    companyAddressLine:
      [companyAddress1, [cityStateZip, companyZipCode].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(' ') || EMPTY,
    companyCityStateZip: [cityStateZip, companyZipCode].filter(Boolean).join(' ') || EMPTY,
    employeeAddressLine:
      [employeeCityStateZip, employeeInfo.employeeZipCode].filter(Boolean).join(' ') || EMPTY,
    filingStatusLabel:
      FILING_STATUS_NAME_BY_ID[resolveFilingStatus(employeeInfo.employeeMarriedStatus)] || EMPTY,
    paidLeaveLabel: annualTaxes.paidLeaveLabel,
    employeeStateCode: stateCode,
    isSalaried: incomeDetails.wageType === 'Salary',
    isHourly: incomeDetails.wageType !== 'Salary',

    // The per-stub store handed to us already carries this stub's own numbers — don't advance again.
    stubIndex,
    stubCount,
    stubNumber: num(generalInfo.payStubNumber),
    checkNumber: num(generalInfo.checkNumber),

    regularPay,
    overtimePay,
    otherEarnings,
    grossPay,

    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    paidLeave,
    totalTaxes,

    medical,
    dental,
    vision,
    retirement401k,
    otherDeductions,
    unionDues,
    totalDeductions,

    netPay,

    regularPayYTD: ytd(regularPay),
    overtimePayYTD: ytd(overtimePay),
    otherEarningsYTD: ytd(otherEarnings),
    grossPayYTD: ytd(grossPay),
    federalTaxYTD: ytd(federalTax),
    stateTaxYTD: ytd(stateTax),
    socialSecurityYTD: ytd(socialSecurity),
    medicareYTD: ytd(medicare),
    paidLeaveYTD: ytd(paidLeave),
    totalTaxesYTD: ytd(totalTaxes),
    medicalYTD: ytd(medical),
    dentalYTD: ytd(dental),
    visionYTD: ytd(vision),
    retirement401kYTD: ytd(retirement401k),
    otherDeductionsYTD: ytd(otherDeductions),
    unionDuesYTD: ytd(unionDues),
    totalDeductionsYTD: ytd(totalDeductions),
    netPayYTD: ytd(netPay),
  };
};

/**
 * Build one model per purchased pay stub.
 *
 * The customer pays per stub (see constants/pricing) and picks a count of 1–12. The date they
 * entered is period #1; each subsequent stub covers the next consecutive period, with its own
 * period dates, its own incrementing check and stub numbers, and its own YTD figures.
 *
 * Always returns at least one model, so callers never have to guard against an empty array.
 */
export const buildPaystubModels = (store: PayStubDetails): PaystubModel[] => {
  const { incomeDetails, generalInfo } = store;

  const stubCount = normalizeStubCount(generalInfo.payStubCount);
  const periods = buildPayPeriods(incomeDetails.periodStartDate, incomeDetails.periodType, stubCount);

  // No usable start date / period type yet (the user is mid-wizard): fall back to whatever dates
  // are already on the store so the preview still renders.
  if (periods.length === 0) {
    return [buildModelForPeriod(store, 0, 1)];
  }

  return periods.map((period: PayPeriod, index: number) =>
    buildModelForPeriod(
      {
        ...store,
        incomeDetails: {
          ...incomeDetails,
          periodStartDate: period.startDate as unknown as Date,
          periodEndDate: period.endDate as unknown as Date,
          periodPayDate: period.payDate as unknown as Date,
        },
        generalInfo: {
          ...generalInfo,
          checkNumber: Number(generalInfo.checkNumber) + index,
          payStubNumber: Number(generalInfo.payStubNumber) + index,
        },
      },
      index,
      periods.length,
    ),
  );
};

/**
 * The model for the FIRST pay stub. Convenience for callers that only ever show one — the
 * template gallery preview and the Review step's pay summary.
 */
export const buildPaystubModel = (store: PayStubDetails): PaystubModel => buildPaystubModels(store)[0];

export default buildPaystubModel;
