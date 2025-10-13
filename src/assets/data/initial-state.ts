import { AppSettings, CompanyInfo, EmployeeInfo, GeneralInfo, IncomeDetails, PayStubDetails } from "./pay-stub-details";

const appSettings: AppSettings = {
    templateId: 0,
    nextTabStep: "template",
    canPrint: true
};

const companyInfo: CompanyInfo = {
    companyName: "Issa Company Limited",
    companyEIN: "11-2233445",
    companyAddress1: "1234 Main St.",
    companyAddress2: "",
    companyCity: "Seattle",
    companyState: "Washington",
    companyZipCode: "98000",
    companyLogo: "",
    companyPhone: "(888) 555-1212",
    companyEmail: "IssaCompany@email.com"
};

const employeeInfo: EmployeeInfo = {
    employeeFirstName: "John",
    employeeMiddleInitial: "",
    employeeLastName: "Doe",
    employeeAddress1: "1234 Employee Street",
    employeeAddress2: "Apt. 2399",
    employeeCity: "Redmond",
    employeeState: "Washington",
    employeeZipCode: "98000",
    employeeSSN: "000-11-2222",
    employeeID: "122-802021",
    employeePhone: "(888) 555-1212",
    employeeEmail: "employee@company.com",
    employeeMarriedStatus: "single",
    employeeHireDate: new Date("1980-01-01")
};

const incomeDetails: IncomeDetails = {
    annualSalary: 0,
    wageType: "Hourly", 
    hourlyRate: 0, // Example hourly rate
    hoursWorked: 0, // Example hours worked per week
    overtimeRate: 0, // Example overtime hourly rate
    overtimeHours: 0, // Example overtime hours worked per week
    bonusAmount: 0, // Example extrea bonus amount
    deduction401k: 0, // Optional 401K amount
    medicalDeduction: 0, // Optional medical deduction amount
    dentalDeduction: 0, // Optional dental deduction amount
    visionDeduction: 0, // Optional vision deduction amount
    otherDeduction: 0, // Optional other deduction amount
    unionDues: 0, // Optional union dues percentage (e.g., 0.01 for 1%)
    periodStartDate: null as unknown as Date,
    periodEndDate: null as unknown as Date,
    periodPayDate: null as unknown as Date,
    periodType: "Weekly"
};

const generalInfo: GeneralInfo = {
    employmentType: "Employee",
    paymentMethod: "Direct Deposit",
    paymentFrequency: "",
    payStubCount: 0,
    payStubNumber: 0,
    extraNotes: "This is an example note for the pay stub.",
    checkNumber: 5001
};

export const initialState: PayStubDetails = {
    appSettings: appSettings,
    companyInfo: companyInfo,
    employeeInfo: employeeInfo,
    incomeDetails: incomeDetails,
    generalInfo: generalInfo
};