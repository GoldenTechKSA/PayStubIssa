import React, {useState} from "react";
import "../../index.css";
import { useNavigate } from "react-router-dom";
import HeroImage from "../../assets/images/heroimage.png";

const HeroPage = () => {
  const steps = [
    {
      title: "1. Start by selecting a paystub format from the list below.",
      details: "Choose from a variety of professional paystub templates to match your needs and preferences. Each format is designed for clarity and compliance.",
    },
    {
      title: "2. Enter Information such as company name, your work schedule and salary details",
      details: "Fill in your employer and employee details, work schedule, salary, and any deductions. Our form guides you through each required field for accuracy.",
    },
    {
      title: "3. Download and print your stub instantly",
      details: "Once your information is complete, generate your paystub instantly. Download it as a PDF and print or share as needed—no waiting required.",
    },
  ];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const navigate = useNavigate();
  const handleToggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <>
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
        <section>
            <div className="howitworks-container">
              <h2 className="howitworks-title">How Does Our Paystub Generator Work?</h2>
              <div className="howitworks-grid">
                {steps.map((step, idx) => (
                  <div
                    className={`howitworks-cell${openIndex === idx ? " open" : ""}`}
                    key={idx}
                    onClick={() => handleToggle(idx)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={openIndex === idx}
                  >
                    <div className="howitworks-step-title">{step.title}</div>
                    {openIndex === idx && (
                      <div className="howitworks-step-details">{step.details}</div>
                    )}
                  </div>
                ))}
            </div>
            <div className="howitworks-ready-title-wrapper">
              <div className="howitworks-ready-title">Ready? Click on 'Get Started Today' Button</div>
            </div>
          </div>
        </section>
    </>
  );
};

export default HeroPage;
