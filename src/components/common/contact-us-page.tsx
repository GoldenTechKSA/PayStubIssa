import React, { useState } from "react";
import {
  Box, Container, Grid, Typography, TextField, MenuItem, Button, Alert, CircularProgress, Paper, Link,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF } from "constants/business-info";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
type FormErrors = Partial<Record<keyof FormData, string>>;

const SUBJECTS = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "sales", label: "Sales Question" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

const EMPTY: FormData = { firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" };

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!formData.firstName.trim()) e.firstName = "First name is required";
    if (!formData.lastName.trim()) e.lastName = "Last name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Please enter a valid email address";
    if (!formData.subject.trim()) e.subject = "Subject is required";
    if (!formData.message.trim()) e.message = "Message is required";
    else if (formData.message.trim().length < 10) e.message = "Message must be at least 10 characters long";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // There is no backend to POST to, so the form hands the message to the user's own mail
      // client rather than pretending to send it. (It previously waited 1.2s and then claimed
      // "Message sent successfully!" while silently discarding the message.)
      const subjectLabel = SUBJECTS.find(s => s.value === formData.subject)?.label ?? "Enquiry";
      const subject = `[${subjectLabel}] Message from ${formData.firstName} ${formData.lastName}`;
      const body = [
        `Name: ${formData.firstName} ${formData.lastName}`,
        `Email: ${formData.email}`,
        formData.phone ? `Phone: ${formData.phone}` : null,
        "",
        formData.message,
      ].filter(Boolean).join("\n");

      window.location.href =
        `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Alert
        icon={<CheckCircleIcon fontSize="inherit" />}
        severity="info"
        action={<Button color="inherit" size="small" onClick={() => setIsSubmitted(false)}>Back to the form</Button>}
      >
        <Typography fontWeight={600}>Your email app should now be open.</Typography>
        We’ve composed the message for you — press send in your email app and it will reach us
        at {SUPPORT_EMAIL}. If nothing opened, email us directly at{" "}
        <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link> or call{" "}
        <Link href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</Link>.
      </Alert>
    );
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Typography variant="h6" component="h2" gutterBottom>Send us a message</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fill this in and we’ll open a pre-written email in your mail app — just press send. You can
        also reach us directly at <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link> or{" "}
        <Link href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</Link>.
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth required label="First name" value={formData.firstName} onChange={handleChange("firstName")} error={!!errors.firstName} helperText={errors.firstName || " "} autoComplete="given-name" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth required label="Last name" value={formData.lastName} onChange={handleChange("lastName")} error={!!errors.lastName} helperText={errors.lastName || " "} autoComplete="family-name" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth required type="email" label="Email address" value={formData.email} onChange={handleChange("email")} error={!!errors.email} helperText={errors.email || " "} autoComplete="email" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth type="tel" label="Phone number" value={formData.phone} onChange={handleChange("phone")} helperText=" " autoComplete="tel" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField select fullWidth required label="Subject" value={formData.subject} onChange={handleChange("subject")} error={!!errors.subject} helperText={errors.subject || " "}>
            {SUBJECTS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField fullWidth required multiline minRows={5} label="Message" placeholder="Tell us how we can help you…" value={formData.message} onChange={handleChange("message")} error={!!errors.message} helperText={errors.message || " "} />
        </Grid>
      </Grid>
      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
        sx={{ mt: 1 }}
      >
        {isSubmitting ? "Opening your email app…" : "Compose email"}
      </Button>
    </Box>
  );
};

const ContactUsPage: React.FC = () => (
  <Box sx={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EAF1FE 100%)", py: { xs: 5, md: 8 } }}>
    <Container maxWidth="md">
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Typography variant="h3" component="h1" color="primary" sx={{ fontWeight: 700, mb: 1 }}>Contact us</Typography>
        <Typography variant="h6" component="p" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 600, mx: "auto" }}>
          Have a question or want to work together? We’d love to hear from you.
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, maxWidth: 760, mx: "auto" }}>
        <ContactForm />
      </Paper>
    </Container>
  </Box>
);

export default ContactUsPage;
