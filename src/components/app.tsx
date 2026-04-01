import React from "react";
import { Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import AppHeader from "./common/app-header";
import AppFooter from "./common/app-footer";
import SpecialOfferPage from "./common/special-offer-page";
import PaystubPreview from "./paystub-details/details";
import DailySpecialPage from "./common/daily-special-page";
import AboutUsPage from "./common/about-us-page";
import FAQPage from "./common/faq-page";
import ContactUsPage from "./common/contact-us-page";
import PrintPreview from "./paystub-details/print-preview";
import store from "../redux/store";
import HeroPage from "./common/hero-page";
import AppBody from "./common/app-body";
import PrivacyPolicy from "./common/privacy-policy";
import AccessibilityPolicy from "./common/accessibility-policy";
import TermsOfUser from "./common/terms-of-use";
import { TelemetryConfig } from '../types/telemetry';
import { TelemetryProvider } from '../contexts/telemetry-context';
import TelemetryErrorBoundary from './common/telemetry-error-boundary';
import PrintComplete from "./paystub-details/print-complete";

const App: React.FC= () => {
    const telemetryConfig: TelemetryConfig = {
        endpoint: '/api/telemetry', // Replace with your actual endpoint
        batchSize: 5,
        flushInterval: 10000, // 10 seconds
        enableConsoleLogging: true, // Enable for development
        enablePerformanceTracking: true,
        enableErrorTracking: true,
        anonymizeData: false, // Set to true in production as needed
    };

    return (
    <TelemetryProvider config={telemetryConfig}>
        <TelemetryErrorBoundary componentName="App">
            <div className="app-root">
                <section>
                    <AppHeader />
                </section>
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<HeroPage />} />
                        <Route path="/appBody" element={<AppBody />} />
                        <Route path="/specialOfferPage" element={<SpecialOfferPage />} />
                        <Route path="/paystubPreview" element={<PaystubPreview />} />
                        <Route path="/dailySpecialPage" element={<DailySpecialPage />} />
                        <Route path="/aboutUsPage" element={<AboutUsPage />} />
                        <Route path="/FAQPage" element={<FAQPage />} />
                        <Route path="/contactUsPage" element={<ContactUsPage />} />
                        <Route path="/printTemplate/:templateId" element={<PrintPreview />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/accessibility" element={<AccessibilityPolicy />} />
                        <Route path="/terms" element={<TermsOfUser />} />
                        <Route path="/print-complete" element={<PrintComplete />} />
                        <Route element={<div><h1>Page Not Found!</h1></div>} />
                    </Routes>
                </main>
                <footer>
                    <AppFooter />
                </footer>
            </div>
        </TelemetryErrorBoundary>
    </TelemetryProvider>
    );
}

export default App;