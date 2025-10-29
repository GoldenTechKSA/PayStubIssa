import { PayStubDetails, Earnings, Deductions, Taxes, TemplateData } from '../components3col/types';

// Helper function to safely convert value to string and remove currency symbols
const removeCurrencySymbol = (value: string | number): string => {
  if (typeof value === 'number') {
    return value.toString();
  }
  return value.replace('$', '');
};

// Helper function to safely parse float from string or number
const parseCurrencyValue = (value: string | number): number => {
  const stringValue = removeCurrencySymbol(value);
  const parsed = parseFloat(stringValue);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper functions (these would be imported from your existing code)
const grossPayAsString = (hourlyRate: number, hoursWorked: number): string => {
  return `$${(hourlyRate * hoursWorked).toFixed(2)}`;
};

const grossPayAsStringYTD = (hourlyRate: number, hoursWorked: number): string => {
  // This would be calculated from YTD data
  return `$${(hourlyRate * hoursWorked * 12).toFixed(2)}`;
};

const overtimeAsStringCurrent = (overtimeRate: number, overtimeHours: number): string => {
  return `$${(overtimeRate * overtimeHours).toFixed(2)}`;
};

const overtimeAsStringYTD = (overtimeRate: number, overtimeHours: number): string => {
  return `$${(overtimeRate * overtimeHours * 12).toFixed(2)}`;
};

const medicalDeductionAsString = (medicalDeduction: number): string => {
  return `$${medicalDeduction.toFixed(2)}`;
};

const medicalDeductionAsStringYTD = (medicalDeduction: number): string => {
  return `$${(medicalDeduction * 12).toFixed(2)}`;
};

// Similar functions for dental, vision, 401k, other deductions...

// Tax calculation mock (replace with your actual implementation)
interface TaxCalculationInput {
  grossIncome: number;
  filingStatus: string;
  stateCode: string;
  additionalDeductions: number;
}

const taxesAsString2025 = (input: TaxCalculationInput) => {
  // Mock implementation - replace with your actual tax calculation
  const federalRate = 0.22;
  const socialSecurityRate = 0.062;
  const medicareRate = 0.0145;
  const stateRate = 0.05;
  
  const federalTax = input.grossIncome * federalRate;
  const socialSecurityTax = input.grossIncome * socialSecurityRate;
  const medicareTax = input.grossIncome * medicareRate;
  const stateTax = input.grossIncome * stateRate;
  
  return {
    federalIncomeTaxAsString: `$${federalTax.toFixed(2)}`,
    socialSecurityTaxAsString: `$${socialSecurityTax.toFixed(2)}`,
    medicareTaxAsString: `$${medicareTax.toFixed(2)}`,
    stateIncomeTaxAsString: `$${stateTax.toFixed(2)}`,
    federalIncomeTaxAsStringYTD: `$${(federalTax * 12).toFixed(2)}`,
    socialSecurityTaxAsStringYTD: `$${(socialSecurityTax * 12).toFixed(2)}`,
    medicareTaxAsStringYTD: `$${(medicareTax * 12).toFixed(2)}`,
    stateIncomeTaxAsStringYTD: `$${(stateTax * 12).toFixed(2)}`,
    totalTaxesAsString: `$${(federalTax + socialSecurityTax + medicareTax + stateTax).toFixed(2)}`
  };
};

export const mapStoreToTemplateData = (store: PayStubDetails): TemplateData => {
  const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
  
  // Format addresses
  const employeeFullName = [employeeInfo.employeeFirstName, employeeInfo.employeeMiddleInitial, employeeInfo.employeeLastName].filter(Boolean).join(" ");
  const employeeFullAddress = [employeeInfo.employeeAddress1, employeeInfo.employeeAddress2].filter(Boolean).join(", ");
  const companyFullAddress = [companyInfo.companyAddress1, companyInfo.companyAddress2].filter(Boolean).join(", ");
  
  // Format pay period
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  const payPeriod = `${formatDate(incomeDetails.periodStartDate)} - ${formatDate(incomeDetails.periodEndDate)}`;
  
  // Create earnings array
  const earnings: Earnings[] = [
    { 
      description: "Regular Pay", 
      rate: `$${incomeDetails.hourlyRate}`, 
      hours: `${incomeDetails.hoursWorked}`, 
      current: grossPayAsString(incomeDetails.hourlyRate, incomeDetails.hoursWorked), 
      ytd: grossPayAsStringYTD(incomeDetails.hourlyRate, incomeDetails.hoursWorked) 
    },
    { 
      description: "Overtime", 
      rate: `$${incomeDetails.overtimeRate}`, 
      hours: `${incomeDetails.overtimeHours}`, 
      current: overtimeAsStringCurrent(incomeDetails.overtimeRate, incomeDetails.overtimeHours), 
      ytd: overtimeAsStringYTD(incomeDetails.overtimeRate, incomeDetails.overtimeHours) 
    },
    { 
      description: "Bonus", 
      rate: " ", 
      hours: " ", 
      current: `$${incomeDetails.bonusAmount}`, 
      ytd: `$${incomeDetails.bonusAmount}` 
    }
  ];
  
  // Create deductions array
  const deductions: Deductions[] = [
    { 
      description: "Medical", 
      current: medicalDeductionAsString(incomeDetails.medicalDeduction), 
      ytd: medicalDeductionAsStringYTD(incomeDetails.medicalDeduction) 
    },
    { 
      description: "Dental", 
      current: medicalDeductionAsString(incomeDetails.dentalDeduction), 
      ytd: medicalDeductionAsStringYTD(incomeDetails.dentalDeduction) 
    },
    { 
      description: "401(k)", 
      current: medicalDeductionAsString(incomeDetails.deduction401k), 
      ytd: medicalDeductionAsStringYTD(incomeDetails.deduction401k) 
    },
    { 
      description: "Vision", 
      current: medicalDeductionAsString(incomeDetails.visionDeduction), 
      ytd: medicalDeductionAsStringYTD(incomeDetails.visionDeduction) 
    },
    { 
      description: "Other", 
      current: medicalDeductionAsString(incomeDetails.otherDeduction), 
      ytd: medicalDeductionAsStringYTD(incomeDetails.otherDeduction) 
    }
  ];
  
  // Create taxes array
  const taxInput: TaxCalculationInput = {
    grossIncome: incomeDetails.hourlyRate * incomeDetails.hoursWorked,
    filingStatus: employeeInfo.employeeMarriedStatus === 'Married' ? 'married' : 'single',
    stateCode: employeeInfo.employeeState,
    additionalDeductions: 5000
  };
  
  const taxResults = taxesAsString2025(taxInput);
  const taxes: Taxes[] = [
    { 
      description: "Federal Income Tax", 
      current: taxResults.federalIncomeTaxAsString, 
      ytd: taxResults.federalIncomeTaxAsStringYTD 
    },
    { 
      description: "Social Security Tax", 
      current: taxResults.socialSecurityTaxAsString, 
      ytd: taxResults.socialSecurityTaxAsStringYTD 
    },
    { 
      description: "Medicare Tax", 
      current: taxResults.medicareTaxAsString, 
      ytd: taxResults.medicareTaxAsStringYTD 
    },
    { 
      description: "State Income Tax", 
      current: taxResults.stateIncomeTaxAsString, 
      ytd: taxResults.stateIncomeTaxAsStringYTD 
    }
  ];
  
  // Calculate totals - safely handle string/number types
  const totalEarningsCurrent = earnings.reduce((sum, earning) => {
    const value = parseCurrencyValue(earning.current);
    return sum + value;
  }, 0);
  
  const totalDeductionsCurrent = deductions.reduce((sum, deduction) => {
    const value = parseCurrencyValue(deduction.current);
    return sum + value;
  }, 0);
  
  const totalTaxesCurrent = taxes.reduce((sum, tax) => {
    const value = parseCurrencyValue(tax.current);
    return sum + value;
  }, 0);
  
  const netPayCurrent = totalEarningsCurrent - totalDeductionsCurrent - totalTaxesCurrent;
  
  return {
    // Header data
    paystub_title: "Pay Stub",

    company_name: companyInfo.companyName,
    company_address: `${companyFullAddress}, ${companyInfo.companyCity}, ${companyInfo.companyState} ${companyInfo.companyZipCode}`,
    company_city_state_zip: `${companyInfo.companyCity}, ${companyInfo.companyState} ${companyInfo.companyZipCode}`,
    company_phone: companyInfo.companyPhone,
    company_tax_id: companyInfo.companyEIN,
    company_email: companyInfo.companyEmail,
    company_logo: "/images/default-logo.png",

    paystub_id: generalInfo.payStubNumber,
    check_number: generalInfo.checkNumber,
    pay_period: { start: incomeDetails.periodStartDate, end: incomeDetails.periodEndDate },
    pay_period_start: incomeDetails.periodStartDate,
    pay_period_end: incomeDetails.periodEndDate,
    pay_date: incomeDetails.periodPayDate,
    
    // Body data - Employee
    employee_name: employeeFullName,
    employee_address: employeeFullAddress,
    employee_city_state_zip: `${employeeInfo.employeeCity}, ${employeeInfo.employeeState} ${employeeInfo.employeeZipCode}`,
    employee_ssn: employeeInfo.employeeSSN,
    employee_id: employeeInfo.employeeID,
    employee_phone: employeeInfo.employeePhone,
    employee_email: employeeInfo.employeeEmail,
    employee_status: employeeInfo.employeeMarriedStatus,
    employee_hire_date: employeeInfo.employeeHireDate,

    employee_department: "Engineering",
    employee_position: "Developer",
    employee_wage_type: incomeDetails.wageType,

    employment_type: generalInfo.employmentType,
    payment_method: generalInfo.paymentMethod, // "Direct Deposit" or "Check"
    payment_frequency: incomeDetails.periodType,
    paystub_count: generalInfo.payStubCount,
    extra_notes: generalInfo.extraNotes,

    annual_salary: incomeDetails.annualSalary,
    hourly_rate: incomeDetails.hourlyRate, // Example hourly rate
    hours_worked: incomeDetails.hoursWorked, // Example hours worked per week
    overtime_rate: incomeDetails.overtimeRate, // Example overtime hourly rate
    overtime_hours: incomeDetails.overtimeHours, // Example overtime hours worked per week
    bonus_amount: incomeDetails.bonusAmount, // Example extrea bonus amount
    deduction_401k: incomeDetails.deduction401k, // Optional 401K amount
    medical_deduction: incomeDetails.medicalDeduction, // Optional medical deduction amount
    dental_deduction: incomeDetails.dentalDeduction, // Optional dental deduction amount
    vision_deduction: incomeDetails.visionDeduction, // Optional vision deduction amount
    other_deduction: incomeDetails.otherDeduction, // Optional other deduction amount
    union_dues: incomeDetails.unionDues, // Optional union dues percentage (e.g., 0.01 for 1%)

// calculated   regular_pay: grossPayAsString(incomeDetails.hourlyRate, incomeDetails.hoursWorked),
// calculated   overtime_pay: overtimeAsStringCurrent(incomeDetails.overtimeRate, incomeDetails.overtimeHours),

    // Body data - Earnings (as arrays)
    earnings_items: earnings,
    deductions_items: deductions,
    taxes_items: taxes,
    
    // Summary data
    current_gross: `$${totalEarningsCurrent.toFixed(2)}`,
    current_deductions: `$${(totalDeductionsCurrent + totalTaxesCurrent).toFixed(2)}`,
    net_pay: `$${netPayCurrent.toFixed(2)}`,
    ytd_gross: `$${(totalEarningsCurrent * 12).toFixed(2)}`,
    ytd_deductions: `$${((totalDeductionsCurrent + totalTaxesCurrent) * 12).toFixed(2)}`,
    ytd_net: `$${(netPayCurrent * 12).toFixed(2)}`
  };
};