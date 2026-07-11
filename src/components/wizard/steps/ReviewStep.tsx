import React, { useState } from "react";
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
import { ATTESTATION_TEXT, CORE_DISCLAIMER, FRAUD_WARNING } from "constants/business-info";
import { telemetryService } from "../../../services/telemetry-service";
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
  const canPrint = appSettings.canPrint;

  const [extraNotes, setExtraNotes] = useState(generalInfo.extraNotes || "");

  // The customer must affirm the figures are real before we will take their money. This is the
  // condition of the licence to use the document — see the Accuracy Attestation section of the
  // Terms. `attestedAt` is recorded with the payment so the affirmation is timestamped.
  const [attested, setAttested] = useState(false);
  const [attestedAt, setAttestedAt] = useState<string | null>(null);

  const model = buildPaystubModel(fullState);
  const models = buildPaystubModels(fullState);

  const stubCount = normalizeStubCount(generalInfo.payStubCount);
  const total = orderTotal(stubCount);

  // The run spans from the first stub's period start to the last stub's period end.
  const firstStub = models[0];
  const lastStub = models[models.length - 1];

  const handleAttestChange = (checked: boolean) => {
    setAttested(checked);
    setAttestedAt(checked ? new Date().toISOString() : null);
  };

  const handlePaymentSuccess = (details: any) => {
    dispatch(updateAppSettings({ canPrint: true }));
    try {
      telemetryService.track("PaymentSuccess", {
        paymentId: details?.id,
        amount: details?.purchase_units?.[0]?.amount?.value,
        currency: details?.purchase_units?.[0]?.amount?.currency_code,
        paystubTemplate: appSettings.templateId,
        stubCount,
        attestedAt,
      });
    } catch { /* telemetry best-effort */ }
  };

  const handlePaymentError = (error: any) => {
    try {
      telemetryService.track("PaymentError", { message: error?.message || String(error) });
    } catch { /* telemetry best-effort */ }
    alert("There was an error processing your payment. Please try again.");
  };

  const handlePrint = () => {
    document.body.classList.add("print-paystub");
    const cleanup = () => {
      document.body.classList.remove("print-paystub");
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

                    {/* Priced per stub. Show the arithmetic so the total is never a surprise. */}
                    <Stack spacing={0.5} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          {stubCount} pay stub{stubCount === 1 ? "" : "s"} × {formatCurrency(UNIT_PRICE)}
                        </Typography>
                        <Typography variant="body2">{formatCurrency(total)}</Typography>
                      </Stack>
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
                          amount={total}
                          description={`${stubCount} pay stub${stubCount === 1 ? "" : "s"}`}
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
          <Box sx={{ bgcolor: "grey.200", border: 1, borderColor: "divider", borderRadius: 1, p: { xs: 1.5, md: 3 }, maxHeight: "75vh", overflow: "auto", display: "flex", justifyContent: "center" }}>
            {/* The sheet: white Letter page with margins + lift. #pdf-content stays the print/PDF surface.
                Until paid, `paystub-locked-preview` blocks Ctrl+P from printing the unpaid stub. */}
            <Box className={canPrint ? undefined : "paystub-locked-preview"} sx={{ position: "relative", width: "100%", maxWidth: 720, minHeight: 480, bgcolor: "#fff", boxShadow: 3, p: { xs: 2, md: 3 } }}>
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
