import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";
import "./printTemplate12.css";
import store from "../../../redux/store";

interface PrintTemplate12Props {
  canPrintStub?: boolean;
}

const PrintTemplate12: React.FC<PrintTemplate12Props> = () => {
  // Helper functions
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "";
    if (typeof date === "string") return date;
    if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
    return String(date);
  };

  // Company Info
  const company = store.getState().companyInfo;
  const companyFullAddress = [company.companyAddress1, company.companyAddress2, company.companyCity, company.companyState, company.companyZipCode,].filter(Boolean).join(", ");

  // Employee Info
  const emp = store.getState().employeeInfo;
  const employeeFullName = [emp.employeeFirstName, emp.employeeMiddleInitial, emp.employeeLastName].filter(Boolean).join(" ");

  // Pay Period Info
  const income = store.getState().incomeDetails;
  const general = store.getState().generalInfo;
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
    <div className="paystub">
        {/* Header Section */}
        <div className="header">
            <div className="company-info">
                <div className="company-name">ACME CORPORATION</div>
                <div className="company-address">
                    123 Business Parkway, Suite 100<br />
                    Anytown, ST 12345<br />
                    Phone: (555) 123-4567
                </div>
            </div>
            <div className="paystub-title">PAY STUB</div>
        </div>

        {/* Employee Info Section */}
        <div className="employee-info">
            <div className="employee-column">
                <div className="info-header">EMPLOYEE INFORMATION</div>
                <div className="info-row">
                    <div className="info-label">Name:</div>
                    <div className="info-value">John A. Smith</div>
                </div>
                <div className="info-row">
                    <div className="info-label">ID:</div>
                    <div className="info-value">EMP-20489</div>
                </div>
                <div className="info-row">
                    <div className="info-label">SSN:</div>
                    <div className="info-value">•••-••-1234</div>
                </div>
            </div>
            <div className="employee-column">
                <div className="info-header">PAY PERIOD</div>
                <div className="info-row">
                    <div className="info-label">Period:</div>
                    <div className="info-value">01/01/2023 - 01/15/2023</div>
                </div>
                <div className="info-row">
                    <div className="info-label">Pay Date:</div>
                    <div className="info-value">01/20/2023</div>
                </div>
                <div className="info-row">
                    <div className="info-label">Frequency:</div>
                    <div className="info-value">Bi-Weekly</div>
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
                        <tr>
                            <td>Regular Pay</td>
                            <td className="align-right">$32.50</td>
                            <td className="align-right">80.00</td>
                            <td className="align-right">$2,600.00</td>
                        </tr>
                        <tr>
                            <td>Overtime Pay</td>
                            <td className="align-right">$48.75</td>
                            <td className="align-right">5.00</td>
                            <td className="align-right">$243.75</td>
                        </tr>
                        <tr>
                            <td>Bonus</td>
                            <td className="align-right">-</td>
                            <td className="align-right">-</td>
                            <td className="align-right">$500.00</td>
                        </tr>
                        <tr className="total-row">
                            <td colSpan={3}>Total Earnings</td>
                            <td className="align-right">$3,343.75</td>
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
                        <tr>
                            <td>Gross Pay</td>
                            <td className="align-right">$6,687.50</td>
                        </tr>
                        <tr>
                            <td>Taxable Wages</td>
                            <td className="align-right">$6,287.50</td>
                        </tr>
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
                        <tr>
                            <td>Federal Income Tax</td>
                            <td className="align-right">($489.32)</td>
                            <td className="align-right">($978.64)</td>
                        </tr>
                        <tr>
                            <td>Social Security</td>
                            <td className="align-right">($207.31)</td>
                            <td className="align-right">($414.62)</td>
                        </tr>
                        <tr>
                            <td>Medicare</td>
                            <td className="align-right">($48.48)</td>
                            <td className="align-right">($96.96)</td>
                        </tr>
                        <tr>
                            <td>State Income Tax</td>
                            <td className="align-right">($133.75)</td>
                            <td className="align-right">($267.50)</td>
                        </tr>
                        <tr className="total-row">
                            <td>Total Taxes</td>
                            <td className="align-right">($878.86)</td>
                            <td className="align-right">($1,757.72)</td>
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
                        <tr>
                            <td>401(k) Contribution</td>
                            <td className="align-right">($200.00)</td>
                            <td className="align-right">($400.00)</td>
                        </tr>
                        <tr>
                            <td>Medical Insurance</td>
                            <td className="align-right">($120.50)</td>
                            <td className="align-right">($241.00)</td>
                        </tr>
                        <tr>
                            <td>Dental Insurance</td>
                            <td className="align-right">($25.00)</td>
                            <td className="align-right">($50.00)</td>
                        </tr>
                        <tr className="total-row">
                            <td>Total Deductions</td>
                            <td className="align-right">($345.50)</td>
                            <td className="align-right">($691.00)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        {/* Net Pay Summary */}
        <div className="net-pay">
            <div className="net-pay-label">NET PAY</div>
            <div className="net-pay-amount">$2,119.39</div>
        </div>

        {/* Footer */}
        <div className="paystub12-footer">
            <div>This pay stub is provided for your records. Please review carefully and report any discrepancies to HR within 10 days.</div>
            <div className="paystub12-footer-links">
                <a href="#">HR Portal</a> | 
                <a href="#">Payroll FAQ</a> | 
                <a href="#">Contact HR</a>
            </div>
            <div>ACME Corporation - Confidential and Proprietary</div>
        </div>
    </div>
  );
};

export default PrintTemplate12;