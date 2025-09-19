import React, {useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveIncomeDetails } from "../../redux/actions";
import { PAYPERIODTYPE } from "../../constants/globals";
import { IncomeDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { isValidDate, formatCurrency } from "../../utils/util";

const IncomeInfo = () => {
    const income = useSelector<PayStubDetails, IncomeDetails>(state => state.incomeDetails);
    const [ annualSalary, setAnnualSalary ] = useState(income.annualSalary);
    const [ periodStartDate, setPeriodStartDate ] = useState("");
    const [ periodEndDate, setPeriodEndDate ] = useState("");
    const [ periodPayDate, setPeriodPayDate ] = useState("");
    const [ periodType, setPeriodType] = useState(income.periodType || "Weekly");
    const [ wageType, setWageType] = useState(income.wageType || "Hourly");
    const [ hourlyRate, setHourlyRate] = useState<number>(income.hourlyRate || 0);
    const [ hoursWorked, setHoursWorked] = useState<number>(income.hoursWorked || 0);
    const [ overtimeRate, setOvertimeRate] = useState<number>(income.overtimeRate || 0);
    const [ overtimeHours, setOvertimeHoursWorked] = useState<number>(income.overtimeHours || 0);
    const [ bonusAmount, setBonusAmount ] = useState<number>(income.bonusAmount || 0 );
    const [ deduction401k, setDeduction401k ] = useState<number>(income.deduction401k || 0 );
    const [ medicalDeduction, setMedicalDeduction ] = useState<number>(income.medicalDeduction || 0 );
    const [ dentalDeduction, setDentalDeduction ] = useState<number>(income.dentalDeduction || 0 );
    const [ visionDeduction, setVisionDeduction ] = useState<number>(income.visionDeduction || 0 );
    const [ otherDeduction, setOtherDeduction ] = useState<number>(income.otherDeduction || 0 );

    const [ annualSalaryTouched, setAnnualSalaryTouched ] = useState(false);
    const [ periodStartDateTouched, setPeriodStartDateTouched ] = useState(false);
    const [ periodEndDateTouched, setPeriodEndDateTouched ] = useState(false);
    const [ periodPayDateTouched, setPeriodPayDateTouched ] = useState(false);
    const [ periodTypeTouched, setPeriodTypeTouched ] = useState(false);
    const [hourlyRateTouched, setHourlyRateTouched] = useState(false);
    const [hoursWorkedTouched, setHoursWorkedTouched] = useState(false);
    const [overtimeRateTouched, setOvertimeRateTouched] = useState(false);
    const [overtimeHoursWorkedTouched, setOvertimeHoursWorkedTouched] = useState(false);
    const [enableOtherDeductions, setEnableOtherDeductions] = useState(false);
    const [ bonusAmountTouched, setBonusAmountTouched ] = useState(false);
    
    const dispatch = useDispatch();

    const handleSubmitGoNext = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        dispatch(saveIncomeDetails({ annualSalary, wageType, hourlyRate, hoursWorked, overtimeHours, overtimeRate, bonusAmount, deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction, periodStartDate, periodEndDate, periodType }));
        console.log("Income details saved:", { annualSalary, wageType, hourlyRate, hoursWorked, periodStartDate, periodEndDate, periodType });
        dispatch(updateAppSettings({ nextTabStep: "general" }));
    };

    const handleSubmitGoBack = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        dispatch(updateAppSettings({ nextTabStep: "employee" }));
    };

    const isFormValid = isValidDate(periodStartDate) && isValidDate(periodEndDate) && annualSalary > 0 && ((wageType === "Hourly" && hourlyRate > 0 && hoursWorked > 0) || (wageType === "Salary" && annualSalary > 0)) && periodType !== "";

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 mb-4">
                <h2>Income or Compensation Details</h2>
            </Row>
            <Row className="mb-4 mx-4  border p-4">
                <Form>
                    <Row className="mb-3">
                        <Col>
                            <Form.Label className="mr-4">Do you earn wages hourly or receive a fixed salary?</Form.Label>
                            <Button variant={wageType === "Hourly" ? "primary" : "outline-primary"} onClick={() => setWageType("Hourly")} className="me-2">Hourly Wage</Button>
                            <Button variant={wageType === "Salary" ? "primary" : "outline-primary"} onClick={() => setWageType("Salary")}>Yearly Salary</Button>
                        </Col>
                        <Col>
                            <Form.Check type="checkbox" id="enableOtherDeductions" label="Include other deductions (Medical, Dental, Vision, 401k...)" className="mt-3" checked={enableOtherDeductions} onChange={e => setEnableOtherDeductions(e.target.checked)}/>                        
                        </Col>
                    </Row>
                    {wageType === "Hourly" && (
                        <Row>
                            <Form.Group as={Col} controlId="hourlyRateId">
                                <Form.Label>Hourly Rate ($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    placeholder="Hourly Rate"
                                    value={hourlyRate === 0 ? "" : hourlyRate}
                                    onBlur={() => setHourlyRateTouched(true)}
                                    isInvalid={hourlyRateTouched && hourlyRate <= 0}
                                    onChange={e => setHourlyRate(parseFloat(e.target.value))}
                                />
                                <Form.Control.Feedback type="invalid">Please provide a valid hourly rate.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="hoursWorkedId">
                                <Form.Label>Hours Worked</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    placeholder="Hours Worked"
                                    value={hoursWorked === 0 ? "" : hoursWorked}
                                    onBlur={() => setHoursWorkedTouched(true)}
                                    isInvalid={hoursWorkedTouched && hoursWorked <= 0}
                                    onChange={e => setHoursWorked(parseFloat(e.target.value))}
                                />
                                <Form.Control.Feedback type="invalid">Please provide a valid number of hours worked.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="overtimeRateId">
                                <Form.Label>Overtime Hourly Rate ($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    placeholder="Overtime Rate"
                                    value={overtimeRate === 0 ? "" : overtimeRate}
                                    onBlur={() => setOvertimeRateTouched(true)}
                                    isInvalid={overtimeRateTouched && overtimeRate <= 0}
                                    onChange={e => setOvertimeRate(parseFloat(e.target.value))}
                                />
                                <Form.Control.Feedback type="invalid">Please provide a valid overtime rate.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="overtimeWorkedId">
                                <Form.Label>Overtime Hours Worked</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    placeholder="Overtime Hours Worked"
                                    value={overtimeHours === 0 ? "" : overtimeHours}
                                    onBlur={() => setOvertimeHoursWorkedTouched(true)}
                                    isInvalid={overtimeHoursWorkedTouched && overtimeHours <= 0}
                                    onChange={e => setOvertimeHoursWorked(parseFloat(e.target.value))}
                                />
                                <Form.Control.Feedback type="invalid">Please provide a valid number of overtime hours worked.</Form.Control.Feedback>
                            </Form.Group>
                            <Form.Group as={Col} controlId="bounusAmountId">
                                <Form.Label>Bonus</Form.Label>
                                <Form.Control
                                    type="number"
                                    min={0}
                                    placeholder="Bonus Amount"
                                    value={bonusAmount === 0 ? "" : bonusAmount}
                                    onBlur={() => setBonusAmountTouched(true)}
                                    isInvalid={bonusAmountTouched &&  bonusAmount <= 0}
                                    onChange={e => setBonusAmount(parseFloat(e.target.value))}
                                />
                                <Form.Control.Feedback type="invalid">Please provide a valid Bonus amount.</Form.Control.Feedback>
                            </Form.Group>

                        </Row>
                    )}
                    {wageType === "Salary" && (
                        <Row>
                            <Form.Group as={Col} controlId="AnnualIncomeId">
                                <Form.Label>Salary Amount($)</Form.Label>
                                <Form.Control
                                    type="number"
                                    pattern="^\$?\d{1,3}(,\d{3})*$" onBlur={() => setAnnualSalaryTouched(true)} isInvalid={annualSalaryTouched && !annualSalary}
                                    placeholder="Base Salary (Pre-Tax)"
                                    value={annualSalary === 0 ? "" : annualSalary}
                                    onChange={e => setAnnualSalary(parseInt(e.target.value))}
                                />
                                <Form.Control.Feedback type="invalid">Please provide a valid income amount.</Form.Control.Feedback>
                            </Form.Group>
                        </Row>
                    )}
                    { enableOtherDeductions && (
                        <Row>
                            <Col as={Col} controlId="MedicalDeductionId">
                                <Form.Label>Medical ($)</Form.Label>
                                <Form.Control type="text" inputMode="numeric" placeholder="0.00" pattern="^\$?\d{1,3}(,\d{3})*(\.\d{2})?$" value={medicalDeduction === 0 ? "" : formatCurrency(medicalDeduction)} onChange={e => setMedicalDeduction(parseInt(e.target.value))}/>
                            </Col>
                            <Col as={Col} controlId="DentalDeductionId">
                                <Form.Label>Dental($)</Form.Label>
                                <Form.Control type="number" pattern="^\$?\d{1,3}(,\d{3})*$" value={dentalDeduction === 0 ? "" : dentalDeduction} onChange={e => setDentalDeduction(parseInt(e.target.value))}/>
                            </Col>
                            <Col as={Col} controlId="VisionDeductionId">
                                <Form.Label>Vision($)</Form.Label>
                                <Form.Control type="number" pattern="^\$?\d{1,3}(,\d{3})*$" value={visionDeduction === 0 ? "" : visionDeduction} onChange={e => setVisionDeduction(parseInt(e.target.value))}/>
                            </Col>
                            <Col as={Col} controlId="Deduction401kId">
                                <Form.Label>401k($)</Form.Label>
                                <Form.Control type="number" pattern="^\$?\d{1,3}(,\d{3})*$" value={deduction401k === 0 ? "" : deduction401k} onChange={e => setDeduction401k(parseInt(e.target.value))}/>
                            </Col>
                            <Col as={Col} controlId="OtherDeductionId">
                                <Form.Label>Other Deductions($)</Form.Label>
                                <Form.Control type="number" pattern="^\$?\d{1,3}(,\d{3})*$" value={otherDeduction === 0 ? "" : otherDeduction} onChange={e => setOtherDeduction(parseInt(e.target.value))}/>
                            </Col>
                        </Row>
                    )}
                    <Row>
                        <Form.Group as={Col} controlId="payPeriodTypeId">
                            <Form.Label>How often are you paid?</Form.Label>
                            <Form.Control as="select" required value={periodType} onBlur={() => setPeriodTypeTouched(true)} isInvalid={periodTypeTouched && !periodType} onChange={e => setPeriodType(e.target.value)}>
                                { PAYPERIODTYPE.map((p) => <option key={p.count} value={p.name}>{p.name}</option> )}
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
                        <Button className="float-left" disabled={!isFormValid} onClick={handleSubmitGoNext} type="submit">Save & Continue</Button>
                    </Col>
                </Row>
            </Row>
        </Container>
    );
}

export default IncomeInfo;