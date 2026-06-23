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
import { periodsPerYear, periodsToDateThisYear } from '../../utils/date-calculator';
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

export const buildPaystubModel = (store: PayStubDetails): PaystubModel => {
  const { incomeDetails, employeeInfo } = store;

  const perYear = periodsPerYear(incomeDetails.periodType);
  const periodsToDate = periodsToDateThisYear(incomeDetails.periodType);

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
    stateCode: employeeInfo.employeeState,
    additionalDeductions: 0,
  });

  const perPeriod = (annualAmount: number) => (perYear > 0 ? annualAmount / perYear : 0);
  const federalTax = perPeriod(annualTaxes.federalIncomeTax);
  const stateTax = perPeriod(annualTaxes.stateIncomeTax);
  const socialSecurity = perPeriod(annualTaxes.socialSecurityTax);
  const medicare = perPeriod(annualTaxes.medicareTax);
  const totalTaxes = federalTax + stateTax + socialSecurity + medicare;

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

  return {
    ...store,

    regularPay,
    overtimePay,
    otherEarnings,
    grossPay,

    federalTax,
    stateTax,
    socialSecurity,
    medicare,
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

export default buildPaystubModel;
