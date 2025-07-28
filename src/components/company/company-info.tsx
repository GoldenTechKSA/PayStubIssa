import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveCompanyInfo } from "../../redux/actions";
import { STATESLIST } from "../../constants/globals";
import { CompanyInfo as CompanyDetails, PayStubDetails } from "assets/data/pay-stub-details";

const CompanyInfo = () => {
    const companyInfo = useSelector<PayStubDetails, CompanyDetails>(state => state.companyInfo);
    const [companyName, setCompanyName] = useState(companyInfo.companyName || "");
    const [companyEIN, setCompanyEIN] = useState(companyInfo.companyEIN || "");
    const [companyAddress1, setCompanyAddress1] = useState(companyInfo.companyAddress1 || "");
    const [companyAddress2, setCompanyAddress2] = useState(companyInfo.companyAddress2 || "");
    const [companyCity, setCompanyCity] = useState(companyInfo.companyCity || "");
    const [companyState, setCompanyState] = useState(companyInfo.companyState || "");
    const [companyZipCode, setCompanyZipCode] = useState(companyInfo.companyZipCode || "");
    const [companyLogo, setCompanyLogo] = useState(companyInfo.companyLogo ||  "");
    const [companyPhone, setCompanyPhone] = useState(companyInfo.companyPhone || "");
    const [companyEmail, setCompanyEmail] = useState(companyInfo.companyEmail || "");

    const [companyNameTouched, setCompanyNameTouched] = useState(false);
    const [companyEINTouched, setCompanyEINTouched] = useState(false);
    const [companyAddress1Touched, setCompanyAddress1Touched] = useState(false);
    const [companyCityTouched, setCompanyCityTouched] = useState(false);
    const [companyStateTouched, setCompanyStateTouched] = useState(false);
    const [companyZipCodeTouched, setCompanyZipCodeTouched] = useState(false);
    const [companyPhoneTouched, setCompanyPhoneTouched] = useState(false);
    const [companyEmailTouched, setCompanyEmailTouched] = useState(false);

    const dispatch = useDispatch();
    
    // Validate EIN: 9 digits in the format XX-XXXXXXX
    function isValidEIN(ein: string): boolean {
        const regex = /^\d{2}-\d{7}$/;
        return regex.test(ein);
    }
    
    // Validate Zip Code: 5 digits
    function isValidZipCode(zip: string): boolean {
    const regex = /^\d{5}$/;
    return regex.test(zip);
    }
    
    // Validate Phone Number: 10 digits or formatted variants
    function isValidUSPhone(phone: string): boolean {
    // Matches: 4255551212, (425) 555-1212, 425-555-1212, 425.555.1212, 425 555 1212
    const regex = /^(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
    return regex.test(phone);
    }

    function isValidCompanyName(name: string): boolean {
      return name.trim().length >= 3 && name.trim().length <= 100;
    }

    function isValidAddress(address: string): boolean {
        return address.trim().length >= 5 && address.trim().length <= 255;
    }

    const handleSubmitGoBack = (event) => {
        dispatch(updateAppSettings({ nextTabStep: "template" }));
    };

    const handleSubmitGoNext = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        dispatch(saveCompanyInfo({ companyName, companyEIN, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode, companyLogo, companyPhone, companyEmail }));
        console.log("Company details saved:", { companyName, companyEIN, companyAddress1, companyAddress2, companyCity, companyState, companyZipCode, companyLogo, companyPhone, companyEmail });
        console.log("moving to the next screen <Employee Information>: (employee)");
        dispatch(updateAppSettings({ nextTabStep: "employee" }));
    };

    const isFormValid = isValidCompanyName(companyName) && isValidEIN(companyEIN) &&  isValidAddress(companyAddress1) && companyCity.trim().length >= 2 && companyState && 
        isValidZipCode(companyZipCode) && isValidUSPhone(companyPhone) && /^\S+@\S+\.\S+$/.test(companyEmail);

    return (
        <Container className="">
            <Row className="mt-3 mb-4">
                <h2>Company Information</h2>
            </Row>
            <Row className="mb-4 mx-4 border p-4">
                <Form>
                    <Row>
                        <Form.Group as={Col} controlId="companyNameId">
                            <Form.Control placeholder="Enter Company Name" maxLength={100} onBlur={() => setCompanyNameTouched(true)} isInvalid={companyNameTouched && !isValidCompanyName(companyName)}  required value={companyName} onChange={e => setCompanyName(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid company name(3–100 characters).
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyEinId">
                            <Form.Control placeholder="Company EIN" onBlur={() => setCompanyEINTouched(true)} isInvalid={companyEINTouched && !isValidEIN(companyEIN)} value={companyEIN} onChange={e => setCompanyEIN(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid EIN. It should be xx-xxxxxxx (9 digits).
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Form.Group className="mb-2" controlId="companyAddress1Id">
                        <Form.Control required placeholder="Enter Company Address (i.e 1234 Main St)" onBlur={() => setCompanyAddress1Touched(true)} isInvalid={companyAddress1Touched && !isValidAddress(companyAddress1)} value={companyAddress1} onChange={e => setCompanyAddress1(e.target.value)}/>
                        <Form.Control.Feedback type="invalid">
                            Please provide a valid address (at least 5 characters).
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-2" controlId="companyAddress2Id">
                        <Form.Control placeholder="suite, unit, or floor" value={companyAddress2} onChange={e => setCompanyAddress2(e.target.value)}/>
                    </Form.Group>
                    <Row>
                        <Form.Group as={Col} controlId="companyCityId">
                            <Form.Control placeholder="City" onBlur={() => setCompanyCityTouched(true)} isInvalid={companyCityTouched && !companyCity} value={companyCity} required onChange={e => setCompanyCity(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid city (at least 2 characters).
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyStateId">
                            <Form.Control required as="select" value={companyState} onBlur={() => setCompanyStateTouched(true)} isInvalid={companyStateTouched && !companyState} onChange={(e) => setCompanyState(e.target.value)}>
                                { STATESLIST.map((s) => <option key={s.code} value={s.name}>{s.name}</option> )}
                            </Form.Control>
                            <Form.Control.Feedback type="invalid">Please select a state.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyZipCodeId">
                            <Form.Control placeholder="Zip Code" onBlur={() => setCompanyZipCodeTouched(true)} isInvalid={companyZipCodeTouched && !isValidZipCode(companyZipCode)} value={companyZipCode} onChange={e => setCompanyZipCode(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid zip code (5 digits).
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="companyLogo">
                            <Form.Control placeholder="Enter Company Logo" value={companyLogo} onChange={e => setCompanyLogo(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid logo URL.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyPhoneId">
                            <Form.Control placeholder="Enter Company Phone Number" onBlur={() => setCompanyPhoneTouched(true)} isInvalid={companyPhoneTouched && !isValidUSPhone(companyPhone)} value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid phone number (10 digits).
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyEmailId">
                            <Form.Control type="email" placeholder="Enter Company Email" onBlur={() => setCompanyEmailTouched(true)} isInvalid={companyEmailTouched && !/^\S+@\S+\.\S+$/.test(companyEmail)} value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid email address.
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                </Form>
                <Row className="w-100 justify-content-end mt-5 p-2">
                    <Col>
                        <Button className="float-right " variant="secondary" onClick={handleSubmitGoBack} type="submit">Go Back</Button>
                    </Col>
                    <Col>
                    {/* enable this when we are ready for full validation <Button className="float-left" disabled={!isFormValid} onClick={handleSubmitGoNext} type="submit">Save & Continue</Button> */}
                        <Button className="float-left" onClick={handleSubmitGoNext} type="submit">Save & Continue</Button>
                    </Col>
                </Row>
            </Row>
        </Container>
    );
}

export default CompanyInfo;