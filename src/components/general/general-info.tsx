import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
import { updateAppSettings, saveGeneralInfo } from "../../redux/actions";

import { useNavigate } from 'react-router-dom';
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

const GeneralInfo = () => {
    const [ employmentType, setEmploymentType ] = useState(0);
    const [ paymentType, setPaymentType ] = useState("");
    const [ payStubCount, setPayStubCount ] = useState("");
    const [ paymentFrequency, setPaymentFrequency ] = useState("Weekly");
    const [ checkNumber, setCheckNumber ] = useState("Weekly");

    const [isEmploymentTypeHovered, setIsEmploymentTypeHovered] = useState(false);
    const [ isPaymentTypeHovered, setIsPaymentTypeHovered ] = useState(false);
    const [ isPayStubCountHovered, setIsPayStubCountHovered ] = useState(false);
    const [ isPaymentFrequencyHovered, setIsPaymentFrequencyHovered ] = useState(false);
    const [ isCheckNumberHovered, setIsCheckNumberHovered ] = useState(false);

    const { templateType } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings)
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
//        history.push(`/printTemplate/${templateType}`);
    };

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
                <Row className="mb-4 mx-4">
                    <Form>
                        <Row>
                            <Form.Group as={Col} controlId="empolymentTypeId" onMouseEnter={() => setIsEmploymentTypeHovered(true)} onMouseLeave={() => setIsEmploymentTypeHovered(false)}>
                                <Form.Control type="text" placeholder="Employment type" onChange={e => setEmploymentType(parseInt(e.target.value))} />
                                {isEmploymentTypeHovered && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "-2.2rem",
                                            right: 0,
                                            background: "#2a7ae2",
                                            color: "#fff",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "6px",
                                            fontSize: "0.95rem",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                            zIndex: 10,
                                        }}
                                    >Employment type</div>
                                )}
                            </Form.Group>
                            <Form.Group as={Col} controlId="paymentTypeId" onMouseEnter={() => setIsPaymentTypeHovered(true)} onMouseLeave={() => setIsPaymentTypeHovered(false)}>
                                <Form.Control type="text" placeholder="Payment type" onChange={e => setPaymentType(e.target.value)} />
                                {isPaymentTypeHovered && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "-2.2rem",
                                            right: 0,
                                            background: "#2a7ae2",
                                            color: "#fff",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "6px",
                                            fontSize: "0.95rem",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                            zIndex: 11,
                                        }}
                                    >Payment type</div>
                                )}
                            </Form.Group>
                            <Form.Group as={Col} controlId="paymentFrequencyId" onMouseEnter={() => setIsPaymentFrequencyHovered(true)} onMouseLeave={() => setIsPaymentFrequencyHovered(false)}>
                                <Form.Control type="text" placeholder="How often you get paid?" onChange={e => setPaymentFrequency(e.target.value)} />
                                {isPaymentFrequencyHovered && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "-2.2rem",
                                            right: 0,
                                            background: "#2a7ae2",
                                            color: "#fff",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "6px",
                                            fontSize: "0.95rem",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                            zIndex: 12,
                                        }}
                                    >How often you get paid?</div>
                                )}
                            </Form.Group>
                        </Row>
                        <Form.Group controlId="payStubCountId" onMouseEnter={() => setIsPayStubCountHovered(true)} onMouseLeave={() => setIsPayStubCountHovered(false)}>
                            <Form.Control placeholder="Enter number of requested paystubs" onChange={e => setPayStubCount(e.target.value)} />
                                {isPayStubCountHovered && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "-2.2rem",
                                        right: 0,
                                        background: "#2a7ae2",
                                        color: "#fff",
                                        padding: "0.5rem 1rem",
                                        borderRadius: "6px",
                                        fontSize: "0.95rem",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                        zIndex: 10,
                                    }}
                                >Enter number of requested paystubs</div>
                            )}
                        </Form.Group>
                        <Form.Group controlId="checkNumberId" onMouseEnter={() => setIsCheckNumberHovered(true)} onMouseLeave={() => setIsCheckNumberHovered(false)}>
                            <Form.Control placeholder="Enter a check number" onChange={e => setCheckNumber(e.target.value)} />
                            {isCheckNumberHovered && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "-2.2rem",
                                        right: 0,
                                        background: "#2a7ae2",
                                        color: "#fff",
                                        padding: "0.5rem 1rem",
                                        borderRadius: "6px",
                                        fontSize: "0.95rem",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                        zIndex: 10,
                                    }}
                                >Enter a check number</div>
                            )}
                        </Form.Group>
                    </Form>
                </Row>
                <Row className="w-100 justify-content-end row-relative">
                    <Col>
                        <Button className="float-left" variant="secondary" onClick={handleSubmitGoBack} type="submit">Go Back</Button>
                    </Col>
                    <Col className="mr-4">
                        <Button className="float-right" onClick={handleSubmitPreviewPaystub} type="submit">Preview your Paystub</Button>
                    </Col>
                </Row>
            </Container>
        );
}

export default GeneralInfo;