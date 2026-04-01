import { AppSettings, CompanyInfo, EmployeeInfo, GeneralInfo, IncomeDetails, PayStubDetails } from "./pay-stub-details";

const appSettings: AppSettings = {
    templateId: 0,
    nextTabStep: "template",
    canPrint: false,
    configPath: ""
};

const companyInfo: CompanyInfo = {
    companyName: "",
    companyEIN: "",
    companyAddress1: "",
    companyAddress2: "",
    companyCity: "",
    companyState: "",
    companyZipCode: "",
    companyLogo: "CompanyLogoHere",
    companyPhone: "",
    companyEmail: ""
};

const employeeInfo: EmployeeInfo = {
    employeeFirstName: "",
    employeeMiddleInitial: "",
    employeeLastName: "",
    employeeAddress1: "",
    employeeAddress2: "",
    employeeCity: "",
    employeeState: "",
    employeeZipCode: "",
    employeeSSN: "",
    employeeID: "",
    employeePhone: "",
    employeeEmail: "",
    employeeMarriedStatus: "single",
    employeeHireDate: new Date("2025-01-01")
};

const incomeDetails: IncomeDetails = {
    annualSalary: 0,
    wageType: "Hourly", 
    hourlyRate: 0.0, // Example hourly rate
    hoursWorked: 0.0, // Example hours worked per week
    overtimeRate: 0.0, // Example overtime hourly rate
    overtimeHours: 0.0, // Example overtime hours worked per week
    bonusAmount: 0.0, // Example extrea bonus amount
    deduction401k: 0, // Optional 401K amount
    medicalDeduction: 0, // Optional medical deduction amount
    dentalDeduction: 0, // Optional dental deduction amount
    visionDeduction: 0, // Optional vision deduction amount
    otherDeduction: 0, // Optional other deduction amount
    unionDues: 0, // Optional union dues percentage (e.g., 0.01 for 1%)
    periodStartDate: new Date(),
    periodEndDate: new Date(),
    periodPayDate: new Date(),
    periodType: "Weekly"
};

const generalInfo: GeneralInfo = {
    employmentType: "",
    paymentMethod: "",
    paymentFrequency: "",
    payStubCount: 0,
    payStubNumber: 0,
    extraNotes: "",
    checkNumber: 5001
};

export const prodInitialState: PayStubDetails = {
    appSettings: appSettings,
    companyInfo: companyInfo,
    employeeInfo: employeeInfo,
    incomeDetails: incomeDetails,
    generalInfo: generalInfo
};