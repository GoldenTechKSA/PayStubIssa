import {formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "./util";

const federalTax = 0;
const stateTax = 0; // Placeholder, replace with actual state tax calculation if available
const socialSecurityTax = 0;  // Placeholder, replace with actual Social Security tax calculation if available
const medicareTax = 0;  // Placeholder, replace with actual Medicare tax calculation if available   
const calculateTotalCurrentTaxes = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (federalTax || 0) + (stateTax || 0) + (socialSecurityTax || 0) + (medicareTax || 0);
};


export const totalTaxesTitle = "Total Taxes";
export const totalCurrentTaxesAsString = (federalTax: number, stateTax: number, socialSecurityTax: number, medicareTax: number) => {
  return (formatCurrency(calculateTotalCurrentTaxes(federalTax, stateTax, socialSecurityTax, medicareTax))) || "N/A";
};
