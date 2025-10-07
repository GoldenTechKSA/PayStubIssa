import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AppSettings, PayStubDetails } from "assets/data/pay-stub-details";
import "../../index.css";
import { Container } from "react-bootstrap";
import InputTabs from "../input-tabs/input-tabs";
import HorizontalGrid, { ImageFileData } from "./horizontal-grid";

const AppBody = () => {
    const { nextTabStep, templateId } = useSelector<PayStubDetails, AppSettings>(state => state.appSettings);
    const [gridCells, setGridCells] = useState<ImageFileData[]>([]);
    const [index, setIndex] = useState<number>(templateId);
    const imageDataPath = `${process.env.PUBLIC_URL}/images/image-names.json`; 

    // Fetch image names from the images folder
    useEffect(() => {
        fetch(imageDataPath)   /* Use this line for local testing: `${process.env.PUBLIC_URL}/images/image-names.json` */
            .then(res => res.json())
            .then((imageData: ImageFileData[]) => {
                setGridCells(
                    imageData.map((data, i) => ({
                        id: i,
                        imageFile: data.imageFile,
                        imageName: data.imageName,
                        title: data.title,
                        description: data.description,
                    }))
                )})
            .catch(err => {console.error("Error fetching image names:", err);
        });
    }, []);

    const updateIndex = (i: number) => {
        setIndex(i);
    }

    return (
        <>
            { nextTabStep === "template" && <div className="horizontal-grid-outer"><HorizontalGrid updateIndex={updateIndex} currentIndex={index} cells={gridCells}/></div> }
            <div className="jumbotron"><Container className="no-print"><InputTabs id={index} images={gridCells}/></Container></div>
        </>
    );
}

export default AppBody;
