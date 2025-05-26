import React from "react";
import { Container } from "react-bootstrap";
import InputTabs from "../template/input-tabs";
import HorizontalGrid, { GridCell } from "./horizontal-grid";
import HeroImage from "../../assets/images/heroimage.png";
import { useDispatch, useSelector } from "react-redux";
import { updateAppSettings } from "../../redux/actions";

const AppBody = () => {
    const dispatch = useDispatch();

    // Sample data for 10 cells
    const gridCells: GridCell[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        imageUrl: `../../assets/images/Image${i + 1}.png`,
        description: `Item ${i + 1}`,
    }));

    const handleCellClick = (cell: GridCell) => {
        console.log("Moving to next step with index = ", cell.id);
//        event.preventDefault();
        dispatch(updateAppSettings({ templateType: cell.id, nextTabStep: "company" }));
        alert(`You clicked ${cell.description}`);
    };
   
    return (
        <>
        <div className="horizontal-grid-outer">
            <HorizontalGrid cells={gridCells} onCellClick={handleCellClick}/>
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
