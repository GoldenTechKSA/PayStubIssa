import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Navbar, Nav } from "react-bootstrap";
import BlurOnIcon from '@material-ui/icons/BlurOn';
import { green } from '@material-ui/core/colors';
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

const AppHeader = () => {
    const { templateType } = useSelector( state => state.appSettings);
    return (
        <Navbar className="no-print" bg="dark" variant="dark">
            <Container fluid>
                <Navbar.Brand href="/" style={{ fontSize: 36, color: green[500] }} ><BlurOnIcon style={{ fontSize: 72, color: green[500] }} />{' '}PayStubIssa</Navbar.Brand>
                <Navbar.Brand href="/specialOfferPage" className="AnimateDiv">Special Price!</Navbar.Brand>
                <Nav>
                    <Navbar.Brand href="/paystubPreview">Preview your Paystub</Navbar.Brand>
                </Nav>
                <Nav>
                    <NavLink className="navLinkClass" to="/dailySpecialPage">Daily Special</NavLink>
                    <NavLink className="navLinkClass" to="/aboutUsPage">About Us</NavLink>
                    <NavLink className="navLinkClass" to="/FAQPage">FAQ</NavLink>
                    <NavLink className="navLinkClass" to="/contactUsPage">Contact Us</NavLink>
                    <NavLink className="navLinkClass" to={`/printTemplate/${templateType}`}>Print Template</NavLink>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default AppHeader;