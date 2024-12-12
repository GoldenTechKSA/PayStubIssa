import React from "react";
import { Container } from "react-bootstrap";
import InputTabs from "../template/input-tabs";
import StatusBar from "./status-bar";

const AppBody = () => {
    return (
        <div className="jumbotron">
            {/* <Container className="no-print"> */}
            <StatusBar />
            <InputTabs />
            {/* </Container> */}
        </div>
    );
}

export default AppBody;