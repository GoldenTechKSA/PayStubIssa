import { AppSettings, CompanyInfo, EmployeeInfo, GeneralInfo, IncomeDetails, PayStubDetails } from "./pay-stub-details";
import { STATESLIST } from "../../constants/globals";


const appSettings: AppSettings = {
    templateId: 0,
    nextTabStep: "template",
    canPrint: false
};

const companyInfo: CompanyInfo = {
    companyName: "Issa Company Limited",
    companyEIN: "83-1122334",
    companyAddress1: "1234 Main St.",
    companyAddress2: "Suite 500",
    companyCity: "Seattle",
    companyState: "Washington",
    companyZipCode: "98000",
    companyLogo: "CompanyLogoHere",
    companyPhone: "(888) 555-1212",
    companyEmail: "IssaCompany@email.com"
};

const employeeInfo: EmployeeInfo = {
    employeeFirstName: "John",
    employeeMiddleInitial: "M",
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
    annualSalary: 100000,
    wageType: "Hourly", 
    hourlyRate: 1.0, // Example hourly rate
    hoursWorked: 1.0, // Example hours worked per week
    overtimeRate: 1.0, // Example overtime hourly rate
    overtimeHours: 1.0, // Example overtime hours worked per week
    bonusAmount: 3.0, // Example extrea bonus amount
    deduction401k: 1, // Optional 401K amount
    medicalDeduction: 1, // Optional medical deduction amount
    dentalDeduction: 1, // Optional dental deduction amount
    visionDeduction: 1, // Optional vision deduction amount
    otherDeduction: 1, // Optional other deduction amount
    periodStartDate: new Date(),
    periodEndDate: new Date(),
    periodPayDate: new Date(),
    periodType: "Weekly"
};

const generalInfo: GeneralInfo = {
    employmentType: "Contractor",
    paymentMethod: "Direct Deposit",
    paymentFrequency: "Bi-Weekly",
    payStubCount: 3,
    payStubNumber: 1,
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