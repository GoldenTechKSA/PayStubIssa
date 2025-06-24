import React, {useState} from "react";
import { useDispatch } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveEmployeeInfo } from "../../redux/actions";
import { FILINGSTATUS, STATESLIST } from "../../constants/globals";

const EmployeeInfo = () => {
    const [ employeeFirstName, setEmployeeFirstName ] = useState("");
    const [ employeeMiddleInitial, setEmployeeMiddleInitial ] = useState("");
    const [ employeeLastName, setEmployeeLastName ] = useState("");
    const [ employeeFirstNameTouched, setEmployeeFirstNameTouched ] = useState(false);
    const [ employeeLastNameTouched, setEmployeeLastNameTouched ] = useState(false);

    const [employeeAddress1, setEmployeeAddress1] = useState("");
    const [employeeAddress2, setEmployeeAddress2] = useState("");
    const [employeeCity, setEmployeeCity] = useState("");
    const [employeeState, setEmployeeState] = useState("");
    const [employeeZipCode, setEmployeeZipCode] = useState("");
    const [employeeAddress1Touched, setEmployeeAddress1Touched] = useState(false);
    const [employeeCityTouched, setEmployeeCityTouched] = useState(false);
    const [employeeStateTouched, setEmployeeStateTouched] = useState(false);
    const [employeeZipCodeTouched, setEmployeeZipCodeTouched] = useState(false);

    const [employeeSSN, setEmployeeSSN] = useState("");
    const [employeePhone, setEmployeePhone] = useState("");
    const [employeeEmail, setEmployeeEmail] = useState("");
    const [employeeMarriedStatus, setEmployeeMarriedStatus] = useState("");
    const [employeeHireDate, setEmployeeHireDate] = useState("");
    const [employeeID, setEmployeeID] = useState("");
    const [employeeSSNTouched, setEmployeeSSNTouched] = useState(false);
    const [employeePhoneTouched, setEmployeePhoneTouched] = useState(false);
    const [employeeEmailTouched, setEmployeeEmailTouched] = useState(false);
    const [employeeMarriedStatusTouched, setEmployeeMarriedStatusTouched] = useState(false);
    const [employeeHireDateTouched, setEmployeeHireDateTouched] = useState(false);
    const [employeeIDTouched, setEmployeeIDTouched] = useState(false);

    const dispatch = useDispatch();

    const handleSubmitGoNext = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(saveEmployeeInfo({ employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode, employeeID, employeeSSN, employeePhone, employeeEmail, employeeMarriedStatus}));
        dispatch(updateAppSettings({ nextTabStep: "income" }));
        };

    const handleSubmitGoBack = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
//        dispatch(saveEmployeeInfo({ employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipcode, employeeSSN, employeePhone, employeeEmail, employeeMarriedStatus}));
        dispatch(updateAppSettings({ nextTabStep: "company" }));
        };
    const isFormValid = isValidName(employeeFirstName) && isValidName(employeeLastName) &&  isValidAddress(employeeAddress1) && isValidZipCode(employeeZipCode) &&
        isValidSSN(employeeSSN) && isValidPhone(employeePhone) && isValidID(employeeID) && isValidHireDate(employeeHireDate) &&
        employeeCity.trim().length >= 2 && employeeState && employeeEmail.trim().length > 0 && employeeMarriedStatus;

    // Validation functions
    function isValidName(name: string): boolean {
        return name.trim().length > 0 && /^[a-zA-Z\s]+$/.test(name);
    }
    function isValidAddress(address: string): boolean {
        return address.trim().length >= 5 && address.trim().length <= 255;
    }
    function isValidZipCode(zip: string): boolean {
        const regex = /^\d{5}$/;
        return regex.test(zip);
    }
    function isValidSSN(ssn: string): boolean {
        const regex = /^\d{3}-\d{2}-\d{4}$/; // Format: XXX-XX-XXXX
        return regex.test(ssn);
    }
    function isValidPhone(phone: string): boolean {
        const regex = /^(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
        return regex.test(phone);
    }
    function isValidID(id: string): boolean {
        return id.trim().length > 0 && /^[a-zA-Z0-9]+$/.test(id);
    }
    function isValidHireDate(dateStr: string): boolean {
        // Expected format: MM/DD/YYYY
        const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
        if (!regex.test(dateStr)) return false;

        const [monthStr, dayStr, yearStr] = dateStr.split('/');
        const month = Number(monthStr);
        const day = Number(dayStr);
        const year = Number(yearStr);

        // Construct the date and check for validity
        const date = new Date(year, month - 1, day); // JS months are 0-indexed
        if (
            date.getFullYear() !== year ||
            date.getMonth() + 1 !== month ||
            date.getDate() !== day
        ) {
            return false; // Invalid calendar date
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
        return date <= today; // Reject future dates
    }

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 mb-4">
                <h2>Enter Personal Information</h2>
            </Row>
            <Row className="mb-4 mx-4 border p-4">
                <Form>
                    <Row>
                        <Form.Group as={Col} controlId="employeeFirstNameId">
                            <Form.Control type="text" placeholder="Enter First Name" value={employeeFirstName} maxLength={100} onBlur={() => setEmployeeFirstNameTouched(true)} isInvalid={employeeFirstNameTouched && !isValidName(employeeFirstName)} onChange={e => setEmployeeFirstName(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid first name.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} sm="2" controlId="employeeMidInitialId">
                            <Form.Control type="text" placeholder="Enter Middle Initial" value={employeeMiddleInitial} onChange={e => setEmployeeMiddleInitial(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeLastNameId">
                            <Form.Control type="text" placeholder="Enter Last Name" value={employeeLastName} maxLength={100} onBlur={() => setEmployeeLastNameTouched(true)} isInvalid={employeeLastNameTouched && !isValidName(employeeLastName)} onChange={e => setEmployeeLastName(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid last name.
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Form.Group className="mb-2"  controlId="employeeAddress1Id">
                        <Form.Control placeholder="Enter Employee Address (i.e 1234 Main St)" value={employeeAddress1} onBlur={() => setEmployeeAddress1Touched(true)} isInvalid={employeeAddress1Touched && !isValidAddress(employeeAddress1)} onChange={e => setEmployeeAddress1(e.target.value)}/>
                        <Form.Control.Feedback type="invalid">
                            Please provide a valid address (at least 5 characters).
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-2" controlId="employeeAddress2Id">
                        <Form.Control placeholder="Apartment, studio, or floor" value={employeeAddress2} onChange={e => setEmployeeAddress2(e.target.value)}/>
                    </Form.Group>
                    <Row>
                        <Form.Group as={Col} controlId="employeeCityId">
                            <Form.Control placeholder="City" value={employeeCity} onBlur={() => setEmployeeCityTouched(true)} isInvalid={employeeCityTouched && !employeeCity} onChange={e => setEmployeeCity(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid city (at least 2 characters).
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeStateId">
                            <Form.Control as="select" defaultValue="State" onBlur={() => setEmployeeStateTouched(true)} isInvalid={employeeStateTouched && !employeeState} onChange={e => setEmployeeState(e.target.value)} >
                                { STATESLIST.map((s) => <option key={s.code} value={s.code}>{s.name}</option> )}
                            </Form.Control>
                            <Form.Control.Feedback type="invalid">
                                Please select a state.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeZipCodeId">
                            <Form.Control placeholder="Zip Code" value={employeeZipCode} onBlur={() => setEmployeeZipCodeTouched(true)} isInvalid={employeeZipCodeTouched && !isValidZipCode(employeeZipCode)} onChange={e => setEmployeeZipCode(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid zip code (5 digits).
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="employeeSsnId">
                            <Form.Control type="text" placeholder="Enter SSN" value={employeeSSN} onBlur={() => setEmployeeSSNTouched(true)} isInvalid={employeeSSNTouched && !isValidSSN(employeeSSN)} onChange={e => setEmployeeSSN(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid SSN (format: XXX-XX-XXXX).
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeePhoneId">
                            <Form.Control type="text" placeholder="Enter Phone number" value={employeePhone} onBlur={() => setEmployeePhoneTouched(true)} isInvalid={employeePhoneTouched && !isValidPhone(employeePhone)} onChange={e => setEmployeePhone(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid phone number (10 digits).
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="employeeEmailId">
                            <Form.Control type="text" placeholder="Enter Email" value={employeeEmail} onBlur={() => setEmployeeEmailTouched(true)} isInvalid={employeeEmailTouched && !/^\S+@\S+\.\S+$/.test(employeeEmail)} onChange={e => setEmployeeEmail(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid email address.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeId">
                            <Form.Control type="text" placeholder="Enter Employee ID" value={employeeID} onBlur={() => setEmployeeIDTouched(true)} isInvalid={employeeIDTouched && !isValidID(employeeID)} onChange={e => setEmployeeID(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid employee ID.
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="hireDateId">
                            <Form.Control type="date" placeholder="Hiring Date" value={employeeHireDate} onBlur={() => setEmployeeHireDateTouched} isInvalid={employeeHireDateTouched && !isValidHireDate(employeeHireDate)} onChange={e => setEmployeeHireDate(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid hire date.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeMarriedStatusId">
                            <Form.Control as="select" defaultValue="Filing Status (Marital Status)" onBlur={() => setEmployeeMarriedStatusTouched(true)} isInvalid={employeeMarriedStatusTouched && !employeeMarriedStatus} onChange={e => setEmployeeMarriedStatus(e.target.value)}>
                                { FILINGSTATUS.map((f) => <option key={f.id} value={f.id}>{f.name}</option> )}
                            <Form.Control.Feedback type="invalid">
                                Please select a marital status.
                            </Form.Control.Feedback>
                            </Form.Control>
                        </Form.Group>
                    </Row>
                </Form>
                <Row className="w-100 justify-content-end mt-5 p-2">
                    <Col>
                        <Button className="float-right" variant="secondary" onClick={handleSubmitGoBack}>Go Back</Button>
                    </Col>
                    <Col>
                        <Button className="float-left" disabled={!isFormValid} onClick={handleSubmitGoNext}>Save & Continue</Button>
                    </Col>
                </Row>
            </Row>
        </Container>
    );
}

export default EmployeeInfo;