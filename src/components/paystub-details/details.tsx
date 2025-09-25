import React from "react";
import { Form, Col, Row, Container, Button } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import store from "../../redux/store";
import "../../index.css";
import { useDispatch } from "react-redux";
import { updateAppSettings } from "../../redux/actions";

const PaystubPreview = () => {
    const state = store.getState();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const templateId = state.appSettings.templateId;

    const devMode = (process.env.NODE_ENV === "production" ? false : true)

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
    
    return (
        <Container>
            <p className="text-info mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem", fontWeight: 500, background: "#f8f9fa", borderRadius: "0.5rem", padding: "1rem 1.5rem", border: "1px solid #d1e7fd", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                Please review all the information below. If everything is correct, click <strong>Continue to Preview & Payment</strong> to see your paystub before finalizing.
            </p>
            {/* Company Info */}
            <Form className="m-3">
                <Row className="mt-3 mb-4">
                    <a className="company-info-link" tabIndex={0} onClick={e=> onCompanyInfoClick(e)} href="/appBody">
                        Company Information
                    </a>
                </Row>
                <Row xs={1} md={2} className="g-2">
                    <Col>
                        <Form.Group>
                            <Form.Label>Company Name</Form.Label>
                            <Form.Control readOnly defaultValue={state.companyInfo.companyName} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Company EIN</Form.Label>
                            <Form.Control readOnly defaultValue={state.companyInfo.companyEIN} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Company Address</Form.Label>
                            <Form.Control readOnly defaultValue={`${state.companyInfo.companyAddress1}, ${state.companyInfo.companyAddress2}`} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>City</Form.Label>
                            <Form.Control readOnly defaultValue={state.companyInfo.companyCity} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>State</Form.Label>
                            <Form.Control readOnly defaultValue={state.companyInfo.companyState} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Zip code</Form.Label>
                            <Form.Control readOnly defaultValue={state.companyInfo.companyZipCode} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Company Phone</Form.Label>
                            <Form.Control readOnly defaultValue={state.companyInfo.companyPhone} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Company Email</Form.Label>
                            <Form.Control readOnly defaultValue={state.companyInfo.companyEmail} />
                        </Form.Group>
                    </Col>
                </Row>
            </Form>
            {/* Employee Info */}
            <Form className="m-3">
                <a className="company-info-link" tabIndex={0} onClick={e=> onEmployeeInfoClick(e)} href="/employee-info">
                    Employee Information
                </a>
                <Row xs={1} md={2} className="g-2">
                    <Col>
                        <Form.Group>
                            <Form.Label>First Name</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeFirstName} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Middle Initial</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeMiddleInitial} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Last Name</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeLastName} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Address</Form.Label>
                            <Form.Control readOnly defaultValue={`${state.employeeInfo.employeeAddress1}, ${state.employeeInfo.employeeAddress2}`} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>City</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeCity} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>State</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeState} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Zip code</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeZipCode} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeePhone} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Employee SSN</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeSSN} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Employee Email</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeEmail} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Employee ID</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeID} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Filing Status</Form.Label>
                            <Form.Control readOnly defaultValue={state.employeeInfo.employeeMarriedStatus} />
                        </Form.Group>
                    </Col>
                </Row>
            </Form>
            {/* Income Info */}
            <Form className="m-3">
                <a className="company-info-link" tabIndex={0} onClick={e=> onIncomeDetailsClick(e)} href="/income-details">
                    Income Details
                </a>
                <Row xs={1} md={2} className="g-2">
                    <Col>
                        <Form.Group>
                            <Form.Label>Annual Income Amount $</Form.Label>
                            <Form.Control readOnly defaultValue={state.incomeDetails.annualSalary} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Pay Period Start Date</Form.Label>
                            <Form.Control readOnly defaultValue={state.incomeDetails.periodStartDate} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Pay Period End Date</Form.Label>
                            <Form.Control readOnly defaultValue={state.incomeDetails.periodEndDate} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Pay Period Type</Form.Label>
                            <Form.Control readOnly defaultValue={state.incomeDetails.periodType} />
                        </Form.Group>
                    </Col>
                </Row>
            </Form>
            {/* General Info */}
            <Form className="m-3">
                <a className="company-info-link" tabIndex={0} onClick={e=> onGeneralInfoClick(e)} href="/general-info">
                    General Information
                </a>
                <Row xs={1} md={2} className="g-2">
                    <Col>
                        <Form.Group>
                            <Form.Label>Employment Type</Form.Label>
                            <Form.Control readOnly defaultValue={state.generalInfo.employmentType} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Payment Method</Form.Label>
                            <Form.Control readOnly defaultValue={state.generalInfo.paymentMethod} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>How often you get paid?</Form.Label>
                            <Form.Control readOnly defaultValue={state.generalInfo.paymentFrequency} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Number of paystubs requested</Form.Label>
                            <Form.Control readOnly defaultValue={state.generalInfo.payStubCount} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Starting check number</Form.Label>
                            <Form.Control readOnly defaultValue={state.generalInfo.checkNumber} />
                        </Form.Group>
                    </Col>
                </Row>
            </Form>
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