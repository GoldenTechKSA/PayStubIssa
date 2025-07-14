import React, { useEffect } from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
import BlurOnIcon from '@mui/icons-material/BlurOn';
import { green } from '@mui/material/colors';
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { AppSettings, PayStubDetails } from "../../assets/data/pay-stub-details";

const AppHeader = () => {
    const { templateId } = useSelector<PayStubDetails, AppSettings>( state => state.appSettings);
    useEffect(() => {
        console.log("paystubPreview templateId=", templateId);
    }, [templateId]);

    return (
        <Navbar className="no-print">
            <Container fluid>
                <Navbar.Brand href="/" style={{ fontSize: 36, color: green[500] }} ><BlurOnIcon style={{ fontSize: 48, color: green[500] }} />{' '}PayStubIssa</Navbar.Brand>
                <Navbar.Brand href="/specialOfferPage" className="AnimateDiv">Special Price!</Navbar.Brand>
                <Nav>
                    <Navbar.Brand href="/paystubPreview">Preview your Paystub</Navbar.Brand>
                </Nav>
                <Nav>
                    <NavLink className="navLinkClass" to="/dailySpecialPage">Daily Special</NavLink>
                    <NavLink className="navLinkClass" to="/aboutUsPage">About Us</NavLink>
                    <NavLink className="navLinkClass" to="/FAQPage">FAQ</NavLink>
                    <NavLink className="navLinkClass" to="/contactUsPage">Contact Us</NavLink>
                    <NavLink className="navLinkClass" to={`/printTemplate/${templateId}`}>Print Template</NavLink>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default AppHeader;