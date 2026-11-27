import { STATE_NAMES, StateBracket, StatePhaseOut, stateStatusKey, stateTaxRulesFor } from "../assets/data/state-tax-data";
import { TaxCalculationInput, TaxCalculationResult, FilingStatus } from "../types/tax-rate-types";
import { getPaidLeaveProgram } from "../assets/data/paid-leave-data";
import { federalTaxYearFor, FederalSchedule } from "../assets/data/federal-tax-data";

const SOCIAL_SECURITY_RATE = 0.062; // employee share, fixed by statute

// Medicare's rate and thresholds are fixed by statute (not indexed), the same in every state.
const MEDICARE_TAX = {
  rate: 0.0145, // 1.45%
  additionalRate: 0.009, // 0.9% additional
  additionalThreshold: {
    single: 200000,
    marriedFilingJointly: 250000,
    marriedFilingSeparately: 125000,
    headOfHousehold: 200000,
  } as Record<FilingStatus, number>,
};

// Tax on `income` from a schedule in which each `rate` applies to the income above `over`.
// Income below the first `over` is not taxed.
const taxFromSchedule = (income: number, brackets: StateBracket[]): number => {
  let tax = 0;
  brackets.forEach((bracket, i) => {
    const top = i + 1 < brackets.length ? brackets[i + 1].over : Infinity;
    if (income > bracket.over) {
      tax += (Math.min(income, top) - bracket.over) * bracket.rate;
    }
  });
  return tax;
};

// A deduction, exemption or credit that shrinks as wages rise past a threshold, never below zero.
const afterPhaseOut = (amount: number, wages: number, phaseOut?: StatePhaseOut): number =>
  phaseOut ? Math.max(0, amount - Math.max(0, wages - phaseOut.over) * phaseOut.rate) : amount;

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
    // Regular Medicare tax (no wage base limit)
    let tax = grossIncome * MEDICARE_TAX.rate;

    // Additional Medicare tax for high earners
    const threshold = MEDICARE_TAX.additionalThreshold[filingStatus];
    if (grossIncome > threshold) {
      tax += (grossIncome - threshold) * MEDICARE_TAX.additionalRate;
    }

    return Math.round(tax * 100) / 100;
  }

  // State income tax on a year of wages, from the state's rate schedule for the year the wages
  // are paid in (see state-tax-data.ts for what that covers and what it leaves out).
  // `annualWages` is already net of pre-tax deductions. A married couple filing jointly has
  // its own schedule and amounts; every other filing status uses the single ones, except that
  // a head of household gets its own standard deduction where the data has one (states that
  // use the federal standard deduction, and South Carolina from 2026).
  private calculateStateIncomeTax(annualWages: number, stateCode: string, filingStatus: FilingStatus, taxYear?: number): number {
    const rules = stateTaxRulesFor(stateCode, taxYear);
    if (!rules || annualWages <= 0) return 0;
    const status = stateStatusKey(filingStatus);

    const headOfHousehold = filingStatus === 'headOfHousehold';
    const standardDeduction = afterPhaseOut(
      (headOfHousehold && rules.standardDeduction?.headOfHousehold) || (rules.standardDeduction?.[status] ?? 0),
      annualWages,
      (headOfHousehold && rules.standardDeductionPhaseOut?.headOfHousehold) || rules.standardDeductionPhaseOut?.[status]);
    const personalExemption = afterPhaseOut(
      rules.personalExemption?.[status] ?? 0, annualWages, rules.personalExemptionPhaseOut?.[status]);

    const taxableIncome = annualWages - standardDeduction - personalExemption;
    if (taxableIncome <= 0) return 0;

    const low = rules.lowIncomeSchedule;
    const brackets = low && taxableIncome <= low.upTo ? low.brackets : rules[status];
    const personalCredit = afterPhaseOut(
      rules.personalCredit?.[status] ?? 0, annualWages, rules.personalCreditPhaseOut?.[status]);
    const tax = taxFromSchedule(taxableIncome, brackets) - personalCredit;

    return Math.max(0, Math.round(tax * 100) / 100);
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

    // Income tax, federal and state, is figured on wages net of pre-tax deductions. The
    // standard deduction is inside the IRS tables and inside each state's rules.
    const incomeTaxWages = Math.max(0, grossIncome - additionalDeductions);

    // Calculate each tax component
    const federalIncomeTax = this.calculateFederalIncomeTax(incomeTaxWages, filingStatus, taxYear);
    const socialSecurityTax = this.calculateSocialSecurityTax(grossIncome, taxYear);
    const medicareTax = this.calculateMedicareTax(grossIncome, filingStatus);
    const stateIncomeTax = this.calculateStateIncomeTax(incomeTaxWages, stateCode, filingStatus, taxYear);
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
    return Object.entries(STATE_NAMES).map(([code, name]) => ({ code, name }));
  }

  // Check if state has an income tax on wages in the given year (the latest on file by default)
  public stateHasIncomeTax(stateCode: string, taxYear?: number): boolean {
    return stateTaxRulesFor(stateCode, taxYear) !== undefined;
  }
}

// Issam: Validate this assumption later, 
// Export a singleton instance
export const taxCalculator = new TaxCalculator();
