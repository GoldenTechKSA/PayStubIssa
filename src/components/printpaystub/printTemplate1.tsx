import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col, Container } from "react-bootstrap";
import "./print.css";

const PrintTemplate1 = ({store}) => {
    const { companyInfo, employeeInfo, incomeDetails, generalInfo } = store;
    const { companyName, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode, companyPhone } = companyInfo;
    const { employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState,
        employeeZipCode, employeeSSN, employeeID, employeePhone, employeeMarriedStatus } = employeeInfo;

    const { periodStartDate, periodEndDate, periodPayDate } = incomeDetails;
    const { employmentType, paymentType, paymentFrequency, payStubCount, checkNumber } = generalInfo;

    return (
        <Container style={{fontFamily: "Roboto, sans-serif"}} className="border border-2 border-dark">
            <Row className="mt-3 mb-5">
                <Col>
                    <Row>{companyName}</Row>
                    <Row>{companyAddress1}</Row>
                    <Row>{companyAddress2}</Row>
                    <Row>{`${companyCity} ${companyState} ${companyZipCode}`}</Row>
                    <Row>{companyPhone}</Row>
                </Col>
                <Col>
                    <Row>{`${employeeFirstName} ${employeeMiddleInitial} ${employeeLastName}`}</Row>
                    <Row>{employeeAddress1}</Row>
                    <Row>{employeeAddress2}</Row>
                    <Row>{`${employeeCity} ${employeeState} ${employeeZipCode}`}</Row>
                    <Row>{employeePhone}</Row>
                    <Row>{employeeSSN}</Row>
                    <Row>{employeeID}</Row>
                    <Row className="mt-5">{`Filing Status: ${employeeMarriedStatus}`}</Row>
                </Col>
                <Col className="col-3 text-center align-self-center">
                    <Row className="bg-dark text-white my-5 justify-content-center">EARNINGS STATEMENT</Row>
                    <Row>DEPARTMENT: NUMBER</Row>
                    <Row>DIRECT DEPOSIT (DD): NUMBER</Row>
                    <Row>{`Pay Period ${periodStartDate} - ${periodEndDate}`}</Row>
                    <Row>{`Pay Date ${periodPayDate}`}</Row>
                 </Col>
            </Row>
            <Row>
                <Col className="border-bottom border-dark border-1">Earnings</Col>
                <Col className="border-bottom border-dark border-1">RATE</Col>
                <Col className="border-bottom border-dark border-1">HOUR/UNIT</Col>
                <Col className="border-bottom border-dark border-1">CURRENT</Col>
                <Col className="border-bottom border-dark border-1">YTD HOUR/UNIT</Col>
                <Col className="border-bottom border-dark border-1">YTD</Col>
            </Row>
            <Row>
                <Col className="col-4 border-bottom border-dark border-2">Salary</Col>
                <Col className="col-2 border-bottom border-dark border-2">80.00</Col>
                <Col className="col-2 border-bottom border-dark border-2">500.00</Col>
                <Col className="col-2 border-bottom border-dark border-2">960.00</Col>
                <Col className="col-2 border-bottom border-dark border-2">6000.00</Col>
            </Row>
            <Row className="mb-5">
                <Col className="col-4">Total</Col>
                <Col className="col-2">80.00</Col>
                <Col className="col-2">500.00</Col>
                <Col className="col-2">960.00</Col>
                <Col className="col-2">6000.00</Col>
            </Row>
            <Row className="justify-content-end">
                <Col className="col-2 border-bottom border-dark border-2">Taxes</Col>
                <Col className="col-2 border-bottom border-dark border-2">CURRENT</Col>
                <Col className="col-2 border-bottom border-dark border-2">YTD</Col>
            </Row>
            <Row className="justify-content-end">
                <Col className="col-2 border-bottom border-gray border-1">MED</Col>
                <Col className="col-2 border-bottom border-gray border-1">7.25</Col>
                <Col className="col-2 border-bottom border-gray border-1">87.00</Col>
            </Row>
            <Row className="justify-content-end">
                <Col className="col-2 border-bottom border-dark border-2">SOC</Col>
                <Col className="col-2 border-bottom border-dark border-2">31.00</Col>
                <Col className="col-2 border-bottom border-dark border-2">372.00</Col>
            </Row>
            <Row className="mb-5 justify-content-end">
                <Col className="col-2">Total</Col>
                <Col className="col-2">$38.25</Col>
                <Col className="col-2">$459.00</Col>
            </Row>
            <Row className="mb-5 justify-content-end">
                <Col className="col-2">Net Pay</Col>
                <Col className="col-2">DD or Checknumber</Col>
                <Col className="col-2">$461.75</Col>
            </Row>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <Row className="mb-5 py-2 bg-dark text-white justify-content-center">THIS IS NOT A CHECK. THIS DOCUMENT IS TO BE USED FOR INFORMATIONAL PURPOSES ONLY.</Row>
            <Row className="mt-3 mb-5">
                <Col>
                    <Row>{companyName}</Row>
                    <Row>{`${companyAddress1}, ${companyAddress2}`}</Row>
                    <Row>{`${companyCity} ${companyState} ${companyZipCode}`}</Row>
                </Col>
                <Col>
                    <Row className="mt-5">{`Filing Status: ${employeeMarriedStatus}`}</Row>
                </Col>
                <Col className="col-3 text-center align-self-center">
                    <Row>DIRECT DEPOSIT (DD): NUMBER</Row>
                    <Row>{`Date ${periodPayDate}`}</Row>
                </Col>
            </Row>
            <Row className="mt-5">pay this Amount</Row>
            <Row className="mb-5 border border-dark border-2">
                <Col className="col-9 p-1 border-right border-dark border-2">** NON-NEGOTIABLE ** DIRECT DEPOSIT RECEIPT **</Col>
                <Col className="col-3 p-1 text-center">VOID ** VOID **</Col>
            </Row>
            <Row className="">
                <Col>
                    <Row>Pay to the Order of</Row>
                </Col>
                <Col>
                    <Row>{`${employeeFirstName} ${employeeMiddleInitial} ${employeeLastName}`}</Row>
                    <Row>{employeeAddress1}</Row>
                    <Row>{employeeAddress2}</Row>
                    <Row>{`${employeeCity} ${employeeState} ${employeeZipCode}`}</Row>
                </Col>
                <Col className="col-3">
                    <Row>DIRECT DEPOSIT: $461.75</Row>
                    <Row>TO BANK ACCOUNT: XXXX6506</Row>
                    <Row>BANK ROUTING NUMBER: XXXX0379</Row>
                    <Row>NON - NEGOTIABLE</Row>
                </Col>
            </Row>
        </Container>
    );
}

export default PrintTemplate1;