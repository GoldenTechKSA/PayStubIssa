import {formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "./util";

export const totalTaxesTitle = "Total Taxes";

const calculateCurrentTaxes = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (federalTax || 0) + (stateTax || 0) + (socialSecurityTax || 0) + (medicareTax || 0);
};


export const currentTaxesAsString = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (formatCurrency(calculateCurrentTaxes(federalTax, stateTax, socialSecurityTax, medicareTax))) || "N/A";
};

export const taxesAsStringYTD = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (formatCurrency(calculateCurrentTaxes(federalTax, stateTax, socialSecurityTax, medicareTax)* getWeeksToDateThisYear())) || "N/A";
};
