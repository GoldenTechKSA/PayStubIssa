import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
  return String(date);
};

interface PrintTemplate9Props {
  store: PayStubDetails;
}

const PrintTemplate9: React.FC<PrintTemplate9Props> = ({ store }) => {
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
    <div className="paystub9-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .paystub9-paper { box-shadow: none !important; border: none !important; }
        }
        .paystub9-root {
          background: #f3f4f6;
          min-height: 100vh;
          padding: 2rem 0;
        }
        .paystub9-paper {
          background: #fff;
          max-width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          border: 2px solid #64748b;
          border-radius: 1.5rem;
          box-shadow: 0 8px 32px rgba(100,116,139,0.10);
          padding: 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #222;
          display: flex;
        }
        .paystub9-ribbon {
          background: linear-gradient(180deg, #64748b 80%, #e0e7ef 100%);
          border-radius: 1.5rem 0 0 1.5rem;
          width: 1.2in;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2rem 0.5rem 1rem 0.5rem;
          color: #fff;
        }
        .paystub9-ribbon-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 2rem;
          letter-spacing: 1px;
        }
        .paystub9-main {
          flex: 1;
          padding: 2rem 2rem 2rem 2rem;
        }
        .paystub9-header {
          border-bottom: 2px solid #64748b;
          padding-bottom: 0.5rem;
          margin-bottom: 1.2rem;
          color: #64748b;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .paystub9-info-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.2rem;
        }
        .paystub9-info-col {
          flex: 1 1 50%;
        }
        .paystub9-info-col table {
          width: 100%;
          font-size: 0.98em;
        }
        .paystub9-label {
          font-weight: 600;
          color: #64748b;
          padding-right: 0.5em;
          white-space: nowrap;
        }
        .paystub9-main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.2rem;
          font-size: 1em;
        }
        .paystub9-main-table th, .paystub9-main-table td {
          border: 1.5px solid #e0e7ef;
          padding: 0.35em 0.5em;
          text-align: right;
        }
        .paystub9-main-table th {
          background: #e0e7ef;
          color: #334155;
          font-weight: 600;
        }
        .paystub9-main-table td:first-child, .paystub9-main-table th:first-child {
          text-align: left;
        }
        .paystub9-total-row {
          background: #f3f4f6;
          font-weight: 700;
        }
        .paystub9-netpay-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #e0e7ef;
          border-radius: 0.5rem;
          padding: 0.8em 1em;
          margin-bottom: 1.2rem;
          font-size: 1.1em;
          font-weight: 600;
          color: #334155;
        }
        .paystub9-netpay-amount {
          margin-left: 0.5em;
          color: #64748b;
          font-size: 1.15em;
          font-weight: 700;
        }
        .paystub9-footer {
          text-align: center;
          font-size: 0.95em;
          color: #888;
          margin-top: 1.5rem;
        }
      `}</style>
      <div className="text-center mb-3 no-print">
        <button
          onClick={handlePrint}
          className="px-3 py-2 bg-gray-700 text-white border-none rounded cursor-pointer text-[11px] hover:bg-gray-900"
        >
          Print or Save as PDF
        </button>
      </div>
      <div className="paystub9-paper">
        <div className="paystub9-ribbon">
          <div className="paystub9-ribbon-title">PayStub</div>
          <div style={{ fontSize: "0.95em", marginBottom: "0.5em" }}>{companyInfo.companyName || "Company Name"}</div>
          <div style={{ fontSize: "0.85em", marginBottom: "0.5em" }}>{companyFullAddress}</div>
          <div style={{ fontSize: "0.85em" }}>{companyInfo.companyEIN && `EIN: ${companyInfo.companyEIN}`}</div>
        </div>
        <div className="paystub9-main">
          {/* Header */}
          <div className="paystub9-header">PAY STUB</div>
          {/* Employee & Pay Info */}
          <div className="paystub9-info-row">
            <div className="paystub9-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub9-label">Employee Name:</td>
                    <td>{employeeFullName}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Employee ID:</td>
                    <td>{employeeInfo.employeeID}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">SSN:</td>
                    <td>{employeeInfo.employeeSSN}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Address:</td>
                    <td>{employeeFullAddress}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Phone:</td>
                    <td>{employeeInfo.employeePhone}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Email:</td>
                    <td>{employeeInfo.employeeEmail}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Filing Status:</td>
                    <td>{employeeInfo.employeeMarriedStatus}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="paystub9-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub9-label">Pay Date:</td>
                    <td>{formatDate(incomeDetails.periodPayDate)}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Check #:</td>
                    <td>{generalInfo.checkNumber}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Pay Period:</td>
                    <td>{payPeriod}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Pay Type:</td>
                    <td>{generalInfo.paymentType}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Employment Type:</td>
                    <td>{generalInfo.employmentType}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Pay Frequency:</td>
                    <td>{generalInfo.paymentFrequency}</td>
                  </tr>
                  <tr>
                    <td className="paystub9-label">Annual Salary:</td>
                    <td>{incomeDetails.annualSalary}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* Main Table */}
          <table className="paystub9-main-table">
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
              <tr className="paystub9-total-row">
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
          <div className="paystub9-netpay-row">
            <div>
              <span className="paystub9-label">Net Pay (This Period):</span>
              <span className="paystub9-netpay-amount">{netPay}</span>
            </div>
            <div>
              <span className="paystub9-label">Net Pay (YTD):</span>
              <span className="paystub9-netpay-amount">{netPayYTD}</span>
            </div>
          </div>
          {/* Footer */}
          <div className="paystub9-footer">
            <p>This is not a check. For questions about your pay stub, please contact HR.</p>
            <p>{companyInfo.companyName || "Company Name"} - Confidential</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate9;