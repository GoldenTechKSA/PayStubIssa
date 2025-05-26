import React from "react";
import { Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import AppHeader from "./common/app-header";
import AppFooter from "./common/app-footer";
import SpecialOfferPage from "./common/special-offer-page";
import PaystubPreview from "./preview/paystub-preview";
import DailySpecialPage from "./common/daily-special-page";
import AboutUsPage from "./common/about-us-page";
import FAQPage from "./common/faq-page";
import ContactUsPage from "./common/contact-us-page";
import PreviewTemplate from "./preview/preview-template";
import store from "../redux/store";
import HeroPage from "./common/hero-page";
import AppBody from "./common/app-body";

function App() {
    return (
        <>
            <AppHeader />
            <Routes>
                <Route path="/" element={<HeroPage />} />
                <Route path="/appBody" element={<AppBody />} />
                <Route path="/specialOfferPage" element={<SpecialOfferPage />} />
                <Route path="/paystubPreview" element={<PaystubPreview />} />
                <Route path="/dailySpecialPage" element={<DailySpecialPage />} />
                <Route path="/aboutUsPage" element={<AboutUsPage />} />
                <Route path="/FAQPage" element={<FAQPage />} />
                <Route path="/contactUsPage" element={<ContactUsPage />} />
                <Route path="/printTemplate/:templateType" element={<PreviewTemplate store={store.getState()} />} />
                <Route element={<div><h1>Page Not Found!</h1></div>} />
            </Routes>
            <AppFooter />
        </>
    );
}

export default App;