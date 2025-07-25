import React, {useState} from "react";
import { useDispatch } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveIncomeDetails } from "../../redux/actions";
import { PAYPERIODTYPE } from "../../constants/globals";

const IncomeInfo = () => {
    const [ annualSalary, setAnnualSalary ] = useState(0);
    const [ periodStartDate, setPeriodStartDate ] = useState("");
    const [ periodEndDate, setPeriodEndDate ] = useState("");
    const [ periodPayDate, setPeriodPayDate ] = useState("");
    const [periodType, setPeriodType] = useState("Hourly");
    const [ annualSalaryTouched, setAnnualSalaryTouched ] = useState(false);
    const [ periodStartDateTouched, setPeriodStartDateTouched ] = useState(false);
    const [ periodEndDateTouched, setPeriodEndDateTouched ] = useState(false);
    const [ periodPayDateTouched, setPeriodPayDateTouched ] = useState(false);
    const [ periodTypeTouched, setPeriodTypeTouched ] = useState(false);

    const dispatch = useDispatch();

    const isFormValid = isValidDate(periodStartDate) && isValidDate(periodEndDate) && annualSalary > 0 && periodType !== "";

    function isValidDate(dateStr: string): boolean {
        // Expected format: MM/DD/YYYY
        const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
        if (!regex.test(dateStr)) return false;

        const [monthStr, dayStr, yearStr] = dateStr.split('/');
        const month = Number(monthStr);
        const day = Number(dayStr);
        const year = Number(yearStr);

        // Construct the date and check for validity
        const date = new Date(year, month - 1, day); // JS months are 0-indexed
        if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
            return false; // Invalid calendar date
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
        return date <= today; // Reject future dates
    }

    const handleSubmitGoNext = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(saveIncomeDetails({ annualSalary, periodStartDate, periodEndDate, periodType }));
        console.log("Income details saved:", { annualSalary, periodStartDate, periodEndDate, periodType });
        dispatch(updateAppSettings({ nextTabStep: "general" }));
        };

    const handleSubmitGoBack = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
//        dispatch(saveIncomeDetails({ annualSalary, periodStartDate, periodEndDate, checkNumber, periodType }));
        dispatch(updateAppSettings({ nextTabStep: "employee" }));
        };

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 mb-4">
                <h2>Income or Compensation Details</h2>
            </Row>
            <Row className="mb-4 mx-4  border p-4">
                <Form>
                    <Row>
                        <Form.Group as={Col} controlId="AnnualIncomeId">
                            <Form.Label>Annual income amount($)</Form.Label>
                            <Form.Control type="text" placeholder="Annual income amount($)" pattern="^\$?\d{1,3}(,\d{3})*$" value={annualSalary} onBlur={() => setAnnualSalaryTouched(true)} isInvalid={annualSalaryTouched && !annualSalary} onChange={e => setAnnualSalary(parseInt(e.target.value))}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid income amount.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="payPeriodTypeId">
                            <Form.Label>How often are you paid?</Form.Label>
                            <Form.Control as="select" onBlur={() => setPeriodTypeTouched(true)} isInvalid={periodTypeTouched && !periodType} onSelect={e => setPeriodType((e.target as HTMLSelectElement).value)}>
                                { PAYPERIODTYPE.map((p) => <option key={p.count} value={p.count}>{p.name}</option> )}
                            <Form.Control.Feedback type="invalid">
                                Please select a pay period type (weekly, monthly, etc.).
                            </Form.Control.Feedback>
                            </Form.Control>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="startDateId">
                            <Form.Label>Pay period start date</Form.Label>
                            <Form.Control type="date" placeholder="Pay period start date" value={periodStartDate} onBlur={() => setPeriodStartDateTouched(true)} isInvalid={periodStartDateTouched && !isValidDate(periodStartDate)} onChange={e => setPeriodStartDate(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid start date.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="endDateId">
                            <Form.Label>Pay period end date</Form.Label>
                            <Form.Control type="date" placeholder="Pay period end date" value={periodEndDate} onBlur={() => setPeriodEndDateTouched(true)} isInvalid={periodEndDateTouched && !isValidDate(periodEndDate)} onChange={e => setPeriodEndDate(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid end date.
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group as={Col} controlId="payDateId">
                            <Form.Label>Pay date</Form.Label>
                            <Form.Control type="date" placeholder="Pay period date" value={periodPayDate} onBlur={() => setPeriodPayDateTouched(true)} isInvalid={periodPayDateTouched && !isValidDate(periodPayDate)} onChange={e => setPeriodPayDate(e.target.value)}/>
                            <Form.Control.Feedback type="invalid">
                                Please provide a valid pay date.
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Row>
                </Form>
                <Row className="w-100 justify-content-end mt-5 p-2">
                    <Col>
                        <Button className="float-right " variant="secondary" onClick={handleSubmitGoBack} type="submit">Go Back</Button>
                    </Col>
                    <Col>
                        <Button className="float-left" disabled={!!isFormValid} onClick={handleSubmitGoNext} type="submit">Save & Continue</Button>
                    </Col>
                </Row>
            </Row>
        </Container>
    );
}

export default IncomeInfo;