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

// Every money line a stub prints for the current period. Each has a `<name>YTD` sibling on the
// model, built from these same keys.
const AMOUNT_KEYS = [
  'regularPay', 'overtimePay', 'otherEarnings', 'grossPay',
  'federalTax', 'stateTax', 'socialSecurity', 'medicare', 'paidLeave', 'totalTaxes',
  'medical', 'dental', 'vision', 'retirement401k', 'otherDeductions', 'otherDeductionsExUnion',
  'unionDues', 'totalDeductions', 'netPay',
] as const;
type AmountKey = typeof AMOUNT_KEYS[number];
type Amounts = Record<AmountKey, number>;

// a + b × times, line by line.
const addAmounts = (a: Amounts, b: Amounts, times: number = 1): Amounts =>
  AMOUNT_KEYS.reduce((acc, key) => {
    acc[key] = a[key] + b[key] * times;
    return acc;
  }, {} as Amounts);

const NO_AMOUNTS: Amounts = AMOUNT_KEYS.reduce((acc, key) => {
  acc[key] = 0;
  return acc;
}, {} as Amounts);

interface PeriodFigures {
  amounts: Amounts;
  paidLeaveLabel: string;
}

const payYearOf = (store: PayStubDetails): number | undefined =>
  Number(toISODate(store.incomeDetails.periodPayDate).slice(0, 4)) || undefined;

/**
 * The current-period money lines for ONE pay period. `store` is expected to already carry that
 * period's dates and its own hours, overtime hours and bonus — see buildPaystubModels.
 */
const figuresForPeriod = (store: PayStubDetails): PeriodFigures => {
  const { incomeDetails, employeeInfo } = store;

  // The wizard stores a full state NAME; the state tax data is keyed by postal code, so the
  // engine must be handed the code — passing 'Virginia' misses the table and silently
  // yields 0 state tax.
  const stateCode = resolveStateCode(employeeInfo.employeeState);
  const filingStatus = resolveFilingStatus(employeeInfo.employeeMarriedStatus);
  const perYear = periodsPerYear(incomeDetails.periodType);

  // --- Earnings ---
  const regularPay =
    incomeDetails.wageType === 'Salary'
      ? num(incomeDetails.annualSalary) / perYear
      : num(incomeDetails.hourlyRate) * num(incomeDetails.hoursWorked);
  const overtimePay = calculateOvertime(num(incomeDetails.overtimeRate), num(incomeDetails.overtimeHours));
  const otherEarnings = num(incomeDetails.bonusAmount);
  const grossPay = regularPay + overtimePay + otherEarnings;

  // 401(k) and union dues are stored as a FRACTION of gross pay (the Earnings step takes a
  // percentage: 5% is saved as 0.05), so the dollar amount is that fraction of this period's gross.
  const retirement401k = grossPay * rateOfGross(incomeDetails.deduction401k);
  const unionDues = grossPay * rateOfGross(incomeDetails.unionDues);

  // --- Taxes ---
  // The 401(k) is a traditional, pre-tax contribution: income tax is withheld on gross less it.
  // Wages are taxed under the rules of the year they are PAID in, so the IRS tables follow this
  // stub's pay date: a stub dated in 2025 uses the 2025 tables even when it is made in 2026.
  const taxes = withholdForPeriod(grossPay, perYear, filingStatus, stateCode, retirement401k, payYearOf(store));
  const { federalTax, stateTax, socialSecurity, medicare, paidLeave, totalTaxes } = taxes;

  // --- Deductions ---
  const medical = num(incomeDetails.medicalDeduction);
  const dental = num(incomeDetails.dentalDeduction);
  const vision = num(incomeDetails.visionDeduction);
  // The flat "Other" amount on its own, for a template that prints union dues on a separate line.
  const otherDeductionsExUnion = num(incomeDetails.otherDeduction);
  // The catch-all "Other" line: most templates have no union-dues row, so the dues print here.
  const otherDeductions = otherDeductionsExUnion + unionDues;
  const totalDeductions = medical + dental + vision + otherDeductionsExUnion + retirement401k + unionDues;

  return {
    paidLeaveLabel: taxes.paidLeaveLabel,
    amounts: {
      regularPay, overtimePay, otherEarnings, grossPay,
      federalTax, stateTax, socialSecurity, medicare, paidLeave, totalTaxes,
      medical, dental, vision, retirement401k, otherDeductions, otherDeductionsExUnion,
      unionDues, totalDeductions,
      netPay: grossPay - totalTaxes - totalDeductions,
    },
  };
};

/**
 * Assemble the model for ONE stub from its store, its current-period figures and the
 * year-to-date totals as of that stub (see buildPaystubModels for how YTD is accumulated).
 */
const assembleModel = (
  store: PayStubDetails,
  stubIndex: number,
  stubCount: number,
  figures: PeriodFigures,
  ytd: Amounts,
): PaystubModel => {
  const { incomeDetails, employeeInfo, generalInfo } = store;
  const stateCode = resolveStateCode(employeeInfo.employeeState);

  // --- Presentation strings (see the helpers above) ---
  const periodStart = formatPeriodDate(incomeDetails.periodStartDate);
  const periodEnd = formatPeriodDate(incomeDetails.periodEndDate);
  const { companyAddress1, companyCity, companyState, companyZipCode } = store.companyInfo;
  const cityStateZip = [companyCity, resolveStateCode(companyState) || companyState]
    .filter(Boolean)
    .join(', ');
  const employeeCityStateZip = [employeeInfo.employeeCity, stateCode || employeeInfo.employeeState]
    .filter(Boolean)
    .join(', ');

  const ytdFields = AMOUNT_KEYS.reduce((acc, key) => {
    acc[`${key}YTD`] = ytd[key];
    return acc;
  }, {} as Record<string, number>);

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
    paidLeaveLabel: figures.paidLeaveLabel,
    employeeStateCode: stateCode,
    paymentMethodLabel: paymentMethodLabel(generalInfo),
    isSalaried: incomeDetails.wageType === 'Salary',
    isHourly: incomeDetails.wageType !== 'Salary',

    // The per-stub store handed to us already carries this stub's own numbers.
    stubIndex,
    stubCount,
    stubNumber: num(generalInfo.payStubNumber),
    checkNumber: num(generalInfo.checkNumber),

    ...figures.amounts,
    ...ytdFields,
  } as PaystubModel;
};

// The check or stub number a stub of the run gets unless the customer typed another one: the
// number entered belongs to the most recent stub, and each earlier stub is one lower (an earlier
// check has a lower number). 0 means "cannot count down that far": the Earnings step leaves the
// cell empty and asks for a number.
export const defaultRunNumber = (base: unknown, index: number): number =>
  Math.max(0, Math.floor(num(base)) - index);

export interface StubInputs {
  hourlyRate: number;
  hoursWorked: number;
  overtimeRate: number;
  overtimeHours: number;
  bonusAmount: number;
  annualSalary: number;
  checkNumber: number;
  payStubNumber: number;
}

/**
 * What ONE stub of the run is built from (index 0 = the most recent period, the one entered).
 * Stub 0 is the base fields themselves (incomeDetails / generalInfo). An earlier stub has its
 * own card on the Earnings step; whatever the customer did not type there follows these defaults:
 *   - Hourly rate, hours worked, overtime rate, annual salary: the same as stub 0.
 *   - Overtime hours and bonus: none. They are one-time, not something every period repeats.
 *   - Check and stub number: count down from stub 0's numbers.
 * A single stub has no per-stub values, so leftovers from a longer run are ignored.
 */
export const resolveStubInputs = (
  incomeDetails: PayStubDetails['incomeDetails'],
  generalInfo: PayStubDetails['generalInfo'],
  index: number,
  stubCount: number,
): StubInputs => {
  const override = (stubCount > 1 && index > 0 && incomeDetails.stubOverrides?.[index]) || {};
  const own = (value: unknown, fallback: number) =>
    value === undefined || value === null || value === '' ? fallback : num(value);

  return {
    hourlyRate: own(override.hourlyRate, num(incomeDetails.hourlyRate)),
    hoursWorked: own(override.hoursWorked, num(incomeDetails.hoursWorked)),
    overtimeRate: own(override.overtimeRate, num(incomeDetails.overtimeRate)),
    overtimeHours: index === 0 ? num(incomeDetails.overtimeHours) : own(override.overtimeHours, 0),
    bonusAmount: index === 0 ? num(incomeDetails.bonusAmount) : own(override.bonusAmount, 0),
    annualSalary: own(override.annualSalary, num(incomeDetails.annualSalary)),
    checkNumber: index === 0
      ? num(generalInfo.checkNumber)
      : own(override.checkNumber, defaultRunNumber(generalInfo.checkNumber, index)),
    payStubNumber: index === 0
      ? num(generalInfo.payStubNumber)
      : own(override.payStubNumber, defaultRunNumber(generalInfo.payStubNumber, index)),
  };
};

// The pay periods of a run, most recent first. The user chooses the pay date of period #1; its
// distance from that period's end date is applied to every stub in the run.
export const buildRunPeriods = (incomeDetails: PayStubDetails['incomeDetails'], stubCount: number): PayPeriod[] => {
  const payGapDays = payDateGapDays(
    calculateEndDate(toISODate(incomeDetails.periodStartDate), incomeDetails.periodType),
    incomeDetails.periodPayDate,
  );
  return buildPayPeriods(incomeDetails.periodStartDate, incomeDetails.periodType, stubCount, payGapDays);
};

/**
 * Year-to-date for a list of stub stores given MOST RECENT FIRST.
 *
 * YTD is an estimate with two parts:
 *   - Before the run: for each period of the year that came before the earliest stub of the run
 *     in that year, the employee is assumed to have been paid that earliest stub's REGULAR pay
 *     (its rate × hours, or its salary) with every deduction, and no overtime or bonus.
 *   - Inside the run: the actual figures of each stub, added up oldest to newest.
 * So YTD never falls from one stub to the next, overtime and bonus count once, and a run that
 * crosses January 1 starts the new year's totals from zero.
 */
const accumulateYtd = (stubStores: PayStubDetails[], figures: PeriodFigures[]): Amounts[] => {
  const ytd: Amounts[] = [];
  let year: number | undefined;
  let running = NO_AMOUNTS;

  for (let i = stubStores.length - 1; i >= 0; i--) {
    const store = stubStores[i];
    const stubYear = payYearOf(store);

    if (i === stubStores.length - 1 || stubYear !== year) {
      year = stubYear;
      const regularOnly = figuresForPeriod({
        ...store,
        incomeDetails: { ...store.incomeDetails, overtimeHours: 0, bonusAmount: 0 },
      }).amounts;
      // YTD is measured against the stub's pay date, not today.
      const periodsBefore = periodsElapsedAt(store.incomeDetails.periodType, new Date(store.incomeDetails.periodPayDate)) - 1;
      running = addAmounts(NO_AMOUNTS, regularOnly, periodsBefore);
    }

    running = addAmounts(running, figures[i].amounts);
    ytd[i] = running;
  }

  return ytd;
};

/**
 * Build one model per purchased pay stub, MOST RECENT FIRST.
 *
 * The customer pays per stub (see constants/pricing) and picks a count of 1–12. The period they
 * entered is stub #1, the latest; each further stub covers the period before it, with its own
 * period dates, its own check and stub numbers (counting down), its own rates, hours, overtime
 * hours and bonus (see resolveStubInputs), and its own YTD figures (see accumulateYtd).
 *
 * Always returns at least one model, so callers never have to guard against an empty array.
 */
export const buildPaystubModels = (store: PayStubDetails): PaystubModel[] => {
  const { incomeDetails, generalInfo } = store;

  const stubCount = normalizeStubCount(generalInfo.payStubCount);
  const periods = buildRunPeriods(incomeDetails, stubCount);

  // No usable start date / period type yet (the user is mid-wizard): fall back to whatever dates
  // are already on the store so the preview still renders.
  const stubStores: PayStubDetails[] = periods.length === 0
    ? [store]
    : periods.map((period: PayPeriod, index: number) => {
        const inputs = resolveStubInputs(incomeDetails, generalInfo, index, periods.length);
        return {
          ...store,
          incomeDetails: {
            ...incomeDetails,
            hourlyRate: inputs.hourlyRate,
            hoursWorked: inputs.hoursWorked,
            overtimeRate: inputs.overtimeRate,
            overtimeHours: inputs.overtimeHours,
            bonusAmount: inputs.bonusAmount,
            annualSalary: inputs.annualSalary,
            periodStartDate: period.startDate as unknown as Date,
            periodEndDate: period.endDate as unknown as Date,
            periodPayDate: period.payDate as unknown as Date,
          },
          generalInfo: {
            ...generalInfo,
            checkNumber: inputs.checkNumber,
            payStubNumber: inputs.payStubNumber,
          },
        };
      });

  const figures = stubStores.map(figuresForPeriod);
  const ytd = accumulateYtd(stubStores, figures);

  return stubStores.map((stubStore, index) =>
    assembleModel(stubStore, index, stubStores.length, figures[index], ytd[index]));
};

/**
 * The model for the FIRST pay stub (the most recent period). Convenience for callers that only
 * ever show one — the template gallery preview and the Review step's pay summary.
 */
export const buildPaystubModel = (store: PayStubDetails): PaystubModel => buildPaystubModels(store)[0];
