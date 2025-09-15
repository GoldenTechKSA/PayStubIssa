import {formatCurrency, getWeeksToDateThisYear } from "./util";
import { TaxCalculationInput, TaxCalculationResult, TaxCalculationResultAsString, FilingStatus } from "../types/tax-rate-types";
import {taxCalculator} from "../utils/tax-calculator";

export const totalTaxesTitle = "Total Taxes";

const calculateCurrentTaxes = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (federalTax || 0) + (stateTax || 0) + (socialSecurityTax || 0) + (medicareTax || 0);
};

export const taxesAsString2025 = (input: TaxCalculationInput) : TaxCalculationResultAsString=> {
  const { grossIncome, filingStatus, stateCode, additionalDeductions } = input;
  const results: TaxCalculationResult = taxCalculator.calculateTaxes(input);

  const federalIncomeTax = results.federalIncomeTax;
  const socialSecurityTax = results.socialSecurityTax;
  const medicareTax = results.medicareTax;
  const stateIncomeTax = results.stateIncomeTax;
  const totalTaxes = results.totalTaxes;
  // const netIncome = results.netIncome;
  // const effectiveTaxRate = results.effectiveTaxRate;

  return {
    federalIncomeTaxAsString: formatCurrency(federalIncomeTax) || "N/A",
    socialSecurityTaxAsString: formatCurrency(socialSecurityTax) || "N/A",
    medicareTaxAsString: formatCurrency(medicareTax) || "N/A",
    stateIncomeTaxAsString: formatCurrency(stateIncomeTax) || "N/A",
    totalTaxesAsString: formatCurrency(totalTaxes) || "N/A",
    federalIncomeTaxAsStringYTD: formatCurrency(federalIncomeTax*getWeeksToDateThisYear()) || "N/A",
    socialSecurityTaxAsStringYTD: formatCurrency(socialSecurityTax*getWeeksToDateThisYear()) || "N/A",
    medicareTaxAsStringYTD: formatCurrency(medicareTax*getWeeksToDateThisYear()) || "N/A",
    stateIncomeTaxAsStringYTD: formatCurrency(stateIncomeTax*getWeeksToDateThisYear()) || "N/A",
    totalTaxesAsStringYTD: formatCurrency(totalTaxes*getWeeksToDateThisYear()) || "N/A",
  };
}

export const currentTaxesAsString = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (formatCurrency(calculateCurrentTaxes(federalTax, stateTax, socialSecurityTax, medicareTax))) || "N/A";
};

export const taxesAsStringYTD = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (formatCurrency(calculateCurrentTaxes(federalTax, stateTax, socialSecurityTax, medicareTax)* getWeeksToDateThisYear())) || "N/A";
};
