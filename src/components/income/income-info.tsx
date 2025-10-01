import React, {useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Row, Col, Container, Button } from "react-bootstrap";
import { updateAppSettings, saveIncomeDetails } from "../../redux/actions";
import { PAYPERIODTYPE } from "../../constants/globals";
import { IncomeDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { isValidDate, formatCurrency } from "../../utils/util";
import { calculateEndDate, calculatePayDate } from "../../utils/date-calculator";

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
    const [ unionDues, setUnionDues ] = useState<number>(income.unionDues || 0 );

    const [ annualSalaryTouched, setAnnualSalaryTouched ] = useState(false);
    const [enableOtherDeductions, setEnableOtherDeductions] = useState(false);
    
    const dispatch = useDispatch();

    const handleSubmitGoNext = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        dispatch(saveIncomeDetails({ annualSalary, wageType, hourlyRate, hoursWorked, overtimeHours, overtimeRate, bonusAmount, deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction, periodStartDate, periodEndDate, periodPayDate, periodType, unionDues } ));
        // console.log("Income details saved:", { annualSalary, wageType, hourlyRate, hoursWorked, overtimeHours, overtimeRate, bonusAmount, deduction401k, medicalDeduction, dentalDeduction, visionDeduction, otherDeduction, periodStartDate, periodEndDate, periodPayDate, periodType, unionDues });
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

    const parseDeduction401k = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value.replace("%", "").trim();
        const parsed = parseFloat(value) / 100;
        setDeduction401k(isNaN(parsed) || value === "" ? 0 : parsed);
    }
    const parseUnionDues = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value.replace("%", "").trim();
        const parsed = parseFloat(value) / 100;
        setUnionDues(isNaN(parsed) || value === "" ? 0 : parsed);
    }

    // Calculate gross pay based on wage type and inputs
    const calculateGrossPay = (): number => {
        if (wageType === "Hourly") {
            return (hourlyRate * hoursWorked) + (overtimeRate * overtimeHours) + bonusAmount;
        } else { // Salary
            return annualSalary / (periodType === "Weekly" ? 52 : periodType === "Bi-Weekly" ? 26 : periodType === "Semi-Monthly" ? 24 : 12) + bonusAmount;
        }
    }

    // Handler for period type change
    const handlePeriodTypeChange = (e) => {
        const newPeriodType = e.target.value;
        setPeriodType(newPeriodType);
        
        if (periodStartDate && newPeriodType) {
            const calculatedEndDate = calculateEndDate(periodStartDate, newPeriodType);
            setPeriodEndDate(calculatedEndDate);
            
            if (calculatedEndDate) {
                const calculatedPayDate = calculatePayDate(calculatedEndDate);
                setPeriodPayDate(calculatedPayDate);
            }
        }
    };

    // Handler for start date change
    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setPeriodStartDate(newStartDate);
        
        if (newStartDate && periodType) {
        const calculatedEndDate = calculateEndDate(newStartDate, periodType);
        setPeriodEndDate(calculatedEndDate);
        
        if (calculatedEndDate) {
            const calculatedPayDate = calculatePayDate(calculatedEndDate);
            setPeriodPayDate(calculatedPayDate);
        }
        }
    };    

    // Form is valid only if all required fields are filled out correctly
    const isFormValid = isValidDate(periodStartDate) && isValidDate(periodEndDate) && isValidDate(periodPayDate) && ((wageType === "Hourly" && hourlyRate > 0 && hoursWorked > 0) || (wageType === "Salary" && annualSalary > 0));

    return (
        <Container className="m-0 p-0 no-gutters">
            <Row className="mt-3 mb-4">
                <h2>Income or Compensation Details</h2>
            </Row>
            <Row className="mb-4 mx-4  border p-4">
                <Form>
                    <Row className="mb-3"> {/* Wage Type Selection, either Hourly wage or yearly Salary */ }
                        <Col>
                            <Form.Label className="mr-4 label_fontsize">Do you earn wages hourly or receive a fixed salary?</Form.Label>
                            <Button variant={wageType === "Hourly" ? "primary" : "outline-primary"} onClick={() => setWageType("Hourly")} className="me-2">Hourly Wage</Button>
                            <Button variant={wageType === "Salary" ? "primary" : "outline-primary"} onClick={() => setWageType("Salary")}>Yearly Salary</Button>
                        </Col>
                    </Row>
                    {wageType === "Hourly" && (
                        <section className="section_background p-3 mb-3 rounded">
                            <Row className="my-0"> {/* Pay Description: pay, rate, hours, totals */ }
                                <Col>
                                    <Form.Label className="label_fontsize"> </Form.Label>
                                </Col>
                                <Col>
                                    <Form.Label className="label_fontsize">Rate (hourly)</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Label className="label_fontsize">Hours worked</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Label className="label_fontsize">Total</Form.Label>
                                </Col>
                            </Row>
                            <Row className="my-0 align-items-center"> {/* Regular Pay Row */ }
                                <Col>
                                    <Form.Label className="label_fontsize">Regular pay {<span className="required-asterisk">*</span>}</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Control required min="0" type="number" step="any" value={undefined} onChange={e => setHourlyRate(parseFloat(e.target.value))}/>
                                </Col>
                                <Col>
                                    <Form.Group controlId="hoursWorkedId">
                                        <Form.Control required min="0" type="number" step="any" value={undefined} onChange={e => setHoursWorked(parseFloat(e.target.value))}/>
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Label className="label_fontsize">{isNaN(hoursWorked) || isNaN(hourlyRate) ? "--" : formatCurrency(hoursWorked*hourlyRate)}</Form.Label>
                                </Col>
                            </Row>
                            <Row className="my-0 align-items-center"> {/* Overtime Pay Row */ }
                                <Col>
                                    <Form.Label className="label_fontsize">Overtime (if applicable)</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Control min="0" type="number" step="any" value={undefined} onChange={e => setOvertimeRate(parseFloat(e.target.value))}/>
                                </Col>
                                <Col>
                                    <Form.Control min="0" type="number" step="any" value={undefined} onChange={e => setOvertimeHoursWorked(parseFloat(e.target.value))}/>
                                </Col>
                                <Col>
                                    <Form.Label className="label_fontsize">{isNaN(overtimeHours) || isNaN(overtimeRate) ? "--" : formatCurrency(overtimeHours*overtimeRate)}</Form.Label>
                                </Col>
                            </Row>
                            <Row className="my-0 align-items-center"> {/* Bonus Pay Row */ }
                                <Col>
                                    <Form.Label className="label_fontsize">Bonus</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Control min="0" type="number" step="any" value={undefined} onChange={e => setBonusAmount(parseFloat(e.target.value))}/>
                                </Col>
                                <Col>
                                    <Form.Label className="label_fontsize"> </Form.Label>
                                </Col>
                                <Col>
                                    <Form.Label className="label_fontsize">{isNaN(bonusAmount) ? "--" : formatCurrency(bonusAmount)}</Form.Label>
                                </Col>
                            </Row>
                        </section>
                    )}
                    {wageType === "Salary" && (
                        <Row>
                            <Form.Group as={Col} controlId="AnnualIncomeId">
                                <Form.Label className="label_fontsize">Salary Amount($) {<span className="required-asterisk">*</span>}</Form.Label>
                                <Form.Control type="number" min="0" step="any" onBlur={() => setAnnualSalaryTouched(true)} isInvalid={annualSalaryTouched && !annualSalary} value={annualSalary} onChange={e => setAnnualSalary(parseFloat(e.target.value))}/>
                                <Form.Control.Feedback type="invalid">Please provide a valid income amount.</Form.Control.Feedback>
                            </Form.Group>
                        </Row>
                    )}
                    <Row className="mb-3"> {/* Wage Type Selection, either Hourly wage or yearly Salary */ }
                        <Form.Check type="checkbox" id="enableOtherDeductions" label="Include other deductions (Medical, Dental, Vision, 401k...)" className="mt-2 label_fontsize" checked={enableOtherDeductions} onChange={e => setEnableOtherDeductions(e.target.checked)}/>                        
                    </Row>
                    { enableOtherDeductions && (
                        <section className="section_background p-3 mb-3 rounded">
                            <Row className="my-0"> {/* Deductions Description: deduction type, amounts */ }
                                <Col className="col_background p-3 m-2 rounded">  {/* Medical, Dental, Vision, etc Deduction Col */ }
                                    <Row className="my-0 align-items-center">
                                        <Col>
                                            <Form.Label className="label_fontsize">Coverage Type</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">Deduction Amount</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">Per Pay Period</Form.Label>
                                        </Col>
                                    </Row>
                                    <Row className="my-0 align-items-center"> {/* Bonus Pay Row */ }
                                        <Col>
                                            <Form.Label className="label_fontsize">Medical</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control min="0" type="number" step="any" value={undefined} onChange={e => setMedicalDeduction(parseFloat(e.target.value))}/>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">{isNaN(medicalDeduction) ? "--" : formatCurrency(medicalDeduction)}</Form.Label>
                                        </Col>
                                    </Row>
                                    <Row className="my-0 align-items-center"> {/* Bonus Pay Row */ }
                                        <Col>
                                            <Form.Label className="label_fontsize">Dental</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control min="0" type="number" step="any" value={undefined} onChange={e => setDentalDeduction(parseFloat(e.target.value))}/>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">{isNaN(dentalDeduction) ? "--" : formatCurrency(dentalDeduction)}</Form.Label>
                                        </Col>
                                    </Row>
                                    <Row className="my-0 align-items-center"> {/* Bonus Pay Row */ }
                                        <Col>
                                            <Form.Label className="label_fontsize">Vision</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control min="0" type="number" step="any" value={undefined} onChange={e => setVisionDeduction(parseFloat(e.target.value))}/>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">{isNaN(visionDeduction) ? "--" : formatCurrency(visionDeduction)}</Form.Label>
                                        </Col>
                                    </Row>
                                    <Row className="my-0 align-items-center"> {/* Bonus Pay Row */ }
                                        <Col>
                                            <Form.Label className="label_fontsize">Others</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control min="0" type="number" step="any" value={undefined} onChange={e => setOtherDeduction(parseFloat(e.target.value))}/>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">{isNaN(otherDeduction) ? "--" : formatCurrency(otherDeduction)}</Form.Label>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col className="col_background p-3 m-2 rounded"> {/* 401K, Union Dues, etc Deduction Col */ }
                                    <Row className="my-0 align-items-center"> 
                                        <Col>
                                            <Form.Label className="label_fontsize">Benefit Type</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">Rate (%)</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">Per Paycheck</Form.Label>
                                        </Col>
                                    </Row>
                                    <Row className="my-0 align-items-center"> {/* Bonus Pay Row */ }
                                        <Col>
                                            <Form.Label className="label_fontsize">401K($)</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control min="0" type="number" step="any" value={undefined} onChange={parseDeduction401k}/>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">{isNaN(deduction401k) ? "--" : formatCurrency(calculateGrossPay()*deduction401k)}</Form.Label>
                                        </Col>
                                    </Row>
                                    <Row className="my-0 align-items-center"> {/* Bonus Pay Row */ }
                                        <Col>
                                            <Form.Label className="label_fontsize">Union Dues</Form.Label>
                                        </Col>
                                        <Col>
                                            <Form.Control min="0" type="number" step="any" value={undefined} onChange={parseUnionDues}/>
                                        </Col>
                                        <Col>
                                            <Form.Label className="label_fontsize">{isNaN(unionDues) ? "--" : formatCurrency(calculateGrossPay()*unionDues)}</Form.Label>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </section>
                    )}
                    <Row>
                        <Form.Group as={Col} controlId="payPeriodTypeId">
                            <Form.Label className="label_fontsize">How often are you paid?  *Tip - ensure that the period end date is not in the future</Form.Label>
                            <Form.Control as="select" value={periodType} onChange={handlePeriodTypeChange}>{ PAYPERIODTYPE.map((p) => <option key={p.count} value={p.name}>{p.name}</option> )}</Form.Control>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="startDateId">
                            <Form.Label className="label_fontsize">Pay period start date {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control required type="date" value={periodStartDate} onChange={handleStartDateChange}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="endDateId">
                            <Form.Label className="label_fontsize">Pay period end date {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control required type="date" value={periodEndDate} onChange={e => setPeriodEndDate(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="payDateId">
                            <Form.Label className="label_fontsize">Pay date {<span className="required-asterisk">*</span>}</Form.Label>
                            <Form.Control required type="date" value={periodPayDate} onChange={e => setPeriodPayDate(e.target.value)}/>
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
