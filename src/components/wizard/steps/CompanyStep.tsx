import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, TextField, MenuItem, Button, Box, Typography, Stack } from "@mui/material";
import { saveCompanyInfo } from "../../../redux/actions";
import { STATESLIST } from "../../../constants/globals";
import { CompanyInfo as CompanyDetails, PayStubDetails } from "assets/data/pay-stub-details";
import { WizardStepLayout } from "../WizardStepLayout";
import { MaskedIdInput } from "../MaskedIdInput";

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const isValidName = (n: string) => n.trim().length >= 3 && n.trim().length <= 100;
const isValidAddress = (a: string) => a.trim().length >= 5 && a.trim().length <= 255;
const isValidZip = (z: string) => /^\d{5}$/.test(z);
const isValidPhone = (p: string) => /^(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/.test(p);
const isValidEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);

const CompanyStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const company = useSelector<PayStubDetails, CompanyDetails>(s => s.companyInfo);
  const dispatch = useDispatch();

  const [companyName, setCompanyName] = useState(company.companyName || "");
  const [companyEIN, setCompanyEIN] = useState(company.companyEIN || "");
  const [companyAddress1, setCompanyAddress1] = useState(company.companyAddress1 || "");
  const [companyAddress2, setCompanyAddress2] = useState(company.companyAddress2 || "");
  const [companyCity, setCompanyCity] = useState(company.companyCity || "");
  const [companyState, setCompanyState] = useState(company.companyState || "Washington");
  const [companyZipCode, setCompanyZipCode] = useState(company.companyZipCode || "");
  const [companyLogo, setCompanyLogo] = useState(company.companyLogo || "");
  const [companyPhone, setCompanyPhone] = useState(company.companyPhone || "");
  const [companyEmail, setCompanyEmail] = useState(company.companyEmail || "");
  const [logoPreview, setLogoPreview] = useState(company.companyLogo || "");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));
  const fileRef = useRef<HTMLInputElement>(null);

  const isValid =
    isValidName(companyName) &&
    isValidAddress(companyAddress1) &&
    companyCity.trim().length >= 2 &&
    isValidZip(companyZipCode) &&
    isValidPhone(companyPhone) &&
    isValidEmail(companyEmail);

  const handleNext = () => {
    dispatch(saveCompanyInfo({
      companyName, companyEIN, companyAddress1, companyAddress2, companyCity,
      companyState, companyZipCode, companyLogo, companyPhone, companyEmail,
    }));
    onNext();
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyLogo(reader.result as string);
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <WizardStepLayout
      title="Company information"
      subtitle="Tell us about the employer issuing this pay stub."
      onBack={onBack}
      onNext={handleNext}
      nextDisabled={!isValid}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth required label="Company name" value={companyName}
            onChange={e => setCompanyName(e.target.value)} onBlur={() => touch("name")}
            error={touched.name && !isValidName(companyName)}
            helperText={touched.name && !isValidName(companyName) ? "Enter a valid company name (3–100 characters)." : " "}
            inputProps={{ maxLength: 100 }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <MaskedIdInput mode="ein" label="Company EIN (optional)" value={companyEIN} onChange={setCompanyEIN} helperText="9 digits, format XX-XXXXXXX." />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth required label="Address" placeholder="1234 Main St" value={companyAddress1}
            onChange={e => setCompanyAddress1(e.target.value)} onBlur={() => touch("addr1")}
            error={touched.addr1 && !isValidAddress(companyAddress1)}
            helperText={touched.addr1 && !isValidAddress(companyAddress1) ? "Enter a valid address (at least 5 characters)." : " "}
            autoComplete="address-line1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth label="Suite, unit, or floor (optional)" value={companyAddress2} onChange={e => setCompanyAddress2(e.target.value)} helperText=" " autoComplete="address-line2" />
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth required label="City" value={companyCity}
            onChange={e => setCompanyCity(e.target.value)} onBlur={() => touch("city")}
            error={touched.city && companyCity.trim().length < 2}
            helperText={touched.city && companyCity.trim().length < 2 ? "Enter a valid city." : " "}
            autoComplete="address-level2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select fullWidth label="State" value={companyState} onChange={e => setCompanyState(e.target.value)} helperText=" ">
            {STATESLIST.map(s => <MenuItem key={s.code} value={s.name}>{s.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth required label="Zip code" value={companyZipCode}
            onChange={e => setCompanyZipCode(e.target.value)} onBlur={() => touch("zip")}
            error={touched.zip && !isValidZip(companyZipCode)}
            helperText={touched.zip && !isValidZip(companyZipCode) ? "5 digits." : " "}
            inputProps={{ maxLength: 5, inputMode: "numeric" }} autoComplete="postal-code"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth required label="Company phone" value={companyPhone}
            onChange={e => setCompanyPhone(e.target.value)} onBlur={() => touch("phone")}
            error={touched.phone && !isValidPhone(companyPhone)}
            helperText={touched.phone && !isValidPhone(companyPhone) ? "Enter a valid 10-digit phone number." : " "}
            type="tel" autoComplete="tel"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth required label="Company email" value={companyEmail}
            onChange={e => setCompanyEmail(e.target.value)} onBlur={() => touch("email")}
            error={touched.email && !isValidEmail(companyEmail)}
            helperText={touched.email && !isValidEmail(companyEmail) ? "Enter a valid email address." : " "}
            type="email" autoComplete="email"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" onClick={() => fileRef.current?.click()}>Upload company logo</Button>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleLogo} />
            {logoPreview
              ? <Box component="img" src={logoPreview} alt="Company logo preview" sx={{ maxWidth: 120, maxHeight: 60, borderRadius: 1, border: 1, borderColor: "divider" }} />
              : <Typography variant="body2" color="text.secondary">Optional — appears on the pay stub.</Typography>}
          </Stack>
        </Grid>
      </Grid>
    </WizardStepLayout>
  );
};

export default CompanyStep;
