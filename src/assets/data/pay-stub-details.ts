export interface AppSettings {
    templateId: number;
    nextTabStep: string;
    /** True only after the server captured and verified the PayPal payment. */
    canPrint: boolean;
    configPath: string;
    /** The server-signed proof of payment; absent until paid. */
    unlock?: {
        token: string;
        orderId: string;
        expiresAt: string;
        /** Number of pay stubs the payment covered. */
        qty: number;
    } | null;
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
    // W-4 exemptions / allowances, printed on the stub only. The tax engine works from
    // the standard deduction and brackets, so this never enters a calculation.
    employeeExemptions: number;
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
    // Presentation-ready strings the XML layer cannot derive on its own: cell
    // placeholders can only look up a path, never slice, join or reformat text.
    // Each is guaranteed non-empty (falling back to an em dash) because a resolved
    // empty string would be coerced to "0" by the renderer.
    employeeSSNMasked: string;    // "***-**-6789" — never the full number
    payPeriodLabel: string;       // "12/03/2023 - 12/09/2023"
    stateTaxLabel: string;        // "WA ST TAX", or "ST TAX" when the state is unknown
    companyAddressLine: string;   // "123 E Indian School Rd Phoenix, AZ 85014"
    companyCityStateZip: string;  // "Los Angeles, CA 90016" — no street
    employeeAddressLine: string;  // "Denver, CO 80246"
    filingStatusLabel: string;    // "Married filing jointly" — not the stored id
    paidLeaveLabel: string;       // "CO FMLI", empty where the state runs no program
    employeeStateCode: string;    // "CA" — the store holds the full state name
    // Wage type as booleans: renderIf tests a single path, and both "Salary" and
    // "Hourly" are truthy strings, so a template cannot branch on wageType itself.
    isSalaried: boolean;
    isHourly: boolean;

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
    // Employee share of a state paid family/medical leave premium; 0 in most states.
    // Included in totalTaxes — see TaxCalculationResult.paidLeave.
    paidLeave: number;
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
    paidLeaveYTD: number;
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

