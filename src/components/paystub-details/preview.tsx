import React from "react";
import { Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import PrintTemplate0 from "../print/template0/printTemplate0";
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
                </Col>
                <Col md={{span: 2, offset:1 }}>
                    <PayPal />
                </Col>
            </Row>
        </>
    );
}

export default Preview;