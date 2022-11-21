import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Container } from "react-bootstrap";
import "./print.css";

const PrintTemplate10 = ({store}) => {
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
                <Col className="col-3 text-center align-self-center">Template 10 EARNINGS STATEMENT</Col>
            </Row>
            <Row>
                <Col className="bg-dark text-light text-center">Employee Name</Col>
                <Col className="bg-dark text-light text-center">SSN</Col>
                <Col className="bg-dark text-light text-center">Empoloyee ID</Col>
                <Col className="bg-dark text-light text-center">Check No.</Col>
                <Col className="bg-dark text-light text-center">Pay Period</Col>
                <Col className="bg-dark text-light text-center">Pay Date</Col>
            </Row>
            <Row className="">
                <Col className="text-center border-right border-dark border-2">`${employeeFirstName} ${employeeMiddleInitial}. ${employeeLastName}`</Col>
                <Col className="text-center border-right border-dark border-2">{employeeSSN}</Col>
                <Col className="text-center border-right border-dark border-2">{employeeID}</Col>
                <Col className="text-center border-right border-dark border-2">{checkNumber}</Col>
                <Col className="text-center border-right border-dark border-2">{periodStartDate}</Col>
                <Col className="text-center">01/15/76</Col>
            </Row>
            <Row>
                <Col className="text-center border-top border-dark border-2">INCOME</Col>
                <Col className="text-center border-top border-dark border-2">RATE</Col>
                <Col className="text-center border-top border-dark border-2">HOURS</Col>
                <Col className="text-center border-top border-dark border-2">CURRENT TOTAL</Col>
                <Col className="text-center border-top border-dark border-2">DEDUCTIONS</Col>
                <Col className="text-center border-top border-dark border-2">CURRENT TOTAL</Col>
                <Col className="text-center border-top border-dark border-2">YEAR-TO-DATE</Col>
            </Row>
            <Row>
                <Col className="text-center border-top border-dark border-2">GROSS WAGES</Col>
                <Col className="text-center border-top border-dark border-2">
                    <Row className="border-left border-dark border-2">FICA MED TAX</Row>
                    <Row className="border-left border-dark border-2">FICA SS TAX</Row>
                    <Row className="border-left border-dark border-2">FED TAX</Row>
                    <Row className="border-left border-dark border-2">CA ST TAX</Row>
                    <Row className="border-left border-dark border-2">SDI</Row>
                </Col>
            </Row>
            <Row>
                <Col className="col-2 text-center border-top border-dark border-2">YTD GROSS</Col>
                <Col className="col-2 text-center border-top border-dark border-2">YTD DEDUCTIONS</Col>
                <Col className="col-2 text-center border-top border-dark border-2">YTD NET PAY</Col>
                <Col className="col-2 text-center border-top border-dark border-2">CURRENT TOTAL</Col>
                <Col className="col-3 text-center border-top border-dark border-2">CURRENT DEDUCTIONS</Col>
                <Col className="col-1 text-center border-top border-dark border-2">NET PAY</Col>
            </Row>
            <Row>
                <Col className="col-2 text-center">23,456.06</Col>
                <Col className="col-2 text-center">123,789.09</Col>
                <Col className="col-2 text-center">45,112.03</Col>
                <Col className="col-2 text-center">13,789.09</Col>
                <Col className="col-3 text-center">1237.50</Col>
                <Col className="col-1 text-center">3789.76</Col>
            </Row>
        </Container>
    );
}

export default PrintTemplate10;