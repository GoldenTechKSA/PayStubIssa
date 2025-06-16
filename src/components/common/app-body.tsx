import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";
import "../../index.css";
import { Container } from "react-bootstrap";
import InputTabs from "../input-tabs/input-tabs";
import HorizontalGrid, { GridCell } from "./horizontal-grid";

const AppBody = () => {
    const { nextTabStep } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    useEffect(() => {console.log("nextTabKey coming from userSelector=", nextTabStep);});

    const gridCells: GridCell[] = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        imageUrl: `picture${i + 1}.png`,
        description: `Item ${i + 1}`,
    }));
   
    return (
        <>
            {nextTabStep === "template" && <div className="horizontal-grid-outer">
                <HorizontalGrid cells={gridCells}/>
            </div> }
            <div className="jumbotron">
                <Container className="no-print">
                    <InputTabs />
                </Container>
            </div>
        </>
    );
}

export default AppBody;
