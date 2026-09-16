import { STATE_TAX_DATA } from "../assets/data/state-tax-data";
import { TaxCalculationInput, TaxCalculationResult, FilingStatus } from "../types/tax-rate-types";
import { getPaidLeaveProgram } from "../assets/data/paid-leave-data";

export class TaxCalculator {
  // Calculate federal income tax using progressive brackets
  private calculateFederalIncomeTax(taxableIncome: number, filingStatus: FilingStatus): number {
    if (taxableIncome <= 0) return 0;

    const federalRates = STATE_TAX_DATA['AL'].taxRates.federalIncomeTax; // Federal rates are same for all states
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of federalRates.brackets) {
      if (remainingIncome <= 0) break;

      const bracketMin = bracket.min;
      const bracketMax = bracket.max || Infinity;
      const bracketWidth = bracketMax - bracketMin;
      const taxableAtThisBracket = Math.min(remainingIncome, bracketWidth);

      if (taxableIncome > bracketMin) {
        tax += taxableAtThisBracket * bracket.rate;
        remainingIncome -= taxableAtThisBracket;
      }
    }

    return Math.round(tax * 100) / 100;
  }

  // Calculate Social Security tax
  private calculateSocialSecurityTax(grossIncome: number): number {
    const socialSecurityData = STATE_TAX_DATA['AL'].taxRates.socialSecurityTax; // Same for all states
    const taxableWages = Math.min(grossIncome, socialSecurityData.wageBase);
    return Math.round(taxableWages * socialSecurityData.rate * 100) / 100;
  }

  // Calculate Medicare tax (including additional Medicare tax for high earners)
  private calculateMedicareTax(grossIncome: number, filingStatus: FilingStatus): number {
    const medicareData = STATE_TAX_DATA['AL'].taxRates.medicareTax; // Same for all states
    
    // Regular Medicare tax (no wage base limit)
    let tax = grossIncome * medicareData.rate;
    
    // Additional Medicare tax for high earners
    const threshold = medicareData.additionalThreshold[filingStatus];
    if (grossIncome > threshold) {
      const additionalTaxableIncome = grossIncome - threshold;
      tax += additionalTaxableIncome * medicareData.additionalRate;
    }
    
    return Math.round(tax * 100) / 100;
  }

  // Calculate state income tax based on state-specific rules
  private calculateStateIncomeTax(taxableIncome: number, stateCode: string, filingStatus: FilingStatus): number {
    if (taxableIncome <= 0) return 0;

    const stateData = STATE_TAX_DATA[stateCode.toUpperCase()];
    if (!stateData || !stateData.taxRates.stateIncomeTax.hasIncomeTax) {
      return 0;
    }

    const stateIncomeTax = stateData.taxRates.stateIncomeTax;

    // Flat rate states
    if (stateIncomeTax.flatRate) {
      return Math.round(taxableIncome * stateIncomeTax.flatRate * 100) / 100;
    }

    // Progressive bracket states
    if (stateIncomeTax.brackets) {
      let tax = 0;
      let remainingIncome = taxableIncome;

      for (const bracket of stateIncomeTax.brackets) {
        if (remainingIncome <= 0) break;

        const bracketMin = bracket.min;
        const bracketMax = bracket.max || Infinity;
        const bracketWidth = bracketMax - bracketMin;
        const taxableAtThisBracket = Math.min(remainingIncome, bracketWidth);

        if (taxableIncome > bracketMin) {
          tax += taxableAtThisBracket * bracket.rate;
          remainingIncome -= taxableAtThisBracket;
        }
      }

      return Math.round(tax * 100) / 100;
    }

    return 0;
  }

  //Get standard deduction for federal taxes
  private getFederalStandardDeduction(filingStatus: FilingStatus): number {
    const federalRates = STATE_TAX_DATA['AL'].taxRates.federalIncomeTax;
    return federalRates.standardDeduction[filingStatus];
  }

  //Get standard deduction for state taxes
  private getStateStandardDeduction(stateCode: string, filingStatus: FilingStatus): number {
    const stateData = STATE_TAX_DATA[stateCode.toUpperCase()];
    if (!stateData || !stateData.taxRates.stateIncomeTax.hasIncomeTax) {
      return 0;
    }

    const standardDeduction = stateData.taxRates.stateIncomeTax.standardDeduction;
    return standardDeduction ? standardDeduction[filingStatus] : 0;
  }

  // Employee contribution to a state paid family/medical leave fund, on ANNUAL wages.
  // Returns 0 for the majority of states, which run no such program.
  private calculatePaidLeave(annualGross: number, stateCode: string): number {
    const program = getPaidLeaveProgram(stateCode);
    if (!program || annualGross <= 0) return 0;

    const contributoryWages =
      program.wageBase === null ? annualGross : Math.min(annualGross, program.wageBase);
    const contribution = contributoryWages * program.employeeRate;
    return program.annualMax === null ? contribution : Math.min(contribution, program.annualMax);
  }

  // Main calculation method
  public calculateTaxes(input: TaxCalculationInput): TaxCalculationResult {
    const {
      grossIncome,
      filingStatus,
      stateCode,
      additionalDeductions = 0
    } = input;

    // Calculate deductions
    const federalStandardDeduction = this.getFederalStandardDeduction(filingStatus);
    const stateStandardDeduction = this.getStateStandardDeduction(stateCode, filingStatus);
    
    const totalFederalDeductions = federalStandardDeduction + additionalDeductions;
    const totalStateDeductions = stateStandardDeduction + additionalDeductions;

    // Calculate taxable income
    const federalTaxableIncome = Math.max(0, grossIncome - totalFederalDeductions);
    const stateTaxableIncome = Math.max(0, grossIncome - totalStateDeductions);

    // Calculate each tax component
    const federalIncomeTax = this.calculateFederalIncomeTax(federalTaxableIncome, filingStatus);
    const socialSecurityTax = this.calculateSocialSecurityTax(grossIncome);
    const medicareTax = this.calculateMedicareTax(grossIncome, filingStatus);
    const stateIncomeTax = this.calculateStateIncomeTax(stateTaxableIncome, stateCode, filingStatus);
    const paidLeave = this.calculatePaidLeave(grossIncome, stateCode);

    // Calculate totals
    const totalTaxes =
      federalIncomeTax + socialSecurityTax + medicareTax + stateIncomeTax + paidLeave;
    const netIncome = grossIncome - totalTaxes;
    const effectiveTaxRate = grossIncome > 0 ? (totalTaxes / grossIncome) * 100 : 0;

    return {
      federalIncomeTax,
      socialSecurityTax,
      medicareTax,
      stateIncomeTax,
      paidLeave,
      paidLeaveLabel: getPaidLeaveProgram(stateCode)?.label ?? '',
      totalTaxes,
      netIncome,
      effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100
    };
  }

  // Get all available states
  public getAvailableStates(): Array<{ code: string; name: string }> {
    return Object.values(STATE_TAX_DATA).map(state => ({
      code: state.stateCode,
      name: state.stateName
    }));
  }

  // Get state tax information
  public getStateInfo(stateCode: string) {
    return STATE_TAX_DATA[stateCode.toUpperCase()];
  }

  // Check if state has income tax
  public stateHasIncomeTax(stateCode: string): boolean {
    const stateData = STATE_TAX_DATA[stateCode.toUpperCase()];
    return stateData ? stateData.taxRates.stateIncomeTax.hasIncomeTax : false;
  }
}

// Issam: Validate this assumption later, 
// Export a singleton instance
export const taxCalculator = new TaxCalculator();