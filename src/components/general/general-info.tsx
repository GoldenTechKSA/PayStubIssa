import React, { useState } from "react";
import { NavigateNext, NavigateBefore } from "@material-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import { Container, Form, Row, Col } from "react-bootstrap";
import { updateAppSettings, saveGeneralInfo } from "../../redux/actions";
import { StyledButton } from "../../constants/button-styles";

import { useNavigate } from 'react-router-dom';
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

const GeneralInfo = () => {
    const [ employmentType, setEmploymentType ] = useState(0);
    const [ paymentType, setPaymentType ] = useState("");
    const [ payStubCount, setPayStubCount ] = useState("");
    const [ paymentFrequency, setPaymentFrequency ] = useState("Weekly");
    const [ checkNumber, setCheckNumber ] = useState("Weekly");

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
                            <Form.Group as={Col} controlId="empolymentTypeId">
                                <Form.Control type="text" placeholder="Employment type" onChange={e => setEmploymentType(parseInt(e.target.value))} />
                            </Form.Group>
                            <Form.Group as={Col} controlId="paymentTypeId">
                                <Form.Control type="text" placeholder="Payment type" onChange={e => setPaymentType(e.target.value)} />
                            </Form.Group>
                            <Form.Group as={Col} controlId="paymentFrequencyId">
                                <Form.Control type="text" placeholder="How often you get paid?" onChange={e => setPaymentFrequency(e.target.value)} />
                            </Form.Group>
                        </Row>
                        <Form.Group controlId="payStubCountId">
                            <Form.Control placeholder="Enter number of requested paystubs" onChange={e => setPayStubCount(e.target.value)} />
                        </Form.Group>
                        <Form.Group controlId="checkNumberId">
                            <Form.Control placeholder="Enter a check number" onChange={e => setCheckNumber(e.target.value)} />
                        </Form.Group>
                    </Form>
                </Row>
                <Row className="w-100 justify-content-end row-relative">
                    <Col>
                        <Form className="float-left" onSubmit={handleSubmitGoBack}>
                            <StyledButton startIcon={<NavigateBefore />} type="submit">Go Back</StyledButton>
                        </Form>
                    </Col>
                    <Col>
                        <Form className="float-right" onSubmit={handleSubmitPreviewPaystub}>
                            <StyledButton endIcon={<NavigateNext />} type="submit">Preview your Paystub</StyledButton>
                        </Form>
                    </Col>
                </Row>
            </Container>
        );
}

export default GeneralInfo;