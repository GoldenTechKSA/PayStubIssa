import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";
import "./printTemplate6.css";

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
  return String(date);
};

interface PrintTemplate6Props {
  store: PayStubDetails;
}

const PrintTemplate6: React.FC<PrintTemplate6Props> = ({ store }) => {
  const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
  const companyFullAddress = [companyInfo.companyAddress1, companyInfo.companyAddress2, companyInfo.companyCity, companyInfo.companyState, companyInfo.companyZipCode].filter(Boolean).join(", ");
  const employeeFullName = [employeeInfo.employeeFirstName, employeeInfo.employeeMiddleInitial, employeeInfo.employeeLastName].filter(Boolean).join(" ");
  const employeeFullAddress = [employeeInfo.employeeAddress1, employeeInfo.employeeAddress2, employeeInfo.employeeCity, employeeInfo.employeeState, employeeInfo.employeeZipCode].filter(Boolean).join(", ");
  const payPeriod = `${formatDate(incomeDetails.periodStartDate)} - ${formatDate(incomeDetails.periodEndDate)}`;
  const payStubNumber = generalInfo.payStubNumber;

  // Example data
  const earnings = [
    { desc: "Regular Pay", current: "$2,000.00", ytd: "$16,000.00" },
    { desc: "Overtime", current: "$150.00", ytd: "$1,200.00" }
  ];
  const deductions = [
    { desc: "Medical", current: "$75.00", ytd: "$600.00" },
    { desc: "401(k)", current: "$100.00", ytd: "$800.00" }
  ];
  const taxes = [
    { desc: "Federal", current: "$300.00", ytd: "$2,400.00" },
    { desc: "State", current: "$100.00", ytd: "$800.00" }
  ];
  const netPay = "$1,575.00";
  const netPayYTD = "$12,800.00";

  const handlePrint = () => window.print();

  return (
    <div className="paystub6-root">
      <div className="paystub6-paper">
        {/* Header */}
        <div className="paystub6-header">
          {/* Company Logo */}
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ marginRight: "16px" }} aria-label="Company SVG Logo" className="paystub-company-svglogo0">
            <circle cx="30" cy="30" r="28" fill="#2563eb" stroke="#1e293b" strokeWidth="2" />
            <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="16" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="bold">LOGO</text>
          </svg>
          <div>
            <div className="paystub6-header-company">{companyInfo.companyName || "Company Name"}</div>
            <div style={{ fontSize: "0.95em", color: "#cbd5e1" }}>{companyFullAddress}</div>
            <div style={{ fontSize: "0.95em", color: "#cbd5e1" }}>
              {companyInfo.companyPhone}{companyInfo.companyPhone && companyInfo.companyEmail ? " | " : ""}{companyInfo.companyEmail}
            </div>
            <div style={{ fontSize: "0.95em", color: "#cbd5e1" }}>{companyInfo.companyEIN && `EIN: ${companyInfo.companyEIN}`}</div>
          </div>



          <div className="">
            <div className="paystub6-header-title">Earnings Statement</div>
            <div className="paystub-header-company-ein0">{payStubNumber && `Stub Number: ${payStubNumber}`}</div>
          </div>


        </div>
        {/* Employee & Pay Info */}
        <div className="paystub6-info-row">
          <div className="paystub6-info-col">
            <table>
              <tbody>
                <tr>
                  <td className="paystub6-label">Employee Name:</td>
                  <td>{employeeFullName}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Employee ID:</td>
                  <td>{employeeInfo.employeeID}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">SSN:</td>
                  <td>{employeeInfo.employeeSSN}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Address:</td>
                  <td>{employeeFullAddress}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Phone:</td>
                  <td>{employeeInfo.employeePhone}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Email:</td>
                  <td>{employeeInfo.employeeEmail}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Filing Status:</td>
                  <td>{employeeInfo.employeeMarriedStatus}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="paystub6-info-col">
            <table>
              <tbody>
                <tr>
                  <td className="paystub6-label">Pay Date:</td>
                  <td>{formatDate(incomeDetails.periodPayDate)}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Check #:</td>
                  <td>{generalInfo.checkNumber}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Pay Period:</td>
                  <td>{payPeriod}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Pay Method:</td>
                  <td>{generalInfo.paymentMethod}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Employment Type:</td>
                  <td>{generalInfo.employmentType}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Pay Frequency:</td>
                  <td>{generalInfo.paymentFrequency}</td>
                </tr>
                <tr>
                  <td className="paystub6-label">Annual Salary:</td>
                  <td>{incomeDetails.annualSalary}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate6;