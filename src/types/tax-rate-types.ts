// Tax processing types and interfaces

/**
 * A state paid family / medical leave program that withholds from the employee.
 * See assets/data/paid-leave-data.ts for the rate table and its yearly-review note.
 */
export interface PaidLeaveProgram {
  stateCode: string;
  label: string;             // the deduction line as it prints, e.g. 'CO FMLI'
  employeeRate: number;      // employee share as a fraction of contributory wages
  wageBase: number | null;   // annual cap on contributory wages; null when uncapped
  annualMax: number | null;  // cap on the employee's yearly contribution; null when none
}

export type FilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately' | 'headOfHousehold';

export interface TaxCalculationInput {
  grossIncome: number;
  filingStatus: FilingStatus;
  stateCode: string;
  // Pre-tax amounts (a traditional 401(k)) that come out of the wages income tax is figured on.
  additionalDeductions?: number;
  // Calendar year the wages are paid in; picks the IRS tables. Defaults to the latest on file.
  taxYear?: number;
}

export interface TaxCalculationResult {
  federalIncomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  stateIncomeTax: number;
  // Employee contribution to a state paid family/medical leave fund, 0 where the state
  // runs no such program. Counted in totalTaxes: it is a mandatory payroll withholding,
  // so leaving it out would break `gross - totalTaxes - deductions = net`.
  paidLeave: number;
  // Print label for the paidLeave line ('CO FMLI'), empty when there is no program.
  paidLeaveLabel: string;
  totalTaxes: number;
  netIncome: number;
  effectiveTaxRate: number;
};

export interface TaxCalculationResultAsString {
  federalIncomeTaxAsString: string;
  socialSecurityTaxAsString: string;
  medicareTaxAsString: string;
  stateIncomeTaxAsString: string;
  totalTaxesAsString: string;
  federalIncomeTaxAsStringYTD: string;
  socialSecurityTaxAsStringYTD: string;
  medicareTaxAsStringYTD: string;
  stateIncomeTaxAsStringYTD: string;
  totalTaxesAsStringYTD: string;}