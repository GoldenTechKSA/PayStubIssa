import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid, Box, Card, CardContent, Typography, Stack, Button, Divider, TextField, Alert, Link, Chip,
  Checkbox, FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PayStubDetails } from "assets/data/pay-stub-details";
import { updateAppSettings, saveGeneralInfo } from "../../../redux/actions";
import { buildPaystubModel, buildPaystubModels } from "../../../templates/utils/buildPaystubModel";
import { formatCurrency } from "../../../utils/util";
import { UNIT_PRICE, orderTotal, normalizeStubCount } from "constants/pricing";
import { paymentsApi, unlockStorage, centsToDollars, PaymentsApiError, type CapturedOrder, type Quote } from "services/payments-api";
import { ATTESTATION_TEXT, CORE_DISCLAIMER, FRAUD_WARNING } from "constants/business-info";
import { telemetry } from "../../../services/telemetry-service";
import { T } from "../../../telemetry/codes";
import TemplateManager from "../../../templates/components/templatemanager";
import { FitPage } from "../FitPage";
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
  // Paid state. `canPrint` is set only after the server captured and verified the payment;
  // the unlock records how many stubs were paid for so bumping the count re-locks the gate.
  const unlock = appSettings.unlock;

  const [extraNotes, setExtraNotes] = useState(generalInfo.extraNotes || "");

  // The customer must affirm the figures are real before we will take their money. This is the
  // condition of the licence to use the document — see the Accuracy Attestation section of the
  // Terms. `attestedAt` is recorded with the payment so the affirmation is timestamped.
  const [attested, setAttested] = useState(false);
  const [attestedAt, setAttestedAt] = useState<string | null>(null);

  const model = buildPaystubModel(fullState);
  const models = buildPaystubModels(fullState);

  const stubCount = normalizeStubCount(generalInfo.payStubCount);
  const canPrint = !!appSettings.canPrint && (!unlock || unlock.qty >= stubCount);
  const paidForFewer = !!appSettings.canPrint && !!unlock && unlock.qty < stubCount;

  // Server-authoritative quote for the displayed total; the local constants are only a
  // fallback for the moment before the API answers (or if it is unreachable).
  const [quote, setQuote] = useState<Quote | null>(null);
  useEffect(() => {
    let cancelled = false;
    paymentsApi.quote({ items: [{ type: "paystub", qty: stubCount }] })
      .then(q => { if (!cancelled) setQuote(q); })
      .catch(() => { if (!cancelled) setQuote(null); });
    return () => { cancelled = true; };
  }, [stubCount]);
  const unitPrice = quote ? centsToDollars(quote.lines[0]?.unitCents ?? 0) : UNIT_PRICE;
  const total = quote ? centsToDollars(quote.totalCents) : orderTotal(stubCount);

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

  // The run spans from the first stub's period start to the last stub's period end.
  const firstStub = models[0];
  const lastStub = models[models.length - 1];

  const handleAttestChange = (checked: boolean) => {
    setAttested(checked);
    setAttestedAt(checked ? new Date().toISOString() : null);
    telemetry.emit(T.REVIEW_ATTESTED, { attested: checked });
  };

  const handlePaymentSuccess = (result: CapturedOrder) => {
    const paidQty = result.quote.lines.reduce((sum, l) => sum + l.qty, 0);
    const nextUnlock = { token: result.token, orderId: result.orderId, expiresAt: result.expiresAt, qty: paidQty };
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
                `${String(firstStub.incomeDetails.periodStartDate || "")} – ${String(lastStub.incomeDetails.periodEndDate || "")}`],
              [stubCount === 1 ? "Pay date" : "First pay date", String(firstStub.incomeDetails.periodPayDate || "")],
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
                  Pay summary ({stubCount === 1 ? "this period" : "per period"})
                </Typography>
                <Stack spacing={0.5}>
                  {([
                    ["Gross pay", model.grossPay],
                    ["Taxes", -model.totalTaxes],
                    ["Deductions", -model.totalDeductions],
                  ] as Array<[string, number]>).map(([label, value]) => (
                    <Stack key={label} direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2">{formatCurrency(value)}</Typography>
                    </Stack>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700}>Net pay</Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="success.main">{formatCurrency(model.netPay)}</Typography>
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
                    {paidForFewer && unlock && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Your payment covered {unlock.qty} pay stub{unlock.qty === 1 ? "" : "s"}. Reduce the count on the
                        Pay period step to print, or pay for {stubCount} below.
                      </Alert>
                    )}

                    {/* Priced per stub. Show the arithmetic so the total is never a surprise. */}
                    <Stack spacing={0.5} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          {stubCount} pay stub{stubCount === 1 ? "" : "s"} × {formatCurrency(unitPrice)}
                        </Typography>
                        <Typography variant="body2">{formatCurrency(quote ? centsToDollars(quote.subtotalCents) : total)}</Typography>
                      </Stack>
                      {quote?.discounts.map(d => (
                        <Stack key={d.code} direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="success.main">{d.description} ({d.code})</Typography>
                          <Typography variant="body2" color="success.main">-{formatCurrency(centsToDollars(d.amountCents))}</Typography>
                        </Stack>
                      ))}
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
                        <Typography variant="subtitle2" fontWeight={700}>{formatCurrency(total)}</Typography>
                      </Stack>
                    </Stack>

                    {/* Accuracy attestation — payment is not offered until this is affirmed. */}
                    <Box sx={{ p: 1.5, mb: 2, bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={attested}
                            onChange={e => handleAttestChange(e.target.checked)}
                            sx={{ alignSelf: "flex-start", pt: 0 }}
                            inputProps={{ "aria-label": "Confirm the information entered is true and accurate" }}
                          />
                        }
                        label={<Typography variant="body2">{ATTESTATION_TEXT}</Typography>}
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
                        <PayPal
                          cart={{ items: [{ type: "paystub", qty: stubCount }] }}
                          meta={{ attestedAt: attestedAt ?? undefined, templateId: appSettings.templateId }}
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
          {/* "Desk" surface: gray backdrop that makes the white sheet read as a physical page */}
          {/* alignItems flex-start: a single-line flex container clamps its line to max-height and
              stretches items to it, which pinned the sheet at its min-height while the stub inside
              kept rendering past the sheet's bottom edge. */}
          <Box sx={{ bgcolor: "grey.200", border: 1, borderColor: "divider", borderRadius: 1, p: { xs: 1.5, md: 3 }, maxHeight: "75vh", overflow: "auto", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            {/* The sheet: white Letter page with margins + lift. #pdf-content stays the print/PDF surface.
                Until paid, `paystub-locked-preview` blocks Ctrl+P from printing the unpaid stub. */}
            <Box className={canPrint ? "paystub-sheet" : "paystub-sheet paystub-locked-preview"} sx={{ position: "relative", width: "100%", maxWidth: 720, minHeight: 480, bgcolor: "#fff", boxShadow: 3, p: { xs: 2, md: 3 } }}>
              <FitPage>
                <Box id="pdf-content">
                  <TemplateManager id={appSettings.templateId} configPath={appSettings.configPath} store={fullState} />
                </Box>
              </FitPage>
              {!canPrint && <PreviewWatermark />}
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
            {stubCount === 1
              ? "This is exactly what will print."
              : `This is exactly what will print — ${stubCount} pay stubs, one per page, covering ${stubCount} consecutive pay periods.`}
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
