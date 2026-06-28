import React from "react";
import { Container, Box, Typography, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Grid, Alert } from "@mui/material";

const CheckList: React.FC<{ items: string[] }> = ({ items }) => (
  <List dense disablePadding>
    {items.map(item => (
      <ListItem key={item} disableGutters alignItems="flex-start">
        <ListItemIcon sx={{ minWidth: 24, mt: 1 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "primary.main",
            }}
          />
        </ListItemIcon>
        <ListItemText primary={item} primaryTypographyProps={{ color: "text.secondary" }} />
      </ListItem>
    ))}
  </List>
);

const STEPS = [
  {
    title: "Step 1: Enter your details",
    items: [
      "Company name & details",
      "Employee name, pay rate, and hours worked",
      "Pay period dates and deductions (taxes, benefits, etc.)",
      "Any additional earnings (bonuses, overtime, etc.)",
    ],
  },
  {
    title: "Step 2: Customize & preview",
    items: [
      "Select a professional pay stub template that fits your needs",
      "Instantly preview your pay stub with all entered details",
      "Make adjustments if needed before finalizing",
    ],
  },
  {
    title: "Step 3: Download & print",
    items: [
      "Save your pay stub as a PDF (print-ready format)",
      "Print or email it directly from your local machine",
      "Your data stays on your device for privacy",
    ],
  },
];

const WHY_US = [
  "IRS & SBA-compliant — our pay stubs meet official standards for income verification.",
  "Instant generation — create, customize, and download pay stubs in minutes.",
  "Secure & reliable — bank-level encryption protects your sensitive data.",
  "Accepted everywhere — valid for loans, rentals, mortgages, and employment verification.",
];

const AboutUsPage: React.FC = () => (
  <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>About us</Typography>

      <Typography variant="h6" component="h2" sx={{ mt: 2 }}>Who are we?</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        We are a trusted payroll solutions provider specializing in professional pay stub generation for small
        businesses, freelancers, and independent contractors. Our team consists of certified accountants and payroll
        experts with years of experience streamlining financial documentation.
      </Typography>

      <Typography variant="h6" component="h2" sx={{ mt: 2 }}>Why choose us?</Typography>
      <CheckList items={WHY_US} />
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        We’re committed to simplifying payroll for business owners while ensuring accuracy and professionalism in every document.
      </Typography>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>How our pay stub generator works</Typography>
      <Typography variant="body1" color="text.secondary">
        Creating accurate, professional pay stubs is simple with our tool — just follow these three easy steps.
      </Typography>
    </Box>

    <Grid container spacing={3} sx={{ mb: 4 }}>
      {STEPS.map(step => (
        <Grid key={step.title} size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderColor: "divider" }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>{step.title}</Typography>
              <CheckList items={step.items} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
      That’s it! No software installs, no waiting — just instant, professional pay stubs.
    </Typography>

    <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.default", mb: 4 }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>Why use our generator?</Typography>
        <CheckList items={[
          "IRS-compliant formats",
          "Automatic tax & deduction calculations",
          "Secure & confidential (256-bit encryption)",
          "Mobile-friendly — create stubs on the go",
        ]} />
      </CardContent>
    </Card>

    <Alert severity="info">Need help? Our support team is available 24/7.</Alert>
  </Container>
);

export default AboutUsPage;
