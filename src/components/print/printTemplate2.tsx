import React from "react";
import { Row, Col, Container } from "react-bootstrap";
import "./print.css";

const PrintTemplate2 = ({store}) => {
    const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
    const { companyName, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode } = companyInfo;
    const { employeeFirstName, employeeMiddleInitial, employeeLastName, 
        employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode,
        employeeSSN, employeeID } = employeeInfo;

    const { annualSalary, periodStartDate, periodEndDate, periodType} = incomeDetails;
    const { employmentType, paymentType, paymentFrequency, payStubCount, checkNumber } = generalInfo;

    return (
        <Container style={{border: "2px solid black" }}>
            <Row>
                <Col>
                    <Row>{companyName}</Row>
                    <Row>{`${companyAddress1} ${companyCity}, ${companyState} ${companyZipCode}`}</Row>
                </Col>
                <Col className="col-3 text-center align-self-center">EARNINGS STATEMENT</Col>
            </Row>
            <Row className="my-3 justify-content-end">Stub# 199034</Row>
            <Row className="my-3 justify-content-end">{checkNumber}</Row>
            <Row>
                <Col className="col-2 bg-dark text-light">EMPLOYEE NAME</Col>
                <Col className="col-3 bg-dark text-light">EMPLOYEE ADDRESS</Col>
                <Col className="bg-dark text-light text-center">EMP. ID</Col>
                <Col className="bg-dark text-light text-center">PAY PERIOD</Col>
                <Col className="bg-dark text-light text-center">PAY DATE</Col>
                <Col className="bg-dark text-light text-center">SSN</Col>
            </Row>
            <Row className="">
                <Col className="pb-2 col-2 border-right border-dark border-2">{`${employeeFirstName} ${employeeMiddleInitial}. ${employeeLastName}`}</Col>
                <Col className="pb-2 col-3 border-right border-dark border-2">{employeeAddress1}</Col>
                <Col className="pb-2 text-center border-right border-dark border-2">{employeeID}</Col>
                <Col className="pb-2 text-center border-right border-dark border-2">{periodStartDate}</Col>
                <Col className="pb-2 text-center">01/15/76</Col>
                <Col className="pb-2 text-center border-right border-dark border-2">{employeeSSN}</Col>
            </Row>
            <Row>
                <Col className="text-center border-top border-dark border-2">INCOME</Col>
                <Col className="text-center border-top border-dark border-2">RATE</Col>
                <Col className="text-center border-top border-dark border-2">HOURS</Col>
                <Col className="text-center border-top border-dark border-2">CURRENT PAY</Col>
                <Col className="text-center border-top border-dark border-2">DEDUCTIONS</Col>
                <Col className="text-center border-top border-dark border-2">TOTAL</Col>
                <Col className="text-center border-top border-dark border-2">YTD TOTAL</Col>
            </Row>
            <Row>
                <Col className="col-2 border-top border-dark border-2">GROSS EARNINGS</Col>
                <Col className="text-center border-top border-dark border-2">11.47</Col>
                <Col className="text-center border-top border-dark border-2">40</Col>
                <Col className="text-center border-top border-dark border-2">458.8</Col>
                <Col className="col-5 text-center border-top border-dark border-2">
                    <Row className="pt-5 border-left border-dark border-1">
                        <Col className="">FICA MED TAX</Col>
                        <Col className="">6.65</Col>
                        <Col className="">206.15</Col>
                    </Row>
                    <Row className="border-left border-dark border-1">
                        <Col className="">FICA SS TAX</Col>
                        <Col className="">27.53</Col>
                        <Col className="">853.43</Col>
                    </Row>
                    <Row className="border-left border-dark border-1">
                        <Col className="">FEDERAL TAX</Col>
                        <Col className="">45.88</Col>
                        <Col className="">1422.28</Col>
                    </Row>
                    <Row className="pb-5 border-left border-dark border-1">
                        <Col className="">STATE TAX</Col>
                        <Col className="">0</Col>
                        <Col className="">0.00</Col>
                    </Row>
                </Col>
            </Row>
            <Row>
                <Col className="pt-4 text-center border-right border-top border-dark border-2">YEAR TO DATE</Col>
                <Col className="pt-4 text-center border-top border-dark border-2">CURRENT PAY PERIOD</Col>
            </Row>
            <Row>
                <Col className="col-2 text-center border-top border-dark border-2">GROSS PAY</Col>
                <Col className="col-2 text-center border-top border-dark border-2">DEDUCTIONS</Col>
                <Col className="col-2 text-center border-top border-dark border-2">NET PAY</Col>
                <Col className="col-2 text-center border-top border-dark border-2">TOTAL PAY</Col>
                <Col className="col-2 text-center border-top border-dark border-2">DEDUCTIONS</Col>
                <Col className="col-2 text-center border-top border-dark border-2">NET PAY</Col>
            </Row>
            <Row>
                <Col className="col-2 text-center">123,456.06</Col>
                <Col className="col-2 text-center">23,789.09</Col>
                <Col className="col-2 text-center">85,112.03</Col>
                <Col className="col-2 text-center">789.09</Col>
                <Col className="col-2 text-center">37.50</Col>
                <Col className="col-2 text-center">1789.76</Col>
            </Row>
        </Container>
    );
}

export default PrintTemplate2;