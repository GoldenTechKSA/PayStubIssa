import React from "react";
import { Container } from "react-bootstrap";
import "../../index.css";

const AboutUsPage: React.FC = () => {
    return (
        <Container fluid>
            <div className="highlight">
                <h1>How Our Pay Stub Generator Works</h1>
                <p>Creating accurate, professional pay stubs is simple with our tool—just follow these three easy steps:</p>
            </div>

            <div className="steps">
                <div className="step-title">Step 1: Enter Your Details</div>
                <ul>
                    <li><span className="check">&#10004;</span>Company name &amp; details</li>
                    <li><span className="check">&#10004;</span>Employee name, pay rate, and hours worked.</li>
                    <li><span className="check">&#10004;</span>Pay period dates and deductions (taxes, benefits, etc.)</li>
                    <li><span className="check">&#10004;</span>Any additional earnings (bonuses, overtime, etc.)</li>
                </ul>
                <p>Our secure form ensures all calculations are automatically verified for accuracy.</p>

                <div className="step-title">Step 2: Customize &amp; Preview</div>
                <ul>
                    <li><span className="check">&#10004;</span>Select a professional pay stub template that fits your needs.</li>
                    <li><span className="check">&#10004;</span>Instantly preview your pay stub with all entered details.</li>
                    <li><span className="check">&#10004;</span>Make adjustments if needed before finalizing.</li>
                </ul>

                <div className="step-title">Step 3: Download &amp; Print</div>
                <ul>
                    <li><span className="check">&#10004;</span>Save your pay stub as a PDF (print-ready format)</li>
                    <li><span className="check">&#10004;</span>Print or email it directly from your local machine.</li>
                    <li><span className="check">&#10004;</span>Access your documents anytime securely stored on your local machine.</li>
                </ul>
                <p>That’s it! No software installs, no waiting—just instant, professional pay stubs.</p>
            </div>

            <div className="features">
                <h2>Why Use Our Generator?</h2>
                <ul className="feature-list">
                    <li><span className="feature-check">&#9989;</span>IRS-compliant formats</li>
                    <li><span className="feature-check">&#9989;</span>Automatic tax &amp; deduction calculations</li>
                    <li><span className="feature-check">&#9989;</span>Secure &amp; confidential (256-bit encryption)</li>
                    <li><span className="feature-check">&#9989;</span>Mobile-friendly (create stubs on the go)</li>
                </ul>
            </div>

            <div className="support">
                Need help? Our support team is available 24/7.
            </div>
        </Container>
    );
};

export default AboutUsPage;
