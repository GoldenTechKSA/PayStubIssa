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
  totalTaxes: number;
  netIncome: number;
  effectiveTaxRate: number;
}