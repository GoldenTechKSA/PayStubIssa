import React from "react";
import { Container } from "react-bootstrap";
import InputTabs from "../template/inputTabs";
import StatusBar from "./statusBar";

const AppBody = () => {
    return (
        <Container className="no-print">
            <StatusBar />
            <InputTabs />
        </Container>
    );
}

export default AppBody;