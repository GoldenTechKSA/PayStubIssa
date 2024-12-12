import React from "react";
import { Container, Image } from "react-bootstrap";
import HeroImage from "../../assets/images/heroimage.png";

const HeroPage = () => {
    return (
        <div className="hero-container">
            <div className="overlay">
                <Container className="bg-light">
                    <h1 className="display-4">Effortlessly Generate Accurate Paystubs</h1>
                    <p className="lead">Streamline Your Payroll Process: Accurate, Compliant, and User-Friendly Paystubs for Your Business. Save Time, Reduce Errors, and Ensure Employee Satisfaction.</p>
                    <p>By following these steps and including all of the outlined details, a comprehensive and accurate paystub can be generated, ensuring both the employee and employer have all the necessary information for payroll records and tax purposes.</p>
                    <a className="btn btn-primary btn-lg" href="#" role="button">Get Started Today</a>
                </Container>
            </div>
        </div>
        );
    }

export default HeroPage;