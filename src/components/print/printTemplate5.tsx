import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import "./print.css";

const PrintTemplate5 = ({ store }) => {
    const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
    const {
        companyName,
        companyAddress1,
        companyAddress2,
        companyCity,
        companyState,
        companyZipCode,
    } = companyInfo;
    const {
        employeeFirstName,
        employeeMiddleInitial,
        employeeLastName,
        employeeAddress1,
        employeeAddress2,
        employeeCity,
        employeeState,
        employeeZipCode,
        employeeSSN,
        employeeID,
    } = employeeInfo;
    const { annualSalary, periodStartDate, periodEndDate, periodType } = incomeDetails;
    const { employmentType, paymentType, paymentFrequency, payStubCount, checkNumber } = generalInfo;

    return (
        <Container fluid className="paystub-modern-container">
            <Row className="paystub-header align-items-center">
                <Col md={5}>
                    <div className="paystub-company">
                        <div className="paystub-company-name">{companyName}</div>
                        <div>{companyAddress1}</div>
                        {companyAddress2 && <div>{companyAddress2}</div>}
                        <div>
                            {companyCity}, {companyState} {companyZipCode}
                        </div>
                    </div>
                </Col>
                <Col md={5}>
                    <div className="paystub-employee">
                        <div className="paystub-section-title">Employee Address</div>
                        <div>{employeeAddress1}</div>
                        {employeeAddress2 && <div>{employeeAddress2}</div>}
                        <div>
                            {employeeCity}, {employeeState} {employeeZipCode}
                        </div>
                    </div>
                </Col>
                <Col md={2} className="text-center">
                    <div className="paystub-statement">EARNINGS STATEMENT</div>
                </Col>
            </Row>
            <Row className="paystub-table-header mt-4">
                <Col className="paystub-th">Employee Name</Col>
                <Col className="paystub-th">SSN</Col>
                <Col className="paystub-th">Employee ID</Col>
                <Col className="paystub-th">Check No.</Col>
                <Col className="paystub-th">Pay Period</Col>
                <Col className="paystub-th">Pay Date</Col>
            </Row>
            <Row className="paystub-table-row">
                <Col className="paystub-td">
                    {employeeFirstName} {employeeMiddleInitial && `${employeeMiddleInitial}.`} {employeeLastName}
                </Col>
                <Col className="paystub-td">{employeeSSN}</Col>
                <Col className="paystub-td">{employeeID}</Col>
                <Col className="paystub-td">{checkNumber}</Col>
                <Col className="paystub-td">
                    {periodStartDate} - {periodEndDate}
                </Col>
                <Col className="paystub-td">{/* Pay Date here if available */}</Col>
            </Row>
            <Row className="paystub-table-header mt-4">
                <Col className="paystub-th">INCOME</Col>
                <Col className="paystub-th">RATE</Col>
                <Col className="paystub-th">HOURS</Col>
                <Col className="paystub-th">CURRENT TOTAL</Col>
                <Col className="paystub-th">DEDUCTIONS</Col>
                <Col className="paystub-th">CURRENT TOTAL</Col>
                <Col className="paystub-th">YEAR-TO-DATE</Col>
            </Row>
            <Row className="paystub-table-row">
                <Col className="paystub-td">GROSS WAGES</Col>
                <Col className="paystub-td">--</Col>
                <Col className="paystub-td">--</Col>
                <Col className="paystub-td">$23,456.06</Col>
                <Col className="paystub-td">
                    <div>FICA MED TAX</div>
                    <div>FICA SS TAX</div>
                    <div>FED TAX</div>
                    <div>CA ST TAX</div>
                    <div>SDI</div>
                </Col>
                <Col className="paystub-td">$1,237.50</Col>
                <Col className="paystub-td">$45,112.03</Col>
            </Row>
            <Row className="paystub-table-header mt-4">
                <Col className="paystub-th">YTD GROSS</Col>
                <Col className="paystub-th">YTD DEDUCTIONS</Col>
                <Col className="paystub-th">YTD NET PAY</Col>
                <Col className="paystub-th">CURRENT TOTAL</Col>
                <Col className="paystub-th">CURRENT DEDUCTIONS</Col>
                <Col className="paystub-th">NET PAY</Col>
            </Row>
            <Row className="paystub-table-row">
                <Col className="paystub-td">$23,456.06</Col>
                <Col className="paystub-td">$123,789.09</Col>
                <Col className="paystub-td">$45,112.03</Col>
                <Col className="paystub-td">$13,789.09</Col>
                <Col className="paystub-td">$1,237.50</Col>
                <Col className="paystub-td">$3,789.76</Col>
            </Row>
        </Container>
    );
};

export default PrintTemplate5;