import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CheckBoxIcon from '@material-ui/icons/CheckBox';
// import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
// import CheckCircleIcon from '@material-ui/icons/CheckCircle';
//import PlayCircleFilledIcon from '@material-ui/icons/PlayCircleFilled';
//import PlayCircleFilledWhiteIcon from '@material-ui/icons/PlayCircleFilledWhite';

import { useSelector } from "react-redux";
import { Container } from "react-bootstrap";
import Table from "react-bootstrap/Table";

const StatusBar = () => {
    const { templateType } = useSelector( state => state.appSettings);
    return (
        <Container>
            <Table borderless={true} hover={false} >
                <tbody>
                    <tr>
                        <td>Initial size</td>
                        <td><CheckBoxIcon color="primary" fontSize="large"/></td>
                        <td><CheckBoxIcon color="primary" fontSize="large"/></td>
                        <td><CheckBoxIcon color="primary" fontSize="large"/></td>
                        <td><CheckBoxIcon color="primary" fontSize="large"/></td>
                        <td><CheckBoxIcon color="primary" fontSize="large"/></td>
                    </tr>
                </tbody>
            </Table>
        </Container>
    );
}

export default StatusBar;