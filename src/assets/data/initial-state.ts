import { AppSettings, CompanyInfo, EmployeeInfo, GeneralInfo, IncomeDetails, PayStubDetails } from "./pay-stub-details";

const appSettings: AppSettings = {
    templateType: 5,
    nextTabStep: "template",
    canPrint: true
};

const companyInfo: CompanyInfo = {
    companyName: "Issa Company Limited",
    companyEIN: "83-112220000",
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
    employeeMarriedStatus: "Single"
};

const incomeDetails: IncomeDetails = {
    annualSalary: 125500,
    periodStartDate: new Date(),
    periodEndDate: new Date(),
    periodPayDate: new Date(),
    periodType: "Hourly"
};

const generalInfo: GeneralInfo = {
    employmentType: "Contractor",
    paymentType: "Direct Deposit",
    paymentFrequency: "Bi-Weekly",
    payStubCount: 3,
    checkNumber: 5001
};

export const initialState: PayStubDetails = {
    appSettings: appSettings,
    companyInfo: companyInfo,
    employeeInfo: employeeInfo,
    incomeDetails: incomeDetails,
    generalInfo: generalInfo
};