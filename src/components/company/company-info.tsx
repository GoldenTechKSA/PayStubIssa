import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveCompanyInfo } from "../../redux/actions";
import { STATESLIST } from "../../constants/globals";
import { CompanyInfo as CompanyDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { EINInput } from "./ein-input";

const CompanyInfo = () => {
    const companyInfo = useSelector<PayStubDetails, CompanyDetails>(state => state.companyInfo);
    const [companyName, setCompanyName] = useState(companyInfo.companyName || "");
    const [companyEIN, setCompanyEIN] = useState(companyInfo.companyEIN || "");
    const [companyAddress1, setCompanyAddress1] = useState(companyInfo.companyAddress1 || "");
    const [companyAddress2, setCompanyAddress2] = useState(companyInfo.companyAddress2 || "");
    const [companyCity, setCompanyCity] = useState(companyInfo.companyCity || "");
    const [companyState, setCompanyState] = useState(companyInfo.companyState || "Washington");
    const [companyZipCode, setCompanyZipCode] = useState(companyInfo.companyZipCode || "");
    const [companyLogo, setCompanyLogo] = useState(companyInfo.companyLogo ||  "");
    const [companyPhone, setCompanyPhone] = useState(companyInfo.companyPhone || "");
    const [companyEmail, setCompanyEmail] = useState(companyInfo.companyEmail || "");
    const [companyLogoPreview, setCompanyLogoPreview] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);


    const [companyNameTouched, setCompanyNameTouched] = useState(false);
    const [companyAddress1Touched, setCompanyAddress1Touched] = useState(false);
    const [companyCityTouched, setCompanyCityTouched] = useState(false);
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
        dispatch(updateAppSettings({ nextTabStep: "employee" }));
    };

    const isFormValid = isValidCompanyName(companyName) && isValidAddress(companyAddress1) && companyCity.trim().length >= 2 && isValidZipCode(companyZipCode) && isValidUSPhone(companyPhone) && /^\S+@\S+\.\S+$/.test(companyEmail);

    // Handler for file upload
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyLogo(reader.result as string);
                setCompanyLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    return (
        <Container className="">
            <Row className="mt-3 mb-4">
                <h2>Company Information</h2>
            </Row>
            <Row className="mb-4 mx-4 border p-4">
                <Form>
                    <Row> {/* company name, company EIN */}
                        <Form.Group as={Col} controlId="companyNameId">
                            <Form.Label className="label_fontsize">Enter company name {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control required maxLength={100} onBlur={() => setCompanyNameTouched(true)} isInvalid={companyNameTouched && !isValidCompanyName(companyName)}  value={companyName} onChange={e => setCompanyName(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid company name(3–100 characters).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyEinId">
                            <EINInput value={companyEIN} onChange={setCompanyEIN}/>
                        </Form.Group>
                    </Row>
                    <Row> {/* company address 1, company address 2 */}
                        <Form.Group as={Col} className="mb-2" controlId="companyAddress1Id">
                            <Form.Label className="label_fontsize">Enter company address (i.e 1234 Main St) {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control required onBlur={() => setCompanyAddress1Touched(true)} isInvalid={companyAddress1Touched && !isValidAddress(companyAddress1)} value={companyAddress1} onChange={e => setCompanyAddress1(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid address (at least 5 characters).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} className="mb-2" controlId="companyAddress2Id">
                            <Form.Label className="label_fontsize">Suite, unit, or floor (i.e suite 100A)</Form.Label>
                            <Form.Control placeholder="suite, unit, or floor" value={companyAddress2} onChange={e => setCompanyAddress2(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row> {/* company city, company state, company zip code */}
                        <Form.Group as={Col} controlId="companyCityId">
                            <Form.Label className="label_fontsize">City {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control required onBlur={() => setCompanyCityTouched(true)} isInvalid={companyCityTouched && !companyCity} value={companyCity} onChange={e => setCompanyCity(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid city (at least 2 characters).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyStateId">
                            <Form.Label className="label_fontsize">State</Form.Label>
                            <Form.Control as="select" value={companyState} onChange={(e) => setCompanyState(e.target.value)}>{ STATESLIST.map((s) => <option key={s.code} value={s.name}>{s.name}</option> )}</Form.Control>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyZipCodeId">
                            <Form.Label className="label_fontsize">Zip code {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control required onBlur={() => setCompanyZipCodeTouched(true)} isInvalid={companyZipCodeTouched && !isValidZipCode(companyZipCode)} value={companyZipCode} onChange={e => setCompanyZipCode(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid zip code (5 digits).</Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row> {/* company phone, company email, company logo */}
                        <Form.Group as={Col} controlId="companyPhoneId">
                            <Form.Label className="label_fontsize">Enter company phone number {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control onBlur={() => setCompanyPhoneTouched(true)} isInvalid={companyPhoneTouched && !isValidUSPhone(companyPhone)} value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid phone number (10 digits).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyEmailId">
                            <Form.Label className="label_fontsize">Enter company email {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control type="email" onBlur={() => setCompanyEmailTouched(true)} isInvalid={companyEmailTouched && !/^\S+@\S+\.\S+$/.test(companyEmail)} value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid email address.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="companyLogo">
                            <Button variant="outline-primary" type="button" onClick={() => fileInputRef.current?.click()} className="mb-2">Upload Company Logo</Button>
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleLogoUpload}/>
                            {companyLogoPreview && (
                                <div className="mt-2">
                                    <img src={companyLogoPreview} alt="Company Logo Preview" style={{ maxWidth: "120px", maxHeight: "60px", borderRadius: "6px", border: "1px solid #eee" }}/>
                                </div>
                            )}
                        </Form.Group>
                    </Row>
                </Form>
                <Row className="w-100 justify-content-end mt-5 p-2">
                    <Col>
                        <Button className="float-right " variant="secondary" onClick={handleSubmitGoBack} type="submit">Go Back</Button>
                    </Col>
                    <Col>
                        <Button className="float-left" disabled={!isFormValid} onClick={handleSubmitGoNext} type="submit">Save & Continue</Button>
                    </Col>
                </Row>
            </Row>
        </Container>
    );
}

export default CompanyInfo;