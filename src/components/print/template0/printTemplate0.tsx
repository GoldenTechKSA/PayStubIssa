import React, {useState} from "react";
import { CompanyInfo, EmployeeInfo, IncomeDetails, GeneralInfo, PayStubDetails, } from "../../../assets/data/pay-stub-details";
import { formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "../../../utils/util";
import { netPayAsStringCurrent, totalEarningsAsStringYTD, totalEarningsAsStringCurrent, grossPayAsString, grossPayAsStringYTD, netPayAsStringYTD } from "../../../utils/earnings-calculator";
import { overtimeAsStringCurrent, overtimeAsStringYTD } from "../../../utils/overtime-calculator";
import { totalTaxesTitle, currentTaxesAsString, taxesAsStringYTD} from "../../../utils/taxes-calculator";
import { medicalDeductionAsStringYTD, dentalDeductionAsStringYTD, deduction401kAsStringYTD, visionDeductionAsStringYTD, otherDeductionAsStringYTD, 
  totalDeductionsTitle, medicalDeductionAsString, dentalDeductionAsString, deduction401kAsString, visionDeductionAsString, otherDeductionAsString, currentDeductionsAsString, deductionsAsStringYTD } from "../../../utils/deductions-calculator";
import "./printTemplate0.css";

type Earnings = { description: string; rate: string | number; hours: string | number; current: string | number; ytd: string | number; };
type Deductions = { description: string; current: string | number; ytd: string | number; };
type Taxes = { description: string; current: string | number; ytd: string | number; }; 

interface PrintTemplate0Props {
  store: PayStubDetails;
  canPrintStub: Boolean;
}

const PrintTemplate0: React.FC<PrintTemplate0Props> = ({ store, canPrintStub } ) => {
  // Destructure store properties using types
  const companyInfo: CompanyInfo = store.companyInfo;   // Company Info
  const employeeInfo: EmployeeInfo = store.employeeInfo;   // Employee Info
  const incomeDetails: IncomeDetails = store.incomeDetails;   // Income Details
  const generalInfo: GeneralInfo = store.generalInfo;   // General Info

  const {companyName, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode, companyPhone, companyEmail, companyEIN,} = companyInfo;
  const {employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode, employeePhone, employeeEmail, employeeSSN, employeeID, employeeMarriedStatus, } = employeeInfo;
  const {annualSalary, wageType, hourlyRate, hoursWorked, overtimeRate, overtimeHours, bonusAmount, deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction, 
    periodStartDate, periodEndDate, periodPayDate, periodType, } = incomeDetails;
  const {employmentType, paymentMethod, paymentFrequency, payStubNumber, payStubCount, checkNumber, extraNotes} = generalInfo;
  const employeeFullName = [employeeFirstName, employeeMiddleInitial, employeeLastName].filter(Boolean).join(" ");
  const employeeFullAddress = [employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode].filter(Boolean).join(", ");
  const companyFullAddress = [companyAddress1, companyAddress2, companyCity, companyState, companyZipCode].filter(Boolean).join(", ");
  const payPeriod = `${formatDate(periodStartDate)} - ${formatDate(periodEndDate)}`;

  const specialNotes = !!extraNotes;
  const directDeposit = !!paymentMethod;
  const emptyCell = "-";

  const federalTax = 1;
  const stateTax = 1;
  const socialSecurityTax = 1;
  const medicareTax = 1;
  
  const FedIncomeTaxYTD = "NotReady";
  const totalDeductionsCurrent = "CurrentNotReady";
  const totalDeductionsYTD = "YTDNotReady";

  const earnings: Earnings[] = [
    { description: "Regular Pay", rate: `$${hourlyRate}`, hours: `${hoursWorked}`, current: `${grossPayAsString(hourlyRate, hoursWorked)}`, ytd:`${grossPayAsStringYTD(hourlyRate, hoursWorked)}` },
    { description: "Overtime", rate: `$${overtimeRate}`, hours: `${overtimeHours}`, current: `${overtimeAsStringCurrent(overtimeRate, overtimeHours)}`, ytd: `${overtimeAsStringYTD(overtimeRate, overtimeHours)}` },
    { description: "Bonus", rate: " ", hours: " ", current: `$${bonusAmount}`, ytd: `$${bonusAmount}` }
  ];
  const deductions: Deductions[] = [
    { description: "Medical", current:`${medicalDeductionAsString(medicalDeduction as number)}`, ytd: `${medicalDeductionAsStringYTD(medicalDeduction as number)}` },
    { description: "Dental", current: `${dentalDeductionAsString(dentalDeduction as number)}`, ytd: `${dentalDeductionAsStringYTD(dentalDeduction as number)}` },
    { description: "401(k)", current: `${deduction401kAsString(deduction401k as number)}`, ytd: `${deduction401kAsStringYTD(deduction401k as number)}` },
    { description: "Vision", current: `${visionDeductionAsString(visionDeduction as number)}`, ytd: `${visionDeductionAsStringYTD(visionDeduction as number)}` },
    { description: "Other", current:  `${otherDeductionAsString(otherDeduction as number)}`, ytd: `${otherDeductionAsStringYTD(otherDeduction as number)}` }
  ];
  const taxes: Taxes[] = [
    { description: "Federal Income Tax", current: `${FedIncomeTaxYTD}`, ytd: `${FedIncomeTaxYTD}` },
    { description: "Social Security Tax", current: " ", ytd: " " },
    { description: "Medicare Tax", current: " ", ytd: " " },
    { description: "State Income Tax", current: " ", ytd: " " }
  ];

  // Example: Replace this with your actual payment check logic
  const [hasPaid, setHasPaid] = useState(canPrintStub); // false = watermark shown
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="paystub-print-root0">
      <style>
        {`
        @media print {
          body, html, #root, .paystub-print-root0 {
            background: #456799 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100vw !important;
          }
          .no-print {
            display: none !important;
          }
          .paystub-print-paper0 {
            box-shadow: none !important;
            border: none !important;
          }
          .paystub-watermark0 {
            display: block !important;
          }
        }
        .paystub-watermark0 {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.18;
          font-size: 2.5rem;
          color: #d32f2f;
          font-weight: bold;
          text-align: center;
          transform: rotate(-20deg);
          background: none;
          user-select: none;
        }
        `}
      </style>
      <div className="paystub-print-paper0" style={{ position: "relative" }}>
        {/* Watermark Overlay */}
        {!hasPaid && (
          <div className="paystub-watermark0" style={{
            display: "grid",
            gridTemplateRows: "repeat(3, 1fr)",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0",
            pointerEvents: "none"
          }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.58,
                  fontSize: "4rem",
                  color: "#d32f2f",
                  fontWeight: "bold",
                  textAlign: "center",
                  transform: "rotate(-20deg)",
                  userSelect: "none",
                  pointerEvents: "none"
                }}
              >
                Draft Paystub
              </div>
            ))}
          </div>
        )}
        {/* Header */}
        <div className="paystub-header0">
          {/* Company Logo */}
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ marginRight: "16px" }} aria-label="Company SVG Logo" className="paystub-company-svglogo0">
            <circle cx="30" cy="30" r="28" fill="#2563eb" stroke="#1e293b" strokeWidth="2" />
            <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="16" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="bold">LOGO</text>
          </svg>
          <div className="paystub-header-company0">
            <div className="paystub-header-company-name0">{companyName || "Company Name"}</div>
            <div className="paystub-header-company-address0">{companyFullAddress}</div>
            <div className="paystub-header-company-contact0">{companyPhone}{companyPhone && companyEmail ? " | " : ""}{companyEmail}</div>
            <div className="paystub-header-company-ein0">{companyEIN && `EIN: ${companyEIN}`}</div>
          </div>
          <div className="">
            <div className="paystub-header-title0">PAY STUB</div>
            <div className="paystub-header-company-ein0">{payStubNumber && `Paystub ID: ${payStubNumber}`}</div>
          </div>
        </div>

        {/* Employee & Pay Info */}
        <div className="paystub-info-row0">
          <div className="paystub-info-col0">
            <table>
              <tbody>
                <tr>
                  <td className="paystub-label0">Employee Name:</td>
                  <td>{employeeFullName}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Employee ID:</td>
                  <td>{employeeID}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">SSN:</td>
                  <td>{employeeSSN}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Address:</td>
                  <td>{employeeFullAddress}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Phone:</td>
                  <td>{employeePhone}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Email:</td>
                  <td>{employeeEmail}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Filing Status:</td>
                  <td>{employeeMarriedStatus}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="paystub-info-col0">
            <table>
              <tbody>
                <tr>
                  <td className="paystub-label0">Pay Date:</td>
                  <td>{formatDate(periodPayDate)}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Check #:</td>
                  <td>{checkNumber}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Pay Period:</td>
                  <td>{payPeriod}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Pay Method:</td>
                  <td>{paymentMethod}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Employment Type:</td>
                  <td>{employmentType}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Pay Frequency:</td>
                  <td>{paymentFrequency}</td>
                </tr>
                <tr>
                  <td className="paystub-label0">Annual Salary:</td>
                  <td>{annualSalary}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Earnings, Deductions, Taxes Table */}
        <table className="paystub-main-table0">
          <thead>
            <tr>
              <th colSpan={5}>Earnings</th>
              <th colSpan={3}>Deductions</th>
              <th colSpan={3}>Taxes</th>
            </tr>
            <tr>
              <th>Description</th>
              <th>Rate</th>
              <th>Hours</th>
              <th>Current</th>
              <th>YTD</th>

              <th>Description</th>
              <th>Current</th>
              <th>YTD</th>

              <th>Description</th>
              <th>Current</th>
              <th>YTD</th>
            </tr>
          </thead>
          <tbody>
            {/* Maximum rows among all sections */}
            {Array.from({ length: Math.max(earnings.length, deductions.length, taxes.length) }).map((_, i) => (
              <tr key={i}>
                <td>{earnings[i]?.description || deductions[i]?.description || taxes[i]?.description || ""}</td>
                <td>{earnings[i]?.rate || ""}</td>
                <td>{earnings[i]?.hours || ""}</td>
                <td>{earnings[i]?.current || ""}</td>
                <td>{earnings[i]?.ytd || ""}</td>

                <td>{deductions[i]?.description || ""}</td>
                <td>{deductions[i]?.current || ""}</td>
                <td>{deductions[i]?.ytd || ""}</td>

                <td>{taxes[i]?.description || ""}</td>
                <td>{taxes[i]?.current || ""}</td>
                <td>{taxes[i]?.ytd || ""}</td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="paystub-total-row0">
              <td>GROSS PAY</td>
              <td>{emptyCell}</td>
              <td>{emptyCell}</td>
              <td>{totalEarningsAsStringCurrent(hourlyRate, hoursWorked, overtimeRate, overtimeHours, bonusAmount)}</td>
              <td>{totalEarningsAsStringYTD(hourlyRate, hoursWorked, overtimeRate, overtimeHours, bonusAmount)}</td>

              <td>{totalDeductionsTitle}</td>
              <td>{currentDeductionsAsString(deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction)}</td>
              <td>{deductionsAsStringYTD(deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction)}</td>

              <td>{totalTaxesTitle}</td>
              <td>{currentTaxesAsString(federalTax, stateTax, socialSecurityTax, medicareTax)}</td>
              <td>{taxesAsStringYTD(federalTax, stateTax, socialSecurityTax, medicareTax)}</td>
            </tr>
          </tbody>
         </table>

        {/* Net Pay Summary */}
        <div className="paystub-netpay-row0">
          <div>
            <span className="paystub-label0">Net Pay (This Period):</span>
            <span className="paystub-netpay-amount0">{`${netPayAsStringCurrent()}`}</span>
          </div>
          <div>
            <span className="paystub-label0">Net Pay (YTD):</span>
            <span className="paystub-netpay-amount0">{`$${netPayAsStringYTD()}`}</span>
          </div>
          {directDeposit && (<div>
            <span className="paystub-label0">Direct Deposit:</span>
            <span>{paymentMethod}</span>
          </div>)}
        </div>

        {/* Footer */}
        <div className="paystub-footer0 paystub-footer-bottom0">
          <div>This is not a check. For questions about your pay stub, please contact HR.</div>
          <div>{companyName} - Confidential</div>
          <div>{companyFullAddress}</div> 
          {specialNotes && (<div>{extraNotes}</div>)} 
        </div>
      </div>
    </div>
  );
};

export default PrintTemplate0;
