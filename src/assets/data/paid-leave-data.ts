import { PaidLeaveProgram } from "../../types/tax-rate-types";

/**
 * State paid family / medical leave programs that take an EMPLOYEE payroll contribution.
 *
 * These are separate from income tax and FICA: a dozen-odd states run their own insurance
 * fund and withhold a flat percentage of wages for it. Employer-only programs (DC, and the
 * employer share of every program below) are deliberately absent — this table models what
 * comes out of the worker's cheque and prints on their stub.
 *
 * 2025 rates. Every field is a published, per-year figure: RE-CHECK THESE EACH JANUARY
 * against the administering agency before a tax year rolls over. `label` is what appears
 * as the deduction line on a pay stub, in the abbreviated form payroll bureaus use.
 *
 *   employeeRate — employee share as a fraction of contributory wages
 *   wageBase     — annual cap on contributory wages, or null when uncapped
 *   annualMax    — hard cap on the employee's yearly contribution, or null when none
 *
 * SS_WAGE_BASE_2025 is the Social Security taxable maximum, which several programs adopt
 * by reference rather than publishing their own cap.
 */
const SS_WAGE_BASE_2025 = 176100;

export const PAID_LEAVE_PROGRAMS: Record<string, PaidLeaveProgram> = {
  CA: {
    // State Disability Insurance, which funds CA Paid Family Leave. The wage cap was
    // removed in 2024, so every dollar of wages is contributory.
    stateCode: 'CA', label: 'CA SDI',
    employeeRate: 0.012, wageBase: null, annualMax: null,
  },
  CO: {
    // FAMLI: 0.9% total, split evenly between employer and employee.
    stateCode: 'CO', label: 'CO FMLI',
    employeeRate: 0.0045, wageBase: SS_WAGE_BASE_2025, annualMax: null,
  },
  CT: {
    stateCode: 'CT', label: 'CT PFML',
    employeeRate: 0.005, wageBase: SS_WAGE_BASE_2025, annualMax: null,
  },
  DE: {
    // Paid Leave contributions began 1 Jan 2025: 0.8% total, employer may deduct half.
    stateCode: 'DE', label: 'DE PFML',
    employeeRate: 0.004, wageBase: SS_WAGE_BASE_2025, annualMax: null,
  },
  HI: {
    // Temporary Disability Insurance: employee share is half the premium, capped by a
    // weekly maximum. Modelled here as the statutory rate against the state wage base.
    stateCode: 'HI', label: 'HI TDI',
    employeeRate: 0.005, wageBase: 74128, annualMax: null,
  },
  MA: {
    // PFML: employee share is 0.18% family + 0.28% medical for employers with 25+ workers.
    stateCode: 'MA', label: 'MA PFML',
    employeeRate: 0.0046, wageBase: SS_WAGE_BASE_2025, annualMax: null,
  },
  ME: {
    // Paid Family and Medical Leave contributions began 1 Jan 2025: 1% total, half employee.
    stateCode: 'ME', label: 'ME PFML',
    employeeRate: 0.005, wageBase: SS_WAGE_BASE_2025, annualMax: null,
  },
  NJ: {
    // Temporary Disability 0.23% + Family Leave Insurance 0.33%, against the NJ wage base.
    stateCode: 'NJ', label: 'NJ TDI/FLI',
    employeeRate: 0.0056, wageBase: 165400, annualMax: null,
  },
  NY: {
    // Paid Family Leave is rate-based but hard-capped at a published annual maximum.
    stateCode: 'NY', label: 'NY PFL',
    employeeRate: 0.00388, wageBase: null, annualMax: 354.53,
  },
  OR: {
    // Paid Leave Oregon: 1% total, employee pays 60% of it.
    stateCode: 'OR', label: 'OR PFML',
    employeeRate: 0.006, wageBase: SS_WAGE_BASE_2025, annualMax: null,
  },
  RI: {
    stateCode: 'RI', label: 'RI TDI',
    employeeRate: 0.013, wageBase: 89200, annualMax: null,
  },
  WA: {
    // Paid Family & Medical Leave: 0.92% total premium, employee pays 71.43% of it.
    stateCode: 'WA', label: 'WA PFML',
    employeeRate: 0.0065716, wageBase: SS_WAGE_BASE_2025, annualMax: null,
  },
};

export const getPaidLeaveProgram = (stateCode: string): PaidLeaveProgram | undefined =>
  PAID_LEAVE_PROGRAMS[(stateCode ?? '').toUpperCase()];
