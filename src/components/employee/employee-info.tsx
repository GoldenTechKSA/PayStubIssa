import React, {useState} from "react";
import { useDispatch } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveEmployeeInfo } from "../../redux/actions";
import { FILINGSTATUS, STATESLIST } from "../../constants/globals";

const EmployeeInfo = () => {
    const [ employeeFirstName, setEmployeeFirstName ] = useState("");
    const [ employeeMiddleInitial, setEmployeeMiddleInitial ] = useState("");
    const [ employeeLastName, setEmployeeLastName ] = useState("");

    const [employeeAddress1, setEmployeeAddress1] = useState("");
    const [employeeAddress2, setEmployeeAddress2] = useState("");
    const [employeeCity, setEmployeeCity] = useState("");
    const [employeeState, setEmployeeState] = useState("");
    const [employeeZipCode, setEmployeeZipCode] = useState("");

    const [employeeSSN, setEmployeeSSN] = useState("");
    const [employeePhone, setEmployeePhone] = useState("");
    const [employeeEmail, setEmployeeEmail] = useState("");
    const [employeeMarriedStatus, setEmployeeMarriedStatus] = useState("");
    const [employeeHireDate, setEmployeeHireDate] = useState("");
    const [employeeID, setEmployeeID] = useState("");

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

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 mb-4">
                <h2>Enter Personal Information</h2>
            </Row>
            <Row className="mb-4 mx-4">
                <Form>
                    <Row>
                        <Form.Group as={Col} controlId="employeeFirstNameId">
                            <Form.Control type="text" placeholder="Enter First Name" value={employeeFirstName} onChange={e => setEmployeeFirstName(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} sm="2" controlId="employeeMidInitialId">
                            <Form.Control type="text" placeholder="Enter Middle Initial" value={employeeMiddleInitial} onChange={e => setEmployeeMiddleInitial(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeLastNameId">
                            <Form.Control type="text" placeholder="Enter Last Name" value={employeeLastName} onChange={e => setEmployeeLastName(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Form.Group controlId="employeeAddress1Id">
                        <Form.Control placeholder="Enter Employee Address (i.e 1234 Main St)" value={employeeAddress1} onChange={e => setEmployeeAddress1(e.target.value)}/>
                    </Form.Group>
                    <Form.Group controlId="employeeAddress2Id">
                        <Form.Control placeholder="Apartment, studio, or floor" value={employeeAddress2} onChange={e => setEmployeeAddress2(e.target.value)}/>
                    </Form.Group>
                    <Row>
                        <Form.Group as={Col} controlId="employeeCityId">
                            <Form.Control placeholder="City" value={employeeCity} onChange={e => setEmployeeCity(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeStateId">
                            <Form.Control as="select" defaultValue="State" onChange={e => setEmployeeState(e.target.value)} >
                                { STATESLIST.map((s) => <option key={s.code} value={s.code}>{s.name}</option> )}
                            </Form.Control>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeZipCodeId">
                            <Form.Control placeholder="Zip Code" value={employeeZipCode} onChange={e => setEmployeeZipCode(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="employeeSsnId">
                            <Form.Control type="text" placeholder="Enter SSN" value={employeeSSN} onChange={e => setEmployeeSSN(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeePhoneId">
                            <Form.Control type="text" placeholder="Enter Phone number" value={employeePhone} onChange={e => setEmployeePhone(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="employeeEmailId">
                            <Form.Control type="text" placeholder="Enter eMail" value={employeeEmail} onChange={e => setEmployeeEmail(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeId">
                            <Form.Control type="text" placeholder="Enter Employee ID" value={employeeID} onChange={e => setEmployeeID(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="hireDateId">
                            <Form.Control type="date" placeholder="Hiring Date" value={employeeHireDate} onChange={e => setEmployeeHireDate(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="employeeMarriedStatusId">
                            <Form.Control as="select" defaultValue="Filing Status (Marital Status)" onChange={e => setEmployeeMarriedStatus(e.target.value)}>
                                { FILINGSTATUS.map((f) => <option key={f.id} value={f.id}>{f.name}</option> )}
                            </Form.Control>
                        </Form.Group>
                    </Row>
                </Form>
            </Row>
            <Row className="w-100 justify-content-end row-relative">
                <Col>
                    <Button className="float-left" variant="secondary" onClick={handleSubmitGoBack}>Go Back</Button>
                </Col>
                <Col className="mr-4">
                    <Button className="float-right" onClick={handleSubmitGoNext}>Save & Continue</Button>
                </Col>
            </Row>
        </Container>
    );
}

export default EmployeeInfo;