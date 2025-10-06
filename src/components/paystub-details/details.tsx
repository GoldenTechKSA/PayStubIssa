import React from "react";
import { Form, Col, Row, Container, Button } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import store from "../../redux/store";
import "../../index.css";
import { useDispatch } from "react-redux";
import { updateAppSettings } from "../../redux/actions";
import { formatPercentage, formatCurrency } from "../../utils/util";

const PaystubPreview = () => {
    const state = store.getState();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const templateId = state.appSettings.templateId;

    const devMode = (process.env.NODE_ENV === "production" ? false : true)
    console.log("store.getState() - State:", state);

    const printPaystub = async () => {
        console.log("Printing paystub with template type:", templateId);
        navigate(`/printTemplate/${templateId}`);
    };

    const customizeMultiplePaystub = async () => {
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

    return (
        <Container>
            <p className="text-info mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem", fontWeight: 500, background: "#f8f9fa", borderRadius: "0.5rem", padding: "1rem 1.5rem", border: "1px solid #d1e7fd", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                Please review all the information below. If everything is correct, click <strong>Continue to Preview & Payment</strong> to see your paystub before finalizing.
            </p>
            {/* Left Card: Company Info, Right Card: Employee Info */}
            <div className="d-flex flex-column flex-md-row gap-4 p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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

            {/* Left Card: Income Details, Right Card: General Information */}
            <div className="d-flex flex-column flex-md-row gap-4 p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                <div className="flex-fill border rounded-3 shadow-sm bg-white" style={{ padding: '24px' }}>
                    <table className="general-info-table w-100">
                    <thead>
                        <tr>
                        <th colSpan={2} className="text-start pb-3">
                            <a 
                            className="company-info-link d-inline-block fs-5 fw-semibold text-decoration-none"
                            tabIndex={0} 
                            onClick={e => onGeneralInfoClick(e)} 
                            href="/general-info"
                            style={{ color: '#2563eb' }}
                            >
                            General Information
                            </a>
                        </th>
                        </tr>
                    </thead>
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
            </div>

            <div className="m-3">
                {/* Paystub Cards – only if payStubCount > 1 */}
                {state.generalInfo.payStubCount > 1 && (
                    <div className="mt-2">
                        <h5 className="mb-3 fw-semibold">Your Paystubs</h5>
                        <Button className="mb-4" onClick={customizeMultiplePaystub} type="button">
                            Customize your Paystub Templates
                        </Button>
                    </div>
                )}
            </div>
            <p className="mb-4" style={{fontSize: "1.1rem", color: "#444", background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: "0.5rem", padding: "1rem 1.5rem", marginTop: "1.5rem"}}>
                <strong>Note:</strong> Clicking <strong>Continue to Preview & Payment</strong> will show you a sample paystub with some details hidden or omitted. After you complete your payment, the page will update to display the full paystub template you selected, including all your entered details.
            </p>

            {/* Print Pay Stub Button*/}
            <Button className="float-right mb-4" onClick={printPaystub} type="button">
                Continue to Preview & Payment
            </Button>
        </Container>
    );
};

export default PaystubPreview;