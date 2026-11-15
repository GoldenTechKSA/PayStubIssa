import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid, TextField, Typography, ToggleButton, ToggleButtonGroup,
  FormControlLabel, Switch, Collapse, InputAdornment, Box, Stack,
} from "@mui/material";
import { saveGeneralInfo, saveIncomeDetails } from "../../../redux/actions";
import { GeneralInfo, IncomeDetails, PayStubDetails, StubOverride } from "assets/data/pay-stub-details";
import { formatCurrency, rateOfGross } from "../../../utils/util";
import { periodsPerYear } from "../../../utils/date-calculator";
import { minOvertimeRate, overtimeRateTooLow } from "../../../utils/overtime-calculator";
import { buildRunPeriods, defaultRunNumber, resolveStubInputs } from "../../../templates/utils/buildPaystubModel";
import { normalizeStubCount } from "constants/pricing";
import { WizardStepLayout } from "../WizardStepLayout";
import { StubCard, StubField } from "../StubCard";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const n = (s: string): number => {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};
const numStr = (v: number | undefined) => (v && v !== 0 ? String(v) : "");
// A stored fraction back to the percentage the user typed, without float noise (0.07 → "7").
const pctStr = (fraction: number) => String(Math.round(fraction * 1e6) / 1e4);
const PCT_ERROR = "Enter a percentage from 0 to 100.";
const isWholeNumber = (s: string) => /^\d+$/.test(s.trim()) && Number(s) > 0;

// Runs of up to this many stubs show every card open; longer ones fold the earlier stubs.
const OPEN_CARDS_LIMIT = 4;

// What the customer typed on the card of an EARLIER stub (index 1 and up). A field they have
// not typed in shows the same value as the first card (rates, hours, salary), nothing (overtime
// hours, bonus) or the number counting down (check, stub): see resolveStubInputs.
type CardEdit = Partial<Record<StubField, string>>;
const OVERRIDE_KEY: Record<StubField, keyof StubOverride> = {
  rate: "hourlyRate", hours: "hoursWorked", otRate: "overtimeRate", otHours: "overtimeHours",
  bonus: "bonusAmount", salary: "annualSalary", check: "checkNumber", stub: "payStubNumber",
};
const FIELDS = Object.keys(OVERRIDE_KEY) as StubField[];
const toCardEdit = (o: StubOverride | null | undefined): CardEdit =>
  FIELDS.reduce((edit, field) => {
    const saved = o?.[OVERRIDE_KEY[field]];
    if (saved != null) edit[field] = String(saved);
    return edit;
  }, {} as CardEdit);
const toOverride = (edit: CardEdit): StubOverride =>
  FIELDS.reduce((o, field) => {
    if (edit[field] !== undefined) o[OVERRIDE_KEY[field]] = n(edit[field] as string);
    return o;
  }, {} as StubOverride);

const EarningsStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const income = useSelector<PayStubDetails, IncomeDetails>(s => s.incomeDetails);
  const general = useSelector<PayStubDetails, GeneralInfo>(s => s.generalInfo);
  const dispatch = useDispatch();

  const [wageType, setWageType] = useState(income.wageType || "Hourly");
  const hourly = wageType === "Hourly";

  // A run of 2+ stubs shows one card per stub, most recent period first.
  const stubCount = normalizeStubCount(general.payStubCount);
  const multi = stubCount > 1;

  // The first card (the most recent stub, or the only one) is the base fields themselves.
  const [first, setFirst] = useState<Record<StubField, string>>({
    rate: numStr(income.hourlyRate), hours: numStr(income.hoursWorked),
    otRate: numStr(income.overtimeRate), otHours: numStr(income.overtimeHours),
    bonus: numStr(income.bonusAmount), salary: numStr(income.annualSalary),
    check: general.checkNumber ? String(general.checkNumber) : "",
    stub: general.payStubNumber ? String(general.payStubNumber) : "",
  });
  const [edits, setEdits] = useState<CardEdit[]>(() => (income.stubOverrides ?? []).map(toCardEdit));
  const [open, setOpen] = useState<Record<number, boolean>>({});

  // Stored as a fraction of gross (0.05 = 5%); see rateOfGross for why out-of-range values read as none.
  const saved401k = rateOfGross(income.deduction401k);
  const savedUnion = rateOfGross(income.unionDues);
  const hasDeductions = !!(income.medicalDeduction || income.dentalDeduction || income.visionDeduction || income.otherDeduction || saved401k || savedUnion);
  const [showDeductions, setShowDeductions] = useState(hasDeductions);
  const [medical, setMedical] = useState(numStr(income.medicalDeduction));
  const [dental, setDental] = useState(numStr(income.dentalDeduction));
  const [vision, setVision] = useState(numStr(income.visionDeduction));
  const [other, setOther] = useState(numStr(income.otherDeduction));
  const [d401kPct, setD401kPct] = useState(saved401k ? pctStr(saved401k) : "");
  const [unionPct, setUnionPct] = useState(savedUnion ? pctStr(savedUnion) : "");

  // Keys are `${card}.${field}`. A saved draft that already has overtime hours on a card shows
  // an overtime-rate problem there straight away.
  const [touched, setTouched] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (let i = 0; i < stubCount; i++) {
      if (resolveStubInputs(income, general, i, stubCount).overtimeHours > 0) initial[`${i}.otHours`] = true;
    }
    return initial;
  });

  const periodsPer = periodsPerYear(income.periodType || "Weekly");
  const periods = multi ? buildRunPeriods(income, stubCount) : [];

  // Each card's values: what was typed on it, else the default described on CardEdit.
  const valuesOf = (i: number): Record<StubField, string> => {
    if (i === 0) return first;
    const edit = edits[i] ?? {};
    const countDown = (base: string) => {
      const v = defaultRunNumber(n(base), i);
      return v > 0 ? String(v) : "";
    };
    return {
      rate: edit.rate ?? first.rate,
      hours: edit.hours ?? first.hours,
      otRate: edit.otRate ?? first.otRate,
      salary: edit.salary ?? first.salary,
      otHours: edit.otHours ?? "",
      bonus: edit.bonus ?? "",
      check: edit.check ?? countDown(first.check),
      stub: edit.stub ?? countDown(first.stub),
    };
  };
  const allValues = Array.from({ length: stubCount }, (_, i) => valuesOf(i));
  const isDuplicate = (field: StubField, i: number) =>
    allValues.some((v, j) => j !== i && v[field].trim() !== "" && Number(v[field]) === Number(allValues[i][field]));

  const cards = allValues.map((values, i) => {
    const edited = (field: StubField) => i > 0 && edits[i]?.[field] !== undefined;
    const seen = (field: StubField) => !!touched[`${i}.${field}`] || edited(field);
    // Federal floor: overtime is paid at no less than 1.5× the hourly rate (see overtime-calculator).
    const otFloor = minOvertimeRate(n(values.rate));
    const otHelp = n(values.rate) > 0
      ? `at least 1.5× the hourly rate (${formatCurrency(otFloor)})`
      : "at least 1.5× the hourly rate";
    const numberError = (field: StubField) =>
      !multi ? "" : !isWholeNumber(values[field]) ? "Enter a whole number above 0."
        : isDuplicate(field, i) ? "Already used on another pay stub." : "";

    // Every failing field, whether or not its message is on screen yet.
    const problems: Partial<Record<StubField, string>> = {
      ...(hourly && n(values.rate) <= 0 ? { rate: "Enter a rate greater than 0." } : {}),
      ...(hourly && n(values.hours) <= 0 ? { hours: "Enter hours greater than 0." } : {}),
      ...(hourly && overtimeRateTooLow(n(values.rate), n(values.otRate), n(values.otHours)) ? { otRate: `Overtime must be ${otHelp}.` } : {}),
      ...(!hourly && n(values.salary) <= 0 ? { salary: "Enter a salary greater than 0." } : {}),
      ...(numberError("check") ? { check: numberError("check") } : {}),
      ...(numberError("stub") ? { stub: numberError("stub") } : {}),
    };
    // A required field stays quiet until the customer has been in it; a number that clashes or
    // an overtime rate that is typed and too low speaks up at once.
    const shown: Partial<Record<StubField, string>> = {
      ...(problems.rate && seen("rate") ? { rate: problems.rate } : {}),
      ...(problems.hours && seen("hours") ? { hours: problems.hours } : {}),
      ...(problems.salary && seen("salary") ? { salary: problems.salary } : {}),
      ...(problems.otRate && (values.otRate !== "" || touched[`${i}.otHours`]) ? { otRate: problems.otRate } : {}),
      ...(problems.check ? { check: problems.check } : {}),
      ...(problems.stub ? { stub: problems.stub } : {}),
    };

    const regularPay = hourly ? n(values.rate) * n(values.hours) : n(values.salary) / periodsPer;
    const overtimePay = hourly ? n(values.otRate) * n(values.otHours) : 0;
    return {
      values, problems, shown, otFloor,
      overtimeHint: `Optional; ${otHelp}`,
      regularPay, overtimePay,
      gross: regularPay + overtimePay + n(values.bonus),
    };
  });

  const setField = (index: number, field: StubField, value: string) => {
    if (index === 0) {
      setFirst(prev => ({ ...prev, [field]: value }));
      return;
    }
    setEdits(prev => {
      const next = [...prev];
      while (next.length <= index) next.push({});
      const edit = { ...next[index] };
      // Emptying an overtime-hours or bonus field means "none", which is what it starts as.
      if (value === "" && (field === "otHours" || field === "bonus")) delete edit[field];
      else edit[field] = value;
      next[index] = edit;
      return next;
    });
  };

  const blurField = (index: number, field: StubField) => {
    setTouched(t => ({ ...t, [`${index}.${field}`]: true }));
    // Leaving the hourly rate or the overtime hours with hours entered and no rate yet: start
    // the overtime rate at the floor. It stays editable, upward only.
    const card = cards[index];
    if ((field === "rate" || field === "otHours") && card.values.otRate === "" && n(card.values.otHours) > 0 && card.otFloor > 0) {
      setField(index, "otRate", String(card.otFloor));
    }
  };

  // The first card's rates, hours, overtime and bonus onto every other card. Each stub keeps
  // its own check and stub number.
  const copyToAll = () => setEdits(prev =>
    Array.from({ length: Math.max(prev.length, stubCount) }, (_, i) => {
      const edit = prev[i] ?? {};
      return {
        ...(edit.check !== undefined ? { check: edit.check } : {}),
        ...(edit.stub !== undefined ? { stub: edit.stub } : {}),
        ...(first.otHours !== "" ? { otHours: first.otHours } : {}),
        ...(first.bonus !== "" ? { bonus: first.bonus } : {}),
      };
    }));

  const pctOk = (s: string) => n(s) >= 0 && n(s) <= 100;
  const isValid = cards.every(card => Object.keys(card.problems).length === 0) && pctOk(d401kPct) && pctOk(unionPct);
  // The gross the 401(k) and union-dues hints are worked out on: the most recent stub's.
  const grossForPct = cards[0].gross;

  const handleWageType = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
    if (!value) return;
    setWageType(value);
  };

  const handleNext = () => {
    dispatch(saveIncomeDetails({
      wageType,
      hourlyRate: n(first.rate), hoursWorked: n(first.hours),
      overtimeRate: n(first.otRate), overtimeHours: n(first.otHours),
      bonusAmount: n(first.bonus), annualSalary: n(first.salary),
      medicalDeduction: n(medical), dentalDeduction: n(dental),
      visionDeduction: n(vision), otherDeduction: n(other),
      deduction401k: n(d401kPct) / 100, unionDues: n(unionPct) / 100,
      // Only what the customer typed on a card is saved; the rest keeps following the defaults.
      // With a single stub there are no other cards, and a longer run's values are left alone.
      ...(multi ? { stubOverrides: edits.map((edit, i) => (i === 0 ? {} : toOverride(edit))) } : {}),
    }));
    if (multi) dispatch(saveGeneralInfo({ checkNumber: n(first.check), payStubNumber: n(first.stub) }));
    onNext();
  };

  const money = { startAdornment: <InputAdornment position="start">$</InputAdornment> };
  const pct = { endAdornment: <InputAdornment position="end">%</InputAdornment> };
  const pctScope = multi ? "on the most recent stub" : "this period";

  return (
    <WizardStepLayout
      title="Earnings"
      headerAction={
        <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.5}>
          <Typography variant="body2" color="text.secondary">How this employee is paid for the period.</Typography>
          <ToggleButtonGroup exclusive size="small" color="primary" value={wageType} onChange={handleWageType}>
            <ToggleButton value="Hourly">Hourly wage</ToggleButton>
            <ToggleButton value="Salary">Yearly salary</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      }
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!isValid}
      nextLabel="Choose a template"
    >
      {multi && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Each pay stub has its own card, most recent pay period first. Fill in the first one; the others start with the same rates and hours, and you can change any of them.
        </Typography>
      )}
      {cards.map((card, i) => {
        const collapsible = stubCount > OPEN_CARDS_LIMIT && i > 0;
        return (
          <StubCard
            key={i}
            index={i}
            startDate={periods[i]?.startDate ?? ""} endDate={periods[i]?.endDate ?? ""}
            hourly={hourly} single={!multi}
            values={card.values} errors={card.shown} hasProblem={Object.keys(card.problems).length > 0}
            overtimeHint={card.overtimeHint}
            regularPay={card.regularPay} overtimePay={card.overtimePay} gross={card.gross}
            periodsPerYear={periodsPer}
            collapsible={collapsible} expanded={open[i] ?? !collapsible}
            onToggle={() => setOpen(o => ({ ...o, [i]: !(o[i] ?? !collapsible) }))}
            onChange={(field, value) => setField(i, field, value)}
            onBlur={field => blurField(i, field)}
            onCopyToAll={multi && i === 0 ? copyToAll : undefined}
          />
        );
      })}

      <Box sx={{ mt: 1 }}>
        <FormControlLabel
          control={<Switch checked={showDeductions} onChange={e => setShowDeductions(e.target.checked)} />}
          label={`Include deductions (medical, dental, vision, 401k, union dues…)${multi ? ", the same on every pay stub" : ""}`}
        />
      </Box>

      <Collapse in={showDeductions}>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Per pay period amounts</Typography>
          <Grid container columnSpacing={2} rowSpacing={1}>
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
                error={!pctOk(d401kPct)}
                helperText={!pctOk(d401kPct) ? PCT_ERROR : d401kPct ? `≈ ${formatCurrency((grossForPct * n(d401kPct)) / 100)} ${pctScope}, taken before income tax` : "Percentage of gross pay"}
                InputProps={pct} inputProps={{ min: 0, max: 100, step: "any" }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label="Union dues" type="number" value={unionPct} onChange={e => setUnionPct(e.target.value)}
                error={!pctOk(unionPct)}
                helperText={!pctOk(unionPct) ? PCT_ERROR : unionPct ? `≈ ${formatCurrency((grossForPct * n(unionPct)) / 100)} ${pctScope}` : "Percentage of gross pay"}
                InputProps={pct} inputProps={{ min: 0, max: 100, step: "any" }}
              />
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </WizardStepLayout>
  );
};

export default EarningsStep;
