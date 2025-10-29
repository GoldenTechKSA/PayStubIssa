import React, {useState} from "react";
import { useSelector } from "react-redux";
import { CompanyInfo, EmployeeInfo, IncomeDetails, GeneralInfo, PayStubDetails, } from "../../../assets/data/pay-stub-details";
import { formatCurrency, getWeeksToDateThisYear, formatDate, calculateFederalIncomeTax2025 } from "../../../utils/util";
import { netPayAsStringCurrent, totalEarningsAsStringYTD, totalEarningsAsStringCurrent, grossPayAsString, grossPayAsStringYTD, netPayAsStringYTD } from "../../../utils/earnings-calculator";
import { overtimeAsStringCurrent, overtimeAsStringYTD } from "../../../utils/overtime-calculator";
import { taxesAsString2025, totalTaxesTitle, currentTaxesAsString, taxesAsStringYTD} from "../../../utils/taxes-calculator";
import { medicalDeductionAsStringYTD, dentalDeductionAsStringYTD, deduction401kAsStringYTD, visionDeductionAsStringYTD, otherDeductionAsStringYTD, 
  totalDeductionsTitle, medicalDeductionAsString, dentalDeductionAsString, deduction401kAsString, visionDeductionAsString, otherDeductionAsString, currentDeductionsAsString, deductionsAsStringYTD } from "../../../utils/deductions-calculator";
import { TaxCalculationInput, TaxCalculationResult, FilingStatus } from "../../../types/tax-rate-types";

import "./printTemplate0.css";
import PaystubHeader0 from "./paystub-header0";
import EmployeePayInfo0 from "./employee-pay-info0";
import PaystubFooter0 from "./paystub-footer0";

type Earnings = { description: string; rate: string | number; hours: string | number; current: string | number; ytd: string | number; };
type Deductions = { description: string; current: string | number; ytd: string | number; };
type Taxes = { description: string; current: string | number; ytd: string | number; }; 

interface PrintTemplate0Props {
  canPrintStub: Boolean;
}

const PrintTemplate0: React.FC<PrintTemplate0Props> = ({ canPrintStub } ) => {
  // Destructure store properties using types
  const companyInfo: CompanyInfo = useSelector<PayStubDetails, CompanyInfo>(state => state.companyInfo);   // Company Info
  const employeeInfo: EmployeeInfo = useSelector<PayStubDetails, EmployeeInfo>(state => state.employeeInfo);   // Employee Info
  const incomeDetails: IncomeDetails = useSelector<PayStubDetails, IncomeDetails>(state => state.incomeDetails);   // Income Details
  const generalInfo: GeneralInfo = useSelector<PayStubDetails, GeneralInfo>(state => state.generalInfo);   // General Info

  const {companyName, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode, companyPhone, companyEmail, companyEIN,} = companyInfo;
  const {employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode, employeePhone, employeeEmail, employeeSSN, employeeID, employeeMarriedStatus, } = employeeInfo;
  const {annualSalary, wageType, hourlyRate, hoursWorked, overtimeRate, overtimeHours, bonusAmount, deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction, periodStartDate, periodEndDate, periodPayDate, periodType, } = incomeDetails;
  const {employmentType, paymentMethod, paymentFrequency, payStubNumber, payStubCount, checkNumber, extraNotes} = generalInfo;
  const employeeFullName = [employeeFirstName, employeeMiddleInitial, employeeLastName].filter(Boolean).join(" ");
  const employeeFullAddress = [employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode].filter(Boolean).join(", ");
  const companyFullAddress = [companyAddress1, companyAddress2, companyCity, companyState, companyZipCode].filter(Boolean).join(", ");
  const payPeriod = `${formatDate(periodStartDate)} - ${formatDate(periodEndDate)}`;
  const specialNotes = !!extraNotes;
  const directDeposit = !!paymentMethod;
  const emptyCell = "-";

  console.log("PrintTemplate0 generalInfo:", generalInfo);
  console.log("PrintTemplate0 employeeInfo:", employeeInfo);
  console.log("PrintTemplate0 companyInfo:", companyInfo);
  console.log("PrintTemplate0 incomeDetails:", incomeDetails);

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

  const input: TaxCalculationInput = {
    grossIncome: 100000,
    filingStatus: 'single',
    stateCode: 'WA',
    additionalDeductions: 5000
  };

  const {federalIncomeTaxAsString, socialSecurityTaxAsString, medicareTaxAsString, stateIncomeTaxAsString, federalIncomeTaxAsStringYTD, socialSecurityTaxAsStringYTD, medicareTaxAsStringYTD, stateIncomeTaxAsStringYTD, totalTaxesAsString } = taxesAsString2025(input);

  const taxes: Taxes[] = [
    { description: "Federal Income Tax", current: `${federalIncomeTaxAsString}`, ytd: `${federalIncomeTaxAsStringYTD}` },
    { description: "Social Security Tax", current: `${socialSecurityTaxAsString}`, ytd: `${socialSecurityTaxAsStringYTD}` },
    { description: "Medicare Tax", current: `${medicareTaxAsString}`, ytd: `${medicareTaxAsStringYTD}` },
    { description: "State Income Tax", current: `${stateIncomeTaxAsString}`, ytd: `${stateIncomeTaxAsStringYTD}` }
  ];

  function renderCompanyLogo(companyLogo) {
    // Check if companyLogo is empty (null, undefined, empty string, or falsy)
    if (!companyLogo) {
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ marginRight: "16px" }} aria-label="Company SVG Logo" className="paystub-company-svglogo0">
          <circle cx="30" cy="30" r="28" fill="#2563eb" stroke="#1e293b" strokeWidth="2" />
          <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="16" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="bold">LOGO</text>
        </svg>
      );
    }
    
    // Return the provided company logo (assuming it's a valid JSX element or image URL)
    // If companyLogo is a string (URL), render as <img>
    if (typeof companyLogo === 'string') {
      return ( <img src={companyLogo} alt="Company Logo" style={{ marginRight: "16px" }} width="60" height="60"/> );
    }
    
    // If it's already a JSX element, return it as-is
    return companyLogo;
  }

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
      <div id="pdf-content" className="paystub-print-paper0" style={{ position: "relative" }}>
        {/* Watermark Overlay */}
        {!canPrintStub && ( <div className="paystub-watermark0" style={{display: "grid", gridTemplateRows: "repeat(3, 1fr)", gridTemplateColumns: "repeat(2, 1fr)", gap: "0", pointerEvents: "none" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.58, fontSize: "4rem", color: "#d32f2f", fontWeight: "bold", textAlign: "center", transform: "rotate(-20deg)", userSelect: "none", pointerEvents: "none" }}>
                Draft Paystub
              </div>
            ))}
          </div>
        )}
        {/* Header */}
        <PaystubHeader0 companyInfo={{ companyLogo: companyInfo.companyLogo }} companyName={companyName} companyFullAddress={companyFullAddress}
          companyPhone={companyPhone} companyEmail={companyEmail} companyEIN={companyEIN} payStubNumber={payStubNumber} renderCompanyLogo={renderCompanyLogo}
        />


        {/* Employee & Pay Info */}
        <EmployeePayInfo0 employeeFullName={employeeFullName} employeeID={employeeID} employeeSSN={employeeSSN} employeeFullAddress={employeeFullAddress} employeePhone={employeePhone} employeeEmail={employeeEmail} employeeMarriedStatus={employeeMarriedStatus} 
        periodPayDate={periodPayDate} checkNumber={checkNumber} payPeriod={payPeriod} paymentMethod={paymentMethod} employmentType={employmentType} paymentFrequency={paymentFrequency} annualSalary={annualSalary} formatDate={formatDate}
        />

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
              <th>Amount</th>
              <th>YTD Total</th>

              <th>Description</th>
              <th>Amount</th>
              <th>YTD Total</th>

              <th>Description</th>
              <th>Amount</th>
              <th>YTD Total</th>
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
              <td>{currentTaxesAsString(1, 1, 1, 1)}</td>
              <td>{taxesAsStringYTD(1, 1, 1, 1)}</td>
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
        <PaystubFooter0 companyName={companyName} companyFullAddress={companyFullAddress} specialNotes={true} extraNotes={extraNotes}/>
      </div>
    </div>
  );
};

export default PrintTemplate0;
