import React from "react";
import "../../index.css";
import { useNavigate } from "react-router-dom";
import HeroImage from "../../assets/images/heroimage.png";

const HeroPage = () => {
    const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="heroContent">
        <h1 className="heroTitle">Effortlessly Generate Accurate Paystubs</h1>
        <p className="heroDescription">Streamline Your Payroll Process: Accurate, Compliant, and User-Friendly Paystubs for Your Business. Save Time, Reduce Errors, and Ensure Employee Satisfaction.</p>
        <p className="heroSubDescription">By following these steps and including all of the outlined details, a comprehensive and accurate paystub can be generated, ensuring both the employee and employer have all the necessary information for payroll records and tax purposes.</p>
        <button className="heroButton" onClick={() => navigate("/appBody")}>Get Started Today</button>
      </div>
      <div className="heroImageContainer">
        <img src= {HeroImage} alt="Hero Banner" className="heroImageFeathered" />
      </div>
    </section>
  );
};

export default HeroPage;
