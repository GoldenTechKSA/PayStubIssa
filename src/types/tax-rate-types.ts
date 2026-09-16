// Tax processing types and interfaces

export interface TaxRates {
  federalIncomeTax: {
    brackets: Array<{
      min: number;
      max: number | null;
      rate: number;
    }>;
    standardDeduction: {
      single: number;
      marriedFilingJointly: number;
      marriedFilingSeparately: number;
      headOfHousehold: number;
    };
  };
  socialSecurityTax: {
    rate: number;
    wageBase: number; // Maximum taxable wages
  };
  medicareTax: {
    rate: number;
    additionalRate: number; // Additional Medicare tax for high earners
    additionalThreshold: {
      single: number;
      marriedFilingJointly: number;
      marriedFilingSeparately: number;
    };
  };
  stateIncomeTax: {
    hasIncomeTax: boolean;
    brackets?: Array<{
      min: number;
      max: number | null;
      rate: number;
    }>;
    flatRate?: number;
    standardDeduction?: {
      single: number;
      marriedFilingJointly: number;
      marriedFilingSeparately: number;
      headOfHousehold: number;
    };
  };
}

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

export interface StateTaxInfo {
  stateName: string;
  stateCode: string;
  taxRates: TaxRates;
}

export type FilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately' | 'headOfHousehold';

export interface TaxCalculationInput {
  grossIncome: number;
  filingStatus: FilingStatus;
  stateCode: string;
  additionalDeductions?: number;
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