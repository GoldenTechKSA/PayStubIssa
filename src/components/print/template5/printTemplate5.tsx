import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
  return String(date);
};

interface PrintTemplate5Props {
  store: PayStubDetails;
}

const PrintTemplate5: React.FC<PrintTemplate5Props> = ({ store }) => {
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
    <div className="paystub5-root">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .paystub5-paper { box-shadow: none !important; border: none !important; }
        }
        .paystub5-root {
          background: #fff7ed;
          min-height: 100vh;
          padding: 2rem 0;
        }
        .paystub5-paper {
          background: #fff;
          max-width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          border: 2px solid #fdba74;
          border-radius: 1rem;
          box-shadow: 0 4px 24px rgba(251,146,60,0.10);
          padding: 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #222;
        }
        .paystub5-banner {
          background: linear-gradient(90deg, #fb923c 60%, #fed7aa 100%);
          border-radius: 1rem 1rem 0 0;
          padding: 1.2rem 2rem 1rem 2rem;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .paystub5-banner-company {
          font-size: 1.3rem;
          font-weight: 700;
        }
        .paystub5-banner-title {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .paystub5-main {
          padding: 2rem 2rem 2rem 2rem;
        }
        .paystub5-info-row {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.2rem;
        }
        .paystub5-info-col {
          flex: 1 1 50%;
        }
        .paystub5-info-col table {
          width: 100%;
          font-size: 0.98em;
        }
        .paystub5-label {
          font-weight: 600;
          color: #fb923c;
          padding-right: 0.5em;
          white-space: nowrap;
        }
        .paystub5-main-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.2rem;
          font-size: 1em;
        }
        .paystub5-main-table th, .paystub5-main-table td {
          border: 1.5px solid #fed7aa;
          padding: 0.35em 0.5em;
          text-align: right;
        }
        .paystub5-main-table th {
          background: #fed7aa;
          color: #b45309;
          font-weight: 600;
        }
        .paystub5-main-table td:first-child, .paystub5-main-table th:first-child {
          text-align: left;
        }
        .paystub5-total-row {
          background: #fff7ed;
          font-weight: 700;
        }
        .paystub5-netpay-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fed7aa;
          border-radius: 0.5rem;
          padding: 0.8em 1em;
          margin-bottom: 1.2rem;
          font-size: 1.1em;
          font-weight: 600;
          color: #b45309;
        }
        .paystub5-netpay-amount {
          margin-left: 0.5em;
          color: #fb923c;
          font-size: 1.15em;
          font-weight: 700;
        }
        .paystub5-footer {
          text-align: center;
          font-size: 0.95em;
          color: #888;
          margin-top: 1.5rem;
        }
      `}</style>
      <div className="text-center mb-3 no-print">
        <button
          onClick={handlePrint}
          className="px-3 py-2 bg-orange-600 text-white border-none rounded cursor-pointer text-[11px] hover:bg-orange-700"
        >
          Print or Save as PDF
        </button>
      </div>
      <div className="paystub5-paper">
        <div className="paystub5-banner">
          <div>
            <div className="paystub5-banner-company">{companyInfo.companyName || "Company Name"}</div>
            <div style={{ fontSize: "0.95em", color: "#fed7aa" }}>{companyFullAddress}</div>
            <div style={{ fontSize: "0.95em", color: "#fed7aa" }}>
              {companyInfo.companyPhone}{companyInfo.companyPhone && companyInfo.companyEmail ? " | " : ""}{companyInfo.companyEmail}
            </div>
            <div style={{ fontSize: "0.95em", color: "#fed7aa" }}>{companyInfo.companyEIN && `EIN: ${companyInfo.companyEIN}`}</div>
          </div>
          <div className="paystub5-banner-title">PAY STUB</div>
        </div>
        <div className="paystub5-main">
          {/* Employee & Pay Info */}
          <div className="paystub5-info-row">
            <div className="paystub5-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub5-label">Employee Name:</td>
                    <td>{employeeFullName}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Employee ID:</td>
                    <td>{employeeInfo.employeeID}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">SSN:</td>
                    <td>{employeeInfo.employeeSSN}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Address:</td>
                    <td>{employeeFullAddress}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Phone:</td>
                    <td>{employeeInfo.employeePhone}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Email:</td>
                    <td>{employeeInfo.employeeEmail}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Filing Status:</td>
                    <td>{employeeInfo.employeeMarriedStatus}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="paystub5-info-col">
              <table>
                <tbody>
                  <tr>
                    <td className="paystub5-label">Pay Date:</td>
                    <td>{formatDate(incomeDetails.periodPayDate)}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Check #:</td>
                    <td>{generalInfo.checkNumber}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Pay Period:</td>
                    <td>{payPeriod}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Pay Type:</td>
                    <td>{generalInfo.paymentType}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Employment Type:</td>
                    <td>{generalInfo.employmentType}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Pay Frequency:</td>
                    <td>{generalInfo.paymentFrequency}</td>
                  </tr>
                  <tr>
                    <td className="paystub5-label">Annual Salary:</td>
                    <td>{incomeDetails.annualSalary}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Table */}
          <table className="paystub5-main-table">
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
              <tr className="paystub5-total-row">
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
          <div className="paystub5-netpay-row">
            <div>
              <span className="paystub5-label">Net Pay (This Period):</span>
              <span className="paystub5-netpay-amount">{netPay}</span>
            </div>
            <div>
              <span className="paystub5-label">Net Pay (YTD):</span>
              <span className="paystub5-netpay-amount">{netPayYTD}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="paystub5-footer">
            <p>This is not a check. For questions about your pay stub, please contact HR.</p>
            <p>{companyInfo.companyName || "Company Name"} - Confidential</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate5;