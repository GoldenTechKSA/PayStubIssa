import React from "react";
import { Container } from "react-bootstrap";
import InputTabs from "../template/input-tabs";
import HorizontalGrid, { GridCell } from "./horizontal-grid";

const AppBody = () => {
    const gridCells: GridCell[] = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        imageUrl: `picture${i + 1}.png`,
        description: `Item ${i + 1}`,
    }));
   
    return (
        <>
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
