import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, TextField, MenuItem } from "@mui/material";
import { saveEmployeeInfo } from "../../../redux/actions";
import { FILINGSTATUS, STATESLIST } from "../../../constants/globals";
import { EmployeeInfo as EmployeeDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { WizardStepLayout } from "../WizardStepLayout";
import { MaskedIdInput } from "../MaskedIdInput";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const isValidName = (n: string) => n.trim().length > 0 && /^[a-zA-Z\s]+$/.test(n);
const isValidAddress = (a: string) => a.trim().length >= 5 && a.trim().length <= 255;
const isValidZip = (z: string) => /^\d{5}$/.test(z);

const toDateInput = (d: Date | string | null | undefined): string => {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const EmployeeStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const employee = useSelector<PayStubDetails, EmployeeDetails>(s => s.employeeInfo);
  const dispatch = useDispatch();

  const [employeeFirstName, setFirstName] = useState(employee.employeeFirstName || "");
  const [employeeMiddleInitial, setMiddleInitial] = useState(employee.employeeMiddleInitial || "");
  const [employeeLastName, setLastName] = useState(employee.employeeLastName || "");
  const [employeeAddress1, setAddress1] = useState(employee.employeeAddress1 || "");
  const [employeeAddress2, setAddress2] = useState(employee.employeeAddress2 || "");
  const [employeeCity, setCity] = useState(employee.employeeCity || "");
  const [employeeState, setState] = useState(employee.employeeState || "Washington");
  const [employeeZipCode, setZip] = useState(employee.employeeZipCode || "");
  const [employeeSSN, setSSN] = useState(employee.employeeSSN || "");
  const [employeePhone, setPhone] = useState(employee.employeePhone || "");
  const [employeeEmail, setEmail] = useState(employee.employeeEmail || "");
  const [employeeID, setEmployeeID] = useState(employee.employeeID || "");
  const [employeeMarriedStatus, setMarriedStatus] = useState(employee.employeeMarriedStatus || "single");
  const [employeeExemptions, setExemptions] = useState(String(employee.employeeExemptions ?? 0));
  const [hireDate, setHireDate] = useState(toDateInput(employee.employeeHireDate) || toDateInput(new Date()));

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  const isValid =
    isValidName(employeeFirstName) &&
    isValidName(employeeLastName) &&
    isValidAddress(employeeAddress1) &&
    employeeCity.trim().length >= 2 &&
    isValidZip(employeeZipCode) &&
    !!employeeState;

  const handleNext = () => {
    dispatch(saveEmployeeInfo({
      employeeFirstName, employeeMiddleInitial, employeeLastName, employeeAddress1, employeeAddress2,
      employeeCity, employeeState, employeeZipCode, employeeID, employeeSSN, employeePhone, employeeEmail,
      employeeHireDate: hireDate ? new Date(hireDate) : new Date(),
      employeeMarriedStatus,
      employeeExemptions: Math.max(0, parseInt(employeeExemptions, 10) || 0),
    }));
    onNext();
  };

  return (
    <WizardStepLayout
      title="Employee information"
      subtitle="The person this pay stub is for."
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!isValid}
    >
      <Grid container columnSpacing={2} rowSpacing={1}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth required label="First name" value={employeeFirstName}
            onChange={e => setFirstName(e.target.value)} onBlur={() => touch("first")}
            error={touched.first && !isValidName(employeeFirstName)}
            helperText={touched.first && !isValidName(employeeFirstName) ? "Letters and spaces only." : " "}
            inputProps={{ maxLength: 100 }} autoComplete="given-name"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <TextField fullWidth label="M.I." value={employeeMiddleInitial} onChange={e => setMiddleInitial(e.target.value)} helperText=" " inputProps={{ maxLength: 1 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth required label="Last name" value={employeeLastName}
            onChange={e => setLastName(e.target.value)} onBlur={() => touch("last")}
            error={touched.last && !isValidName(employeeLastName)}
            helperText={touched.last && !isValidName(employeeLastName) ? "Letters and spaces only." : " "}
            inputProps={{ maxLength: 100 }} autoComplete="family-name"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth required label="Address" value={employeeAddress1}
            onChange={e => setAddress1(e.target.value)} onBlur={() => touch("addr1")}
            error={touched.addr1 && !isValidAddress(employeeAddress1)}
            helperText={touched.addr1 && !isValidAddress(employeeAddress1) ? "Enter a valid address (at least 5 characters)." : " "}
            autoComplete="address-line1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Apartment, studio, or floor (optional)" value={employeeAddress2} onChange={e => setAddress2(e.target.value)} helperText=" " autoComplete="address-line2" />
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth required label="City" value={employeeCity}
            onChange={e => setCity(e.target.value)} onBlur={() => touch("city")}
            error={touched.city && employeeCity.trim().length < 2}
            helperText={touched.city && employeeCity.trim().length < 2 ? "Enter a valid city." : " "}
            autoComplete="address-level2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select fullWidth label="State" value={employeeState} onChange={e => setState(e.target.value)} helperText=" ">
            {STATESLIST.map(s => <MenuItem key={s.code} value={s.name}>{s.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth required label="Zip code" value={employeeZipCode}
            onChange={e => setZip(e.target.value)} onBlur={() => touch("zip")}
            error={touched.zip && !isValidZip(employeeZipCode)}
            helperText={touched.zip && !isValidZip(employeeZipCode) ? "5 digits." : " "}
            inputProps={{ maxLength: 5, inputMode: "numeric" }} autoComplete="postal-code"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <MaskedIdInput mode="ssn" label="Employee SSN (optional)" value={employeeSSN} onChange={setSSN} helperText="Masked once complete." />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Phone (optional)" value={employeePhone} onChange={e => setPhone(e.target.value)} helperText=" " type="tel" autoComplete="tel" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Employee ID (optional)" value={employeeID} onChange={e => setEmployeeID(e.target.value)} helperText=" " />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Email (optional)" value={employeeEmail} onChange={e => setEmail(e.target.value)} helperText=" " type="email" autoComplete="email" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField fullWidth label="Hire date" type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} helperText=" " InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select fullWidth label="Filing status" value={employeeMarriedStatus} onChange={e => setMarriedStatus(e.target.value)} helperText=" ">
            {FILINGSTATUS.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth label="Exemptions / allowances" value={employeeExemptions}
            onChange={e => setExemptions(e.target.value.replace(/\D/g, ""))}
            helperText="Printed on the stub; does not change tax withheld."
            inputProps={{ maxLength: 2, inputMode: "numeric" }}
          />
        </Grid>
      </Grid>
    </WizardStepLayout>
  );
};

export default EmployeeStep;
