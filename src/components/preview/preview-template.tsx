import React from "react";
import { Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import PrintTemplate0 from "../printpaystub/printtemplate0";
import PrintTemplate1 from "../printpaystub/printtemplate1";
import PrintTemplate2 from "../printpaystub/printtemplate2";
import PrintTemplate3 from "../printpaystub/printtemplate3";
import PrintTemplate4 from "../printpaystub/printtemplate4";
import PrintTemplate5 from "../printpaystub/printtemplate5";
import PrintTemplate6 from "../printpaystub/printtemplate6";
import PrintTemplate7 from "../printpaystub/printtemplate7";
import PrintTemplate8 from "../printpaystub/printtemplate8";
import PrintTemplate9 from "../printpaystub/printtemplate9";
import PrintTemplate10 from "../printpaystub/printtemplate10";
import PrintTemplate11 from "../printpaystub/printtemplate11";
import PrintTemplate12 from "../printpaystub/printtemplate12";
import PayPal from "../common/paypal-payment";
import * as templateTypes from "../../constants/template-types";
import templateNames from "../../assets/data/template-names.json";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

const PreviewTemplate = ({store}) => {
    const { templateType, canPrint } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    return (
        <>
            <Row className={ canPrint ? "mt-5" : "no-print mt-5"}>
                <Col md={7} className="">
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_0 && <PrintTemplate0 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_1 && <PrintTemplate1 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_2 && <PrintTemplate2 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_3 && <PrintTemplate3 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_4 && <PrintTemplate4 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_5 && <PrintTemplate5 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_6 && <PrintTemplate6 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_7 && <PrintTemplate7 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_9 && <PrintTemplate8 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_10 && <PrintTemplate9 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_11 && <PrintTemplate10 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_12 && <PrintTemplate11 store={store}/> }
                    { templateType === templateTypes.PAYSTUB_TEMPLATE_12 && <PrintTemplate12 store={store}/> }
                </Col>
                <Col md={{span: 2, offset:1 }}>
                    <PayPal />
                </Col>
            </Row>
        </>
    );
}

export default PreviewTemplate;