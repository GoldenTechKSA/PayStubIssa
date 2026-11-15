import React from "react";
import { Box, Button, ButtonBase, Chip, Collapse, Grid, InputAdornment, TextField, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { formatCurrency } from "../../utils/util";
import { formatDate } from "../../templates/components/paystub/utils";

export type StubField = "rate" | "hours" | "otRate" | "otHours" | "bonus" | "salary" | "check" | "stub";

interface StubCardProps {
  /** Position in the run, 0 = the most recent period. */
  index: number;
  /** 'YYYY-MM-DD' dates of this stub's pay period; empty while the period step is incomplete. */
  startDate: string;
  endDate: string;
  /** Hourly wage shows rate/hours/overtime; a salary shows the annual salary instead. */
  hourly: boolean;
  /** A single stub is drawn without the card frame, header, and check/stub numbers. */
  single: boolean;
  values: Record<StubField, string>;
  /** Error message per field, already limited to the ones that should show. */
  errors: Partial<Record<StubField, string>>;
  /** True when any field of this card fails validation, shown or not. */
  hasProblem: boolean;
  overtimeHint: string;
  regularPay: number;
  overtimePay: number;
  gross: number;
  periodsPerYear: number;
  /** Long runs fold the earlier stubs down to a one-line summary. */
  collapsible: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (field: StubField, value: string) => void;
  onBlur: (field: StubField) => void;
  /** Only on the first card of a run. */
  onCopyToAll?: () => void;
}

const money = { startAdornment: <InputAdornment position="start">$</InputAdornment> };
const readOnly = { readOnly: true };

/**
 * One pay stub's own earnings controls. A run of stubs shows one card per stub, most recent
 * first, and each card holds everything that stub is paid from: its rates, hours, overtime,
 * bonus, check number and stub number. Purely presentational: the Earnings step owns the
 * values and the validation.
 */
export const StubCard: React.FC<StubCardProps> = ({
  index, startDate, endDate, hourly, single, values, errors, hasProblem, overtimeHint,
  regularPay, overtimePay, gross, periodsPerYear, collapsible, expanded, onToggle, onChange, onBlur, onCopyToAll,
}) => {
  const field = (name: StubField, label: string, extra: Partial<React.ComponentProps<typeof TextField>> = {}) => (
    <TextField
      fullWidth type="number" label={label} value={values[name]}
      onChange={e => onChange(name, e.target.value)} onBlur={() => onBlur(name)}
      error={!!errors[name]} helperText={errors[name] || " "}
      inputProps={{ min: 0, step: "any" }}
      {...extra}
    />
  );
  const col = { xs: 12, sm: 4 };

  const fields = (
    <Grid container columnSpacing={2} rowSpacing={1}>
      {hourly ? (
        <>
          <Grid size={col}>{field("rate", "Hourly rate", { required: true, InputProps: money })}</Grid>
          <Grid size={col}>{field("hours", "Hours worked", { required: true })}</Grid>
          <Grid size={col}>
            <TextField fullWidth label="Regular pay" value={formatCurrency(regularPay)} helperText="This period" InputProps={readOnly} />
          </Grid>

          <Grid size={col}>{field("otRate", "Overtime rate", { InputProps: money, helperText: errors.otRate || overtimeHint })}</Grid>
          <Grid size={col}>{field("otHours", "Overtime hours")}</Grid>
          <Grid size={col}>
            <TextField fullWidth label="Overtime pay" value={formatCurrency(overtimePay)} helperText="This period" InputProps={readOnly} />
          </Grid>

          <Grid size={col}>{field("bonus", "Bonus", { InputProps: money })}</Grid>
        </>
      ) : (
        <>
          <Grid size={col}>{field("salary", "Annual salary", { required: true, InputProps: money })}</Grid>
          <Grid size={col}>
            <TextField fullWidth label="Salary this period" value={formatCurrency(regularPay)} helperText={`Salary ÷ ${periodsPerYear} periods`} InputProps={readOnly} />
          </Grid>
          <Grid size={col}>{field("bonus", "Bonus", { InputProps: money })}</Grid>
        </>
      )}
      {!single && (
        <>
          <Grid size={col}>{field("check", "Check number", { inputProps: { min: 1, step: 1 } })}</Grid>
          <Grid size={col}>{field("stub", "Pay stub number", { inputProps: { min: 1, step: 1 } })}</Grid>
        </>
      )}
    </Grid>
  );

  // A single stub keeps the plain form it always had.
  if (single) {
    return (
      <>
        {fields}
        {!hourly && (
          <Typography variant="body2" color="text.secondary">Estimated pay this period: {formatCurrency(gross)}</Typography>
        )}
      </>
    );
  }

  const period = startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : "";
  const title = (
    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1.5, rowGap: 0.5, flexGrow: 1 }}>
      <Typography variant="subtitle1" component="h3" fontWeight={600}>Pay stub {index + 1}</Typography>
      {period && <Typography variant="body2" color="text.secondary">{period}</Typography>}
      {index === 0 && <Chip size="small" label="Most recent" color="primary" variant="outlined" />}
      {!expanded && (
        <Typography variant="body2" color={hasProblem ? "error" : "text.secondary"} sx={{ ml: "auto" }}>
          {hasProblem ? "Needs attention" : `Gross ${formatCurrency(gross)}`}
        </Typography>
      )}
    </Box>
  );
  const bodyId = `pay-stub-card-${index}`;

  return (
    <Box
      role="group" aria-label={`Pay stub ${index + 1}`}
      sx={{ border: 1, borderColor: !expanded && hasProblem ? "error.main" : "divider", borderRadius: 2, mb: 2, overflow: "hidden" }}
    >
      {collapsible ? (
        <ButtonBase
          onClick={onToggle} aria-expanded={expanded} aria-controls={bodyId}
          sx={{ width: "100%", justifyContent: "flex-start", textAlign: "left", px: 2, py: 1.5, gap: 1, bgcolor: "background.default" }}
        >
          {title}
          <ExpandMoreIcon sx={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
        </ButtonBase>
      ) : (
        <Box sx={{ px: 2, py: 1.5, bgcolor: "background.default" }}>{title}</Box>
      )}

      <Collapse in={expanded} unmountOnExit>
        <Box id={bodyId} sx={{ p: 2, pt: 2.5, borderTop: 1, borderColor: "divider" }}>
          {fields}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
            {onCopyToAll
              ? <Button size="small" onClick={onCopyToAll}>Copy these values to all pay stubs</Button>
              : <span />}
            <Typography variant="body1">
              Gross pay <Box component="span" sx={{ fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", ml: 1 }}>{formatCurrency(gross)}</Box>
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default StubCard;
