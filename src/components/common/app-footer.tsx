import React from "react";
import { Col, Image, Row} from "react-bootstrap";
import PayPalImg from "../../assets/images/paypal.png";

//<Image rounded className="img-fluid" src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_SbyPP_mc_vs_dc_ae.jpg" alt="PayPal Acceptance Mark" />
const AppFooter = () => {
    return (
        <Row className="no-print footer ">
            <Col className="ml-3 col-4 align-self-center">
                <span>©Copyright PayStubIssa(2020–2025). All rights reserved</span>
            </Col>
            <Col className="col-1 align-self-center">
                <span>Accessibility</span>
            </Col>
            <Col className="col-1 align-self-center">
                <span>Privacy</span>
            </Col>
            <Col className="col-1 align-self-center">
                <span>Legal</span>
            </Col>
            <Col className="m-2 col-offset-3 col-2">
                <Image rounded className="img-fluid" src={PayPalImg} alt="PayPal Acceptance Mark" />
            </Col>
        </Row>
    )
}

export default AppFooter;