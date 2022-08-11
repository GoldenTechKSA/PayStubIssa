import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import PrintTemplate0 from "../printpaystub/printTemplate0";
import PrintTemplate1 from "../printpaystub/printTemplate1";
import PrintTemplate2 from "../printpaystub/printTemplate2";
import PrintTemplate3 from "../printpaystub/printTemplate3";
import PrintTemplate4 from "../printpaystub/printTemplate4";
import PrintTemplate5 from "../printpaystub/printTemplate5";
import PrintTemplate6 from "../printpaystub/printTemplate6";
import PrintTemplate7 from "../printpaystub/printTemplate7";
import PrintTemplate8 from "../printpaystub/printTemplate8";
import PrintTemplate9 from "../printpaystub/printTemplate9";
import PrintTemplate10 from "../printpaystub/printTemplate10";
import PrintTemplate11 from "../printpaystub/printTemplate11";
import PrintTemplate12 from "../printpaystub/printTemplate12";
import PayPal from "../common/payPalPayment";
import * as templateTypes from "../../constants/templateTypes";
import templateNames from "../../assets/data/templateNames.json";

const PreviewTemplate = ({store}) => {
    const { templateType, canPrint } = useSelector( state => state.appSettings )
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