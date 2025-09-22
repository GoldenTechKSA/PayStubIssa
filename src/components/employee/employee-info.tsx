import React, {useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveEmployeeInfo } from "../../redux/actions";
import { FILINGSTATUS, STATESLIST } from "../../constants/globals";
import { EmployeeInfo as EmployeeDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { isValidDate as isValidHireDate } from "../../utils/util";

const EmployeeInfo = () => {
    const employee = useSelector<PayStubDetails, EmployeeDetails>(state => state.employeeInfo);

    const [employeeFirstName, setEmployeeFirstName ] = useState(employee.employeeFirstName || "");
    const [employeeMiddleInitial, setEmployeeMiddleInitial ] = useState(employee.employeeMiddleInitial || "");
    const [employeeLastName, setEmployeeLastName ] = useState(employee.employeeLastName || "");
    const [employeeAddress1, setEmployeeAddress1] = useState(employee.employeeAddress1 || "");
    const [employeeAddress2, setEmployeeAddress2] = useState(employee.employeeAddress2 || "");
    const [employeeCity, setEmployeeCity] = useState(employee.employeeCity || "");
    const [employeeState, setEmployeeState] = useState(employee.employeeState || "Washington");
    const [employeeZipCode, setEmployeeZipCode] = useState(employee.employeeZipCode || "");
    const [employeeSSN, setEmployeeSSN] = useState(employee.employeeSSN || "");
    const [employeePhone, setEmployeePhone] = useState(employee.employeePhone || "");
    const [employeeEmail, setEmployeeEmail] = useState(employee.employeeEmail || "");
    const [employeeMarriedStatus, setEmployeeMarriedStatus] = useState(employee.employeeMarriedStatus || "single");
    const [employeeHireDate, setEmployeeHireDate] = useState(employee.employeeHireDate || new Date()); // Default to today
    const [employeeID, setEmployeeID] = useState(employee.employeeID || "");

    const [ employeeFirstNameTouched, setEmployeeFirstNameTouched ] = useState(false);
    const [ employeeLastNameTouched, setEmployeeLastNameTouched ] = useState(false);
    const [employeeAddress1Touched, setEmployeeAddress1Touched] = useState(false);
    const [employeeCityTouched, setEmployeeCityTouched] = useState(false);
    const [employeeZipCodeTouched, setEmployeeZipCodeTouched] = useState(false);

    const dispatch = useDispatch();

    const handleSubmitGoNext = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        dispatch(saveEmployeeInfo({ employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode, employeeID, employeeSSN, employeePhone, employeeEmail, employeeHireDate, employeeMarriedStatus}));
        console.log("Employee Info Saved:", { employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2, employeeCity, employeeState, employeeZipCode, employeeID, employeeSSN, employeePhone, employeeEmail, employeeHireDate, employeeMarriedStatus });
        dispatch(updateAppSettings({ nextTabStep: "income" }));
    };

    const handleSubmitGoBack = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        dispatch(updateAppSettings({ nextTabStep: "company" }));
    };

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
    function isValidEmployeeID(id: string): boolean {
        return id.trim().length > 0 && /^[a-zA-Z0-9-]+$/.test(id);
    }

    // Overall form validity
    const isFormValid = isValidName(employeeFirstName) && isValidName(employeeLastName) &&  isValidAddress(employeeAddress1) && isValidZipCode(employeeZipCode) && employeeCity.trim().length >= 2 && employeeState;

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 mb-4">
                <h2>Personal Information</h2>
            </Row>
            <Row className="mb-4 mx-4 border p-4">
                <Form>
                    <Row> {/* FirstName, LastName */ }
                        <Form.Group as={Col} controlId="employeeFirstNameId">
                            <Form.Label required className="label_fontsize">Enter first name</Form.Label>
                            <Form.Control type="text" value={employeeFirstName} maxLength={100} onBlur={() => setEmployeeFirstNameTouched(true)} isInvalid={employeeFirstNameTouched && !isValidName(employeeFirstName)} onChange={e => setEmployeeFirstName(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid first name.</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} sm="2" controlId="employeeMidInitialId">
                            <Form.Label className="label_fontsize">Enter middle initial</Form.Label>
                            <Form.Control type="text" value={employeeMiddleInitial} onChange={e => setEmployeeMiddleInitial(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col}  controlId="employeeLastNameId">
                            <Form.Label className="label_fontsize">Enter last name</Form.Label>
                            <Form.Control required type="text" value={employeeLastName} maxLength={100} onBlur={() => setEmployeeLastNameTouched(true)} isInvalid={employeeLastNameTouched && !isValidName(employeeLastName)} onChange={e => setEmployeeLastName(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid last name.</Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row> {/* Address, Apt, Suite, Unit */ }
                        <Form.Group as={Col} required className="mb-2"  controlId="employeeAddress1Id">
                            <Form.Label className="label_fontsize">Enter employee address</Form.Label>
                            <Form.Control value={employeeAddress1} onBlur={() => setEmployeeAddress1Touched(true)} isInvalid={employeeAddress1Touched && !isValidAddress(employeeAddress1)} onChange={e => setEmployeeAddress1(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid address (at least 5 characters).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} className="mb-2" controlId="employeeAddress2Id">
                            <Form.Label className="label_fontsize">Apartment, studio, or floor</Form.Label>
                            <Form.Control value={employeeAddress2} onChange={e => setEmployeeAddress2(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row> {/* City, State, Zipcode */ }
                        <Form.Group as={Col} controlId="employeeCityId">
                            <Form.Label className="label_fontsize">City</Form.Label>
                            <Form.Control required value={employeeCity} onBlur={() => setEmployeeCityTouched(true)} isInvalid={employeeCityTouched && !employeeCity} onChange={e => setEmployeeCity(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid city (at least 2 characters).</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeStateId">
                            <Form.Label className="label_fontsize">State</Form.Label>
                            <Form.Control as="select" value={employeeState} onChange={e => setEmployeeState(e.target.value)} >{ STATESLIST.map((s) => <option key={s.code} value={s.name}>{s.name}</option> )}</Form.Control>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeZipCodeId">
                            <Form.Label className="label_fontsize">Zip code</Form.Label>
                            <Form.Control required value={employeeZipCode} onBlur={() => setEmployeeZipCodeTouched(true)} isInvalid={employeeZipCodeTouched && !isValidZipCode(employeeZipCode)} onChange={e => setEmployeeZipCode(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">Please provide a valid zip code (5 digits).</Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                    <Row> {/* Employee SSN, Phone, employee ID */ }
                        <Form.Group as={Col} controlId="employeeSsnId">
                        <Form.Label className="label_fontsize">Enter employee SSN</Form.Label>
                            <Form.Control type="text" value={employeeSSN} onChange={e => setEmployeeSSN(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeePhoneId">
                            <Form.Label className="label_fontsize">Enter phone number</Form.Label>
                            <Form.Control type="text" value={employeePhone} onChange={e => setEmployeePhone(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeId">
                            <Form.Label className="label_fontsize">Enter employee ID</Form.Label>
                            <Form.Control type="text" value={employeeID} onChange={e => setEmployeeID(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row> {/* Employee Email, HireDate, Marital status */ }
                        <Form.Group as={Col} controlId="employeeEmailId">
                            <Form.Label className="label_fontsize">Enter employee email</Form.Label>
                            <Form.Control type="text" value={employeeEmail} onChange={e => setEmployeeEmail(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="hireDateId" >
                            <Form.Label className="label_fontsize">Hiring Date</Form.Label>
                            <Form.Control type="date" value={employeeHireDate.toISOString().split("T")[0]} onChange={e => setEmployeeHireDate(new Date(e.target.value))}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeMarriedStatusId">
                            <Form.Label className="label_fontsize">Choose Filing Status (Marital Status)</Form.Label>
                            <Form.Control as="select" value={employeeMarriedStatus} onChange={e => setEmployeeMarriedStatus(e.target.value)}>{ FILINGSTATUS.map((f) => <option key={f.id} value={f.id}>{f.name}</option> )}</Form.Control>
                        </Form.Group>
                    </Row>
                </Form>
                <Row className="w-100 justify-content-end mt-5 p-2">
                    <Col>
                        <Button className="float-right" variant="secondary" onClick={handleSubmitGoBack}>Go Back</Button>
                    </Col>
                    <Col>
                        <Button className="float-left" disabled={!isFormValid} onClick={handleSubmitGoNext} type="submit" >Save & Continue</Button>
                    </Col>
                </Row>
            </Row>
        </Container>
    );
}

export default EmployeeInfo;