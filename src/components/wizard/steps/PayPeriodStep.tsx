import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, TextField, MenuItem, Typography } from "@mui/material";
import { saveIncomeDetails, saveGeneralInfo } from "../../../redux/actions";
import { PAYPERIODTYPE, PAYMENTMETHOD, EMPLOYMENTTYPE } from "../../../constants/globals";
import { IncomeDetails, GeneralInfo, PayStubDetails } from "assets/data/pay-stub-details";
import { isValidDate, isValidStubCount } from "../../../utils/util";
import { calculateEndDate, calculatePayDate } from "../../../utils/date-calculator";
import { WizardStepLayout } from "../WizardStepLayout";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const toDateInput = (d: Date | string | null | undefined): string => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const PayPeriodStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const income = useSelector<PayStubDetails, IncomeDetails>(s => s.incomeDetails);
  const general = useSelector<PayStubDetails, GeneralInfo>(s => s.generalInfo);
  const dispatch = useDispatch();

  const [periodType, setPeriodType] = useState(income.periodType || "Weekly");
  const [periodStartDate, setStart] = useState(toDateInput(income.periodStartDate));
  const [periodEndDate, setEnd] = useState(toDateInput(income.periodEndDate));
  const [periodPayDate, setPayDate] = useState(toDateInput(income.periodPayDate));

  const [payStubCount, setPayStubCount] = useState<number>(general.payStubCount || 1);
  const [checkNumber, setCheckNumber] = useState<number>(general.checkNumber || 5000);
  const [payStubNumber, setPayStubNumber] = useState<number>(general.payStubNumber || 0);
  const [employmentType, setEmploymentType] = useState(general.employmentType || "");
  const [paymentMethod, setPaymentMethod] = useState(general.paymentMethod || "");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  // Recompute end + pay dates when start or period type changes.
  const recompute = (start: string, type: string) => {
    if (start && type) {
      const end = calculateEndDate(start, type);
      setEnd(end);
      if (end) setPayDate(calculatePayDate(end));
    }
  };

  const handleStartChange = (value: string) => {
    setStart(value);
    recompute(value, periodType);
  };
  const handlePeriodTypeChange = (value: string) => {
    setPeriodType(value);
    recompute(periodStartDate, value);
  };

  const isValid =
    isValidDate(periodStartDate) &&
    isValidDate(periodEndDate) &&
    isValidDate(periodPayDate) &&
    isValidStubCount(String(payStubCount));

  const handleNext = () => {
    dispatch(saveIncomeDetails({ periodType, periodStartDate, periodEndDate, periodPayDate }));
    dispatch(saveGeneralInfo({ payStubCount, checkNumber, payStubNumber, employmentType, paymentMethod }));
    onNext();
  };

  return (
    <WizardStepLayout
      title="Pay period"
      subtitle="The dates and cadence for this pay stub. Tip: the end date should not be in the future."
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
            onChange={e => handleStartChange(e.target.value)} onBlur={() => touch("start")}
            error={touched.start && !isValidDate(periodStartDate)}
            helperText={touched.start && !isValidDate(periodStartDate) ? "Enter a valid date (not in the future)." : " "}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth required label="Period end date" type="date" value={periodEndDate}
            onChange={e => setEnd(e.target.value)} onBlur={() => touch("end")}
            error={touched.end && !isValidDate(periodEndDate)}
            helperText={touched.end && !isValidDate(periodEndDate) ? "Enter a valid date." : "Auto-filled from start + frequency."}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth required label="Pay date" type="date" value={periodPayDate}
            onChange={e => setPayDate(e.target.value)} onBlur={() => touch("pay")}
            error={touched.pay && !isValidDate(periodPayDate)}
            helperText={touched.pay && !isValidDate(periodPayDate) ? "Enter a valid date." : "Auto-filled (end + 1 day)."}
            InputLabelProps={{ shrink: true }}
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
          <TextField fullWidth label="Pay stub number" type="number" value={payStubNumber} onChange={e => setPayStubNumber(parseInt(e.target.value, 10) || 0)} helperText=" " inputProps={{ min: 0, step: 1 }} />
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
