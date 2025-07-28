import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings, saveGeneralInfo } from "../../redux/actions";
import { useNavigate } from 'react-router-dom';
import { PAYMENTMETHOD } from "../../constants/globals";
import { GeneralInfo as GeneralDetails, PayStubDetails } from "assets/data/pay-stub-details";

const GeneralInfo = () => {
    const general = useSelector<PayStubDetails, GeneralDetails>(state => state.generalInfo);
    const [ employmentType, setEmploymentType ] = useState(general.employmentType || "Contractor");
    const [ payStubCount, setPayStubCount ] = useState(general.payStubCount || 1);
    const [ payStubNumber, setPaystubNumber ] = useState(general.payStubNumber || 1);
    const [ checkNumber, setCheckNumber ] = useState(general.checkNumber || 5000);
    const [ paymentMethod, setPaymentMethod] = useState(general.paymentMethod || "Direct Deposit");
    const [ extraNotes, setExtraNotes ] = useState("");
    const [ payStubCountTouched, setPayStubCountTouched ] = useState(false);
    const [ paymentMethodTouched, setPaymentMethodTouched ] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
 
    const handleSubmitPreviewPaystub = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(saveGeneralInfo({ payStubCount, paymentMethod, payStubNumber, checkNumber, extraNotes }));
        console.log("General Info Saved:", { payStubCount, payStubNumber, checkNumber, extraNotes });
        console.log("moving to the next screen to preview the paystub details (paystubPreview)");
        navigate('/paystubPreview');
    };

    function isValidStubCount(input): boolean {
        const regex = /^\d+$/; // Matches one or more digits
        return regex.test(input);
    }

    function isValidCheckNum(input): boolean {
        const regex = /^\d{3,}$/; // Matches strings with only digits and at least 3 of them
        return regex.test(input);
    }

    const isFormValid = isValidCheckNum(checkNumber) && isValidStubCount(payStubCount);

    const handleSubmitGoBack = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(updateAppSettings({ nextTabStep: "income" }));
    };

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 bm-4">
                <h2>Miscellaneous Paystub details</h2>
            </Row>
            <Row className="mb-4 mx-4  border p-4">
                <Form>
                    
                    <Row>
                        <Form.Group as={Col} controlId="employmentTypeId">
                            <Form.Label>What type of employment applies to this pay period?</Form.Label>
                            <Form.Control placeholder="(e.g., full-time, part-time, contractor, salary)" value={employmentType} onChange={e => setEmploymentType(e.target.value)} />
                            <Form.Control.Feedback type="invalid">Please specify the employment category for this pay period (e.g., full-time, part-time, contract).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="paymentMethodId">
                            <Form.Label>Select the payment method for this pay period:</Form.Label>
                            <Form.Control as="select" value={paymentMethod} onBlur={() => setPaymentMethodTouched(true)} isInvalid={paymentMethodTouched && !paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                { PAYMENTMETHOD.map((p) => <option key={p.count} value={p.name}>{p.name}</option> )}
                            <Form.Control.Feedback type="invalid">Please Select how you received payment for this pay period. (e.g. via direct deposit, physical check, wire transfer, or other means.</Form.Control.Feedback>
                            </Form.Control>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} className="mb-4" controlId="payStubCountId">
                            <Form.Label>How many paystubs do you need?</Form.Label>
                            <Form.Control placeholder="example 1, 2 or 3" value={payStubCount} onBlur={() => setPayStubCountTouched(true)} isInvalid={payStubCountTouched && !isValidStubCount(payStubCount)} onChange={e => setPayStubCount(parseInt(e.target.value))} />
                            <Form.Control.Feedback type="invalid">Please provide a valid number of paystubs.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="checkNumberId">
                            <Form.Label>Enter check number associated with this paystub:</Form.Label>
                            <Form.Control placeholder="Enter a check number" value={checkNumber} isInvalid={!isValidCheckNum(checkNumber)} onChange={e => setCheckNumber(parseInt(e.target.value))} />
                            <Form.Control.Feedback type="invalid">Please provide a valid check number (at least 3 digits).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="paystubId">
                            <Form.Label>Enter paystub number associated with this pay period:</Form.Label>
                            <Form.Control placeholder="Enter paystub number" value={payStubNumber} onChange={e => setPaystubNumber(parseInt(e.target.value))} />
                            <Form.Control.Feedback type="invalid">Please provide a valid paystub number (at least 1 digit).</Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="extraNotesId">
                            <Form.Label>Additional Notes or Reference</Form.Label>
                            <Form.Control as="textarea" rows={2} placeholder="Extra notes for internal reference" value={extraNotes} onChange={e => setExtraNotes(e.target.value)} />
                        </Form.Group>
                    </Row>
                </Form>
            <Row className="w-100 justify-content-end mt-5 p-2">
                <Col>
                    <Button className="float-right " variant="secondary" onClick={handleSubmitGoBack} type="submit">Go Back</Button>
                </Col>
                <Col>
                    <Button className="float-left" disabled = {!isFormValid} onClick={handleSubmitPreviewPaystub} type="submit">Preview your Paystub</Button>
                </Col>
            </Row>
            </Row>
        </Container>
    );
}

export default GeneralInfo;