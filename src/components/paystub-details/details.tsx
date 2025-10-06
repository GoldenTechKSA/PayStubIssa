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
            {/* Company Info */}
            <table className="company-info-table m-3">
            <thead>
                <tr>
                <th colSpan={2} className="text-start py-3">
                    <a 
                    className="company-info-link" 
                    tabIndex={0} 
                    onClick={e => onCompanyInfoClick(e)} 
                    href="/appBody"
                    >
                    Company Information
                    </a>
                </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td>
                    <strong>Company Name</strong><br />
                    {state.companyInfo.companyName}
                </td>
                {state.companyInfo.companyEIN && (
                    <td>
                    <strong>Company EIN</strong><br />
                    {maskEIN(state.companyInfo.companyEIN)}
                    </td>
                )}
                </tr>
                <tr>
                <td>
                    <strong>Company Address</strong><br />
                    {`${state.companyInfo.companyAddress1}${state.companyInfo.companyAddress2 ? `, ${state.companyInfo.companyAddress2}` : ''}`}
                </td>
                <td>
                    <strong>City</strong><br />
                    {state.companyInfo.companyCity}
                </td>
                </tr>
                <tr>
                <td>
                    <strong>State</strong><br />
                    {state.companyInfo.companyState}
                </td>
                <td>
                    <strong>Zip code</strong><br />
                    {state.companyInfo.companyZipCode}
                </td>
                </tr>
                <tr>
                <td>
                    <strong>Company Phone</strong><br />
                    {state.companyInfo.companyPhone}
                </td>
                <td>
                    <strong>Company Email</strong><br />
                    {state.companyInfo.companyEmail}
                </td>
                </tr>
                {state.companyInfo.companyLogo && (
                <tr>
                    <td colSpan={2}>
                    <strong>Company Logo</strong><br />
                    <div className="mt-2">
                        <img 
                        src={state.companyInfo.companyLogo} 
                        alt="Company Logo Preview" 
                        style={{ 
                            maxWidth: "120px", 
                            maxHeight: "60px", 
                            borderRadius: "6px", 
                            border: "1px solid #eee" 
                        }}
                        />
                    </div>
                    </td>
                </tr>
                )}
            </tbody>
            </table>

            {/* Employee Info */}
            <table className="employee-info-table m-3">
            <thead>
                <tr>
                <th colSpan={2} className="text-start py-3">
                    <a 
                    className="company-info-link" 
                    tabIndex={0} 
                    onClick={e => onEmployeeInfoClick(e)} 
                    href="/employee-info"
                    >
                    Employee Information
                    </a>
                </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td>
                    <strong>First Name</strong><br />
                    {state.employeeInfo.employeeFirstName}
                </td>
                {state.employeeInfo.employeeMiddleInitial && (
                    <td>
                    <strong>Middle Initial</strong><br />
                    {state.employeeInfo.employeeMiddleInitial}
                    </td>
                )}
                </tr>
                <tr>
                <td>
                    <strong>Last Name</strong><br />
                    {state.employeeInfo.employeeLastName}
                </td>
                <td>
                    <strong>Address</strong><br />
                    {`${state.employeeInfo.employeeAddress1}${state.employeeInfo.employeeAddress2 ? `, ${state.employeeInfo.employeeAddress2}` : ''}`}
                </td>
                </tr>
                <tr>
                <td>
                    <strong>City</strong><br />
                    {state.employeeInfo.employeeCity}
                </td>
                <td>
                    <strong>State</strong><br />
                    {state.employeeInfo.employeeState}
                </td>
                </tr>
                <tr>
                <td>
                    <strong>Zip code</strong><br />
                    {state.employeeInfo.employeeZipCode}
                </td>
                {state.employeeInfo.employeePhone && (
                    <td>
                    <strong>Phone Number</strong><br />
                    {state.employeeInfo.employeePhone}
                    </td>
                )}
                </tr>
                <tr>
                {state.employeeInfo.employeeSSN && (
                    <td>
                    <strong>Employee SSN</strong><br />
                    {maskSSN(state.employeeInfo.employeeSSN)}
                    </td>
                )}
                {state.employeeInfo.employeeEmail && (
                    <td>
                    <strong>Employee Email</strong><br />
                    {state.employeeInfo.employeeEmail}
                    </td>
                )}
                </tr>
                <tr>
                {state.employeeInfo.employeeID && (
                    <td>
                    <strong>Employee ID</strong><br />
                    {state.employeeInfo.employeeID}
                    </td>
                )}
                <td>
                    <strong>Filing Status</strong><br />
                    {state.employeeInfo.employeeMarriedStatus}
                </td>
                </tr>
            </tbody>
            </table>
            {/* Income Info */}
            <table className="income-info-table m-3">
            <thead>
                <tr>
                <th colSpan={2} className="text-start py-3">
                    <a 
                    className="company-info-link" 
                    tabIndex={0} 
                    onClick={e => onIncomeDetailsClick(e)} 
                    href="/income-details"
                    >
                    Income Details
                    </a>
                </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td>
                    <strong>Earned Wages (Hourly or Salary)</strong><br />
                    {state.incomeDetails.wageType}
                </td>
                {state.incomeDetails.wageType === "Salary" && state.incomeDetails.annualSalary > 0 && (
                    <td>
                    <strong>Annual Income Amount $</strong><br />
                    {formatCurrency(state.incomeDetails.annualSalary)}
                    </td>
                )}
                </tr>

                {IsHourlyWages() && (
                <>
                    <tr>
                    <td>
                        <strong>Regular Pay Rate</strong><br />
                        {formatCurrency(state.incomeDetails.hourlyRate)}
                    </td>
                    <td>
                        <strong>Regular Pay Hours</strong><br />
                        {state.incomeDetails.hoursWorked}
                    </td>
                    </tr>
                    <tr>
                    {state.incomeDetails.overtimeRate > 0 && (
                        <td>
                        <strong>Overtime Rate</strong><br />
                        {formatCurrency(state.incomeDetails.overtimeRate)}
                        </td>
                    )}
                    {state.incomeDetails.overtimeHours > 0 && (
                        <td>
                        <strong>Overtime Hours</strong><br />
                        {state.incomeDetails.overtimeHours}
                        </td>
                    )}
                    </tr>
                    <tr>
                    {state.incomeDetails.bonusAmount > 0 && (
                        <td>
                        <strong>Bonus Amount</strong><br />
                        {formatCurrency(state.incomeDetails.bonusAmount)}
                        </td>
                    )}
                    {state.incomeDetails.deduction401k > 0 && (
                        <td>
                        <strong>401k Benefit Rate (%)</strong><br />
                        {formatPercentage(state.incomeDetails.deduction401k)}
                        </td>
                    )}
                    </tr>
                </>
                )}

                <tr>
                {state.incomeDetails.medicalDeduction > 0 && (
                    <td>
                    <strong>Medical Coverage Amount</strong><br />
                    {formatCurrency(state.incomeDetails.medicalDeduction)}
                    </td>
                )}
                {state.incomeDetails.dentalDeduction > 0 && (
                    <td>
                    <strong>Dental Coverage Amount</strong><br />
                    {formatCurrency(state.incomeDetails.dentalDeduction)}
                    </td>
                )}
                </tr>
                <tr>
                {state.incomeDetails.visionDeduction > 0 && (
                    <td>
                    <strong>Vision Coverage Amount</strong><br />
                    {formatCurrency(state.incomeDetails.visionDeduction)}
                    </td>
                )}
                {state.incomeDetails.otherDeduction > 0 && (
                    <td>
                    <strong>Other Deductions</strong><br />
                    {formatCurrency(state.incomeDetails.otherDeduction)}
                    </td>
                )}
                </tr>
                <tr>
                {state.incomeDetails.unionDues > 0 && (
                    <td>
                    <strong>Union Dues Rate (%)</strong><br />
                    {formatPercentage(state.incomeDetails.unionDues)}
                    </td>
                )}
                <td>
                    <strong>Pay Period Type</strong><br />
                    {state.incomeDetails.periodType}
                </td>
                </tr>
                <tr>
                <td>
                    <strong>Pay Period Start Date</strong><br />
                    {state.incomeDetails.periodStartDate}
                </td>
                <td>
                    <strong>Pay Period End Date</strong><br />
                    {state.incomeDetails.periodEndDate}
                </td>
                </tr>
                <tr>
                <td>
                    <strong>Pay Period Date</strong><br />
                    {state.incomeDetails.periodPayDate}
                </td>
                <td></td> {/* Placeholder to maintain 2-column structure */}
                </tr>
            </tbody>
            </table>
            {/* General Info */}
            <table className="general-info-table m-3">
            <thead>
                <tr>
                <th colSpan={2} className="text-start py-3">
                    <a 
                    className="company-info-link" 
                    tabIndex={0} 
                    onClick={e => onGeneralInfoClick(e)} 
                    href="/general-info"
                    >
                    General Information
                    </a>
                </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                {state.generalInfo.employmentType && (
                    <td>
                    <strong>Employment Type</strong><br />
                    {state.generalInfo.employmentType}
                    </td>
                )}
                {state.generalInfo.paymentMethod && (
                    <td>
                    <strong>Payment Method</strong><br />
                    {state.generalInfo.paymentMethod}
                    </td>
                )}
                </tr>
                <tr>
                {state.generalInfo.paymentFrequency && (
                    <td>
                    <strong>How often you get paid?</strong><br />
                    {state.generalInfo.paymentFrequency}
                    </td>
                )}
                {state.generalInfo.payStubCount > 0 && (
                    <td>
                    <strong>Number of paystubs requested</strong><br />
                    {state.generalInfo.payStubCount}
                    </td>
                )}
                </tr>
                <tr>
                {state.generalInfo.payStubNumber > 0 && (
                    <td>
                    <strong>Paystub number or id</strong><br />
                    {state.generalInfo.payStubNumber}
                    </td>
                )}
                {state.generalInfo.checkNumber > 0 && (
                    <td>
                    <strong>Starting check number</strong><br />
                    {state.generalInfo.checkNumber}
                    </td>
                )}
                </tr>
                {state.generalInfo.extraNotes && (
                <tr>
                    <td colSpan={2}>
                    <strong>Additional notes or reference</strong><br />
                    {state.generalInfo.extraNotes}
                    </td>
                </tr>
                )}
            </tbody>
            </table>            
            <p className="mb-4" style={{fontSize: "1.1rem", color: "#444", background: "#fff3cd", border: "1px solid #ffeeba", borderRadius: "0.5rem", padding: "1rem 1.5rem", marginTop: "1.5rem"}}>
                <strong>Note:</strong> Clicking <strong>Continue to Preview & Payment</strong> will show you a sample paystub with some details hidden or omitted. After you complete your payment, the page will update to display the full paystub template you selected, including all your entered details.
            </p>
{ devMode && (
            <table>
            <tbody>
{/* ============================================================================================================================================================== */}
                <tr>
                <td>            <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 0}));
                                navigate("/printTemplate/0");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate0
                        </a>
            </td>
                <td>            <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 1}));
                                navigate("/printTemplate/1");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate1
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 2}));
                                navigate("/printTemplate/2");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate2
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 3}));
                                navigate("/printTemplate/3");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate3
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 4}));
                                navigate("/printTemplate/4");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate4
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 5}));
                                navigate("/printTemplate/5");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate5
                        </a>
            </td>
                </tr>
{/* ============================================================================================================================================================== */}
                <tr>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 6}));
                                navigate("/printTemplate/6");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate6
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 7}));
                                navigate("/printTemplate/7");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate7
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 8}));
                                navigate("/printTemplate/8");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate8
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 9}));
                                navigate("/printTemplate/9");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate9
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 10}));
                                navigate("/printTemplate/10");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate10
                        </a>
            </td>
                <td>
                        <a 
                            href="#" onClick={e => {
                                e.preventDefault();
                                dispatch(updateAppSettings({ templateId: 11}));
                                navigate("/printTemplate/11");
                            }} 
                            style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate11
                        </a>
            </td>
                </tr>
{/* ============================================================================================================================================================== */}
                    <tr>
                    <td>
                            <a 
                                href="#" onClick={e => {
                                    e.preventDefault();
                                    dispatch(updateAppSettings({ templateId: 12}));
                                    navigate("/printTemplate/12");
                                }} 
                                style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate12
                            </a>
                </td>
                    <td>
                            <a 
                                href="#" onClick={e => {
                                    e.preventDefault();
                                    dispatch(updateAppSettings({ templateId: 13}));
                                    navigate("/printTemplate/13");
                                }} 
                                style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate13
                            </a>
                </td>
                    <td>
                            <a 
                                href="#" onClick={e => {
                                    e.preventDefault();
                                    dispatch(updateAppSettings({ templateId: 12}));
                                    navigate("/printTemplate/12");
                                }} 
                                style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate12
                            </a>
                </td>
                    <td>
                            <a 
                                href="#" onClick={e => {
                                    e.preventDefault();
                                    dispatch(updateAppSettings({ templateId: 12}));
                                    navigate("/printTemplate/12");
                                }} 
                                style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate12
                            </a>
                </td>
                    <td>
                            <a 
                                href="#" onClick={e => {
                                    e.preventDefault();
                                    dispatch(updateAppSettings({ templateId: 12}));
                                    navigate("/printTemplate/12");
                                }} 
                                style={{ color: "#3498db", textDecoration: "underline", marginRight: "16px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>PrintTemplate12
                            </a>
                </td>
                    <td></td>
                    </tr>
            </tbody>
            </table>
)}
            {/* Print Pay Stub Button*/}
            <Button className="float-right mb-4" onClick={printPaystub} type="button">
                Continue to Preview & Payment
            </Button>
        </Container>
    );
};

export default PaystubPreview;