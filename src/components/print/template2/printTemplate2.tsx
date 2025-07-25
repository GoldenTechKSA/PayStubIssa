import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";
import "./printTemplate2.css";

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
  return String(date);
};

interface PrintTemplate2Props {
  store: PayStubDetails;
}

const PrintTemplate2: React.FC<PrintTemplate2Props> = ({ store }) => {
  const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
  const companyFullAddress = [companyInfo.companyAddress1, companyInfo.companyAddress2, companyInfo.companyCity, companyInfo.companyState, companyInfo.companyZipCode].filter(Boolean).join(", ");
  const employeeFullName = [employeeInfo.employeeFirstName, employeeInfo.employeeMiddleInitial, employeeInfo.employeeLastName].filter(Boolean).join(" ");
  const employeeFullAddress = [employeeInfo.employeeAddress1, employeeInfo.employeeAddress2, employeeInfo.employeeCity, employeeInfo.employeeState, employeeInfo.employeeZipCode].filter(Boolean).join(", ");
  const payPeriod = `${formatDate(incomeDetails.periodStartDate)} - ${formatDate(incomeDetails.periodEndDate)}`;

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
    <div className="paystub2-root">
      <div className="text-center mb-3 no-print">
        <button
          onClick={handlePrint}
          className="px-3 py-2 bg-teal-600 text-white border-none rounded cursor-pointer text-[11px] hover:bg-teal-700"
        >
          Print or Save as PDF
        </button>
      </div>
      <div className="paystub2-paper">
        <div className="paystub2-accent" />
        <div className="paystub2-main">
          {/* Header */}
          <div className="paystub2-header">
            <div>
              <div className="paystub2-header-company">{companyInfo.companyName || "Company Name"}</div>
              <div style={{ fontSize: "0.95em", color: "#444" }}>{companyFullAddress}</div>
              <div style={{ fontSize: "0.95em", color: "#444" }}>
                {companyInfo.companyPhone}{companyInfo.companyPhone && companyInfo.companyEmail ? " | " : ""}{companyInfo.companyEmail}
              </div>
              <div style={{ fontSize: "0.95em", color: "#444" }}>{companyInfo.companyEIN && `EIN: ${companyInfo.companyEIN}`}</div>
            </div>
            <div className="paystub2-header-title">Print 2 - PAY STUB</div>
          </div>

          {/* Employee & Pay Info */}
          <div className="paystub2-info-row">
            <div className="paystub2-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub2-label">Employee Name:</td>
                    <td>{employeeFullName}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Employee ID:</td>
                    <td>{employeeInfo.employeeID}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">SSN:</td>
                    <td>{employeeInfo.employeeSSN}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Address:</td>
                    <td>{employeeFullAddress}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Phone:</td>
                    <td>{employeeInfo.employeePhone}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Email:</td>
                    <td>{employeeInfo.employeeEmail}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Filing Status:</td>
                    <td>{employeeInfo.employeeMarriedStatus}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="paystub2-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub2-label">Pay Date:</td>
                    <td>{formatDate(incomeDetails.periodPayDate)}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Check #:</td>
                    <td>{generalInfo.checkNumber}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Pay Period:</td>
                    <td>{payPeriod}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Pay Method:</td>
                    <td>{generalInfo.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Employment Type:</td>
                    <td>{generalInfo.employmentType}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Pay Frequency:</td>
                    <td>{generalInfo.paymentFrequency}</td>
                  </tr>
                  <tr>
                    <td className="paystub2-label">Annual Salary:</td>
                    <td>{incomeDetails.annualSalary}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Table */}
          <table className="paystub2-main-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Earnings</th>
                <th>Earnings YTD</th>
                <th>Deductions</th>
                <th>Deductions YTD</th>
                <th>Taxes</th>
                <th>Taxes YTD</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(earnings.length, deductions.length, taxes.length) }).map((_, i) => (
                <tr key={i}>
                  <td>
                    {earnings[i]?.desc || deductions[i]?.desc || taxes[i]?.desc || ""}
                  </td>
                  <td>{earnings[i]?.current || ""}</td>
                  <td>{earnings[i]?.ytd || ""}</td>
                  <td>{deductions[i]?.current || ""}</td>
                  <td>{deductions[i]?.ytd || ""}</td>
                  <td>{taxes[i]?.current || ""}</td>
                  <td>{taxes[i]?.ytd || ""}</td>
                </tr>
              ))}
              <tr className="paystub2-total-row">
                <td>Total</td>
                <td>{earnings.reduce((a, b) => a + parseFloat(b.current.replace(/[^0-9.-]+/g,"")), 0).toLocaleString("en-US", {style:"currency",currency:"USD"})}</td>
                <td>{earnings.reduce((a, b) => a + parseFloat(b.ytd.replace(/[^0-9.-]+/g,"")), 0).toLocaleString("en-US", {style:"currency",currency:"USD"})}</td>
                <td>{deductions.reduce((a, b) => a + parseFloat(b.current.replace(/[^0-9.-]+/g,"")), 0).toLocaleString("en-US", {style:"currency",currency:"USD"})}</td>
                <td>{deductions.reduce((a, b) => a + parseFloat(b.ytd.replace(/[^0-9.-]+/g,"")), 0).toLocaleString("en-US", {style:"currency",currency:"USD"})}</td>
                <td>{taxes.reduce((a, b) => a + parseFloat(b.current.replace(/[^0-9.-]+/g,"")), 0).toLocaleString("en-US", {style:"currency",currency:"USD"})}</td>
                <td>{taxes.reduce((a, b) => a + parseFloat(b.ytd.replace(/[^0-9.-]+/g,"")), 0).toLocaleString("en-US", {style:"currency",currency:"USD"})}</td>
              </tr>
            </tbody>
          </table>

          {/* Net Pay Summary */}
          <div className="paystub2-netpay-row">
            <div>
              <span className="paystub2-label">Net Pay (This Period):</span>
              <span className="paystub2-netpay-amount">{netPay}</span>
            </div>
            <div>
              <span className="paystub2-label">Net Pay (YTD):</span>
              <span className="paystub2-netpay-amount">{netPayYTD}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="paystub2-footer">
            <p>This is not a check. For questions about your pay stub, please contact HR.</p>
            <p>{companyInfo.companyName || "Company Name"} - Confidential</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate2;