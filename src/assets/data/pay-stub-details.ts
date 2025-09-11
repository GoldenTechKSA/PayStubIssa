export interface AppSettings {
    templateId: number;
    nextTabStep: string;
    canPrint: boolean;
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
    deduction401k?: number; // Optional 401K amount
    medicalDeduction?: number; // Optional medical deduction amount
    dentalDeduction?: number; // Optional dental deduction amount
    visionDeduction?: number; // Optional vision deduction amount
    otherDeduction?: number; // Optional other deduction amount
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
