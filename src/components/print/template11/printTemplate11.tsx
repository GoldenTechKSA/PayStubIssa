import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";
import "./printTemplate11.css";

interface PrintTemplate11Props {
  store: PayStubDetails;
}

const PrintTemplate11: React.FC<PrintTemplate11Props> = ({ store }) => {
  // Helper functions
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "";
    if (typeof date === "string") return date;
    if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
    return String(date);
  };

  // Company Info
  const company = store.companyInfo;
  const companyFullAddress = [company.companyAddress1, company.companyAddress2, company.companyCity, company.companyState, company.companyZipCode].filter(Boolean).join(", ");

  // Employee Info
  const emp = store.employeeInfo;
  const employeeFullName = [emp.employeeFirstName, emp.employeeMiddleInitial, emp.employeeLastName].filter(Boolean).join(" ");

  // Pay Period Info
  const income = store.incomeDetails;
  const general = store.generalInfo;
  const payPeriod = `${formatDate(income.periodStartDate)} - ${formatDate(income.periodEndDate)}`;

  // Earnings, Taxes, Deductions (replace with your actual data structure)
  const earnings = [
    // fallback example
    { description: "Regular Pay", rate: "$32.50", hours: "80.00", amount: "$2,600.00" },
    { description: "Overtime Pay", rate: "$48.75", hours: "5.00", amount: "$243.75" },
    { description: "Bonus", rate: "-", hours: "-", amount: "$500.00" },
  ];
  const earningsTotal = "$3,343.75";
  const ytdEarnings = [
    { label: "Gross Pay", value: "$6,687.50" },
    { label: "Taxable Wages", value: "$6,287.50" },
  ];

  const taxes = [
    { description: "Federal Income Tax", current: "($489.32)", ytd: "($978.64)" },
    { description: "Social Security", current: "($207.31)", ytd: "($414.62)" },
    { description: "Medicare", current: "($48.48)", ytd: "($96.96)" },
    { description: "State Income Tax", current: "($133.75)", ytd: "($267.50)" },
  ];
  const taxesTotal = { current: "($878.86)", ytd: "($1,757.72)" };

  const deductions = [
    { description: "401(k) Contribution", current: "($200.00)", ytd: "($400.00)" },
    { description: "Medical Insurance", current: "($120.50)", ytd: "($241.00)" },
    { description: "Dental Insurance", current: "($25.00)", ytd: "($50.00)" },
  ];
  const deductionsTotal = { current: "($345.50)", ytd: "($691.00)" };

  const netPay = "$2,119.39";

  return (
    <div className="paystub-html-template">
      {/* Header Section */}
      <div className="header">
        <div className="company-info">
          <div className="company-name">{company.companyName}</div>
          <div className="company-address">
            {companyFullAddress}
            <br />
            {company.companyPhone && <>Phone: {company.companyPhone}</>}
          </div>
        </div>
        <div className="paystub-title">Print 11 - PAY STUB</div>
      </div>

      {/* Employee Info Section */}
      <div className="employee-info">
        <div className="employee-column">
          <div className="info-header">EMPLOYEE INFORMATION</div>
          <div className="info-row">
            <div className="info-label">Name:</div>
            <div className="info-value">{employeeFullName}</div>
          </div>
          <div className="info-row">
            <div className="info-label">ID:</div>
            <div className="info-value">{emp.employeeID}</div>
          </div>
          <div className="info-row">
            <div className="info-label">SSN:</div>
            <div className="info-value">{emp.employeeSSN}</div>
          </div>
        </div>
        <div className="employee-column">
          <div className="info-header">PAY PERIOD</div>
          <div className="info-row">
            <div className="info-label">Period:</div>
            <div className="info-value">{payPeriod}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Pay Date:</div>
            <div className="info-value">{formatDate(income.periodPayDate)}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Frequency:</div>
            <div className="info-value">{general.paymentFrequency}</div>
          </div>
        </div>
      </div>

      {/* Two Column Main Content */}
      <div className="main-content">
        {/* Earnings Column */}
        <div className="content-column">
          <table className="pay-table">
            <thead>
              <tr>
                <th colSpan={4}>EARNINGS</th>
              </tr>
              <tr>
                <th>Description</th>
                <th className="align-right">Rate</th>
                <th className="align-right">Hours</th>
                <th className="align-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e, i) => (
                <tr key={i}>
                  <td>{e.description}</td>
                  <td className="align-right">{e.rate}</td>
                  <td className="align-right">{e.hours}</td>
                  <td className="align-right">{e.amount}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={3}>Total Earnings</td>
                <td className="align-right">{earningsTotal}</td>
              </tr>
            </tbody>
          </table>
          <table className="pay-table">
            <thead>
              <tr>
                <th colSpan={2}>YTD EARNINGS</th>
              </tr>
            </thead>
            <tbody>
              {ytdEarnings.map((y, i) => (
                <tr key={i}>
                  <td>{y.label}</td>
                  <td className="align-right">{y.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Taxes/Deductions Column */}
        <div className="content-column">
          <table className="pay-table">
            <thead>
              <tr>
                <th colSpan={3}>TAXES</th>
              </tr>
              <tr>
                <th>Description</th>
                <th className="align-right">Current</th>
                <th className="align-right">YTD</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t, i) => (
                <tr key={i}>
                  <td>{t.description}</td>
                  <td className="align-right">{t.current}</td>
                  <td className="align-right">{t.ytd}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total Taxes</td>
                <td className="align-right">{taxesTotal.current}</td>
                <td className="align-right">{taxesTotal.ytd}</td>
              </tr>
            </tbody>
          </table>
          <table className="pay-table">
            <thead>
              <tr>
                <th colSpan={3}>DEDUCTIONS</th>
              </tr>
              <tr>
                <th>Description</th>
                <th className="align-right">Current</th>
                <th className="align-right">YTD</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((d, i) => (
                <tr key={i}>
                  <td>{d.description}</td>
                  <td className="align-right">{d.current}</td>
                  <td className="align-right">{d.ytd}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>Total Deductions</td>
                <td className="align-right">{deductionsTotal.current}</td>
                <td className="align-right">{deductionsTotal.ytd}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Net Pay Summary */}
      <div className="net-pay">
        <div className="net-pay-label">NET PAY</div>
        <div className="net-pay-amount">{netPay}</div>
      </div>

      {/* Footer */}
      <div className="paystub11-footer">
        <div>
          This pay stub is provided for your records. Please review carefully and report any discrepancies to HR within 10 days.
        </div>
        <div>{company.companyName} - Confidential and Proprietary</div>
      </div>
    </div>
  );
};

export default PrintTemplate11;