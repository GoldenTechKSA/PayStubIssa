import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import "./print.css";

const PrintTemplate5 = ({store}) => {
    const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
    const { companyName, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode } = companyInfo;
    const { employeeFirstName, employeeMiddleInitial, employeeLastName, 
        employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode,
        employeeSSN, employeeID } = employeeInfo;

    const { annualSalary, periodStartDate, periodEndDate, periodType} = incomeDetails;
    const { employmentType, paymentType, paymentFrequency, payStubCount, checkNumber } = generalInfo;

    return (
        <Container style={{border: "2px solid black" }} className="d-flex flex-column justify-content-center">
            <Row>
                <Col>
                    <Row>{companyName}</Row>
                    <Row>{companyAddress1}</Row>
                    <Row>{`${companyCity} ${companyState} ${companyZipCode}`}</Row>
                </Col>
                <Col>Pay Date: 1/2/3456</Col>
            </Row>
            <Row>
                <Col>{`${employeeFirstName} ${employeeMiddleInitial}. ${employeeLastName}`}</Col>
                <Col>Employee Name</Col>
                <Col>SSN</Col>
                <Col>{employeeSSN}</Col>
            </Row>
            <Row>
                <Col>Template 5 EARNINGS STATEMENT</Col>
                <Col>DEDUCTIONS</Col>
                <Col>YEAR-TO-DATE</Col>
            </Row>
            <Row>
                <Col>Type</Col>
                <Col>Hours</Col>
                <Col>Amount</Col>
                <Col>Type</Col>
                <Col>Amount</Col>
                <Col>Type</Col>
                <Col>Amount</Col>
            </Row>
            <Row>
                <Col>Regular</Col>
                <Col>80</Col>
                <Col>$800.00</Col>
                <Col>Fed Tax</Col>
                <Col >$117.37</Col>
                <Col >Gross Earnings</Col>
                <Col >$5225.00</Col>
            </Row>
            <Row>
                <Col>Overtime</Col>
                <Col>20</Col>
                <Col>$300.00</Col>
                <Col>FICA</Col>
                <Col >$33.60</Col>
                <Col >Fed Tax</Col>
                <Col >$586.85</Col>
            </Row>
            <Row>
                <Col>State Tax</Col>
                <Col>$52.25</Col>
                <Col>FICA</Col>
                <Col >$165.00</Col>
            </Row>
            <Row>
                <Col className="col-2">State Tax</Col>
                <Col className="col-2">$258.39</Col>
            </Row>
            <Row>
                <Col>Total Gross</Col>
                <Col >$1100.00</Col>
                <Col >Total Deductions</Col>
                <Col >$203.22</Col>
            </Row>
        </Container>
    );
}

export default PrintTemplate5;