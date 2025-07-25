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
}
export interface IncomeDetails {
    annualSalary: number;
    wageType: string; // "Hourly" or "Salary", 
    hourlyRate: number; // Example hourly rate
    hoursWorked: number; // Example hours worked per week
    periodStartDate: Date;
    periodEndDate: Date;
    periodPayDate: Date;
    periodType: string;
}
export interface GeneralInfo {
    employmentType: string;
    paymentMethod: string;
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
