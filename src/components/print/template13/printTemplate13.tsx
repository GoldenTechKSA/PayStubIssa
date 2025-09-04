import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";
import "./printTemplate13.css";

// Example data for table rows (replace with real props/data as needed)
const earningsRows = [
  { label: "Regular Pay", hours: 80, rate: 30, amount: 2400 },
  { label: "Overtime", hours: 5, rate: 45, amount: 225 },
];
const taxesRows = [
  { label: "Federal Income Tax", amount: 350 },
  { label: "Social Security", amount: 150 },
  { label: "Medicare", amount: 50 },
];
const deductionsRows = [
  { label: "Health Insurance", amount: 100 },
  { label: "401(k) Contribution", amount: 75 },
];

interface PrintTemplate13Props {
  store: PayStubDetails;
}

const PrintTemplate13: React.FC<PrintTemplate13Props> = ({ store }) => {
  const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;

  // Calculate totals
  const earningsTotal = earningsRows.reduce((sum, row) => sum + row.amount, 0);
  const taxesTotal = taxesRows.reduce((sum, row) => sum + row.amount, 0);
  const deductionsTotal = deductionsRows.reduce((sum, row) => sum + row.amount, 0);
  const netPay = earningsTotal - taxesTotal - deductionsTotal;

  return (
    <div className="paystub13-root">
      {/* Header */}
      <div className="paystub13-header">
        <div className="paystub13-company">
          <h2>{companyInfo.companyName}</h2>
          <div>
            <div>{companyInfo.companyAddress1}{companyInfo.companyAddress2 && `, ${companyInfo.companyAddress2}`}</div>
            <div>
              {companyInfo.companyCity}, {companyInfo.companyState} {companyInfo.companyZipCode}
            </div>
            <div>EIN: {companyInfo.companyEIN}</div>
            <div>Phone: {companyInfo.companyPhone}</div>
            <div>
              <small>{companyInfo.companyEmail}</small>
            </div>
          </div>
        </div>
        <div className="paystub13-title">PAY STUB</div>
      </div>

      {/* Three-Column Info */}
      <div className="paystub13-info-row-3col">
        {/* Employee */}
        <div className="paystub13-info-col-3col">
          <div className="paystub13-info-label">Employee</div>
          <div className="paystub13-info-value">
            {employeeInfo.employeeFirstName} {employeeInfo.employeeMiddleInitial} {employeeInfo.employeeLastName}
          </div>
          <div className="paystub13-info-label">Employee ID</div>
          <div className="paystub13-info-value">{employeeInfo.employeeID}</div>
          <div className="paystub13-info-label">SSN</div>
          <div className="paystub13-info-value">{employeeInfo.employeeSSN}</div>
          <div className="paystub13-info-label">Marital Status</div>
          <div className="paystub13-info-value">{employeeInfo.employeeMarriedStatus}</div>
        </div>
        {/* Address */}
        <div className="paystub13-info-col-3col">
          <div className="paystub13-info-label">Address</div>
          <div className="paystub13-info-value">
            {employeeInfo.employeeAddress1}
            {employeeInfo.employeeAddress2 && `, ${employeeInfo.employeeAddress2}`}
            <br />
            {employeeInfo.employeeCity}, {employeeInfo.employeeState} {employeeInfo.employeeZipCode}
          </div>
          <div className="paystub13-info-label">Phone</div>
          <div className="paystub13-info-value">{employeeInfo.employeePhone}</div>
          <div className="paystub13-info-label">Email</div>
          <div className="paystub13-info-value">{employeeInfo.employeeEmail}</div>
        </div>
        {/* Payment */}
        <div className="paystub13-info-col-3col">
          <div className="paystub13-info-label">Pay Period</div>
          <div className="paystub13-info-value">
            {incomeDetails.periodStartDate.toLocaleDateString()} - {incomeDetails.periodEndDate.toLocaleDateString()}
          </div>
          <div className="paystub13-info-label">Pay Date</div>
          <div className="paystub13-info-value">
            {incomeDetails.periodPayDate.toLocaleDateString()}
          </div>
          <div className="paystub13-info-label">Period Type</div>
          <div className="paystub13-info-value">{incomeDetails.periodType}</div>
          <div className="paystub13-info-label">Annual Salary</div>
          <div className="paystub13-info-value">${incomeDetails.annualSalary.toLocaleString()}</div>
          <div className="paystub13-info-label">Employment Type</div>
          <div className="paystub13-info-value">{generalInfo.employmentType}</div>
          <div className="paystub13-info-label">Payment Method</div>
          <div className="paystub13-info-value">{generalInfo.paymentMethod}</div>
          <div className="paystub13-info-label">Payment Frequency</div>
          <div className="paystub13-info-value">{generalInfo.paymentFrequency}</div>
          <div className="paystub13-info-label">Check Number</div>
          <div className="paystub13-info-value">{generalInfo.checkNumber}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="paystub13-table-section">
        <table className="paystub13-table">
          <thead>
            <tr>
              <th colSpan={4}>EARNINGS</th>
              <th colSpan={2}>TAXES</th>
              <th colSpan={2}>DEDUCTIONS</th>
            </tr>
            <tr>
              <th>Description</th>
              <th>Hours</th>
              <th>Rate</th>
              <th className="paystub13-right">Amount</th>
              <th>Description</th>
              <th className="paystub13-right">Amount</th>
              <th>Description</th>
              <th className="paystub13-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Maximum number of rows among the three sections */}
            {Array.from({
              length: Math.max(
                earningsRows.length,
                taxesRows.length,
                deductionsRows.length
              ),
            }).map((_, idx) => (
              <tr key={idx}>
                {/* Earnings */}
                <td>{earningsRows[idx]?.label || ""}</td>
                <td>{earningsRows[idx]?.hours ?? ""}</td>
                <td>{earningsRows[idx]?.rate ? `$${earningsRows[idx].rate}` : ""}</td>
                <td className="paystub13-right">
                  {earningsRows[idx]?.amount !== undefined
                    ? `$${earningsRows[idx].amount.toFixed(2)}`
                    : ""}
                </td>
                {/* Taxes */}
                <td>{taxesRows[idx]?.label || ""}</td>
                <td className="paystub13-right">
                  {taxesRows[idx]?.amount !== undefined
                    ? `$${taxesRows[idx].amount.toFixed(2)}`
                    : ""}
                </td>
                {/* Deductions */}
                <td>{deductionsRows[idx]?.label || ""}</td>
                <td className="paystub13-right">
                  {deductionsRows[idx]?.amount !== undefined
                    ? `$${deductionsRows[idx].amount.toFixed(2)}`
                    : ""}
                </td>
              </tr>
            ))}
            {/* Subtotals */}
            <tr className="paystub13-subtotal-row">
              <td colSpan={3}>Earnings Total</td>
              <td className="paystub13-right">${earningsTotal.toFixed(2)}</td>
              <td>Taxes Total</td>
              <td className="paystub13-right">${taxesTotal.toFixed(2)}</td>
              <td>Deductions Total</td>
              <td className="paystub13-right">${deductionsTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay Summary */}
      <div className="paystub13-netpay-summary">
        Net Pay: <span style={{ marginLeft: "1.2rem" }}>${netPay.toFixed(2)}</span>
      </div>

      {/* Footer */}
      <div className="paystub13-footer">
        <div className="paystub13-footer-links">
          <a href="https://hrportal.example.com" target="_blank" rel="noopener noreferrer">HR Portal</a>
          <a href="https://faq.example.com" target="_blank" rel="noopener noreferrer">FAQ</a>
          <a href="https://support.example.com" target="_blank" rel="noopener noreferrer">Support</a>
        </div>
        <div className="paystub13-footer-disclaimer">
          This pay stub is a confidential document intended only for the employee named above. If you have questions about your pay, please contact HR. For official use only.
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate13;