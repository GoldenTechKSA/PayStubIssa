import React, { useState } from "react";
import "../../index.css";
import { Container } from "react-bootstrap";
import InputTabs from "../template/input-tabs";
import HorizontalGrid, { GridCell } from "./horizontal-grid";

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

const AppBody = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const gridCells: GridCell[] = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        imageUrl: `picture${i + 1}.png`,
        description: `Item ${i + 1}`,
    }));
   
    const handleToggle = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <>
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
    </div>
            <div className="horizontal-grid-outer">
                <HorizontalGrid cells={gridCells}/>
            </div>
            <div className="jumbotron">
                <Container className="no-print">
                    <InputTabs />
                </Container>
            </div>
        </>
    );
}

export default AppBody;
