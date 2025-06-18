import React from "react";
import { Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import PrintTemplate0 from "../print/template0/printTemplate0";
import PrintTemplate1 from "../print/template1/printTemplate1";
import PrintTemplate2 from "../print/template2/printTemplate2";
import PrintTemplate3 from "../print/template3/printTemplate3";
import PrintTemplate4 from "../print/template4/printTemplate4";
import PrintTemplate5 from "../print/template5/printTemplate5";
import PrintTemplate6 from "../print/template6/printTemplate6";
import PrintTemplate7 from "../print/template7/printTemplate7";
import PrintTemplate8 from "../print/template8/printTemplate8";
import PrintTemplate9 from "../print/template9/printTemplate9";
import PrintTemplate10 from "../print/template10/printTemplate10";
import PrintTemplate11 from "../print/template11/printTemplate11";
import PrintTemplate12 from "../print/template12/printTemplate12";

import PayPal from "../common/paypal-payment";
import * as templateIds from "../../constants/template-ids";
import templateNames from "../../assets/data/template-names.json";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";

const Preview = ({store}) => {
    const { templateId, canPrint } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    return (
        <>
            <Row className={ canPrint ? "mt-5" : "no-print mt-5"}>
                <Col md={7} className="">
                    { templateId === templateIds.PAYSTUB_TEMPLATE_0 && <PrintTemplate0 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_1 && <PrintTemplate1 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_2 && <PrintTemplate2 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_3 && <PrintTemplate3 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_4 && <PrintTemplate4 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_5 && <PrintTemplate5 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_6 && <PrintTemplate6 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_7 && <PrintTemplate7 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_8 && <PrintTemplate8 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_9 && <PrintTemplate9 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_10 && <PrintTemplate10 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_11 && <PrintTemplate11 store={store}/> }
                    { templateId === templateIds.PAYSTUB_TEMPLATE_12 && <PrintTemplate12 store={store}/> }
                </Col>
                <Col md={{span: 2, offset:1 }}>
                    <PayPal />
                </Col>
            </Row>
        </>
    );
}

export default Preview;