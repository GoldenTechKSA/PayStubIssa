import React from "react";
import { Form, Col, Row, Container } from "react-bootstrap";
import store from "../../redux/store";

const PaystubPreview = () => {
    const state = store.getState();

    return (
        <Container>
            {/* Company Info */}
            <Form className="m-3">
                <h2>Company Information</h2>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Company Name</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.companyInfo.companyName}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Company EIN</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.companyInfo.companyEIN}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Company Address</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={`${state.companyInfo.companyAddress1}, ${state.companyInfo.companyAddress2}`}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">City</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.companyInfo.companyCity}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">State</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.companyInfo.companyState}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Zip code</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.companyInfo.companyZipCode}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Company Phone</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.companyInfo.companyPhone}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Company eMail</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.companyInfo.companyEmail}/></Col>
                </Form.Group>
            </Form>
            {/* Employee Info */}
            <Form className="m-3">
                <h2>Employee Information</h2>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">First Name</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeFirstName}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Middle Initial</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeMiddleInitial}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Last Name</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeLastName}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Address</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={`${state.employeeInfo.employeeAddress1}, ${state.employeeInfo.employeeAddress2}`}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">City</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeCity}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">State</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeState}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Zip code</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeZipCode}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Phone Number</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeePhone}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Employee SSN</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeSSN}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Employee eMail</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeEmail}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Employee ID</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeID}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="2">Filing Status</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.employeeInfo.employeeMarriedStatus}/></Col>
                </Form.Group>
            </Form>
            {/* Income Info */}
            <Form className="m-3">
                <h2>Income Details</h2>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Annual Income Amount $</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.incomeDetails.annualSalary}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Pay Period Start Date</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.incomeDetails.periodStartDate}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Pay Period Start Date</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.incomeDetails.periodEndDate}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Pay Period Type</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.incomeDetails.periodType}/></Col>
                </Form.Group>
            </Form>
            {/* General Info */}
            <Form className="m-3">
                <h2>General Information</h2>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Employment Type</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.generalInfo.employmentType}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Payment Type</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.generalInfo.paymentType}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">How often you get paid?</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.generalInfo.paymentFrequency}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Number of paystubs requested</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.generalInfo.payStubCount}/></Col>
                </Form.Group>
                <Form.Group as={Row} className="my-0">
                    <Form.Label column sm="3">Starting check number</Form.Label><Col sm="8"><Form.Control readOnly defaultValue={state.generalInfo.checkNumber}/></Col>
                </Form.Group>
            </Form>
        </Container>
    );
}

export default PaystubPreview;