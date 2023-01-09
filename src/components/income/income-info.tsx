import React, {useState} from "react";
import { useDispatch } from "react-redux";
import { Form, Row, Col, Container } from "react-bootstrap";
import { updateAppSettings, saveIncomeDetails } from "../../redux/actions";
import { NavigateNext, NavigateBefore } from "@material-ui/icons";
import { StyledButton } from "../../constants/button-styles";
import { PAYPERIODTYPE } from "../../constants/globals";

const IncomeInfo = () => {
    const [ annualSalary, setAnnualSalary ] = useState(0);
    const [ periodStartDate, setPeriodStartDate ] = useState("");
    const [ periodEndDate, setPeriodEndDate ] = useState("");
    const [periodType, setPeriodType] = useState("Hourly");

    const dispatch = useDispatch();

    const handleSubmitGoNext = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.stopPropagation();
        }
        dispatch(saveIncomeDetails({ annualSalary, periodStartDate, periodEndDate, periodType }));
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
                <h2>Income Details</h2>
            </Row>
            <Row className="mb-4 mx-4">
                <Form>
                    <Row>
                        <Form.Group as={Col} controlId="AnnualIncomeId">
                            <Form.Control type="number" placeholder="Annual income amount($)" onChange={e => setAnnualSalary(parseInt(e.target.value))}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="startDateId">
                            <Form.Control type="date" placeholder="Pay period start date" onChange={e => setPeriodStartDate(e.target.value)}/>
                        </Form.Group>
                        <Form.Group as={Col} controlId="endDateId">
                            <Form.Control type="date" placeholder="Pay period end date" onChange={e => setPeriodEndDate(e.target.value)}/>
                        </Form.Group>
                    </Row>
                    <Row>
                        <Form.Group as={Col} controlId="payPeriodTypeId">
                            <Form.Control as="select" defaultValue="Pay period type..." onSelect={e => setPeriodType((e.target as HTMLSelectElement).value)}>
                                { PAYPERIODTYPE.map((p) => <option key={p.count} value={p.count}>{p.name}</option> )}
                            </Form.Control>
                        </Form.Group>
                    </Row>
                </Form>
            </Row>
            <Row className="w-100 justify-content-end row-relative">
                <Col>
                    <Form onSubmit={handleSubmitGoBack}>
                        <StyledButton startIcon={<NavigateBefore />} type="submit">Go Back</StyledButton>
                    </Form>
                </Col>
                <Col>
                    <Form className="float-right" onSubmit={handleSubmitGoNext}>
                        <StyledButton endIcon={<NavigateNext />} type="submit">Go Next</StyledButton>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default IncomeInfo;