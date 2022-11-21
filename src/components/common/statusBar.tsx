import React, {Icon} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../index.css";
import { useSelector } from "react-redux";
import { Container } from "react-bootstrap";

const StatusBar = () => {
    const { templateType } = useSelector( state => state.appSettings);
    const progressBarItems = [1, 2 ,3, 4, 5];
    const currentProgressStepIndex = templateType;
    return (
        <Container className="m-0 p-0 no-gutters">
            {(
              <div className="stepWrapper">
                {progressBarItems.map((x, i) => (
                  <div className="stepBlock" key={i}>
                    <div className="circleWrapper">
                      <div className="circle">{x}</div>
                    </div>
                    <span className="progressLineBlue"/>
                  </div>
                ))}
              </div>
            )}
        </Container>
    );
}

export default StatusBar;