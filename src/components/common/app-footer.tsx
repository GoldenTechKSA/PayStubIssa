import React from "react";
import { Link } from "react-router-dom";
import { Image } from "react-bootstrap";
import PayPalImg from "../../assets/images/paypal.png";

const AppFooter = () => {
    return (
        <footer className="no-print footer d-flex align-items-center justify-content-between flex-wrap">
            <span className="footer-copyright">
                ©Copyright PayStubIssa(2020–2025). All rights reserved
            </span>
            <nav className="footer-links d-flex align-items-center">
                <Link to="/accessibility" className="mx-2" style={{ textDecoration: "none", cursor: "pointer" }}>Accessibility</Link>
                <Link to="/privacy" className="mx-2" style={{ textDecoration: "none", cursor: "pointer" }}>Privacy</Link>
                <Link to="/terms" className="mx-2" style={{ textDecoration: "none", cursor: "pointer" }}>Terms of Use</Link>
            </nav>
            <span className="footer-paypal">
                <Image rounded className="img-fluid" src={PayPalImg} alt="PayPal Acceptance Mark" />
            </span>
        </footer>
    );
};

export default AppFooter;