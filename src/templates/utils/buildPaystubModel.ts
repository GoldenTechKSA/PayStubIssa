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
import { rateOfGross } from '../../utils/util';
import {
  periodsPerYear, periodsElapsedAt, buildPayPeriods, PayPeriod,
  calculateEndDate, payDateGapDays, toISODate,
} from '../../utils/date-calculator';
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

// "Direct Deposit to Checking ****6789": the method plus, for direct deposit only, the account
// type and the LAST FOUR digits of the account. The routing number and the rest of the account
// number never reach the model, so no template can print them by accident.
const paymentMethodLabel = (generalInfo: PayStubDetails['generalInfo']): string => {
  const method = String(generalInfo.paymentMethod ?? '').trim();
  if (!method) return EMPTY;
  if (method !== 'Direct Deposit') return method;
  const digits = String(generalInfo.bankAccountNumber ?? '').replace(/\D/g, '');
  if (digits.length < 4) return method;
  const type = String(generalInfo.bankAccountType ?? '').trim();
  return `${method} to ${type ? type + ' ' : ''}****${digits.slice(-4)}`;
};

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
 * The one-time part of a stub: overtime and bonus are paid in the period they were entered
 * for and in no other, so YTD counts them ONCE rather than projecting them over the year.
 * The tax figures are the EXTRA withholding those earnings drew (tax on the full period minus
 * tax on regular pay alone), and netPay is their net effect. Later stubs in a run receive the
 * running sum of these as `carried`, so the amount stays in YTD without being paid again.
 */
interface OneTimeTotals {
  overtimePay: number;
  otherEarnings: number;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  paidLeave: number;
  totalTaxes: number;
  retirement401k: number;
  unionDues: number;
  totalDeductions: number;
  netPay: number;
}

const NO_ONE_TIME: OneTimeTotals = {
  overtimePay: 0,
  otherEarnings: 0,
  grossPay: 0,
  federalTax: 0,
  stateTax: 0,
  socialSecurity: 0,
  medicare: 0,
  paidLeave: 0,
  totalTaxes: 0,
  retirement401k: 0,
  unionDues: 0,
  totalDeductions: 0,
  netPay: 0,
};

const addOneTime = (a: OneTimeTotals, b: OneTimeTotals): OneTimeTotals => ({
  overtimePay: a.overtimePay + b.overtimePay,
  otherEarnings: a.otherEarnings + b.otherEarnings,
  grossPay: a.grossPay + b.grossPay,
  federalTax: a.federalTax + b.federalTax,
  stateTax: a.stateTax + b.stateTax,
  socialSecurity: a.socialSecurity + b.socialSecurity,
  medicare: a.medicare + b.medicare,
  paidLeave: a.paidLeave + b.paidLeave,
  totalTaxes: a.totalTaxes + b.totalTaxes,
  retirement401k: a.retirement401k + b.retirement401k,
  unionDues: a.unionDues + b.unionDues,
  totalDeductions: a.totalDeductions + b.totalDeductions,
  netPay: a.netPay + b.netPay,
});

interface PeriodWithholding {
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  paidLeave: number;
  totalTaxes: number;
  paidLeaveLabel: string;
}

// Withholding for ONE period of the given gross.
// `periodPreTax` is what a traditional 401(k) took out of that gross: it lowers the wages that
// federal and state INCOME tax are figured on, but not Social Security, Medicare or a state
// paid-leave premium, which are still charged on the full gross.
// The tax engine works on ANNUAL income (annual standard deduction + annual brackets),
// so we annualize the period gross, compute annual tax, then divide back to this period.
// FICA is flat-rate so this is neutral for it; it is required for federal/state accuracy.
const withholdForPeriod = (
  periodGross: number,
  perYear: number,
  filingStatus: FilingStatus,
  stateCode: string,
  periodPreTax: number = 0,
  taxYear?: number,
): PeriodWithholding => {
  const annualTaxes: TaxCalculationResult = taxCalculator.calculateTaxes({
    grossIncome: periodGross * perYear,
    filingStatus,
    stateCode,
    additionalDeductions: periodPreTax * perYear,
    taxYear,
  });

  // Each line is rounded to the cent it prints as, and the total is the sum of those cents, so
  // "Total Taxes" on a stub always equals the tax lines above it added up by hand.
  const perPeriod = (annualAmount: number) =>
    (perYear > 0 ? Math.round((annualAmount / perYear) * 100) / 100 : 0);
  const federalTax = perPeriod(annualTaxes.federalIncomeTax);
  const stateTax = perPeriod(annualTaxes.stateIncomeTax);
  const socialSecurity = perPeriod(annualTaxes.socialSecurityTax);
  const medicare = perPeriod(annualTaxes.medicareTax);
  // Employee share of a state paid-leave premium (0 in most states); part of totalTaxes.
  const paidLeave = perPeriod(annualTaxes.paidLeave);

  return {
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    paidLeave,
    totalTaxes: federalTax + stateTax + socialSecurity + medicare + paidLeave,
    paidLeaveLabel: annualTaxes.paidLeaveLabel,
  };
};

interface PeriodBuild {
  model: PaystubModel;
  // This stub's own one-time amounts plus everything carried into it — what the NEXT stub carries.
  oneTimeToDate: OneTimeTotals;
}

/**
 * Build the model for ONE pay period.
 *
 * `store` is expected to already carry that period's dates and check/stub numbers — see
 * buildPaystubModels, which derives a per-stub store before calling this.
 *
 * YTD method:
 *   - Regular pay, taxes on regular pay, and deductions are assumed to recur every period of
 *     the year, so each is `per-period amount × periods elapsed as of this stub's pay date`.
 *     For the two percent-of-gross deductions (401(k), union dues) the recurring part is the
 *     percentage of REGULAR pay.
 *   - Overtime and bonus are one-time: they (and the extra tax and extra percent-of-gross
 *     deductions they drew) are added to YTD once — on the stub that pays them and, via
 *     `carried`, on every later stub in the run.
 */
const buildModelForPeriod = (
  store: PayStubDetails,
  stubIndex: number,
  stubCount: number,
  carried: OneTimeTotals = NO_ONE_TIME,
): PeriodBuild => {
  const { incomeDetails, employeeInfo, generalInfo } = store;

  // The wizard stores a full state NAME; STATE_TAX_DATA is keyed by postal code, so the
  // engine must be handed the code — passing 'Virginia' misses the table and silently
  // yields 0 state tax.
  const stateCode = resolveStateCode(employeeInfo.employeeState);
  const filingStatus = resolveFilingStatus(employeeInfo.employeeMarriedStatus);

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

  // 401(k) and union dues are stored as a FRACTION of gross pay (the Earnings step takes a
  // percentage: 5% is saved as 0.05), so the dollar amount is that fraction of this period's gross.
  const rate401k = rateOfGross(incomeDetails.deduction401k);
  const rateUnion = rateOfGross(incomeDetails.unionDues);
  const retirement401k = grossPay * rate401k;
  const unionDues = grossPay * rateUnion;
  // The same two on regular pay alone: the recurring base for YTD.
  const base401k = regularPay * rate401k;
  const baseUnion = regularPay * rateUnion;

  // --- Taxes (current period) ---
  // The 401(k) is a traditional, pre-tax contribution: income tax is withheld on gross less it.
  // Wages are taxed under the rules of the year they are PAID in, so the IRS tables follow this
  // stub's pay date: a stub dated in 2025 uses the 2025 tables even when it is made in 2026.
  const taxYear = Number(toISODate(incomeDetails.periodPayDate).slice(0, 4)) || undefined;
  const taxes = withholdForPeriod(grossPay, perYear, filingStatus, stateCode, retirement401k, taxYear);
  const { federalTax, stateTax, socialSecurity, medicare, paidLeave, totalTaxes } = taxes;

  // Withholding on regular pay alone: the recurring tax base for YTD. Only differs from the
  // period's actual withholding when there is one-time pay on top.
  const oneTimeEarnings = overtimePay + otherEarnings;
  const baseTaxes = oneTimeEarnings > 0
    ? withholdForPeriod(regularPay, perYear, filingStatus, stateCode, base401k, taxYear)
    : taxes;

  // --- Deductions (current period) ---
  const medical = num(incomeDetails.medicalDeduction);
  const dental = num(incomeDetails.dentalDeduction);
  const vision = num(incomeDetails.visionDeduction);
  // The flat "Other" amount on its own, for a template that prints union dues on a separate line.
  const otherDeductionsExUnion = num(incomeDetails.otherDeduction);
  // The catch-all "Other" line: most templates have no union-dues row, so the dues print here.
  const otherDeductions = otherDeductionsExUnion + unionDues;
  const flatDeductions = medical + dental + vision + otherDeductionsExUnion;
  const totalDeductions = flatDeductions + retirement401k + unionDues;

  const baseTotalDeductions = flatDeductions + base401k + baseUnion;

  // --- Net (current period) ---
  const netPay = grossPay - totalTaxes - totalDeductions;
  const baseNetPay = regularPay - baseTaxes.totalTaxes - baseTotalDeductions;

  // --- Year-to-date ---
  // Recurring amounts: proportional estimate (per-period amount × periods elapsed).
  const recurring = (perPeriodAmount: number) => perPeriodAmount * periodsToDate;
  // One-time amounts: this stub's overtime/bonus (and the extra tax and net effect they had),
  // plus whatever earlier stubs in the run already paid once.
  const oneTimeToDate = addOneTime(carried, {
    overtimePay,
    otherEarnings,
    grossPay: oneTimeEarnings,
    federalTax: federalTax - baseTaxes.federalTax,
    stateTax: stateTax - baseTaxes.stateTax,
    socialSecurity: socialSecurity - baseTaxes.socialSecurity,
    medicare: medicare - baseTaxes.medicare,
    paidLeave: paidLeave - baseTaxes.paidLeave,
    totalTaxes: totalTaxes - baseTaxes.totalTaxes,
    retirement401k: retirement401k - base401k,
    unionDues: unionDues - baseUnion,
    totalDeductions: totalDeductions - baseTotalDeductions,
    netPay: netPay - baseNetPay,
  });

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

  const model: PaystubModel = {
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
    paidLeaveLabel: taxes.paidLeaveLabel,
    employeeStateCode: stateCode,
    paymentMethodLabel: paymentMethodLabel(generalInfo),
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
    otherDeductionsExUnion,
    unionDues,
    totalDeductions,

    netPay,

    // Recurring (× periods elapsed) + one-time (counted once, carried through the run).
    regularPayYTD: recurring(regularPay),
    overtimePayYTD: oneTimeToDate.overtimePay,
    otherEarningsYTD: oneTimeToDate.otherEarnings,
    grossPayYTD: recurring(regularPay) + oneTimeToDate.grossPay,
    federalTaxYTD: recurring(baseTaxes.federalTax) + oneTimeToDate.federalTax,
    stateTaxYTD: recurring(baseTaxes.stateTax) + oneTimeToDate.stateTax,
    socialSecurityYTD: recurring(baseTaxes.socialSecurity) + oneTimeToDate.socialSecurity,
    medicareYTD: recurring(baseTaxes.medicare) + oneTimeToDate.medicare,
    paidLeaveYTD: recurring(baseTaxes.paidLeave) + oneTimeToDate.paidLeave,
    totalTaxesYTD: recurring(baseTaxes.totalTaxes) + oneTimeToDate.totalTaxes,
    medicalYTD: recurring(medical),
    dentalYTD: recurring(dental),
    visionYTD: recurring(vision),
    retirement401kYTD: recurring(base401k) + oneTimeToDate.retirement401k,
    otherDeductionsYTD: recurring(otherDeductionsExUnion + baseUnion) + oneTimeToDate.unionDues,
    otherDeductionsExUnionYTD: recurring(otherDeductionsExUnion),
    unionDuesYTD: recurring(baseUnion) + oneTimeToDate.unionDues,
    totalDeductionsYTD: recurring(baseTotalDeductions) + oneTimeToDate.totalDeductions,
    netPayYTD: recurring(baseNetPay) + oneTimeToDate.netPay,
  };

  return { model, oneTimeToDate };
};

/**
 * Build one model per purchased pay stub.
 *
 * The customer pays per stub (see constants/pricing) and picks a count of 1–12. The date they
 * entered is period #1; each subsequent stub covers the next consecutive period, with its own
 * period dates, its own incrementing check and stub numbers, and its own YTD figures.
 *
 * The overtime and bonus the customer entered belong to period #1 only ("This period" on the
 * Earnings step). Later stubs pay regular wages alone, and carry period #1's one-time amounts
 * forward in their YTD so the year's totals stay consistent across the run.
 *
 * Always returns at least one model, so callers never have to guard against an empty array.
 */
export const buildPaystubModels = (store: PayStubDetails): PaystubModel[] => {
  const { incomeDetails, generalInfo } = store;

  const stubCount = normalizeStubCount(generalInfo.payStubCount);
  // The user chooses the pay date of period #1; its distance from that period's end date is
  // applied to every stub in the run.
  const payGapDays = payDateGapDays(
    calculateEndDate(toISODate(incomeDetails.periodStartDate), incomeDetails.periodType),
    incomeDetails.periodPayDate,
  );
  const periods = buildPayPeriods(incomeDetails.periodStartDate, incomeDetails.periodType, stubCount, payGapDays);

  // No usable start date / period type yet (the user is mid-wizard): fall back to whatever dates
  // are already on the store so the preview still renders.
  if (periods.length === 0) {
    return [buildModelForPeriod(store, 0, 1).model];
  }

  const models: PaystubModel[] = [];
  let carried = NO_ONE_TIME;

  periods.forEach((period: PayPeriod, index: number) => {
    const oneTimePay = index === 0 ? {} : { overtimeRate: 0, overtimeHours: 0, bonusAmount: 0 };
    const { model, oneTimeToDate } = buildModelForPeriod(
      {
        ...store,
        incomeDetails: {
          ...incomeDetails,
          ...oneTimePay,
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
      carried,
    );
    models.push(model);
    carried = oneTimeToDate;
  });

  return models;
};

/**
 * The model for the FIRST pay stub. Convenience for callers that only ever show one — the
 * template gallery preview and the Review step's pay summary.
 */
export const buildPaystubModel = (store: PayStubDetails): PaystubModel => buildPaystubModels(store)[0];

export default buildPaystubModel;
