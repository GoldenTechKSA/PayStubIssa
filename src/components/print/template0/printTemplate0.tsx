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
        {/* Header */}
        <div className="paystub-header0">
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ marginRight: "16px" }} aria-label="Company SVG Logo" className="paystub-company-svglogo0">
            <circle cx="30" cy="30" r="28" fill="#2563eb" stroke="#1e293b" strokeWidth="2" />
            <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="16" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="bold">LOGO</text>
          </svg>
          <div className="paystub-header-company0">
            <div className="paystub-header-company-name0">{companyName || "Company Name"}</div>
            <div className="paystub-header-company-address0">{companyFullAddress}</div>
            <div className="paystub-header-company-contact0">
              {companyPhone}{companyPhone && companyEmail ? " | " : ""}{companyEmail}
            </div>
            <div className="paystub-header-company-ein0">{companyEIN && `EIN: ${companyEIN}`}</div>
          </div>
          <div className="paystub-header-title0">PAY STUB</div>
        </div>

        {/* Employee & Pay Info */}
        <div className="paystub-info-row0">
          <div className="paystub-info-col0">
            <table>
              <tbody>
                <tr>
                  <td className="paystub-label0">Employee Name:</td>
                  <td>{employeeFullName}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Employee ID:</td>
                  <td>{employeeID}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">SSN:</td>
                  <td>{employeeSSN}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Address:</td>
                  <td>{employeeFullAddress}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Phone:</td>
                  <td>{employeePhone}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Email:</td>
                  <td>{employeeEmail}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Filing Status:</td>
                  <td>{employeeMarriedStatus}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="paystub-info-col0">
            <table>
              <tbody>
                <tr>
                  <td className="paystub-label0">Pay Date:</td>
                  <td>{formatDate(periodPayDate)}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Check #:</td>
                  <td>{checkNumber}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Pay Period:</td>
                  <td>{payPeriod}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Pay Method:</td>
                  <td>{paymentMethod}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Employment Type:</td>
                  <td>{employmentType}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Pay Frequency:</td>
                  <td>{paymentFrequency}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Annual Salary:</td>
                  <td>{annualSalary}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

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

        {/* Net Pay Summary */}
        <div className="paystub-netpay-row0">
          <div>
            <span className="paystub-label0">Net Pay (This Period):</span>
            <span className="paystub-netpay-amount0">{netPay}</span>
          </div>
          <div>
            <span className="paystub-label0">Net Pay (YTD):</span>
            <span className="paystub-netpay-amount0">{netPayYTD}</span>
          </div>
          <div>
            <span className="paystub-label0">Direct Deposit:</span>
            <span>{directDeposit}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="paystub-footer0">
          <p>This is not a check. For questions about your pay stub, please contact HR.</p>
          <p>{companyName || "Company Name"} - Confidential</p>
        </div>
      </div>
      <div className="text-center mb-3 no-print">
        <button
          onClick={handlePrint}
          className="px-3 py-2 bg-blue-600 border-none rounded cursor-pointer text-[11px] hover:bg-blue-700"
        >
          Print or Save as PDF
        </button>
      </div>
    </div>
  );
};

export default PrintTemplate0;
