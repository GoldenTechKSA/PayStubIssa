import React from "react";
import { Container } from "react-bootstrap";
import InputTabs from "../template/input-tabs";
import StatusBar from "./status-bar";

const AppBody = () => {
    return (
        <Container className="no-print">
            <StatusBar />
            <InputTabs />
        </Container>
    );
}

export default AppBody;