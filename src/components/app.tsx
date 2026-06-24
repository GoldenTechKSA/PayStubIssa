import React from "react";
import { Route, Routes, Link as RouterLink } from "react-router-dom";
import { Container, Typography, Button } from "@mui/material";
import AppHeader from "./common/app-header";
import AppFooter from "./common/app-footer";
import AboutUsPage from "./common/about-us-page";
import FAQPage from "./common/faq-page";
import ContactUsPage from "./common/contact-us-page";
import HeroPage from "./common/hero-page";
import PrivacyPolicy from "./common/privacy-policy";
import AccessibilityPolicy from "./common/accessibility-policy";
import TermsOfUser from "./common/terms-of-use";
import { TelemetryConfig } from "../types/telemetry";
import { TelemetryProvider } from "../contexts/telemetry-context";
import TelemetryErrorBoundary from "./common/telemetry-error-boundary";
import PaystubWizard from "./wizard/PaystubWizard";

const NotFound: React.FC = () => (
  <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
    <Typography variant="h3" component="h1" gutterBottom>Page not found</Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
      The page you’re looking for doesn’t exist or has moved.
    </Typography>
    <Button component={RouterLink} to="/" variant="contained">Go home</Button>
  </Container>
);

const App: React.FC = () => {
  const telemetryConfig: TelemetryConfig = {
    endpoint: "/api/telemetry", // Replace with your actual endpoint
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
          <AppHeader />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HeroPage />} />
              <Route path="/create" element={<PaystubWizard />} />
              <Route path="/aboutUsPage" element={<AboutUsPage />} />
              <Route path="/FAQPage" element={<FAQPage />} />
              <Route path="/contactUsPage" element={<ContactUsPage />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/accessibility" element={<AccessibilityPolicy />} />
              <Route path="/terms" element={<TermsOfUser />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <AppFooter />
        </div>
      </TelemetryErrorBoundary>
    </TelemetryProvider>
  );
};

export default App;
