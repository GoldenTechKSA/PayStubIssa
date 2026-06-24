import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container, Stepper, Step, StepLabel, Box, Typography, LinearProgress, useMediaQuery, useTheme,
} from "@mui/material";
import { PayStubDetails } from "assets/data/pay-stub-details";
import {
  saveCompanyInfo, saveEmployeeInfo, saveIncomeDetails, saveGeneralInfo, updateAppSettings,
} from "../../redux/actions";
import CompanyStep from "./steps/CompanyStep";
import EmployeeStep from "./steps/EmployeeStep";
import PayPeriodStep from "./steps/PayPeriodStep";
import EarningsStep from "./steps/EarningsStep";
import TemplateStep from "./steps/TemplateStep";
import ReviewStep from "./steps/ReviewStep";

const STEPS = ["Company", "Employee", "Pay period", "Earnings", "Template", "Review"];
const DRAFT_KEY = "paystubissa.draft.v1";
// Template selection moves to its own step in a later phase; default to the
// reference template so the existing review/preview handoff renders.
const DEFAULT_CONFIG = "/configs/template-simple/paystub-config.xml";

const PaystubWizard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [active, setActive] = useState(0);

  const company = useSelector((s: PayStubDetails) => s.companyInfo);
  const employee = useSelector((s: PayStubDetails) => s.employeeInfo);
  const income = useSelector((s: PayStubDetails) => s.incomeDetails);
  const general = useSelector((s: PayStubDetails) => s.generalInfo);
  const appSettings = useSelector((s: PayStubDetails) => s.appSettings);

  const hydrated = useRef(false);

  // Hydrate any saved draft once, and default the template so the downstream preview renders.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.companyInfo) dispatch(saveCompanyInfo(d.companyInfo));
        if (d.employeeInfo) dispatch(saveEmployeeInfo(d.employeeInfo));
        if (d.incomeDetails) dispatch(saveIncomeDetails(d.incomeDetails));
        if (d.generalInfo) dispatch(saveGeneralInfo(d.generalInfo));
      }
    } catch {
      /* ignore malformed draft */
    }
    if (!appSettings.configPath) {
      dispatch(updateAppSettings({ configPath: DEFAULT_CONFIG, templateId: 0 }));
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Autosave the draft after each change (skips the initial pre-hydration render).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ companyInfo: company, employeeInfo: employee, incomeDetails: income, generalInfo: general }),
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [company, employee, income, general]);

  // Scroll to top when changing step.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const goNext = () => {
    if (active < STEPS.length - 1) setActive(a => a + 1);
  };
  const goBack = () => {
    if (active > 0) setActive(a => a - 1);
    else navigate("/");
  };

  const stepProps = { onNext: goNext, onBack: goBack };

  return (
    <Container maxWidth={active >= 4 ? "lg" : "md"} sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create your pay stub
      </Typography>

      {isMobile ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Step {active + 1} of {STEPS.length}: {STEPS[active]}
          </Typography>
          <LinearProgress variant="determinate" value={((active + 1) / STEPS.length) * 100} sx={{ borderRadius: 1, height: 6 }} />
        </Box>
      ) : (
        <Stepper activeStep={active} sx={{ mb: 4 }}>
          {STEPS.map((label, i) => (
            <Step key={label} completed={i < active}>
              <StepLabel
                onClick={() => { if (i < active) setActive(i); }}
                sx={{ cursor: i < active ? "pointer" : "default" }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {active === 0 && <CompanyStep {...stepProps} />}
      {active === 1 && <EmployeeStep {...stepProps} />}
      {active === 2 && <PayPeriodStep {...stepProps} />}
      {active === 3 && <EarningsStep {...stepProps} />}
      {active === 4 && <TemplateStep {...stepProps} />}
      {active === 5 && <ReviewStep onBack={goBack} onEdit={setActive} />}
    </Container>
  );
};

export default PaystubWizard;
