import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings, saveGeneralInfo } from "../../redux/actions";
import { useNavigate } from 'react-router-dom';
import { PAYMENTMETHOD } from "../../constants/globals";
import { EMPLOYMENTTYPE } from "../../constants/globals";
import { GeneralInfo as GeneralDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { isValidStubCount, isValidString } from "../../utils/util";

const GeneralInfo = () => {
    const general = useSelector<PayStubDetails, GeneralDetails>(state => state.generalInfo);
    const [ employmentType, setEmploymentType ] = useState(general.employmentType || "Contractor");
    const [ payStubCount, setPayStubCount ] = useState(general.payStubCount || 1);
    const [ payStubNumber, setPaystubNumber ] = useState(general.payStubNumber || 1);
    const [ checkNumber, setCheckNumber ] = useState(general.checkNumber || 5000);
    const [ paymentMethod, setPaymentMethod] = useState(general.paymentMethod || "None");
    const [ extraNotes, setExtraNotes ] = useState("");

    const [ employmentTypeTouched, setEmploymentTypeTouched ] = useState(false);
    const [ extraNotesTouched, setExtraNotesTouched ] = useState(false);
    const [ payStubCountTouched, setPayStubCountTouched ] = useState(false);
    const [ paymentMethodTouched, setPaymentMethodTouched ] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
 
    const handleSubmitPreviewPaystub = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        dispatch(saveGeneralInfo({ payStubCount, paymentMethod, payStubNumber, checkNumber, extraNotes }));
        navigate('/paystubPreview');
    };

    function isValidCheckNum(input): boolean {
        const regex = /^\d{3,}$/; // Matches strings with only digits and at least 3 of them
        return regex.test(input);
    }

    const handleSubmitGoBack = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(updateAppSettings({ nextTabStep: "income" }));
    };

    const isFormValid = isValidStubCount(payStubCount) && isValidString(employmentType) && isValidString(paymentMethod);

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 bm-4">
                <h2>Miscellaneous Paystub details</h2>
            </Row>
            <Row className="mb-4 mx-4  border p-4">
                <Form>
                    <Row>
                        <Form.Group as={Col} className="mb-4" controlId="payStubCountId">
                            <Form.Label className="label_fontsize">How many paystubs do you need? {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control placeholder="example 1, 2 or 3, etc." value={payStubCount} onBlur={() => setPayStubCountTouched(true)} isInvalid={payStubCountTouched && !isValidStubCount(payStubCount)} onChange={e => setPayStubCount(parseInt(e.target.value))} />
                            <Form.Control.Feedback type="invalid">Please provide a valid number of paystubs.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="checkNumberId">
                            <Form.Label className="label_fontsize">Enter check number associated with this paystub:</Form.Label>
                            <Form.Control placeholder="Enter a check number" value={checkNumber} isInvalid={!isValidCheckNum(checkNumber)} onChange={e => setCheckNumber(parseInt(e.target.value))} />
                            <Form.Control.Feedback type="invalid">Please provide a valid check number (at least 3 digits).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="paystubId">
                            <Form.Label className="label_fontsize">Enter paystub number associated with this pay period:</Form.Label>
                            <Form.Control placeholder="Enter paystub number" value={payStubNumber} onChange={e => setPaystubNumber(parseInt(e.target.value))} />
                            <Form.Control.Feedback type="invalid">Please provide a valid paystub number (at least 1 digit).</Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="employmentTypeId">
                            <Form.Label className="label_fontsize">What type of employment applies to this pay period?</Form.Label>
                            <Form.Control as="select" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>{ EMPLOYMENTTYPE.map((p) => <option key={p.id} value={p.name}>{p.name}</option> )}</Form.Control>
                        </Form.Group>
                        <Form.Group as={Col} controlId="paymentMethodId">
                            <Form.Label className="label_fontsize">Select the payment method for this pay period:</Form.Label>
                            <Form.Control as="select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>{ PAYMENTMETHOD.map((p) => <option key={p.count} value={p.name}>{p.name}</option> )}</Form.Control>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="extraNotesId">
                            <Form.Label className="label_fontsize">Additional Notes or Reference</Form.Label>
                            <Form.Control as="textarea" rows={2} placeholder="Extra notes for internal reference - Optional" value={extraNotes} onBlur={() => setExtraNotesTouched(true)} isInvalid={extraNotesTouched && !isValidString(extraNotes)} onChange={e => setExtraNotes(e.target.value)} />
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