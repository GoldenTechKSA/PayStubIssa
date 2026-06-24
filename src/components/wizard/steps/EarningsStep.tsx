import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid, TextField, Typography, ToggleButton, ToggleButtonGroup,
  FormControlLabel, Switch, Collapse, InputAdornment, Box,
} from "@mui/material";
import { saveIncomeDetails } from "../../../redux/actions";
import { IncomeDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { formatCurrency } from "../../../utils/util";
import { periodsPerYear } from "../../../utils/date-calculator";
import { WizardStepLayout } from "../WizardStepLayout";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const n = (s: string): number => {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};
const numStr = (v: number | undefined) => (v && v !== 0 ? String(v) : "");

const EarningsStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const income = useSelector<PayStubDetails, IncomeDetails>(s => s.incomeDetails);
  const dispatch = useDispatch();

  const [wageType, setWageType] = useState(income.wageType || "Hourly");
  const [hourlyRate, setHourlyRate] = useState(numStr(income.hourlyRate));
  const [hoursWorked, setHoursWorked] = useState(numStr(income.hoursWorked));
  const [overtimeRate, setOvertimeRate] = useState(numStr(income.overtimeRate));
  const [overtimeHours, setOvertimeHours] = useState(numStr(income.overtimeHours));
  const [bonusAmount, setBonusAmount] = useState(numStr(income.bonusAmount));
  const [annualSalary, setAnnualSalary] = useState(numStr(income.annualSalary));

  const hasDeductions = !!(income.medicalDeduction || income.dentalDeduction || income.visionDeduction || income.otherDeduction || income.deduction401k || income.unionDues);
  const [showDeductions, setShowDeductions] = useState(hasDeductions);
  const [medical, setMedical] = useState(numStr(income.medicalDeduction));
  const [dental, setDental] = useState(numStr(income.dentalDeduction));
  const [vision, setVision] = useState(numStr(income.visionDeduction));
  const [other, setOther] = useState(numStr(income.otherDeduction));
  const [d401kPct, setD401kPct] = useState(income.deduction401k ? String(income.deduction401k * 100) : "");
  const [unionPct, setUnionPct] = useState(income.unionDues ? String(income.unionDues * 100) : "");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  const periodsPer = periodsPerYear(income.periodType || "Weekly");
  const grossForPct = wageType === "Hourly"
    ? n(hourlyRate) * n(hoursWorked) + n(overtimeRate) * n(overtimeHours) + n(bonusAmount)
    : n(annualSalary) / periodsPer + n(bonusAmount);

  const isValid = wageType === "Hourly"
    ? n(hourlyRate) > 0 && n(hoursWorked) > 0
    : n(annualSalary) > 0;

  const handleWageType = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (!value) return;
    setWageType(value);
  };

  const handleNext = () => {
    dispatch(saveIncomeDetails({
      wageType,
      hourlyRate: n(hourlyRate), hoursWorked: n(hoursWorked),
      overtimeRate: n(overtimeRate), overtimeHours: n(overtimeHours),
      bonusAmount: n(bonusAmount), annualSalary: n(annualSalary),
      medicalDeduction: n(medical), dentalDeduction: n(dental),
      visionDeduction: n(vision), otherDeduction: n(other),
      deduction401k: n(d401kPct) / 100, unionDues: n(unionPct) / 100,
    }));
    onNext();
  };

  const money = { startAdornment: <InputAdornment position="start">$</InputAdornment> };
  const pct = { endAdornment: <InputAdornment position="end">%</InputAdornment> };

  return (
    <WizardStepLayout
      title="Earnings"
      subtitle="How this employee is paid for the period."
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!isValid}
      nextLabel="Choose a template"
    >
      <ToggleButtonGroup exclusive color="primary" value={wageType} onChange={handleWageType} sx={{ mb: 3 }}>
        <ToggleButton value="Hourly">Hourly wage</ToggleButton>
        <ToggleButton value="Salary">Yearly salary</ToggleButton>
      </ToggleButtonGroup>

      {wageType === "Hourly" ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth required label="Hourly rate" type="number" value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)} onBlur={() => touch("rate")}
              error={touched.rate && n(hourlyRate) <= 0}
              helperText={touched.rate && n(hourlyRate) <= 0 ? "Enter a rate greater than 0." : " "}
              InputProps={money} inputProps={{ min: 0, step: "any" }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth required label="Hours worked" type="number" value={hoursWorked}
              onChange={e => setHoursWorked(e.target.value)} onBlur={() => touch("hours")}
              error={touched.hours && n(hoursWorked) <= 0}
              helperText={touched.hours && n(hoursWorked) <= 0 ? "Enter hours greater than 0." : " "}
              inputProps={{ min: 0, step: "any" }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Regular pay" value={formatCurrency(n(hourlyRate) * n(hoursWorked))} helperText="This period" InputProps={{ readOnly: true }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Overtime rate" type="number" value={overtimeRate} onChange={e => setOvertimeRate(e.target.value)} helperText=" " InputProps={money} inputProps={{ min: 0, step: "any" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Overtime hours" type="number" value={overtimeHours} onChange={e => setOvertimeHours(e.target.value)} helperText=" " inputProps={{ min: 0, step: "any" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Overtime pay" value={formatCurrency(n(overtimeRate) * n(overtimeHours))} helperText="This period" InputProps={{ readOnly: true }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Bonus" type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} helperText=" " InputProps={money} inputProps={{ min: 0, step: "any" }} />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth required label="Annual salary" type="number" value={annualSalary}
              onChange={e => setAnnualSalary(e.target.value)} onBlur={() => touch("salary")}
              error={touched.salary && n(annualSalary) <= 0}
              helperText={touched.salary && n(annualSalary) <= 0 ? "Enter a salary greater than 0." : " "}
              InputProps={money} inputProps={{ min: 0, step: "any" }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Bonus" type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} helperText=" " InputProps={money} inputProps={{ min: 0, step: "any" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Estimated pay this period" value={formatCurrency(grossForPct)} helperText={`Salary ÷ ${periodsPer} periods + bonus`} InputProps={{ readOnly: true }} />
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={<Switch checked={showDeductions} onChange={e => setShowDeductions(e.target.checked)} />}
          label="Include deductions (medical, dental, vision, 401k, union dues…)"
        />
      </Box>

      <Collapse in={showDeductions}>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Per pay period amounts</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField fullWidth label="Medical" type="number" value={medical} onChange={e => setMedical(e.target.value)} helperText=" " InputProps={money} inputProps={{ min: 0, step: "any" }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField fullWidth label="Dental" type="number" value={dental} onChange={e => setDental(e.target.value)} helperText=" " InputProps={money} inputProps={{ min: 0, step: "any" }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField fullWidth label="Vision" type="number" value={vision} onChange={e => setVision(e.target.value)} helperText=" " InputProps={money} inputProps={{ min: 0, step: "any" }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField fullWidth label="Other" type="number" value={other} onChange={e => setOther(e.target.value)} helperText=" " InputProps={money} inputProps={{ min: 0, step: "any" }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="401(k)" type="number" value={d401kPct} onChange={e => setD401kPct(e.target.value)}
                helperText={d401kPct ? `≈ ${formatCurrency((grossForPct * n(d401kPct)) / 100)} this period` : "Percentage of gross pay"}
                InputProps={pct} inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Union dues" type="number" value={unionPct} onChange={e => setUnionPct(e.target.value)}
                helperText={unionPct ? `≈ ${formatCurrency((grossForPct * n(unionPct)) / 100)} this period` : "Percentage of gross pay"}
                InputProps={pct} inputProps={{ min: 0, step: "any" }}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </WizardStepLayout>
  );
};

export default EarningsStep;
