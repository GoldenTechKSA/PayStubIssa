import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Container } from "react-bootstrap";
import "./print.css";

const PrintTemplate3 = ({store}) => {
    const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
    const { companyName, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode } = companyInfo;
    const { employeeFirstName, employeeMiddleInitial, employeeLastName, employeeSSN, employeeID, employeeMarriedStatus } = employeeInfo;

    const { periodStartDate, periodEndDate, periodPayDate } = incomeDetails;
    const { employmentType, paymentType, paymentFrequency } = generalInfo;

    return (
        <Container>
            <Row><Col className="align-self-left">stub#: 12345</Col><Col className="mb-5 col-3 text-center align-self-center">EARNINGS STATEMENT-3</Col></Row>
            <Row style={{backgroundColor:"lightgray" }} className="py-2"><Col>COMPANY NAME</Col><Col>COMPANY ADDRESS</Col></Row>
            <Row className="py-1"><Col className="border-right border-dark border-1">{companyName}</Col><Col>{`${companyAddress1}, ${companyAddress2}, ${companyCity}, ${companyState} ${companyZipCode}`}</Col></Row>
            <Row style={{backgroundColor:"lightgray" }}>
                <Col className="">EMPLOYEE NAME</Col>
                <Col className="">SSN</Col>
                <Col className="">MARITAL STATUS</Col>
                <Col className="">EMPLOYEE ID</Col>
            </Row>
            <Row className="">
                <Col className="">{`${employeeFirstName} ${employeeMiddleInitial}. ${employeeLastName}`}</Col>
                <Col className="">{employeeSSN}</Col>
                <Col className="">{employeeMarriedStatus}</Col>
                <Col className="">{employeeID}</Col>
            </Row>
            <Row style={{backgroundColor:"lightgray" }}>
                <Col className="text-center col-2">PAY DATE</Col>
                <Col className="text-center col-3">PAY PERIOD</Col>
                <Col className="text-center ">PAY ???</Col>
                <Col className="text-center ">PAY TYPE</Col>
                <Col className="text-center ">EXEMPTIONS</Col>
            </Row>
            <Row className="">
                <Col className="text-center col-2">{periodPayDate}</Col>
                <Col className="text-center col-3">{`${periodStartDate} - ${periodEndDate}`}</Col>
                <Col className="text-center ">{paymentFrequency}</Col>
                <Col className="text-center">{paymentType}</Col>
                <Col className="text-center">03</Col>
            </Row>



            <Row style={{backgroundColor:"lightgray" }}>
                <Col className="">INCOME</Col>
                <Col className="text-center">RATE</Col>
                <Col className="text-center">HOURS</Col>
                <Col className="text-center">CURRENT TOTAL</Col>
                <Col className="text-center">DEDUCTIONS</Col>
                <Col className="text-center">CURRENT TOTAL</Col>
                <Col className="text-center">YEAR-TO-DATE</Col>
            </Row>
            <Row>
                <Col className="border-top border-dark border-2">GROSS WAGES</Col>
                <Col className="text-center border-top border-dark border-2">
                    <Row className="border-left border-dark border-2">FICA MED TAX</Row>
                    <Row className="border-left border-dark border-2">FICA SS TAX</Row>
                    <Row className="border-left border-dark border-2">FED TAX</Row>
                    <Row className="border-left border-dark border-2">CA ST TAX</Row>
                    <Row className="border-left border-dark border-2">SDI</Row>
                </Col>
            </Row>
            <Row  style={{backgroundColor:"lightgray" }}>
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

export default PrintTemplate3;