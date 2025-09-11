// Example usage:
// const deduction401kStr = deduction401kAsString(150); // For $150 deduction
// const medicalDeductionStr = medicalDeductionAsString(100); // For $100 medical deduction
// const dentalDeductionStr = dentalDeductionAsString(50); // For $50 dental deduction
// const visionDeductionStr = visionDeductionAsString(25); // For $25 vision deduction
// const otherDeductionStr = otherDeductionAsString(30); // For $30 other deduction

import {formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "./util";

export const totalDeductionsTitle = "Total Deductions";

const calculateCurrentDeductions = (deduction401k: number | undefined, medicalDeduction: number | undefined, dentalDeduction: number | undefined, visionDeduction: number | undefined, otherDeduction: number | undefined) => {
  if (deduction401k && medicalDeduction && dentalDeduction && visionDeduction && otherDeduction) {
    return ( deduction401k + medicalDeduction + dentalDeduction + visionDeduction + otherDeduction || 0);
  }
  return 0
};

const calculateDeductionsYTD = (deduction401k: number | undefined, medicalDeduction: number | undefined, dentalDeduction: number | undefined, visionDeduction: number | undefined, otherDeduction: number | undefined) => {
  if (deduction401k && medicalDeduction && dentalDeduction && visionDeduction && otherDeduction) {
    return (calculateCurrentDeductions(deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction) * getWeeksToDateThisYear());
  }
  return 0;
};

export const deduction401kAsString = (deduction401k: number) => {
  return (deduction401k ? formatCurrency(deduction401k) : "N/A");
};
export const medicalDeductionAsString = (medicalDeduction: number) => {
  return (medicalDeduction ? formatCurrency(medicalDeduction) : "N/A");
};
export const dentalDeductionAsString = (dentalDeduction: number) => {
  return (dentalDeduction ? formatCurrency(dentalDeduction) : "N/A");
};
export const visionDeductionAsString = (visionDeduction: number) => {
  return (visionDeduction ? formatCurrency(visionDeduction) : "N/A");
};
export const otherDeductionAsString = (otherDeduction: number) => {
  return (otherDeduction ? formatCurrency(otherDeduction) : "N/A");
};
export const currentDeductionsAsString = (deduction401k: number | undefined, medicalDeduction: number | undefined, dentalDeduction: number | undefined, visionDeduction: number | undefined, otherDeduction: number | undefined) => {
  return (formatCurrency(calculateCurrentDeductions(deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction)) || "N/A");
};

export const deductionsAsStringYTD = (deduction401k: number | undefined, medicalDeduction: number | undefined, dentalDeduction: number | undefined, visionDeduction: number | undefined, otherDeduction: number | undefined) => {
  return (formatCurrency(calculateDeductionsYTD(deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction)) || "N/A");
};

export const deduction401kAsStringYTD = (deduction401k: number) => {
  return (deduction401k ? formatCurrency(deduction401k*getWeeksToDateThisYear()) : "N/A");
};
export const medicalDeductionAsStringYTD = (medicalDeduction: number) => {
  return (medicalDeduction ? formatCurrency(medicalDeduction*getWeeksToDateThisYear()) : "N/A");
};
export const dentalDeductionAsStringYTD = (dentalDeduction: number) => {
  return (dentalDeduction ? formatCurrency(dentalDeduction*getWeeksToDateThisYear()) : "N/A");
};
export const visionDeductionAsStringYTD = (visionDeduction: number) => {
  return (visionDeduction ? formatCurrency(visionDeduction*getWeeksToDateThisYear()) : "N/A");
};
export const otherDeductionAsStringYTD = (otherDeduction: number) => {
  return (otherDeduction ? formatCurrency(otherDeduction*getWeeksToDateThisYear()) : "N/A");
};
