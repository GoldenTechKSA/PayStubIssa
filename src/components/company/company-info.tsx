import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveCompanyInfo } from "../../redux/actions";
import { STATESLIST } from "../../constants/globals";

const CompanyInfo = () => {
    const [companyName, setCompanyName] = useState("");
    const [companyEIN, setCompanyEIN] = useState("");
    const [companyAddress1, setCompanyAddress1] = useState("");
    const [companyAddress2, setCompanyAddress2] = useState("");
    const [companyCity, setCompanyCity] = useState("");
    const [companyState, setCompanyState] = useState("");
    const [companyZipCode, setCompanyZipCode] = useState("");
    const [companyLogo, setCompanyLogo] = useState("");
    const [companyPhone, setCompanyPhone] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");

    const dispatch = useDispatch();

    const handleSubmitGoBack = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
// I don't think I need to dispatch anything here.
//        dispatch(saveCompanyInfo({ companyName, companyEIN, companyAddress1, companyAddress2, companyCity, companyState, companyLogo, companyPhone, companyEmail }));
        dispatch(updateAppSettings({ nextTabStep: "template" }));
        };

    const handleSubmitGoNext = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(saveCompanyInfo({ companyName, companyEIN, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode, companyLogo, companyPhone, companyEmail }));
        dispatch(updateAppSettings({ nextTabStep: "employee" }));
    };

    return (
        <Container className="">
            <Row className="mt-3 mb-4">
                <h2>Company Information</h2>
            </Row>
            <Row className="mb-4 mx-4">
                <Form>
                    <Row>
                        <Form.Group as={Col} controlId="companyNameId">
                            <Form.Control placeholder="Enter Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyEinId">
                            <Form.Control placeholder="Company EIN" value={companyEIN} onChange={e => setCompanyEIN(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Form.Group controlId="companyAddress1Id">
                        <Form.Control placeholder="Enter Company Address (i.e 1234 Main St)" value={companyAddress1} onChange={e => setCompanyAddress1(e.target.value)}/>
                    </Form.Group>
                    <Form.Group controlId="companyAddress2Id">
                        <Form.Control placeholder="suite, unit, or floor" value={companyAddress2} onChange={e => setCompanyAddress2(e.target.value)}/>
                    </Form.Group>
                    <Row>
                        <Form.Group as={Col} controlId="companyCityId">
                            <Form.Control placeholder="City" value={companyCity} required onChange={e => setCompanyCity(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyStateId">
                            <Form.Control as="select" defaultValue="Choose state..." onChange={(e) => setCompanyState(e.target.value)}>
                                { STATESLIST.map((s) => <option key={s.code} value={s.code}>{s.name}</option> )}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyZipCodeId">
                            <Form.Control placeholder="Zip Code" value={companyZipCode} onChange={e => setCompanyZipCode(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="companyLogo">
                            <Form.Control placeholder="Enter Company Logo" value={companyLogo} onChange={e => setCompanyLogo(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyPhoneId">
                            <Form.Control placeholder="Enter Company Phone Number" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyEmailId">
                            <Form.Control type="email" placeholder="Enter Company Email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}/>
                        </Form.Group>
                    </Row>
                </Form>
            </Row>
            <Row className="w-100 justify-content-end row-relative">
                <Col>
                    <Button className="float-left" variant="secondary" onClick={handleSubmitGoBack} type="submit">Go Back</Button>
                </Col>
                <Col className="mr-4">
                    <Button className="float-right" onClick={handleSubmitGoNext} type="submit">Go Next</Button>
                </Col>
            </Row>
        </Container>
    );
}

export default CompanyInfo;