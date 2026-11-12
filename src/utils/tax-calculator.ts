import { STATE_TAX_DATA } from "../assets/data/state-tax-data";
import { TaxCalculationInput, TaxCalculationResult, FilingStatus } from "../types/tax-rate-types";
import { getPaidLeaveProgram } from "../assets/data/paid-leave-data";
import { federalTaxYearFor, FederalSchedule } from "../assets/data/federal-tax-data";

const SOCIAL_SECURITY_RATE = 0.062; // employee share, fixed by statute

export class TaxCalculator {
  // Federal income tax withholding for a year of wages, by the IRS percentage method for
  // automated payroll systems (Publication 15-T, Worksheet 1A) with a standard Form W-4:
  // Step 2 box not checked, nothing in Steps 3 and 4. `annualWages` is already net of pre-tax
  // deductions. Each filing status has its own schedule; married filing separately uses the
  // single one, as the IRS tables do.
  private calculateFederalIncomeTax(annualWages: number, filingStatus: FilingStatus, taxYear?: number): number {
    const tables = federalTaxYearFor(taxYear);
    const allowance = filingStatus === 'marriedFilingJointly'
      ? tables.step2UncheckedAllowance.marriedFilingJointly
      : tables.step2UncheckedAllowance.other;
    const adjustedAnnualWage = annualWages - allowance;
    if (adjustedAnnualWage <= 0) return 0;

    const scheduleKey: FederalSchedule = filingStatus === 'marriedFilingSeparately' ? 'single' : filingStatus;
    const brackets = tables.schedules[scheduleKey];

    let tax = 0;
    brackets.forEach((bracket, i) => {
      const top = i + 1 < brackets.length ? brackets[i + 1].over : Infinity;
      if (adjustedAnnualWage > bracket.over) {
        tax += (Math.min(adjustedAnnualWage, top) - bracket.over) * bracket.rate;
      }
    });

    return Math.round(tax * 100) / 100;
  }

  // Calculate Social Security tax (wages above that year's wage base are not taxed)
  private calculateSocialSecurityTax(grossIncome: number, taxYear?: number): number {
    const taxableWages = Math.min(grossIncome, federalTaxYearFor(taxYear).socialSecurityWageBase);
    return Math.round(taxableWages * SOCIAL_SECURITY_RATE * 100) / 100;
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
      additionalDeductions = 0,
      taxYear
    } = input;

    // Calculate deductions
    const stateStandardDeduction = this.getStateStandardDeduction(stateCode, filingStatus);
    
    const totalStateDeductions = stateStandardDeduction + additionalDeductions;

    // Calculate taxable income
    // Federal: wages net of pre-tax deductions; the standard deduction is inside the IRS tables.
    const federalWages = Math.max(0, grossIncome - additionalDeductions);
    const stateTaxableIncome = Math.max(0, grossIncome - totalStateDeductions);

    // Calculate each tax component
    const federalIncomeTax = this.calculateFederalIncomeTax(federalWages, filingStatus, taxYear);
    const socialSecurityTax = this.calculateSocialSecurityTax(grossIncome, taxYear);
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