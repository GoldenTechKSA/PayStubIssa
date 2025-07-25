import React from "react";
import { useSelector } from "react-redux";
import { Container, Tab, Tabs } from "react-bootstrap";
import GeneralInfo from "../general/general-info";
import CompanyInfo from "../company/company-info";
import EmployeeInfo from "../employee/employee-info";
import IncomeInfo from "../income/income-info";
import TemplateSelection from "../carousel/template-selection";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

export type InputTabsProps = {
  id: number;
};

const InputTabs: React.FC<InputTabsProps> = ({ id }) => {
    const { nextTabStep } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    const { templateId } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);

    return (
        <Container className="no-print tab-container-relative">
            <Tabs className="mt-4" activeKey={nextTabStep} id="TemplateSelectionTabs" justify>
                <Tab className="tab-custom-height border border-2 border-dark " eventKey="template" title="Select Template" disabled={ nextTabStep !== "template" }>
                    <TemplateSelection index={id} />
                </Tab>
                <Tab className="tab-custom-height" eventKey="company" title="Company Information" disabled={ nextTabStep !== "company" }>
                    <CompanyInfo />
                </Tab>
                <Tab className="tab-custom-height" eventKey="employee" title="Employee Information" disabled={ nextTabStep !== "employee" }>
                    <EmployeeInfo />
                </Tab>
                <Tab className="tab-custom-height" eventKey="income" title="Income Details" disabled={ nextTabStep !== "income" }>
                    <IncomeInfo />
                </Tab>
                <Tab className="tab-custom-height" eventKey="general" title="General Information" disabled={ nextTabStep !== "general" }>
                    <GeneralInfo />
                </Tab>
            </Tabs>
        </Container>
    );
}

export default InputTabs;