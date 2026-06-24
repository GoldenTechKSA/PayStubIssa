import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid, Box, Card, CardContent, Typography, Stack, Button, Divider, TextField, Alert, Link, Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import LockIcon from "@mui/icons-material/Lock";
import { PayStubDetails } from "assets/data/pay-stub-details";
import { updateAppSettings, saveGeneralInfo } from "../../../redux/actions";
import { buildPaystubModel } from "../../../templates/utils/buildPaystubModel";
import { formatCurrency } from "../../../utils/util";
import { telemetryService } from "../../../services/telemetry-service";
import TemplateManager from "../../../templates/components/templatemanager";
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

  const model = buildPaystubModel(fullState);

  const handlePaymentSuccess = (details: any) => {
    dispatch(updateAppSettings({ canPrint: true }));
    try {
      telemetryService.track("PaymentSuccess", {
        paymentId: details?.id,
        amount: details?.purchase_units?.[0]?.amount?.value,
        currency: details?.purchase_units?.[0]?.amount?.currency_code,
        paystubTemplate: appSettings.templateId,
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
        Check everything below. Your pay stub unlocks for printing and PDF download after payment.
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
              ["Period", `${String(incomeDetails.periodStartDate || "")} – ${String(incomeDetails.periodEndDate || "")}`],
              ["Pay date", String(incomeDetails.periodPayDate || "")],
              ["Pay stubs", generalInfo.payStubCount],
            ]} />

            <SummarySection title="Earnings" onEdit={() => onEdit(3)} rows={[
              ["Wage type", incomeDetails.wageType],
              ["Pay", earningsValue],
            ]} />

            {/* Computed pay summary */}
            <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.default" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Pay summary (this period)</Typography>
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
                    <Alert severity="success" sx={{ mb: 2 }}>Payment complete — your pay stub is unlocked.</Alert>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>Print pay stub</Button>
                      <PDFDownloadButton targetId="pdf-content" fileName="paystub" buttonText="Download PDF" />
                    </Stack>
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Pay to unlock — $8.99</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Secure checkout via PayPal. After payment you can print and download your pay stub as a PDF.
                    </Typography>
                    <PayPal onPaymentSuccess={handlePaymentSuccess} onPaymentError={handlePaymentError} />
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, color: "text.disabled" }}>
                      <LockIcon fontSize="small" />
                      <Typography variant="caption">Print &amp; PDF unlock after payment</Typography>
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right: live preview (watermarked until paid) */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Preview</Typography>
            {!canPrint && <Chip label="Watermarked until payment" size="small" variant="outlined" />}
          </Stack>
          <Box sx={{ position: "relative", border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "#fff", p: 2, maxHeight: "75vh", overflow: "auto" }}>
            <Box id="pdf-content">
              <TemplateManager id={appSettings.templateId} configPath={appSettings.configPath} store={fullState} />
            </Box>
            {!canPrint && (
              <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <Typography variant="h3" sx={{ transform: "rotate(-25deg)", color: "rgba(37,99,235,0.12)", fontWeight: 800, letterSpacing: 4, userSelect: "none" }}>
                  PREVIEW
                </Typography>
              </Box>
            )}
          </Box>
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
