import React from "react";
import { Form, Col, Row, Container, Button } from "react-bootstrap";
import store from "../../redux/store";
import "../../index.css";

const PaystubPreview = () => {
    const state = store.getState();
    const printPaystub = async () => {
        const printWindow = window.open('');
        if (printWindow) {
            printWindow.document.write('<html><head><title></title><style type="text/css">');
            printWindow.document.write('* { font-family: SegoeUI-Regular-final, "Segoe UI", Segoe, Tahoma, Helvetica, Arial, Sans-Serif; }');
            printWindow.document.write('table, th, td { border: 1px solid black; border-collapse: collapse;}');
            printWindow.document.write('th, td { max-width: 500px; overflow-wrap: break-word; padding: 2px 5px 2px 5px;}');
            printWindow.document.write('li { list-style-type: none; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<table>');
            printWindow.document.write('<tr>');
            printWindow.document.write('</tr>');
            printWindow.document.write('</table>');
            printWindow.document.write('<br/>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    return (
        <Container>
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
            {/* Print Pay Stub Button*/}
            <Button className="float-right mb-4" onClick={printPaystub} type="button">
                Preview your Paystub
            </Button>
        </Container>
    );
};

export default PaystubPreview;