import React from "react";
import { Form, Col, Row, Container, Button } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import store from "../../redux/store";
import "../../index.css";

const PaystubPreview = () => {
    const state = store.getState();
    const navigate = useNavigate();
    const templateId = state.appSettings.templateId;

    const printPaystub = async () => {
        console.log("Printing paystub with template type:", templateId);
        navigate(`/printTemplate/${templateId}`);
    };

    return (
        <Container>
            <p className="text-info mb-4" style={{ fontSize: "1.5rem", marginTop: "2rem", fontWeight: 500, background: "#f8f9fa", borderRadius: "0.5rem", padding: "1rem 1.5rem", border: "1px solid #d1e7fd", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                Please review all the information below. If everything is correct, click <strong>Continue to Preview & Payment</strong> to see your paystub before finalizing.
            </p>
            {/* Company Info */}
            <Form className="m-3">
                <h2>Company Information</h2>
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
                <h2>Employee Information</h2>
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
                <h2>Income Details</h2>
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
                <h2>General Information</h2>
                <Row xs={1} md={2} className="g-2">
                    <Col>
                        <Form.Group>
                            <Form.Label>Employment Type</Form.Label>
                            <Form.Control readOnly defaultValue={state.generalInfo.employmentType} />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label>Payment Type</Form.Label>
                            <Form.Control readOnly defaultValue={state.generalInfo.paymentType} />
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
            {/* Print Pay Stub Button*/}
            <Button className="float-right mb-4" onClick={printPaystub} type="button">
                Continue to Preview & Payment
            </Button>
        </Container>
    );
};

export default PaystubPreview;