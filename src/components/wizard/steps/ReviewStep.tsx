import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  Grid, Box, Card, CardContent, Typography, Stack, Button, Divider, TextField, Alert, AlertTitle, Link, Chip,
  Checkbox, FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PayStubDetails } from "assets/data/pay-stub-details";
import {
  updateAppSettings, saveGeneralInfo, saveCompanyInfo, saveEmployeeInfo, saveIncomeDetails,
} from "../../../redux/actions";
import { contentOf, fingerprintOf, newSalt, lockStatus, restorePayloads, type PaidSnapshot } from "../../../utils/paid-lock";
import { isDevUnlock } from "../../../utils/dev-flags";
import { buildPaystubModels } from "../../../templates/utils/buildPaystubModel";
import { formatCurrency } from "../../../utils/util";
import { normalizeStubCount } from "constants/pricing";
import { usePrice } from "contexts/price-context";
import { paymentsApi, unlockStorage, centsToDollars, PaymentsApiError, type CapturedOrder, type Quote } from "services/payments-api";
import { ATTESTATION_TEXT, CORE_DISCLAIMER, FINAL_ONCE_PAID, FRAUD_WARNING, POLICIES_VERSION } from "constants/business-info";
import { telemetry } from "../../../services/telemetry-service";
import { T } from "../../../telemetry/codes";
import TemplateManager from "../../../templates/components/templatemanager";
import { FitPage } from "../FitPage";
import { StubPager } from "../StubPager";
import { PreviewWatermark } from "../PreviewWatermark";
import PayPal from "../../common/paypal-payment";
import PDFDownloadButton from "../../pdf/pdf-button-comp";
import "../print.css";

interface StepProps {
  onBack: () => void;
  onEdit: (stepIndex: number) => void;
}

const maskSSN = (ssn: string) => {
  const d = (ssn || "").replace(/\D/g, "");
  return d.length >= 4 ? `XXX-XX-${d.slice(-4)}` : "";
};
const maskEIN = (ein: string) => {
  const d = (ein || "").replace(/\D/g, "");
  return d.length >= 2 ? `${d.slice(0, 2)}-${"X".repeat(Math.max(0, d.length - 2))}` : "";
};

const SummarySection: React.FC<{ title: string; onEdit: () => void; rows: Array<[string, React.ReactNode]> }> = ({ title, onEdit, rows }) => (
  <Card variant="outlined" sx={{ borderColor: "divider" }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
        <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>Edit</Button>
      </Stack>
      <Stack spacing={0.5}>
        {rows.filter(([, v]) => v !== "" && v != null).map(([label, value]) => (
          <Stack key={label} direction="row" spacing={2} justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" sx={{ textAlign: "right" }}>{value}</Typography>
          </Stack>
        ))}
      </Stack>
    </CardContent>
  </Card>
);

const ReviewStep: React.FC<StepProps> = ({ onBack, onEdit }) => {
  const dispatch = useDispatch();
  const fullState = useSelector((s: PayStubDetails) => s);
  const { companyInfo, employeeInfo, incomeDetails, generalInfo, appSettings } = fullState;
  const location = useLocation();
  // Paid state. `canPrint` is set only after the server captured and verified the payment;
  // the unlock records a fingerprint of the content that was paid for, so any change to the
  // stub (or a larger count) re-locks the gate until the paid content is back.
  const unlock = appSettings.unlock;
  const status = useMemo(
    () => lockStatus(fullState, unlock),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyInfo, employeeInfo, incomeDetails, generalInfo, appSettings.configPath, appSettings.templateId, unlock],
  );

  const [extraNotes, setExtraNotes] = useState(generalInfo.extraNotes || "");

  // The customer must agree to the Terms and affirm the figures are real before we will take
  // their money. One box does both (clickwrap): its label links to the Terms and the Privacy
  // Policy and carries the Accuracy Attestation quoted in the Terms. `attestedAt` and the
  // policies version are recorded with the order, so each purchase shows what was agreed, and when.
  const [attested, setAttested] = useState(false);
  const [attestedAt, setAttestedAt] = useState<string | null>(null);

  const models = buildPaystubModels(fullState);

  const stubCount = normalizeStubCount(generalInfo.payStubCount);

  // Which stub of the run the preview and the pay summary show. The whole run is rendered
  // (print and the PDF need every page); on screen only this one is visible. Lands on stub 1
  // whenever the size of the run changes.
  const [activeStub, setActiveStub] = useState(0);
  useEffect(() => { setActiveStub(0); }, [stubCount]);
  const active = Math.min(activeStub, models.length - 1);
  const model = models[active];
  const goToStub = (i: number) => setActiveStub(Math.max(0, Math.min(models.length - 1, i)));

  // Swipe left/right between stubs on a touch screen.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) goToStub(active + (dx < 0 ? 1 : -1));
  };
  const canPrint = status === "match" || (isDevUnlock(location.search) && !!appSettings.canPrint);

  // Report each time the stub stops being the one that was paid for.
  const prevStatus = useRef<string | null>(null);
  useEffect(() => {
    if (status === "mismatch" && prevStatus.current !== "mismatch") {
      telemetry.emit(T.UNLOCK_CONTENT_MISMATCH, { orderId: unlock?.orderId ?? null });
    }
    prevStatus.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Coupon: the customer types a code and applies it; only the applied code is sent with the
  // quote and the order. The server is the only judge of what a code is worth.
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const cart = { items: [{ type: "paystub" as const, qty: stubCount }], ...(couponCode ? { couponCode } : {}) };

  const applyCoupon = () => {
    const code = couponInput.trim();
    setCouponError(null);
    setCouponCode(code ? code : null);
  };
  const removeCoupon = () => {
    setCouponInput("");
    setCouponError(null);
    setCouponCode(null);
  };

  // Server-authoritative quote for the displayed total. Until it answers (or if the API is
  // unreachable) the site-wide server price from PriceProvider stands in; with neither, the
  // amounts show as a dash rather than a guess.
  const unitCents = usePrice().priceFor(stubCount);
  const [quote, setQuote] = useState<Quote | null>(null);
  useEffect(() => {
    let cancelled = false;
    paymentsApi.quote(cart)
      .then(q => {
        if (cancelled) return;
        setQuote(q);
        if (couponCode) telemetry.emit(T.COUPON_APPLIED, { amountCents: q.discountCents });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (couponCode && err instanceof PaymentsApiError && err.code === "INVALID_COUPON") {
          // Drop the code and re-quote at full price; the message stays under the field.
          telemetry.emit(T.COUPON_REJECTED, { code: err.code });
          setCouponError(err.message);
          setCouponCode(null);
          return;
        }
        setQuote(null);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stubCount, couponCode]);
  const unitPrice = quote
    ? centsToDollars(quote.lines[0]?.unitCents ?? 0)
    : unitCents !== null ? centsToDollars(unitCents) : null;
  const total = quote
    ? centsToDollars(quote.totalCents)
    : unitCents !== null ? centsToDollars(unitCents * stubCount) : null;
  const money = (v: number | null) => (v === null ? "—" : formatCurrency(v));

  // A reload on this step should not lose a payment just made: restore the session unlock,
  // but only after the server confirms the token is genuine and its order really completed.
  useEffect(() => {
    if (appSettings.canPrint) return;
    const stored = unlockStorage.load();
    if (!stored) return;
    let cancelled = false;
    paymentsApi.verifyUnlock(stored.token)
      .then(v => {
        if (cancelled) return;
        dispatch(updateAppSettings({ canPrint: true, unlock: { ...stored, qty: v.qty, expiresAt: v.expiresAt } }));
        telemetry.emit(T.UNLOCK_RESTORED, { orderId: stored.orderId });
      })
      .catch(() => { if (!cancelled) unlockStorage.clear(); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stubs are most recent first, so the run spans from the LAST model's period start (the
  // earliest period) to the first model's period end.
  const latestStub = models[0];
  const earliestStub = models[models.length - 1];

  const handleAttestChange = (checked: boolean) => {
    setAttested(checked);
    setAttestedAt(checked ? new Date().toISOString() : null);
    telemetry.emit(T.REVIEW_ATTESTED, { attested: checked });
  };

  // What the customer is paying for, fixed at the moment they click the PayPal button. The
  // snapshot and salt stay in the browser; only the fingerprint goes to the server.
  const pending = useRef<{ salt: string; fingerprint: string; snapshot: PaidSnapshot } | null>(null);
  const beginCheckout = (): string => {
    const salt = newSalt();
    const snapshot = contentOf(fullState);
    const fingerprint = fingerprintOf(snapshot, salt);
    pending.current = { salt, fingerprint, snapshot };
    return fingerprint;
  };

  // Put the stub back exactly as it was when it was paid for.
  const restorePaid = () => {
    const snap = unlock?.snapshot;
    if (!unlock || !snap) return;
    const restored = { ...unlock, released: false };
    const p = restorePayloads(fullState, snap);
    dispatch(saveCompanyInfo(p.companyInfo));
    dispatch(saveEmployeeInfo(p.employeeInfo));
    dispatch(saveIncomeDetails(p.incomeDetails));
    dispatch(saveGeneralInfo(p.generalInfo));
    dispatch(updateAppSettings({ ...p.template, unlock: restored }));
    unlockStorage.save(restored);
    telemetry.emit(T.UNLOCK_PAID_RESTORED, { orderId: unlock.orderId });
  };

  const handlePaymentSuccess = (result: CapturedOrder) => {
    const paidQty = result.quote.lines.reduce((sum, l) => sum + l.qty, 0);
    const paid = pending.current;
    pending.current = null; // a checkout is used once
    const nextUnlock = {
      token: result.token, orderId: result.orderId, expiresAt: result.expiresAt, qty: paidQty,
      ...(paid ? {
        fingerprint: result.fingerprint ?? paid.fingerprint,
        salt: paid.salt,
        snapshot: paid.snapshot,
        released: false,
      } : {}),
    };
    unlockStorage.save(nextUnlock);
    dispatch(updateAppSettings({ canPrint: true, unlock: nextUnlock }));
    telemetry.emit(T.PAYMENT_SUCCEEDED, {
      orderId: result.orderId,
      amountCents: result.quote.totalCents,
      currency: result.quote.currency,
      stubCount: paidQty,
      templateId: appSettings.templateId ?? null,
    });
  };

  const handlePaymentError = (error: unknown) => {
    const message = error instanceof PaymentsApiError
      ? error.message
      : (error as any)?.message || String(error);
    telemetry.emit(T.PAYMENT_FAILED, { code: error instanceof PaymentsApiError ? error.code : null, message });
    alert(error instanceof PaymentsApiError ? message : "There was an error processing your payment. Please try again.");
  };

  const handlePrint = () => {
    telemetry.emit(T.PRINT_CLICKED);
    document.body.classList.add("print-paystub");
    // A single stub is centred on its sheet; a run of N has to keep flowing one per page,
    // so the centring is opt-in via this class rather than applied to every print.
    if (stubCount === 1) document.body.classList.add("print-paystub-single");
    const cleanup = () => {
      document.body.classList.remove("print-paystub");
      document.body.classList.remove("print-paystub-single");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  const saveNotes = () => dispatch(saveGeneralInfo({ extraNotes }));

  const employeeName = [employeeInfo.employeeFirstName, employeeInfo.employeeMiddleInitial, employeeInfo.employeeLastName].filter(Boolean).join(" ");
  const earningsValue = incomeDetails.wageType === "Salary"
    ? `${formatCurrency(incomeDetails.annualSalary || 0)} / year`
    : `${formatCurrency(incomeDetails.hourlyRate || 0)} × ${incomeDetails.hoursWorked || 0} hrs`;

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>Review &amp; finalize</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Check everything below. Your pay stub{stubCount === 1 ? "" : "s"} unlock{stubCount === 1 ? "s" : ""} for
        printing and PDF download after payment.
      </Typography>

      <Grid container spacing={3}>
        {/* Left: summary + pay + notes + payment */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            <SummarySection title="Company" onEdit={() => onEdit(0)} rows={[
              ["Name", companyInfo.companyName],
              ["Address", [companyInfo.companyAddress1, companyInfo.companyCity, companyInfo.companyState, companyInfo.companyZipCode].filter(Boolean).join(", ")],
              ["EIN", maskEIN(companyInfo.companyEIN)],
            ]} />

            <SummarySection title="Employee" onEdit={() => onEdit(1)} rows={[
              ["Name", employeeName],
              ["Address", [employeeInfo.employeeAddress1, employeeInfo.employeeCity, employeeInfo.employeeState, employeeInfo.employeeZipCode].filter(Boolean).join(", ")],
              ["SSN", maskSSN(employeeInfo.employeeSSN)],
              ["Filing status", employeeInfo.employeeMarriedStatus],
            ]} />

            <SummarySection title="Pay period" onEdit={() => onEdit(2)} rows={[
              ["Frequency", incomeDetails.periodType],
              // With a run of stubs, show the span the whole run covers, not just the first period.
              [stubCount === 1 ? "Period" : "Periods covered",
                `${String(earliestStub.incomeDetails.periodStartDate || "")} – ${String(latestStub.incomeDetails.periodEndDate || "")}`],
              [stubCount === 1 ? "Pay date" : "Most recent pay date", String(latestStub.incomeDetails.periodPayDate || "")],
              ["Pay stubs", stubCount],
            ]} />

            <SummarySection title="Earnings" onEdit={() => onEdit(3)} rows={[
              ["Wage type", incomeDetails.wageType],
              ["Pay", earningsValue],
            ]} />

            {/* Computed pay summary */}
            <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.default" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Pay summary{stubCount === 1 ? "" : ` (stub ${active + 1} of ${stubCount})`}
                </Typography>
                {/* The period the preview shows, with its year-to-date beside it so a run reads as growing. */}
                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ width: 96, textAlign: "right" }}>This period</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 96, textAlign: "right" }}>YTD</Typography>
                  </Stack>
                  {([
                    ["Gross pay", model.grossPay, model.grossPayYTD],
                    ["Taxes", -model.totalTaxes, -model.totalTaxesYTD],
                    ["Deductions", -model.totalDeductions, -model.totalDeductionsYTD],
                  ] as Array<[string, number, number]>).map(([label, value, ytd]) => (
                    <Stack key={label} direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{label}</Typography>
                      <Typography variant="body2" sx={{ width: 96, textAlign: "right" }}>{formatCurrency(value)}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 96, textAlign: "right" }}>{formatCurrency(ytd)}</Typography>
                    </Stack>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>Net pay</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="success.main" sx={{ width: 96, textAlign: "right" }}>{formatCurrency(model.netPay)}</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ width: 96, textAlign: "right" }}>{formatCurrency(model.netPayYTD)}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <TextField
              fullWidth multiline minRows={2} label="Notes (optional)"
              placeholder="Internal reference — does not appear on the pay stub"
              value={extraNotes} onChange={e => setExtraNotes(e.target.value)} onBlur={saveNotes}
            />

            {/* Payment gate */}
            <Card variant="outlined" sx={{ borderColor: canPrint ? "success.main" : "divider" }}>
              <CardContent>
                {canPrint ? (
                  <>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Payment complete — your {stubCount === 1 ? "pay stub is" : `${stubCount} pay stubs are`} unlocked.
                    </Alert>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                        {stubCount === 1 ? "Print pay stub" : `Print ${stubCount} pay stubs`}
                      </Button>
                      <PDFDownloadButton targetId="pdf-content" fileName="paystub" buttonText="Download PDF" />
                    </Stack>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Pay to unlock</Typography>
                    {status === "mismatch" && (
                      <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                        action={unlock?.snapshot ? (
                          <Button color="inherit" size="small" onClick={restorePaid}>Restore my paid stub</Button>
                        ) : undefined}
                      >
                        <AlertTitle>This is not the pay stub you paid for</AlertTitle>
                        You changed it after payment. Pay again for the new version, or go back to the one you bought.
                      </Alert>
                    )}

                    {/* Priced per stub. Show the arithmetic so the total is never a surprise. */}
                    <Stack spacing={0.5} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          {stubCount} pay stub{stubCount === 1 ? "" : "s"} × {money(unitPrice)}
                        </Typography>
                        <Typography variant="body2">{money(quote ? centsToDollars(quote.subtotalCents) : total)}</Typography>
                      </Stack>
                      {quote?.discounts.map(d => (
                        <Stack key={d.code} direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" color="success.main">{d.description} ({d.code})</Typography>
                            <Button
                              size="small"
                              color="inherit"
                              onClick={removeCoupon}
                              aria-label="Remove coupon"
                              sx={{ minWidth: 0, p: 0.25, color: "text.secondary" }}
                            >
                              <CloseIcon fontSize="inherit" />
                            </Button>
                          </Stack>
                          <Typography variant="body2" color="success.main">-{formatCurrency(centsToDollars(d.amountCents))}</Typography>
                        </Stack>
                      ))}
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
                        <Typography variant="subtitle2" fontWeight={700}>{money(total)}</Typography>
                      </Stack>
                    </Stack>

                    {/* Coupon entry stays visible until a code is applied; the discount line above then carries the remove control. */}
                    {!quote?.discounts.length && (
                      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
                        <TextField
                          label="Coupon code"
                          size="small"
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value); if (couponError) setCouponError(null); }}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                          error={!!couponError}
                          helperText={couponError ?? " "}
                          inputProps={{ autoCapitalize: "characters", autoCorrect: "off", spellCheck: false, maxLength: 40 }}
                          sx={{ flex: 1 }}
                        />
                        <Button variant="outlined" onClick={applyCoupon} disabled={!couponInput.trim()} sx={{ mt: "1px", height: 40 }}>
                          Apply
                        </Button>
                      </Stack>
                    )}

                    {/* Accuracy attestation — payment is not offered until this is affirmed. */}
                    <Box sx={{ p: 1.5, mb: 2, bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attested}
                            onChange={e => handleAttestChange(e.target.checked)}
                            sx={{ alignSelf: "flex-start", pt: 0 }}
                            inputProps={{ "aria-label": "Agree to the Terms of Use and Privacy Policy and confirm the information entered is true and accurate" }}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            I have read and agree to the{" "}
                            <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms of Use</Link> and{" "}
                            <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>, and{" "}
                            {ATTESTATION_TEXT}
                          </Typography>
                        }
                        sx={{ alignItems: "flex-start", m: 0 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        {FRAUD_WARNING}
                      </Typography>
                    </Box>

                    {attested ? (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Secure checkout via PayPal. After payment you can print and download your
                          pay stub{stubCount === 1 ? "" : "s"} as a PDF.
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                          {FINAL_ONCE_PAID}
                        </Typography>
                        <PayPal
                          cart={cart}
                          getFingerprint={beginCheckout}
                          meta={{ attestedAt: attestedAt ?? undefined, templateId: appSettings.templateId, termsVersion: POLICIES_VERSION }}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentError={handlePaymentError}
                        />
                      </>
                    ) : (
                      <Alert severity="info" variant="outlined">
                        Confirm the statement above to continue to payment.
                      </Alert>
                    )}

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, color: "text.disabled" }}>
                      <LockIcon fontSize="small" />
                      <Typography variant="caption">Print &amp; PDF unlock after payment</Typography>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                      {CORE_DISCLAIMER}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right: live preview rendered as a printable Letter sheet (watermarked until paid) */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">{canPrint ? "Final pay stub" : "Preview"}</Typography>
            {canPrint
              ? <Chip icon={<CheckCircleIcon />} color="success" variant="outlined" size="small" label="Ready to print" />
              : <Chip label="Watermarked until payment" size="small" variant="outlined" />}
          </Stack>
          {/* A run of N stubs is paged: arrows, "Pay stub k of N" with its dates, and a dot per stub. */}
          <StubPager
            count={models.length}
            active={active}
            onChange={goToStub}
            stubs={models.map(m => ({
              periodStart: m.incomeDetails.periodStartDate,
              periodEnd: m.incomeDetails.periodEndDate,
              payDate: m.incomeDetails.periodPayDate,
            }))}
          />
          {/* "Desk" surface: gray backdrop that makes the white sheet read as a physical page */}
          {/* alignItems flex-start: a single-line flex container clamps its line to max-height and
              stretches items to it, which pinned the sheet at its min-height while the stub inside
              kept rendering past the sheet's bottom edge. */}
          <Box onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} sx={{ bgcolor: "grey.200", border: 1, borderColor: "divider", borderRadius: 1, p: { xs: 1.5, md: 3 }, maxHeight: "75vh", overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            {/* The sheet: white Letter page with margins + lift. #pdf-content stays the print/PDF surface.
                Until paid, `paystub-locked-preview` blocks Ctrl+P from printing the unpaid stub. */}
            <Box className={canPrint ? "paystub-sheet" : "paystub-sheet paystub-locked-preview"} sx={{ position: "relative", width: "100%", maxWidth: 720, minHeight: 480, bgcolor: "#fff", boxShadow: 3, p: { xs: 2, md: 3 } }}>
              <FitPage>
                <Box id="pdf-content">
                  <TemplateManager id={appSettings.templateId} configPath={appSettings.configPath} store={fullState} activeStub={active} />
                </Box>
              </FitPage>
              {!canPrint && <PreviewWatermark />}
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
            {stubCount === 1
              ? "This is exactly what will print."
              : `This is exactly what will print — ${stubCount} pay stubs, one per page, covering ${stubCount} consecutive pay periods, most recent first. Use the arrows to see each one.`}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack} color="inherit">Back</Button>
        <Link component="button" type="button" onClick={() => onEdit(0)} underline="hover" sx={{ alignSelf: "center" }}>
          Start over from Company
        </Link>
      </Box>
    </Box>
  );
};

export default ReviewStep;
