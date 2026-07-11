import React from "react";
import { Container, Box, Typography, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Grid, Alert } from "@mui/material";
import {
  BRAND_NAME,
  CORE_DISCLAIMER,
  FRAUD_WARNING,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_HREF,
  TEMPLATE_COUNT,
} from "constants/business-info";
import { MAX_STUBS, MIN_STUBS, UNIT_PRICE } from "constants/pricing";

const PRICE = `$${UNIT_PRICE.toFixed(2)}`;

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
      "Company name, address, and logo",
      "Employee name, state, filing status, pay rate, and hours worked",
      `Pay period dates — generate anywhere from ${MIN_STUBS} to ${MAX_STUBS} stubs for consecutive periods in one order`,
      "Earnings and deductions (overtime, bonuses, benefits, retirement)",
    ],
  },
  {
    title: "Step 2: Choose a template and preview",
    items: [
      `Choose from ${TEMPLATE_COUNT} templates built for specific worker types — independent contractor, commission-only, hospitality and tips, construction, travel nurse, day rate, per diem, seasonal, and more`,
      "See a live preview of your pay stub as you go, before you pay",
      "Go back and change anything — edits are free and unlimited",
    ],
  },
  {
    title: "Step 3: Download and print",
    items: [
      "Pay per stub, then print or download immediately",
      "You get a US Letter PDF with one page per pay stub",
      "Save your file before you close the tab — nothing is stored anywhere",
    ],
  },
];

const WHY_US = [
  "Private by design — your data never leaves your browser. We have no server storing it, because we never receive it.",
  "Real tax math — federal income tax, Social Security, Medicare, and state income tax are calculated automatically from the employee's state and IRS filing status.",
  `Built for how people actually get paid — ${TEMPLATE_COUNT} templates covering contractors, tipped workers, commission earners, day-rate and per-diem workers, and more.`,
  "A clear, professional wage record — gross pay, itemized earnings, taxes withheld, deductions, net pay, and year-to-date figures, laid out the way a pay stub should be.",
  "Instant generation — create, preview, and download in minutes. No software to install.",
  `Pay per stub, no subscription — ${PRICE} per pay stub, ${MIN_STUBS}–${MAX_STUBS} stubs per order.`,
];

const AboutUsPage: React.FC = () => (
  <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>About us</Typography>

      <Typography variant="h6" component="h2" sx={{ mt: 2 }}>Who are we?</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {BRAND_NAME} makes pay stub generation simple for small businesses, freelancers, and independent
        contractors. Our team includes certified accountants and payroll experts, and we have built one thing and
        built it well: a tool that takes the figures you already have and turns them into a clear, professional
        wage record.
      </Typography>

      <Typography variant="h6" component="h2" sx={{ mt: 2 }}>Why choose us?</Typography>
      <CheckList items={WHY_US} />
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        We’re committed to making payroll documentation straightforward for business owners — accurate arithmetic,
        professional presentation, and no surprises.
      </Typography>
    </Box>

    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>How our pay stub generator works</Typography>
      <Typography variant="body1" color="text.secondary">
        Our six-step wizard walks you through company, employee, pay period, earnings, template, and review. It comes
        down to three easy stages.
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
      That’s it! No software installs, no accounts, no waiting — just a professional pay stub in minutes.
    </Typography>

    <Card variant="outlined" sx={{ borderColor: "divider", bgcolor: "background.default", mb: 4 }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>Why use our generator?</Typography>
        <CheckList items={[
          "Automatic tax & deduction calculations",
          "Company logo upload and a template for your kind of work",
          "Your data stays in your browser — we never receive it",
          "Mobile-friendly — create stubs on the go",
        ]} />
      </CardContent>
    </Card>

    <Card variant="outlined" sx={{ borderColor: "divider", mb: 4 }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>What we are — and what we aren’t</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {CORE_DISCLAIMER}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          We make no promise that any third party — a lender, landlord, employer, or agency — will accept a document
          you create here. That is always their decision. Year-to-date figures are a proportional estimate based on
          what you enter, not a record of a real payroll history.
        </Typography>
        <Alert severity="warning">{FRAUD_WARNING}</Alert>
      </CardContent>
    </Card>

    <Alert severity="info">
      Need help? Our support team is available during business hours by phone at{" "}
      <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a> or by email at{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
    </Alert>
  </Container>
);

export default AboutUsPage;
