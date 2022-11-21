import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Tab, Tabs } from "react-bootstrap";
import GeneralInfo from "../general/GeneralInfo";
import CompanyInfo from "../company/CompanyInfo";
import EmployeeInfo from "../employee/EmployeeInfo";
import IncomeInfo from "../income/IncomeInfo";
import TemplateSelection from "../templateSelection/TemplateSelection";

const InputTabs = () => {
//    const [currentTabKey, setCurrentTabKey] = useState("template");
    const { nextTabStep } = useSelector( state => state.appSettings);

    useEffect(() => {
        console.log("nextTabKey coming from userSelector=", nextTabStep);
    });

    return (
        <Container className="no-print tab-container-relative">
            <Tabs className="mt-4" activeKey={nextTabStep} id="TemplateSelectionTabs" justify>
                <Tab className="tab-custom-height border border-2 border-dark " eventKey="template" title="Select Template" disabled={ nextTabStep !== "template" }>
                    <TemplateSelection />
                </Tab>
                <Tab className="tab-custom-height border border-2 border-dark" eventKey="company" title="Company Information" disabled={ nextTabStep !== "company" }>
                    <CompanyInfo />
                </Tab>
                <Tab className="tab-custom-height border border-2 border-dark" eventKey="employee" title="Employee Information" disabled={ nextTabStep !== "employee" }>
                    <EmployeeInfo />
                </Tab>
                <Tab className="tab-custom-height border border-2 border-dark" eventKey="income" title="Income Details" disabled={ nextTabStep !== "income" }>
                    <IncomeInfo />
                </Tab>
                <Tab className="tab-custom-height border border-2 border-dark" eventKey="general" title="General Information" disabled={ nextTabStep !== "general" }>
                    <GeneralInfo />
                </Tab>
            </Tabs>
        </Container>
    );
}

export default InputTabs;