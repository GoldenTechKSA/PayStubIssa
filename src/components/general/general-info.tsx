import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings, saveGeneralInfo } from "../../redux/actions";
import { useNavigate } from 'react-router-dom';
// import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

const GeneralInfo = () => {
    const [ employmentType, setEmploymentType ] = useState(0);
    const [ paymentType, setPaymentType ] = useState("");
    const [ payStubCount, setPayStubCount ] = useState("");
    const [ paymentFrequency, setPaymentFrequency ] = useState("Weekly");
    const [ checkNumber, setCheckNumber ] = useState("Weekly");
    const [ employmentTypeTouched, setEmploymentTypeTouched ] = useState(false);
    const [ paymentTypeTouched, setPaymentTypeTouched ] = useState(false);
    const [ payStubCountTouched, setPayStubCountTouched ] = useState(false);
    const [ paymentFrequencyTouched, setPaymentFrequencyTouched ] = useState(false);
    const [ checkNumberTouched, setCheckNumberTouched ] = useState(false);

//    const { templateId } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    const dispatch = useDispatch();
    const navigate = useNavigate();
 
    const handleSubmitPreviewPaystub = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(saveGeneralInfo({ employmentType, paymentType, paymentFrequency, payStubCount, checkNumber }));
// TODO: see if we need to introduce a preview input details before we print selected Template        
        navigate('/paystubPreview');
//        history.push(`/printTemplate/${templateId}`);
    };

    const isFormValid = isValidCheckNum(checkNumber) &&
        isValidStubCount(payStubCount) &&
        employmentType > 0 &&
        paymentType.trim() !== "" &&
        paymentFrequency.trim() !== "";

    function isValidCheckNum(input: string): boolean {
        const regex = /^\d{3,}$/; // Matches strings with only digits and at least 3 of them
        return regex.test(input);
    }
    function isValidStubCount(input: string): boolean {
        const regex = /^\d+$/; // Matches one or more digits
        return regex.test(input);
    }
    const handleSubmitGoBack = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
//        dispatch(saveGeneralInfo({ employmentType, paymentType, paymentFrequency, payStubCount, checkNumber }));
        dispatch(updateAppSettings({ nextTabStep: "income" }));
        };

        return (
            <Container className="m-0 p-0 no-gutters">
                <Row className="mt-3 bm-4">
                    <h2>General Information</h2>
                </Row>
                <Row className="mb-4 mx-4  border p-4">
                    <Form>
                        <Row>
                            <Form.Group as={Col} controlId="empolymentTypeId">
                                <Form.Label>Payment amount($)</Form.Label>
                                <Form.Control type="text" placeholder="Employment type" value={employmentType} onBlur={() => setEmploymentTypeTouched(true)} isInvalid={employmentTypeTouched && !employmentType} onChange={e => setEmploymentType(parseInt(e.target.value))} />
                                <Form.Control.Feedback type="invalid">Enter a valid payment amount.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="paymentTypeId">
                                <Form.Label>Payment type (hourly, salary)</Form.Label>
                                <Form.Control type="text" placeholder="Payment type" value={paymentType} onBlur={() => setPaymentTypeTouched(true)} isInvalid={paymentTypeTouched && !paymentType} onChange={e => setPaymentType(e.target.value)} />
                                <Form.Control.Feedback type="invalid">Please provide a valid payment type.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="paymentFrequencyId">
                                <Form.Label>Enter number of requested paystubs</Form.Label>
                                <Form.Control type="text" placeholder="How often you get paid?" value={paymentFrequency} onBlur={() => setPaymentFrequencyTouched(true)} isInvalid={paymentFrequencyTouched && !paymentFrequency} onChange={e => setPaymentFrequency(e.target.value)} />
                                <Form.Control.Feedback type="invalid">Please provide a valid payment frequency.</Form.Control.Feedback>
                            </Form.Group>
                        </Row>
                        <Row>
                            <Form.Group as={Col} className="mb-4" controlId="payStubCountId">
                                <Form.Label>Enter number of requested paystubs</Form.Label>
                                <Form.Control placeholder="example 1, 2 or 3" value={payStubCount} onBlur={() => setPayStubCountTouched(true)} isInvalid={payStubCountTouched && !isValidStubCount(payStubCount)} onChange={e => setPayStubCount(e.target.value)} />
                                <Form.Control.Feedback type="invalid">Please provide a valid number of paystubs.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="checkNumberId">
                                <Form.Label>Enter a check number</Form.Label>
                                <Form.Control placeholder="Enter a check number" value={checkNumber} onBlur={() => setCheckNumberTouched(true)} isInvalid={checkNumberTouched && !isValidCheckNum(checkNumber)} onChange={e => setCheckNumber(e.target.value)} />
                                <Form.Control.Feedback type="invalid">Please provide a valid check number (at least 3 digits).</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="StubNumberId">
                                <Form.Label>Enter paystub number</Form.Label>
                                <Form.Control placeholder="Enter paystub number" value={checkNumber} onBlur={() => setCheckNumberTouched(true)} isInvalid={checkNumberTouched && !isValidCheckNum(checkNumber)} onChange={e => setCheckNumber(e.target.value)} />
                                <Form.Control.Feedback type="invalid">Please provide a valid paystub number (at least 2 digits).</Form.Control.Feedback>
                            </Form.Group>
                        </Row>
                    </Form>
                <Row className="w-100 justify-content-end mt-5 p-2">
                    <Col>
                        <Button className="float-right " variant="secondary" onClick={handleSubmitGoBack} type="submit">Go Back</Button>
                    </Col>
                    <Col>
                        <Button className="float-left" disabled = {!!isFormValid} onClick={handleSubmitPreviewPaystub} type="submit">Preview your Paystub</Button>
                    </Col>
                </Row>
                </Row>
            </Container>
        );
}

export default GeneralInfo;