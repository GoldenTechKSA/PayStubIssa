import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
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
import { telemetry } from "../../services/telemetry-service";
import { T } from "../../telemetry/codes";
import { isDevUnlock } from "../../utils/dev-flags";
import { normalizeStubCount } from "../../constants/pricing";
import { lockStatus, restorePayloads } from "../../utils/paid-lock";
import { paymentsApi, unlockStorage, PaymentsApiError } from "../../services/payments-api";

const STEPS = ["Company", "Employee", "Pay period", "Earnings", "Template", "Review"];
const DRAFT_KEY = "paystubissa.draft.v1";
// Template selection moves to its own step in a later phase; default to the
// reference template so the existing review/preview handoff renders.
const DEFAULT_CONFIG = "/configs/template-simple/paystub-config.xml";
const REVIEW = STEPS.length - 1;

const PaystubWizard = () => {
  const dispatch = useDispatch();
  const store = useStore<PayStubDetails>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [active, setActive] = useState(0);

  const company = useSelector((s: PayStubDetails) => s.companyInfo);
  const employee = useSelector((s: PayStubDetails) => s.employeeInfo);
  const income = useSelector((s: PayStubDetails) => s.incomeDetails);
  const general = useSelector((s: PayStubDetails) => s.generalInfo);
  const appSettings = useSelector((s: PayStubDetails) => s.appSettings);

  const hydrated = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  // A payment stored in this tab is checked with the server before the wizard is shown, so a
  // reload neither flashes step 1 nor unlocks anything the server no longer stands behind.
  const [restoring, setRestoring] = useState(
    () => !store.getState().appSettings.unlock && !!unlockStorage.load(),
  );

  // Hydrate any saved draft once, and default the template so the downstream preview renders.
  useEffect(() => {
    let cancelled = false;
    let draftRestored = false;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        draftRestored = true;
        const d = JSON.parse(raw);
        if (d.companyInfo) dispatch(saveCompanyInfo(d.companyInfo));
        if (d.employeeInfo) dispatch(saveEmployeeInfo(d.employeeInfo));
        if (d.incomeDetails) dispatch(saveIncomeDetails(d.incomeDetails));
        if (d.generalInfo) dispatch(saveGeneralInfo(d.generalInfo));
        if (d.template?.configPath) {
          dispatch(updateAppSettings({ configPath: d.template.configPath, templateId: d.template.templateId ?? 0 }));
        }
      }
    } catch {
      /* ignore malformed draft */
    }
    // An Offers card opens the wizard as `/create?stubs=N`. That count wins over the draft's
    // (the customer just picked a pack) but nothing else in the draft is touched. Anything
    // that is not a whole number of at least 1 is ignored; the parameter is then dropped from
    // the address so a reload or a shared link does not re-apply it.
    const params = new URLSearchParams(location.search);
    if (params.has("stubs")) {
      const raw = params.get("stubs") || "";
      if (/^\d+$/.test(raw) && Number(raw) >= 1) {
        dispatch(saveGeneralInfo({ payStubCount: normalizeStubCount(raw) }));
      }
      params.delete("stubs");
      const rest = params.toString();
      navigate({ pathname: location.pathname, search: rest ? `?${rest}` : "" }, { replace: true });
    }
    // Read the store, not the render's selector values: the draft's template was applied above.
    if (!store.getState().appSettings.configPath) {
      dispatch(updateAppSettings({ configPath: DEFAULT_CONFIG, templateId: 0 }));
    }
    // Local testing shortcut (never in production builds): `?dev=unlock` goes straight to
    // Review with print/PDF unlocked. The draft above still wins over the dev seed.
    if (isDevUnlock(location.search)) {
      dispatch(updateAppSettings({ canPrint: true }));
      setActive(REVIEW);
    }
    hydrated.current = true;
    telemetry.emit(T.WIZARD_ENTERED, { draftRestored });

    // A reload should not lose a payment: bring the stored unlock back once the server confirms
    // the token. An unreleased paid stub is put back exactly as it was paid for (this replaces
    // the draft and the template default above) and the wizard opens on Review.
    const stored = store.getState().appSettings.unlock ? null : unlockStorage.load();
    if (stored) {
      setRestoring(true);
      paymentsApi.verifyUnlock(stored.token)
        .then(v => {
          if (cancelled) return;
          // The server's fingerprint wins over whatever the browser kept (or lost).
          const unlock = { ...stored, qty: v.qty, expiresAt: v.expiresAt, fingerprint: v.fingerprint ?? stored.fingerprint };
          unlockStorage.save(unlock);
          if (!unlock.released && unlock.snapshot) {
            const p = restorePayloads(store.getState(), unlock.snapshot);
            dispatch(saveCompanyInfo(p.companyInfo));
            dispatch(saveEmployeeInfo(p.employeeInfo));
            dispatch(saveIncomeDetails(p.incomeDetails));
            dispatch(saveGeneralInfo(p.generalInfo));
            dispatch(updateAppSettings({ ...p.template, canPrint: true, unlock }));
            setActive(REVIEW);
            telemetry.emit(T.UNLOCK_RESTORED, { orderId: unlock.orderId });
          } else {
            dispatch(updateAppSettings({ unlock }));
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          // A token the server rejects is gone for good; any other failure (offline, API down)
          // keeps it for the next visit but unlocks nothing now.
          if (err instanceof PaymentsApiError && err.status === 401) unlockStorage.clear();
        })
        .finally(() => { if (!cancelled) setRestoring(false); });
    } else {
      setRestoring(false);
    }
    return () => {
      cancelled = true;
      telemetry.emit(T.WIZARD_EXITED, { lastStep: activeRef.current });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Autosave the draft after each change (skips the initial pre-hydration render).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          companyInfo: company, employeeInfo: employee, incomeDetails: income, generalInfo: general,
          template: { configPath: appSettings.configPath, templateId: appSettings.templateId },
        }),
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [company, employee, income, general, appSettings.configPath, appSettings.templateId]);

  // While the stub on screen is the one paid for (and the customer has not chosen to make
  // another), the wizard stays on Review and cannot be navigated away from it.
  const unlock = appSettings.unlock;
  const status = useMemo(
    () => lockStatus({ appSettings, companyInfo: company, employeeInfo: employee, incomeDetails: income, generalInfo: general }, unlock),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company, employee, income, general, appSettings.configPath, appSettings.templateId, unlock],
  );
  const frozen = status === "match" && !unlock?.released && !isDevUnlock(location.search);
  useEffect(() => {
    if (frozen && active !== REVIEW) setActive(REVIEW);
  }, [frozen, active]);
  const step = frozen ? REVIEW : active;

  // Scroll to top when changing step, and report which step is now on screen.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    telemetry.emit(T.WIZARD_STEP_VIEWED, { step: active, name: STEPS[active] });
  }, [active]);

  // Each step calls onNext only after its own validation passed, so "completed" is accurate.
  const goNext = () => {
    telemetry.emit(T.WIZARD_STEP_COMPLETED, { step: active, name: STEPS[active] });
    if (active < STEPS.length - 1) setActive(a => a + 1);
  };
  const goBack = () => {
    if (frozen) return;
    telemetry.emit(T.WIZARD_STEP_BACK, { step: active });
    if (active > 0) setActive(a => a - 1);
    else navigate("/");
  };
  // Stepper label click or a Review "Edit" button: a non-linear move.
  const jumpTo = (to: number) => {
    if (frozen) return;
    telemetry.emit(T.WIZARD_STEP_JUMPED, { from: active, to });
    setActive(to);
  };

  const stepProps = { onNext: goNext, onBack: goBack };

  return (
    <Container maxWidth={step >= 4 ? "lg" : "md"} sx={{ py: { xs: 3, sm: 5 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create your pay stub
      </Typography>

      {isMobile ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </Typography>
          <LinearProgress variant="determinate" value={((step + 1) / STEPS.length) * 100} sx={{ borderRadius: 1, height: 6 }} />
        </Box>
      ) : (
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map((label, i) => {
            const clickable = !frozen && i < step;
            return (
              <Step key={label} completed={i < step}>
                <StepLabel
                  onClick={() => { if (clickable) jumpTo(i); }}
                  sx={{ cursor: clickable ? "pointer" : "default" }}
                >
                  {label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      )}

      {restoring ? (
        <LinearProgress aria-label="Checking your payment" sx={{ my: 4 }} />
      ) : (
        <>
          {step === 0 && <CompanyStep {...stepProps} />}
          {step === 1 && <EmployeeStep {...stepProps} />}
          {step === 2 && <PayPeriodStep {...stepProps} />}
          {step === 3 && <EarningsStep {...stepProps} />}
          {step === 4 && <TemplateStep {...stepProps} />}
          {step === 5 && <ReviewStep onBack={goBack} onEdit={jumpTo} frozen={frozen} />}
        </>
      )}
    </Container>
  );
};

export default PaystubWizard;
