import { AppSettings, CompanyInfo, EmployeeInfo, GeneralInfo, IncomeDetails, PayStubDetails } from "./pay-stub-details";

const appSettings: AppSettings = {
    templateId: 0,
    nextTabStep: "template",
    canPrint: false, // start locked so the payment gate (PayPal) shows, matching production
    configPath: ""
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
    employeeExemptions: 0,
    employeeHireDate: new Date("1980-01-01")
};

const incomeDetails: IncomeDetails = {
    annualSalary: 0,
    wageType: "Hourly", 
    // A complete, realistic bi-weekly example (the same figures the template snapshot
    // harness renders) so every wizard step validates as-is and the preview shows real
    // numbers. Keep the dates in the past: the Pay period step rejects future dates.
    hourlyRate: 32.5,
    hoursWorked: 80,
    overtimeRate: 48.75,
    overtimeHours: 6,
    bonusAmount: 250,
    deduction401k: 150,
    medicalDeduction: 120.5,
    dentalDeduction: 25,
    visionDeduction: 10,
    otherDeduction: 0,
    unionDues: 0, // Optional union dues percentage (e.g., 0.01 for 1%)
    periodStartDate: new Date("2025-09-28T00:00:00"),
    periodEndDate: new Date("2025-10-11T00:00:00"),
    periodPayDate: new Date("2025-10-17T00:00:00"),
    periodType: "Bi-Weekly"
};

const generalInfo: GeneralInfo = {
    employmentType: "Employee",
    paymentMethod: "Direct Deposit",
    paymentFrequency: "",
    payStubCount: 1,
    payStubNumber: 1024,
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