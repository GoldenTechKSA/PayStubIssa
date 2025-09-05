import React from "react";
import { PayStubDetails } from "../../../assets/data/pay-stub-details";
import "./printTemplate5.css";

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
          <div className="paystub5-banner-title">Print 5 - PAY STUB</div>
        </div>
        <div className="paystub5-main">
          {/* Employee & Pay Info */}
          <div className="paystub5-info-row">
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
                    <td className="paystub5-label">Pay Method:</td>
                    <td>{generalInfo.paymentMethod}</td>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate5;