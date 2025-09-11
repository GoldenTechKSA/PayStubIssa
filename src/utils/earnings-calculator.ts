import {formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "./util";
import {calculateOvertime, calculateOvertimeYTD } from "./overtime-calculator";

const calculateGrossPay = (rate: number, hours: number) => {
    return ((rate * hours) || 0);
};

const calculateGrossYTD = (rate: number, hours: number) => {
  return(calculateGrossPay(rate, hours) * getWeeksToDateThisYear());
};

const calculateNetPayYTD = (totalCurrentPayYTD: number, totalCurrentTaxes: number, totalCurrentDeductions: number) => {
return ((totalCurrentPayYTD  * getWeeksToDateThisYear()) - (totalCurrentTaxes * getWeeksToDateThisYear()) - (totalCurrentDeductions * getWeeksToDateThisYear()));
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

export const netPayAsStringCurrent = () => {
  const totalCurrentPay: number = 0;
  const totalCurrentTaxes: number = 0;
  const totalCurrentDeductions: number = 0;
  return (formatCurrency(calculateNetPay(totalCurrentPay, totalCurrentTaxes, totalCurrentDeductions)) || "N/A");
}

export const totalEarningsAsStringCurrent = (rate: number, hours:number, orate: number, ohours: number, bonus: number) => {
  return (formatCurrency(totalEarningsCurrent(rate, hours, orate, ohours, bonus))) || "N/A";
};

export const totalEarningsAsStringYTD = (rate: number, hours: number, orate: number, ohours: number, bonus: number) => {
  return formatCurrency(totalEarningsYTD(rate, hours, orate, ohours, bonus)) || "N/A";
};

export const netPayAsStringYTD = () => {
  const totalCurrentPayYTD: number = 0;
  const totalCurrentTaxesYTD: number = 0;
  const totalCurrentDeductionsYTD: number = 0;
  return (formatCurrency(calculateNetPayYTD(totalCurrentPayYTD, totalCurrentTaxesYTD, totalCurrentDeductionsYTD)) || "N/A");
}

export const totalEarningsTitle = "Total Earnings";


