import {formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "./util";
import {calculateOvertime, calculateOvertimeYTD } from "./overtime-calculator";

const calculateGrossPay = (rate: number, hours: number) => {
    return ((rate * hours) || 0);
};

const calculateGrossYTD = (rate: number, hours: number) => {
  return(calculateGrossPay(rate, hours) * getWeeksToDateThisYear());
};

const calculateNetPayYTD = (rate: number, hours: number, totalCurrentTaxes: number, totalCurrentDeductions: number) => {
return (calculateGrossYTD(rate, hours) - (totalCurrentTaxes * getWeeksToDateThisYear()) - (totalCurrentDeductions * getWeeksToDateThisYear()));
};

const calculateNetPay = (totalCurrentPay: number, totalCurrentTaxes: number, totalCurrentDeductions:number ) => {
    return (totalCurrentPay - totalCurrentTaxes - totalCurrentDeductions);
};

const totalEarningsCurrent = (rate: number, hours: number, orate: number, ohours: number, bonus: number) => {
  return (calculateGrossPay(rate, hours) + calculateOvertime(orate, ohours) + bonus);
};

const totalEarningsYTD = (rate: number, hours:number, orate: number, ohours: number, bonus: number) => {
  return (calculateGrossYTD(rate, hours) + calculateOvertimeYTD(orate, ohours) + bonus);
};

export const grossPayAsString = (rate: number, hours: number) => {
  return (formatCurrency(calculateGrossPay(rate, hours)) || "N/A");
};

export const grossPayAsStringYTD = (rate: number, hours: number) => {
  return((formatCurrency(calculateGrossPay(rate, hours) * getWeeksToDateThisYear())) || "N/A");
};

export const netPayAsStringCurrent = (totalCurrentPay, totalCurrentTaxes, totalCurrentDeductions ) => {
  return (formatCurrency(calculateNetPay(totalCurrentPay, totalCurrentTaxes, totalCurrentDeductions)) || "N/A");
}

export const totalEarningsAsStringCurrent = (rate: number, hours:number, orate: number, ohours: number, bonus: number) => {
  return (formatCurrency(totalEarningsCurrent(rate, hours, orate, ohours, bonus))) || "N/A";
};

export const totalEarningsAsStringYTD = (rate: number, hours: number, orate: number, ohours: number, bonus: number) => {
  return formatCurrency(totalEarningsYTD(rate, hours, orate, ohours, bonus)) || "N/A";
};

export const totalEarningsTitle = "Total Earnings";


