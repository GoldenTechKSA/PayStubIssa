import React, { use, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";
import "../../index.css";
import { Container } from "react-bootstrap";
import InputTabs, {InputTabsProps} from "../input-tabs/input-tabs";
import HorizontalGrid, { GridCell } from "./horizontal-grid";

const AppBody = () => {
    const { nextTabStep, templateId } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
//    console.log(`1 AppBody:templateId= ${templateId}`);
    const [gridCells, setGridCells] = useState<GridCell[]>([]);

    useEffect(() => {
        // Fetch image names from the images folder
        fetch("/images/image-names.json")
            .then(res => res.json())
            .then((files: string[]) => {
                setGridCells(
                    files.map((file, i) => ({
                        id: i,
                        imageUrl: file,
                        description: `Description of Item ${i}`,
                    }))
                );
            });
    }, []);

    // useEffect(() => {
    //     console.log("2 AppBody: templateId =", templateId);
    // }, [templateId]);
    
    return (
        <>
            {
                nextTabStep === "template" && <div className="horizontal-grid-outer">
                    <HorizontalGrid currentIndex={templateId} cells={gridCells}/>
                </div>
            }
            <div className="jumbotron">
                <Container className="no-print">
                    <InputTabs id={templateId}/>
                </Container>
            </div>
        </>
    );
}

export default AppBody;
