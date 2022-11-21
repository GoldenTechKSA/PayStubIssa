import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Container } from "react-bootstrap";
import "./print.css";

const PrintTemplate4 = ({store}) => {
    const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
    const { companyName, companyAddress1, companyEIN, companyCity, companyState, companyZipCode } = companyInfo;
    const { employeeFirstName, employeeMiddleInitial, employeeLastName, 
        employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode,
        employeeSSN, employeeID } = employeeInfo;

    const { annualSalary, periodPayDate, periodStartDate, periodEndDate, periodType} = incomeDetails;
    const { employmentType, paymentType, paymentFrequency, payStubCount, checkNumber } = generalInfo;

    return (
        <Container style={{border: "2px solid black" }} className="d-flex flex-column justify-content-center">

{/* Row1 Company Info */}
            <Row className="pb-3">
                <Col className="col-4">
                    <Row>{companyName}</Row>
                    <Row>{companyAddress1}</Row>
                    <Row>{`${companyCity} ${companyState} ${companyZipCode}`}</Row>
                </Col>
                <Col className="col-6 text-center align-self-center">{`${periodStartDate} - ${periodEndDate} EARNINGS - 4`}</Col>
                <Col className="col-2">
                    <Row>{`Paid: ${periodPayDate}`}</Row>
                    <Row>{`BIN: ${companyEIN}`}</Row>
                    <Row>Stub: 22198-01</Row>
                </Col>
            </Row>
{/* Row2 Employee Info */}
            <Row className="pb-3">
                <Col className="pb-3 border border-dark border-2">
                    <Row>
                        <Col>Tax Status</Col>
                        <Col>Addl Tax</Col>
                        <Col>YTD Subject</Col>
                    </Row>
                    <Row>
                        <Col>Federal S 1</Col>
                        <Col> .00</Col>
                        <Col>7,079.67</Col>
                    </Row>
                    <Row>
                        <Col>State S 1</Col>
                        <Col>.00</Col>
                        <Col>7,079.67</Col>
                    </Row>
                </Col>
                <Col className="pb-3 border border-dark border-2">
                    <Row>
                        <Col className="col-5">Summary</Col>
                        <Col>Current</Col>
                        <Col>YTD</Col>
                    </Row>
                    <Row>
                        <Col className="col-5">Gross Amount</Col>
                        <Col>3,168.83</Col>
                        <Col>9,341.15</Col>
                    </Row>
                    <Row>
                        <Col className="col-5">Employee Deductions</Col>
                        <Col>991.89</Col>
                        <Col>4,054.97</Col>
                    </Row>
                    <Row>
                        <Col className="col-5">Net Amount</Col>
                        <Col>2,176.94</Col>
                        <Col>Col 4</Col>
                    </Row>
                </Col>
            </Row>
{/* Row3 Income Info */}
        <Row>
            <Col>
                <Row>{`ID: ${employeeID}`}</Row>
                <Row>{`${employeeFirstName} ${employeeMiddleInitial}. ${employeeLastName}`}</Row>
                <Row>{employeeAddress1}</Row>
                <Row>{`${employeeCity} ${employeeState} ${employeeZipCode}`}</Row>
            </Col>
            <Col>
                    <Row className="border-left border-dark border-2">Net Pay Distribution</Row>
                    <Row className="border-left border-dark border-2">Bank Deposit # 1</Row>
                    <Row className="border-left border-dark border-2">Check number: 333999</Row>
                </Col>
        </Row>
        </Container>
    );
}

export default PrintTemplate4;