import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, TextField, MenuItem, Typography } from "@mui/material";
import { saveIncomeDetails, saveGeneralInfo } from "../../../redux/actions";
import { PAYPERIODTYPE, PAYMENTMETHOD, EMPLOYMENTTYPE } from "../../../constants/globals";
import { IncomeDetails, GeneralInfo, PayStubDetails } from "assets/data/pay-stub-details";
import { isValidDate, isValidStubCount } from "../../../utils/util";
import {
  calculateEndDate,
  calculatePayDate,
  defaultPeriodStart,
  periodHasEnded,
  periodLengthLabel,
  toISODate,
} from "../../../utils/date-calculator";
import { WizardStepLayout } from "../WizardStepLayout";

// Read-only, computed fields: muted so they read as results rather than inputs awaiting a value.
const readOnlySx = {
  "& .MuiInputBase-root": { bgcolor: "action.hover" },
  "& .MuiInputBase-input": { color: "text.secondary", cursor: "default" },
};

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const PayPeriodStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const income = useSelector<PayStubDetails, IncomeDetails>(s => s.incomeDetails);
  const general = useSelector<PayStubDetails, GeneralInfo>(s => s.generalInfo);
  const dispatch = useDispatch();

  const [periodType, setPeriodType] = useState(income.periodType || "Weekly");
  const [periodStartDate, setStart] = useState(toISODate(income.periodStartDate));

  // End and pay date are not editable: they are always derived from start + frequency, so a
  // saved end/pay date that disagrees with the start is simply recomputed here.
  const periodEndDate = calculateEndDate(periodStartDate, periodType);
  const periodPayDate = calculatePayDate(periodEndDate);

  const [payStubCount, setPayStubCount] = useState<number>(general.payStubCount || 1);
  const [checkNumber, setCheckNumber] = useState<number>(general.checkNumber || 5000);
  const [payStubNumber, setPayStubNumber] = useState<number>(general.payStubNumber || 1);
  const [employmentType, setEmploymentType] = useState(general.employmentType || "");
  const [paymentMethod, setPaymentMethod] = useState(general.paymentMethod || "");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  // A pay stub covers a period that has already been worked, so the start must sit at least one
  // full period in the past (the computed end date is before today). Changing the frequency snaps
  // the start back to that frequency's default, even over a hand-typed date: the frequency decides
  // the period, and the user then adjusts the start if they need a different one.
  const handlePeriodTypeChange = (value: string) => {
    setPeriodType(value);
    setStart(defaultPeriodStart(value));
  };

  const startIsDate = isValidDate(periodStartDate);
  const startTooRecent = startIsDate && !periodHasEnded(periodStartDate, periodType);
  const startError = !startIsDate
    ? "Enter a valid date (not in the future)."
    : startTooRecent
      ? `Start date must be at least ${periodLengthLabel(periodType)} before today so the pay period has ended.`
      : "";

  const isValid = !startError && isValidStubCount(String(payStubCount));

  const handleNext = () => {
    dispatch(saveIncomeDetails({ periodType, periodStartDate, periodEndDate, periodPayDate }));
    dispatch(saveGeneralInfo({ payStubCount, checkNumber, payStubNumber, employmentType, paymentMethod }));
    onNext();
  };

  return (
    <WizardStepLayout
      title="Pay period"
      subtitle="Pick the pay frequency and the day the period started. The end date and pay date follow from those, and the period must already have ended."
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!isValid}
    >
      <Grid container columnSpacing={2} rowSpacing={1}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select fullWidth label="Pay frequency" value={periodType} onChange={e => handlePeriodTypeChange(e.target.value)} helperText=" ">
            {PAYPERIODTYPE.map(p => <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth required label="Period start date" type="date" value={periodStartDate}
            onChange={e => setStart(e.target.value)} onBlur={() => touch("start")}
            error={touched.start && !!startError}
            helperText={touched.start && startError ? startError : " "}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth label="Period end date" type="date" value={periodEndDate}
            helperText="Calculated from start date and frequency."
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            sx={readOnlySx}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth label="Pay date" type="date" value={periodPayDate}
            helperText="Calculated: end date plus one day."
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            sx={readOnlySx}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Pay stub options</Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth required label="How many pay stubs?" type="number" value={payStubCount}
            onChange={e => setPayStubCount(parseInt(e.target.value, 10) || 0)} onBlur={() => touch("count")}
            error={touched.count && !isValidStubCount(String(payStubCount))}
            helperText={touched.count && !isValidStubCount(String(payStubCount)) ? "Choose between 1 and 12." : " "}
            inputProps={{ min: 1, max: 12, step: 1 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Starting check number" type="number" value={checkNumber} onChange={e => setCheckNumber(parseInt(e.target.value, 10) || 0)} helperText=" " inputProps={{ min: 0, step: 1 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Pay stub number" type="number" value={payStubNumber} onChange={e => setPayStubNumber(parseInt(e.target.value, 10) || 1)} helperText=" " inputProps={{ min: 1, step: 1 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select fullWidth label="Employment type" value={employmentType} onChange={e => setEmploymentType(e.target.value)} helperText=" ">
            {EMPLOYMENTTYPE.map(p => <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField select fullWidth label="Payment method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} helperText=" ">
            {PAYMENTMETHOD.map(p => <MenuItem key={p.count} value={p.name}>{p.name}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </WizardStepLayout>
  );
};

export default PayPeriodStep;
