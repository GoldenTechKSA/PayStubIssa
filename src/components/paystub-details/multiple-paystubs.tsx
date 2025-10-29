import React from "react";
import { Form, Col, Row, Container, Button } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import store from "../../redux/store";
import "../../index.css";
import { useDispatch } from "react-redux";
import { updateAppSettings } from "../../redux/actions";
import { formatPercentage, formatCurrency } from "../../utils/util";

const MultiplePaystubPreview = () => {
    const state = store.getState();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const templateId = state.appSettings.templateId;

    const devMode = (process.env.NODE_ENV === "production" ? false : true)
    // console.log("store.getState() - State:", state);

    const printPaystub = async () => {
        console.log("Printing paystub with template type:", templateId);
        navigate(`/printTemplate/${templateId}`);
    };

    const onCompanyInfoClick = (e) => {
        e.preventDefault();
        dispatch(updateAppSettings({ nextTabStep: "company" }));
        navigate("/appBody");
    };

    const onEmployeeInfoClick = (e) => {
        e.preventDefault();
        dispatch(updateAppSettings({ nextTabStep: "employee" }));
        navigate("/appBody");
    };

    const onIncomeDetailsClick = (e) => {
        e.preventDefault();
        dispatch(updateAppSettings({ nextTabStep: "income" }));
        navigate("/appBody");
    };

    const onGeneralInfoClick = (e) => {
        e.preventDefault();
        dispatch(updateAppSettings({ nextTabStep: "general" }));
        navigate("/appBody");
    };
    
    const IsHourlyWages = () => {
        return state.incomeDetails.wageType === "Hourly";
    };

    // Helper function to mask EIN
    const maskEIN = (ein) => {
    if (!ein) return '';
    // Remove any non-digit characters
    const digitsOnly = ein.replace(/\D/g, '');
    // Ensure we have at least 2 digits for the prefix
    if (digitsOnly.length < 2) {
        return digitsOnly;
    }
    // Take first 2 digits and mask the rest with 'x'
    const prefix = digitsOnly.substring(0, 2);
    const maskedPart = 'x'.repeat(Math.max(0, digitsOnly.length - 2));
    return `${prefix}-${maskedPart}`;
    };

    // Helper function to mask SSN
    const maskSSN = (ssn) => {
    if (!ssn) return '';
    // Remove any non-digit characters
    const digitsOnly = ssn.replace(/\D/g, '');
    // Ensure we have at least 5 digits to show the last 4
    if (digitsOnly.length < 5) {
        // If we have less than 5 digits, show what we have (though this is unusual)
        return 'XXX-XX-' + digitsOnly;
    }
    
    // Take the last 4 digits and mask the first 5 with 'X'
    const lastFour = digitsOnly.slice(-4);
    return `XXX-XX-${lastFour}`;
    };    


//=========================================================================================================================
// Example implementations – adjust based on your data model

const calculatePeriodStart = (index) => {
  // Example: if base period is 2024-06-01, each stub is 2 weeks apart
  const baseDate = new Date(state.incomeDetails?.periodStartDate || '2024-01-01');
  const periodDays = getDaysPerPeriod(state.generalInfo.paymentFrequency); // e.g., 14 for biweekly
  const newDate = new Date(baseDate);
  newDate.setDate(baseDate.getDate() + index * periodDays);
  return newDate;
};

const calculatePeriodEnd = (index) => {
  const start = calculatePeriodStart(index);
  const periodDays = getDaysPerPeriod(state.generalInfo.paymentFrequency);
  const end = new Date(start);
  end.setDate(start.getDate() + periodDays - 1);
  return end;
};

const calculatePayDate = (index) => {
  const basePayDate = new Date(state.incomeDetails?.periodPayDate || '2024-01-15');
  const periodDays = getDaysPerPeriod(state.generalInfo.paymentFrequency);
  const newDate = new Date(basePayDate);
  newDate.setDate(basePayDate.getDate() + index * periodDays);
  return newDate;
};

const getDaysPerPeriod = (frequency) => {
  switch (frequency?.toLowerCase()) {
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'semimonthly': return 15; // approximate
    case 'monthly': return 30;
    default: return 14;
  }
};

const getPaystubImageUrl = (stubNumber) => {
  // Return URL to generated or stored paystub image
  // e.g., `/api/paystubs/${stubNumber}/preview`
  return `/paystubs/preview/${stubNumber}.png`; // adjust as needed
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Optional: handle paystub selection
const onPaystubSelect = (stubNumber) => {
  console.log('Selected paystub:', stubNumber);
  // Navigate to detail view, open modal, etc.
};//======== PAYSTUB MULTI-CARD VIEW HELPERS =========================================================================================



    return (
        <Container>
            <div className="d-flex flex-column flex-md-row gap-4 p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Left Card: Company Info */}
                <div className="flex-fill border rounded-3 shadow-sm bg-white" style={{ padding: '24px' }}>
                    <table className="company-info-table w-100">
                    <thead>
                        <tr>
                        <th colSpan={2} className="text-start pb-3">
                            <a 
                            className="company-info-link d-inline-block fs-5 fw-semibold text-decoration-none"
                            tabIndex={0} 
                            onClick={e => onCompanyInfoClick(e)} 
                            href="/appBody"
                            style={{ color: '#2563eb' }}
                            >
                            Company Information
                            </a>
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Company Name</strong>
                            {state.companyInfo.companyName}
                        </td>
                        {state.companyInfo.companyEIN && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Company EIN</strong>
                            {maskEIN(state.companyInfo.companyEIN)}
                            </td>
                        )}
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Company Address</strong>
                            {`${state.companyInfo.companyAddress1}${state.companyInfo.companyAddress2 ? `, ${state.companyInfo.companyAddress2}` : ''}`}
                        </td>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">City</strong>
                            {state.companyInfo.companyCity}
                        </td>
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">State</strong>
                            {state.companyInfo.companyState}
                        </td>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Zip code</strong>
                            {state.companyInfo.companyZipCode}
                        </td>
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Company Phone</strong>
                            {state.companyInfo.companyPhone}
                        </td>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Company Email</strong>
                            {state.companyInfo.companyEmail}
                        </td>
                        </tr>
                        {state.companyInfo.companyLogo && (
                        <tr>
                            <td colSpan={2} className="py-2">
                            <strong className="d-block text-muted fw-normal mb-2">Company Logo</strong>
                            <img 
                                src={state.companyInfo.companyLogo} 
                                alt="Company Logo Preview" 
                                style={{ 
                                maxWidth: "120px", 
                                maxHeight: "60px", 
                                borderRadius: "6px", 
                                border: "1px solid #e5e7eb" 
                                }}
                            />
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
                {/* Right Card: Employee Info */}
                <div className="flex-fill border rounded-3 shadow-sm bg-white" style={{ padding: '24px' }}>
                    <table className="employee-info-table w-100">
                    <thead>
                        <tr>
                        <th colSpan={2} className="text-start pb-3">
                            <a 
                            className="company-info-link d-inline-block fs-5 fw-semibold text-decoration-none"
                            tabIndex={0} 
                            onClick={e => onEmployeeInfoClick(e)} 
                            href="/employee-info"
                            style={{ color: '#2563eb' }}
                            >
                            Employee Information
                            </a>
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">First Name</strong>
                            {state.employeeInfo.employeeFirstName}
                        </td>
                        {state.employeeInfo.employeeMiddleInitial && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Middle Initial</strong>
                            {state.employeeInfo.employeeMiddleInitial}
                            </td>
                        )}
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Last Name</strong>
                            {state.employeeInfo.employeeLastName}
                        </td>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Address</strong>
                            {`${state.employeeInfo.employeeAddress1}${state.employeeInfo.employeeAddress2 ? `, ${state.employeeInfo.employeeAddress2}` : ''}`}
                        </td>
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">City</strong>
                            {state.employeeInfo.employeeCity}
                        </td>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">State</strong>
                            {state.employeeInfo.employeeState}
                        </td>
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Zip code</strong>
                            {state.employeeInfo.employeeZipCode}
                        </td>
                        {state.employeeInfo.employeePhone && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Phone Number</strong>
                            {state.employeeInfo.employeePhone}
                            </td>
                        )}
                        </tr>
                        <tr>
                        {state.employeeInfo.employeeSSN && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Employee SSN</strong>
                            {maskSSN(state.employeeInfo.employeeSSN)}
                            </td>
                        )}
                        {state.employeeInfo.employeeEmail && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Employee Email</strong>
                            {state.employeeInfo.employeeEmail}
                            </td>
                        )}
                        </tr>
                        <tr>
                        {state.employeeInfo.employeeID && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Employee ID</strong>
                            {state.employeeInfo.employeeID}
                            </td>
                        )}
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Filing Status</strong>
                            {state.employeeInfo.employeeMarriedStatus}
                        </td>
                        </tr>
                    </tbody>
                    </table>
                </div>
            </div>

            <div className="d-flex flex-column flex-md-row gap-4 p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Left Card: Income Details */}
                <div className="flex-fill border rounded-3 shadow-sm bg-white" style={{ padding: '24px' }}>
                    <table className="income-info-table w-100">
                    <thead>
                        <tr>
                        <th colSpan={2} className="text-start pb-3">
                            <a 
                            className="company-info-link d-inline-block fs-5 fw-semibold text-decoration-none"
                            tabIndex={0} 
                            onClick={e => onIncomeDetailsClick(e)} 
                            href="/income-details"
                            style={{ color: '#2563eb' }}
                            >
                            Income Details
                            </a>
                        </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Earned Wages (Hourly or Salary)</strong>
                            {state.incomeDetails.wageType}
                        </td>
                        {state.incomeDetails.wageType === "Salary" && state.incomeDetails.annualSalary > 0 && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Annual Income Amount $</strong>
                            {formatCurrency(state.incomeDetails.annualSalary)}
                            </td>
                        )}
                        </tr>

                        {IsHourlyWages() && (
                        <>
                            <tr>
                            <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Regular Pay Rate</strong>
                                {formatCurrency(state.incomeDetails.hourlyRate)}
                            </td>
                            <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Regular Pay Hours</strong>
                                {state.incomeDetails.hoursWorked}
                            </td>
                            </tr>
                            <tr>
                            {state.incomeDetails.overtimeRate > 0 && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Overtime Rate</strong>
                                {formatCurrency(state.incomeDetails.overtimeRate)}
                                </td>
                            )}
                            {state.incomeDetails.overtimeHours > 0 && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Overtime Hours</strong>
                                {state.incomeDetails.overtimeHours}
                                </td>
                            )}
                            </tr>
                            <tr>
                            {state.incomeDetails.bonusAmount > 0 && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Bonus Amount</strong>
                                {formatCurrency(state.incomeDetails.bonusAmount)}
                                </td>
                            )}
                            {state.incomeDetails.deduction401k > 0 && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">401k Benefit Rate (%)</strong>
                                {formatPercentage(state.incomeDetails.deduction401k)}
                                </td>
                            )}
                            </tr>
                        </>
                        )}

                        <tr>
                        {state.incomeDetails.medicalDeduction > 0 && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Medical Coverage Amount</strong>
                            {formatCurrency(state.incomeDetails.medicalDeduction)}
                            </td>
                        )}
                        {state.incomeDetails.dentalDeduction > 0 && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Dental Coverage Amount</strong>
                            {formatCurrency(state.incomeDetails.dentalDeduction)}
                            </td>
                        )}
                        </tr>
                        <tr>
                        {state.incomeDetails.visionDeduction > 0 && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Vision Coverage Amount</strong>
                            {formatCurrency(state.incomeDetails.visionDeduction)}
                            </td>
                        )}
                        {state.incomeDetails.otherDeduction > 0 && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Other Deductions</strong>
                            {formatCurrency(state.incomeDetails.otherDeduction)}
                            </td>
                        )}
                        </tr>
                        <tr>
                        {state.incomeDetails.unionDues > 0 && (
                            <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Union Dues Rate (%)</strong>
                            {formatPercentage(state.incomeDetails.unionDues)}
                            </td>
                        )}
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Pay Period Type</strong>
                            {state.incomeDetails.periodType}
                        </td>
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Pay Period Start Date</strong>
                            {state.incomeDetails.periodStartDate}
                        </td>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Pay Period End Date</strong>
                            {state.incomeDetails.periodEndDate}
                        </td>
                        </tr>
                        <tr>
                        <td className="py-2">
                            <strong className="d-block text-muted fw-normal mb-1">Pay Period Date</strong>
                            {state.incomeDetails.periodPayDate}
                        </td>
                        <td></td>
                        </tr>
                    </tbody>
                    </table>
                </div>
                {/* General Info Section */}
                <div className="m-3">
                    {/* Always show General Information table */}
                    <div className="border rounded-3 shadow-sm bg-white p-4 mb-4">
                        <a 
                        className="company-info-link d-inline-block fs-5 fw-semibold text-decoration-none mb-3"
                        tabIndex={0} 
                        onClick={e => onGeneralInfoClick(e)} 
                        href="/general-info"
                        style={{ color: '#2563eb' }}
                        >
                        General Information
                        </a>

                        <table className="general-info-table w-100">
                        <tbody>
                            <tr>
                            {state.generalInfo.employmentType && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Employment Type</strong>
                                {state.generalInfo.employmentType}
                                </td>
                            )}
                            {state.generalInfo.paymentMethod && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Payment Method</strong>
                                {state.generalInfo.paymentMethod}
                                </td>
                            )}
                            </tr>
                            <tr>
                            {state.generalInfo.paymentFrequency && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">How often you get paid?</strong>
                                {state.generalInfo.paymentFrequency}
                                </td>
                            )}
                            {state.generalInfo.payStubCount > 0 && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Number of paystubs requested</strong>
                                {state.generalInfo.payStubCount}
                                </td>
                            )}
                            </tr>
                            <tr>
                            {state.generalInfo.payStubNumber > 0 && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Paystub number or id</strong>
                                {state.generalInfo.payStubNumber}
                                </td>
                            )}
                            {state.generalInfo.checkNumber > 0 && (
                                <td className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Starting check number</strong>
                                {state.generalInfo.checkNumber}
                                </td>
                            )}
                            </tr>
                            {state.generalInfo.extraNotes && (
                            <tr>
                                <td colSpan={2} className="py-2">
                                <strong className="d-block text-muted fw-normal mb-1">Additional notes or reference</strong>
                                {state.generalInfo.extraNotes}
                                </td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>

                    {/* Paystub Cards – only if payStubCount > 1 */}
                    {state.generalInfo.payStubCount > 1 && (
                        <div className="mt-2">
                        <h5 className="mb-3 fw-semibold">Your Paystubs</h5>
                        <p className="text-muted mb-3">
                            Select a paystub to view or manage:
                        </p>
                        <div className="d-flex flex-column flex-md-row flex-wrap gap-4">
                            {Array.from({ length: state.generalInfo.payStubCount }, (_, i) => {
                            const stubNumber = state.generalInfo.payStubNumber + i;
                            const periodStart = calculatePeriodStart(i);
                            const periodEnd = calculatePeriodEnd(i);
                            const payDate = calculatePayDate(i);
                            const imageUrl = getPaystubImageUrl(stubNumber);

                            return (
                                <div 
                                key={stubNumber}
                                className="border rounded-3 shadow-sm bg-white overflow-hidden"
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '320px',
                                    cursor: 'pointer',
                                    transition: 'box-shadow 0.2s, transform 0.2s'
                                }}
                                onClick={() => onPaystubSelect(stubNumber)}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
                                >
                                {/* Paystub Image Preview */}
                                <div className="bg-light d-flex align-items-center justify-content-center p-3" style={{ height: '160px' }}>
                                    {imageUrl ? (
                                    <img 
                                        src={imageUrl} 
                                        alt={`Paystub #${stubNumber}`} 
                                        className="img-fluid"
                                        style={{ 
                                        maxHeight: '100%', 
                                        maxWidth: '100%',
                                        objectFit: 'contain'
                                        }}
                                    />
                                    ) : (
                                    <div className="text-center text-muted">
                                        <svg width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                                        <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5z"/>
                                        </svg>
                                        <div className="mt-2">Paystub #{stubNumber}</div>
                                    </div>
                                    )}
                                </div>

                                {/* Paystub Details */}
                                <div className="p-3">
                                    <h6 className="mb-2 fw-semibold">Paystub #{stubNumber}</h6>
                                    <div className="small text-muted">
                                    <div>Period: {formatDate(periodStart)} – {formatDate(periodEnd)}</div>
                                    <div>Pay Date: {formatDate(payDate)}</div>
                                    {state.generalInfo.checkNumber > 0 && (
                                        <div>Check #: {state.generalInfo.checkNumber + i}</div>
                                    )}
                                    </div>
                                </div>
                                </div>
                            );
                            })}
                        </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Pay Stub Button*/}
            <Button className="float-right mb-4" onClick={printPaystub} type="button">
                Continue to Preview & Payment
            </Button>
        </Container>
    );
};

export default MultiplePaystubPreview;