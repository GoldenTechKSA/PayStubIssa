import React from "react";
import { CompanyInfo, EmployeeInfo, IncomeDetails, GeneralInfo, PayStubDetails, } from "../../../assets/data/pay-stub-details";
import "./printTemplate0.css";

// Helper to format date fields safely
const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
  return String(date);
};

interface PrintTemplate0Props {
  store: PayStubDetails;
}

const PrintTemplate0: React.FC<PrintTemplate0Props> = ({ store }) => {
  // Destructure store properties using types
  const companyInfo: CompanyInfo = store.companyInfo;
  const employeeInfo: EmployeeInfo = store.employeeInfo;
  const incomeDetails: IncomeDetails = store.incomeDetails;
  const generalInfo: GeneralInfo = store.generalInfo;

  // Company Info
  const {companyName, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode, companyPhone, companyEmail, companyEIN,} = companyInfo;

  // Employee Info
  const {employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode, employeePhone, employeeEmail, employeeSSN, employeeID, employeeMarriedStatus, } = employeeInfo;

  // Income Details
  const {annualSalary, periodStartDate, periodEndDate, periodPayDate, periodType, } = incomeDetails;

  // General Info
  const {employmentType, paymentMethod, paymentFrequency, payStubCount, checkNumber,} = generalInfo;

  // Compose values for the template
  const employeeFullName = [employeeFirstName, employeeMiddleInitial, employeeLastName].filter(Boolean).join(" ");
  const employeeFullAddress = [employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode].filter(Boolean).join(", ");
  const companyFullAddress = [companyAddress1, companyAddress2, companyCity, companyState, companyZipCode].filter(Boolean).join(", ");
  const payPeriod = `${formatDate(periodStartDate)} - ${formatDate(periodEndDate)}`;

  // Example earnings, deductions, and taxes (replace with real calculations as needed)
  const earnings = [
    { description: "Regular Pay", rate: "$25.00", hours: "80.00", current: "$2,000.00", ytd: "$16,000.00" },
    { description: "Overtime", rate: "$37.50", hours: "5.00", current: "$187.50", ytd: "$1,500.00" },
    { description: "Bonus", rate: "-", hours: "-", current: "$100.00", ytd: "$500.00" }
  ];
  const totalEarnings = "$2,287.50";
  const totalEarningsYTD = "$18,000.00";

  const deductions = [
    { description: "Medical", current: "$75.00", ytd: "$600.00" },
    { description: "Dental", current: "$25.00", ytd: "$200.00" },
    { description: "401(k)", current: "$114.38", ytd: "$915.04" }
  ];
  const totalDeductions = "$214.38";
  const totalDeductionsYTD = "$1,715.04";

  const taxes = [
    { description: "Federal Income", current: "$350.00", ytd: "$2,800.00" },
    { description: "Social Security", current: "$141.83", ytd: "$1,134.64" },
    { description: "Medicare", current: "$33.17", ytd: "$265.36" },
    { description: "State Income", current: "$125.00", ytd: "$1,000.00" }
  ];
  const totalTaxes = "$650.00";
  const totalTaxesYTD = "$5,200.00";

  const grossPay = totalEarnings;
  const grossPayYTD = totalEarningsYTD;
  const netPay = "$1,423.12";
  const netPayYTD = "$11,084.96";
  const directDeposit = "****1234";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="paystub-print-root0">
      <style>
        {`
        @media print {
          body, html, #root, .paystub-print-root0 {
            background: #456799 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100vw !important;
          }
          .no-print {
            display: none !important;
          }
          .paystub-print-paper0 {
            box-shadow: none !important;
            border: none !important;
          }
        }
        `}
      </style>
      <div className="paystub-print-paper0">
        {/* Earnings, Deductions, Taxes Table */}
        <table className="paystub-main-table0">
          <thead>
            <tr>
              <th rowSpan={2}>Description</th>
              <th colSpan={2}>Earnings</th>
              <th colSpan={2}>Deductions</th>
              <th colSpan={2}>Taxes</th>
            </tr>
            <tr>
              <th>Current</th>
              <th>YTD</th>
              <th>Current</th>
              <th>YTD</th>
              <th>Current</th>
              <th>YTD</th>
            </tr>
          </thead>
          <tbody>
            {/* Maximum rows among all sections */}
            {Array.from({ length: Math.max(earnings.length, deductions.length, taxes.length) }).map((_, i) => (
              <tr key={i}>
                <td>
                  {earnings[i]?.description || deductions[i]?.description || taxes[i]?.description || ""}
                </td>
                <td>{earnings[i]?.current || ""}</td>
                <td>{earnings[i]?.ytd || ""}</td>
                <td>{deductions[i]?.current || ""}</td>
                <td>{deductions[i]?.ytd || ""}</td>
                <td>{taxes[i]?.current || ""}</td>
                <td>{taxes[i]?.ytd || ""}</td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="paystub-total-row0">
              <td>Total</td>
              <td>{totalEarnings}</td>
              <td>{totalEarningsYTD}</td>
              <td>{totalDeductions}</td>
              <td>{totalDeductionsYTD}</td>
              <td>{totalTaxes}</td>
              <td>{totalTaxesYTD}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrintTemplate0;
