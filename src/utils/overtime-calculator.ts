// Example usage:
// const overtimeCurrent = overtimeAsStringCurrent(25, 10); // For $25/hour rate and 10 hours of overtime
// const overtimeYTD = overtimeAsStringYTD(25, 10); // YTD for the same rate and hours

import {formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "./util";

export const calculateOvertime = (rate: number, hours: number) => {
  return (rate ? (rate * hours) : 0);
};

export const calculateOvertimeYTD = (rate: number, hours: number) => {
  return (calculateOvertime(rate, hours) * getWeeksToDateThisYear());
};

export const overtimeAsStringCurrent = (rate: number, hours: number) => {
  return (formatCurrency(calculateOvertime(rate, hours)) || "N/A");
};

export const overtimeAsStringYTD = (rate: number, hours: number) => {
  return((formatCurrency(calculateOvertimeYTD(rate, hours))) || "N/A");
};
