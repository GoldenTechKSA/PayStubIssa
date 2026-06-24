import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Grid, Typography, Button, Stack, Chip, Card, CardContent } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import LockIcon from "@mui/icons-material/Lock";
import BoltIcon from "@mui/icons-material/Bolt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HeroImage from "../../assets/images/heroImage.png";
import SpecialPriceBanner from "./special-price-banner";

const TRUST = [
  { icon: <VerifiedUserIcon color="primary" />, label: "IRS & SBA-compliant" },
  { icon: <LockIcon color="primary" />, label: "Bank-level encryption" },
  { icon: <BoltIcon color="primary" />, label: "Instant PDF & print" },
];

const STEPS = [
  {
    title: "1. Enter your details",
    details: "Add your company, employee, pay period, and salary or hourly details. Our guided form checks each field for accuracy.",
  },
  {
    title: "2. Pick a template & preview",
    details: "Choose a professional layout and see your pay stub populated live with your real data before you pay.",
  },
  {
    title: "3. Download & print",
    details: "Pay securely, then download a print-ready PDF or print instantly — no software, no waiting.",
  },
];

// Show the seasonal banner only within a fixed promo window.
const showSpecialBanner = (): boolean => {
  const now = new Date();
  return now >= new Date("2025-11-01") && now <= new Date("2025-12-31");
};

const HeroPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {showSpecialBanner() && <SpecialPriceBanner />}

      {/* Hero */}
      <Box sx={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EAF1FE 100%)", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", md: "3rem" }, mb: 2 }}>
                Effortlessly generate accurate pay stubs
              </Typography>
              <Typography variant="h6" component="p" sx={{ color: "text.secondary", fontWeight: 400, mb: 3 }}>
                Accurate, compliant, and easy. Create professional pay stubs in minutes — with automatic tax and
                deduction calculations — and download a print-ready PDF.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                <Button size="large" variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/create")}>
                  Get started today
                </Button>
                <Button size="large" variant="outlined" onClick={() => navigate("/FAQPage")}>
                  How it works
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {TRUST.map(t => (
                  <Chip key={t.label} icon={t.icon as React.ReactElement} label={t.label} variant="outlined" sx={{ bgcolor: "background.paper" }} />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                component="img"
                src={HeroImage}
                alt="Sample professional pay stub generated with PayStubIssa"
                sx={{ width: "100%", height: "auto", borderRadius: 3, boxShadow: 3 }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How it works */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography variant="h4" component="h2" align="center" sx={{ mb: 1 }}>
          How does our pay stub generator work?
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5, maxWidth: 680, mx: "auto" }}>
          Three simple steps from your details to a finished, professional pay stub.
        </Typography>
        <Grid container spacing={3}>
          {STEPS.map(step => (
            <Grid key={step.title} size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ height: "100%", borderColor: "divider" }}>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>{step.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{step.details}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Final CTA */}
      <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Ready to create your pay stub?</Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            It only takes a few minutes. Pay once per stub — no subscription required.
          </Typography>
          <Button size="large" variant="contained" color="success" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/create")}>
            Get started today
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HeroPage;
