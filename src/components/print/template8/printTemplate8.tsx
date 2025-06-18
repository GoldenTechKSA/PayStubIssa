import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
  return String(date);
};

interface PrintTemplate8Props {
  store: PayStubDetails;
}

const PrintTemplate8: React.FC<PrintTemplate8Props> = ({ store }) => {
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
    <div className="paystub8-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .paystub8-paper { box-shadow: none !important; border: none !important; }
        }
        .paystub8-root {
          background: #fef2f2;
          min-height: 100vh;
          padding: 2rem 0;
        }
        .paystub8-paper {
          background: #fff;
          max-width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          border: 2px solid #ef4444;
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px rgba(239,68,68,0.13);
          padding: 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #222;
        }
        .paystub8-banner {
          background: linear-gradient(90deg, #ef4444 70%, #fca5a5 100%);
          border-radius: 1.5rem 1.5rem 0 0;
          padding: 1.2rem 2rem 1rem 2rem;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .paystub8-banner-company {
          font-size: 1.3rem;
          font-weight: 700;
        }
        .paystub8-banner-title {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .paystub8-main {
          padding: 2rem 2rem 2rem 2rem;
        }
        .paystub8-info-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.2rem;
        }
        .paystub8-info-col {
          flex: 1 1 50%;
        }
        .paystub8-info-col table {
          width: 100%;
          font-size: 0.98em;
        }
        .paystub8-label {
          font-weight: 600;
          color: #ef4444;
          padding-right: 0.5em;
          white-space: nowrap;
        }
        .paystub8-main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.2rem;
          font-size: 1em;
        }
        .paystub8-main-table th, .paystub8-main-table td {
          border: 1.5px solid #fca5a5;
          padding: 0.35em 0.5em;
          text-align: right;
        }
        .paystub8-main-table th {
          background: #fca5a5;
          color: #991b1b;
          font-weight: 600;
        }
        .paystub8-main-table td:first-child, .paystub8-main-table th:first-child {
          text-align: left;
        }
        .paystub8-total-row {
          background: #fef2f2;
          font-weight: 700;
        }
        .paystub8-netpay-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fca5a5;
          border-radius: 0.5rem;
          padding: 0.8em 1em;
          margin-bottom: 1.2rem;
          font-size: 1.1em;
          font-weight: 600;
          color: #991b1b;
        }
        .paystub8-netpay-amount {
          margin-left: 0.5em;
          color: #ef4444;
          font-size: 1.15em;
          font-weight: 700;
        }
        .paystub8-footer {
          text-align: center;
          font-size: 0.95em;
          color: #888;
          margin-top: 1.5rem;
        }
      `}</style>
      <div className="text-center mb-3 no-print">
        <button
          onClick={handlePrint}
          className="px-3 py-2 bg-red-600 text-white border-none rounded cursor-pointer text-[11px] hover:bg-red-700"
        >
          Print or Save as PDF
        </button>
      </div>
      <div className="paystub8-paper">
        <div className="paystub8-banner">
          <div>
            <div className="paystub8-banner-company">{companyInfo.companyName || "Company Name"}</div>
            <div style={{ fontSize: "0.95em", color: "#fca5a5" }}>{companyFullAddress}</div>
            <div style={{ fontSize: "0.95em", color: "#fca5a5" }}>
              {companyInfo.companyPhone}{companyInfo.companyPhone && companyInfo.companyEmail ? " | " : ""}{companyInfo.companyEmail}
            </div>
            <div style={{ fontSize: "0.95em", color: "#fca5a5" }}>{companyInfo.companyEIN && `EIN: ${companyInfo.companyEIN}`}</div>
          </div>
          <div className="paystub8-banner-title">PAY STUB</div>
        </div>
        <div className="paystub8-main">
          {/* Employee & Pay Info */}
          <div className="paystub8-info-row">
            <div className="paystub8-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub8-label">Employee Name:</td>
                    <td>{employeeFullName}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Employee ID:</td>
                    <td>{employeeInfo.employeeID}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">SSN:</td>
                    <td>{employeeInfo.employeeSSN}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Address:</td>
                    <td>{employeeFullAddress}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Phone:</td>
                    <td>{employeeInfo.employeePhone}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Email:</td>
                    <td>{employeeInfo.employeeEmail}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Filing Status:</td>
                    <td>{employeeInfo.employeeMarriedStatus}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="paystub8-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub8-label">Pay Date:</td>
                    <td>{formatDate(incomeDetails.periodPayDate)}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Check #:</td>
                    <td>{generalInfo.checkNumber}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Pay Period:</td>
                    <td>{payPeriod}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Pay Type:</td>
                    <td>{generalInfo.paymentType}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Employment Type:</td>
                    <td>{generalInfo.employmentType}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Pay Frequency:</td>
                    <td>{generalInfo.paymentFrequency}</td>
                  </tr>
                  <tr>
                    <td className="paystub8-label">Annual Salary:</td>
                    <td>{incomeDetails.annualSalary}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Main Table */}
          <table className="paystub8-main-table">
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
              <tr className="paystub8-total-row">
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
          <div className="paystub8-netpay-row">
            <div>
              <span className="paystub8-label">Net Pay (This Period):</span>
              <span className="paystub8-netpay-amount">{netPay}</span>
            </div>
            <div>
              <span className="paystub8-label">Net Pay (YTD):</span>
              <span className="paystub8-netpay-amount">{netPayYTD}</span>
            </div>
          </div>
          {/* Footer */}
          <div className="paystub8-footer">
            <p>This is not a check. For questions about your pay stub, please contact HR.</p>
            <p>{companyInfo.companyName || "Company Name"} - Confidential</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate8;