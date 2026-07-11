export interface AppSettings {
    templateId: number;
    nextTabStep: string;
    canPrint: boolean;
    configPath: string;
}
export interface CompanyInfo {
    companyName: string;
    companyEIN: string;
    companyAddress1: string;
    companyAddress2: string;
    companyCity: string;
    companyState: string;
    companyZipCode: string;
    companyLogo: string;
    companyPhone: string;
    companyEmail: string;
}
export interface EmployeeInfo {
    employeeFirstName: string;
    employeeMiddleInitial: string;
    employeeLastName: string;
    employeeAddress1: string;
    employeeAddress2: string;
    employeeCity: string;
    employeeState: string;
    employeeZipCode: string;
    employeeSSN: string;
    employeeID: string;
    employeePhone: string;
    employeeEmail: string;
    employeeMarriedStatus: string;
    employeeHireDate: Date;
}
export interface IncomeDetails {
    annualSalary: number;
    wageType: string; // "Hourly" or "Salary", 
    hourlyRate: number; // Example hourly rate
    hoursWorked: number; // Example hours worked per week
    overtimeRate: number; // Example overtime hourly rate
    overtimeHours: number; // Example overtime hours worked per week
    bonusAmount: number; // Example extrea bonus amount
    deduction401k: number; // Optional 401K amount
    medicalDeduction: number; // Optional medical deduction amount
    dentalDeduction: number; // Optional dental deduction amount
    visionDeduction: number; // Optional vision deduction amount
    otherDeduction: number; // Optional other deduction amount
    unionDues: number; // Optional union dues percentage (e.g., 0.01 for 1%)
    periodStartDate: Date;
    periodEndDate: Date;
    periodPayDate: Date;
    periodType: string;
}
export interface GeneralInfo {
    employmentType: string;
    paymentMethod: string; // "Direct Deposit" or "Check"
    paymentFrequency: string;
    payStubCount: number;
    payStubNumber: number;
    checkNumber: number;
    extraNotes: string;
}

export interface PayStubDetails {
    appSettings: AppSettings;
    companyInfo: CompanyInfo;
    employeeInfo: EmployeeInfo;
    incomeDetails: IncomeDetails;
    generalInfo: GeneralInfo;
}

/**
 * PaystubModel is the single, computed data contract consumed by the XML renderer.
 * It extends the raw store (so templates can still bind to e.g. {incomeDetails.hourlyRate})
 * and adds the derived, period-current numbers plus a year-to-date (`*YTD`) sibling for each.
 *
 * All values are RAW NUMBERS — presentation (currency/number/date) is applied in the
 * renderer via the cell `format` attribute, not here. See buildPaystubModel().
 */
export interface PaystubModel extends PayStubDetails {
    // Position of this stub within the purchased run (0-based), and the run's size.
    // A run of N stubs covers N consecutive pay periods; each stub carries its own period
    // dates (on incomeDetails), its own check/stub number, and its own YTD figures.
    stubIndex: number;
    stubCount: number;
    stubNumber: number;
    checkNumber: number;

    // Earnings (current period)
    regularPay: number;
    overtimePay: number;
    otherEarnings: number;
    grossPay: number;
    // Taxes (current period)
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    totalTaxes: number;
    // Deductions (current period)
    medical: number;
    dental: number;
    vision: number;
    retirement401k: number;
    otherDeductions: number;
    unionDues: number;
    totalDeductions: number;
    // Net (current period)
    netPay: number;

    // Year-to-date siblings
    regularPayYTD: number;
    overtimePayYTD: number;
    otherEarningsYTD: number;
    grossPayYTD: number;
    federalTaxYTD: number;
    stateTaxYTD: number;
    socialSecurityYTD: number;
    medicareYTD: number;
    totalTaxesYTD: number;
    medicalYTD: number;
    dentalYTD: number;
    visionYTD: number;
    retirement401kYTD: number;
    otherDeductionsYTD: number;
    unionDuesYTD: number;
    totalDeductionsYTD: number;
    netPayYTD: number;
}

