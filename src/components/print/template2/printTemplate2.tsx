import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";

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
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .paystub2-paper { box-shadow: none !important; border: none !important; }
        }
        .paystub2-root {
          background: #e6f7f7;
          min-height: 100vh;
          padding: 2rem 0;
        }
        .paystub2-paper {
          background: #fff;
          max-width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          border: 2px solid #2ec4b6;
          border-radius: 1rem;
          box-shadow: 0 4px 24px rgba(44,62,80,0.10);
          padding: 2rem 1.5rem 1.5rem 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #222;
          display: flex;
        }
        .paystub2-accent {
          width: 1.2rem;
          background: linear-gradient(180deg, #2ec4b6 60%, #cbf3f0 100%);
          border-radius: 1rem 0 0 1rem;
          margin-right: 1.5rem;
        }
        .paystub2-main {
          flex: 1;
        }
        .paystub2-header {
          border-bottom: 3px solid #2ec4b6;
          padding-bottom: 0.5rem;
          margin-bottom: 1.2rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .paystub2-header-company {
          font-size: 1.3rem;
          font-weight: 700;
          color: #2ec4b6;
        }
        .paystub2-header-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #006d77;
          letter-spacing: 2px;
        }
        .paystub2-info-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.2rem;
        }
        .paystub2-info-col {
          flex: 1 1 50%;
        }
        .paystub2-info-col table {
          width: 100%;
          font-size: 0.98em;
        }
        .paystub2-label {
          font-weight: 600;
          color: #2ec4b6;
          padding-right: 0.5em;
          white-space: nowrap;
        }
        .paystub2-main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.2rem;
          font-size: 1em;
        }
        .paystub2-main-table th, .paystub2-main-table td {
          border: 1.5px solid #cbf3f0;
          padding: 0.35em 0.5em;
          text-align: right;
        }
        .paystub2-main-table th {
          background: #cbf3f0;
          color: #006d77;
          font-weight: 600;
        }
        .paystub2-main-table td:first-child, .paystub2-main-table th:first-child {
          text-align: left;
        }
        .paystub2-total-row {
          background: #e6f7f7;
          font-weight: 700;
        }
        .paystub2-netpay-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #cbf3f0;
          border-radius: 0.5rem;
          padding: 0.8em 1em;
          margin-bottom: 1.2rem;
          font-size: 1.1em;
          font-weight: 600;
          color: #006d77;
        }
        .paystub2-netpay-amount {
          margin-left: 0.5em;
          color: #2ec4b6;
          font-size: 1.15em;
          font-weight: 700;
        }
        .paystub2-footer {
          text-align: center;
          font-size: 0.95em;
          color: #888;
          margin-top: 1.5rem;
        }
      `}</style>
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
            <div className="paystub2-header-title">PAY STUB</div>
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
                    <td className="paystub2-label">Pay Type:</td>
                    <td>{generalInfo.paymentType}</td>
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