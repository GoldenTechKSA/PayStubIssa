import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Grid, Typography, Button, Stack, Chip, Card, CardContent, Divider } from "@mui/material";
import CalculateIcon from "@mui/icons-material/Calculate";
import LockIcon from "@mui/icons-material/Lock";
import BoltIcon from "@mui/icons-material/Bolt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import HeroImage from "../../assets/images/heroimage.png";
import { MIN_STUBS, MAX_STUBS } from "constants/pricing";
import { usePrice } from "contexts/price-context";
import { CORE_DISCLAIMER, TEMPLATE_COUNT } from "constants/business-info";

// Every claim here has to be one the product can actually back. "Private by design" is the
// literal truth (the server handles payment and anonymous analytics; pay stub data never leaves
// the browser) and is a stronger promise than the encryption boast it replaced; "Real tax math"
// is what the tax engine actually does. Template counts come from TEMPLATE_COUNT, which a test
// pins to template-configs.json, so the number on this page cannot drift from the gallery.
const TRUST = [
  { icon: <LockIcon color="primary" />, label: "Private by design — your pay stub data never leaves your browser" },
  { icon: <CalculateIcon color="primary" />, label: "Real federal, state & FICA tax math" },
  { icon: <BoltIcon color="primary" />, label: "Instant PDF & print" },
];

const STEPS = [
  {
    title: "1. Enter your details",
    details: "Add your company, employee, pay period, and salary or hourly details. Our guided form checks that each field is complete and correctly formatted.",
  },
  {
    title: "2. Pick a template & preview",
    details: `Choose from ${TEMPLATE_COUNT} layouts, from a standard employee pay stub to an independent contractor statement, and see your pay stub populated live with your real data before you pay.`,
  },
  {
    title: "3. Download & print",
    details: "Pay securely, then download a print-ready PDF or print instantly — no software, no waiting.",
  },
];

const INCLUDED = [
  "Federal, state, Social Security and Medicare calculated for you",
  `${TEMPLATE_COUNT} templates — standard employee, classic earnings statements, payroll register, independent contractor and temporary assignment`,
  "Your company logo on the stub",
  "Live preview before you pay",
  "Print-ready US Letter PDF, one page per stub",
];

// The price, in view before any scrolling, right beside the button that starts the wizard. It
// reads the server's price (contexts/price-context.tsx) and is simply absent in the rare case
// that price is not known — never a guessed number.
const PriceBadge: React.FC<{ label: string }> = ({ label }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.25}
    aria-label={`${label} per pay stub, no subscription`}
    sx={{
      px: 2,
      py: 0.75,
      borderRadius: 2,
      border: 2,
      borderColor: "success.main",
      bgcolor: "background.paper",
      alignSelf: { xs: "flex-start", sm: "center" },
    }}
  >
    <Typography
      component="span"
      sx={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "1.75rem", lineHeight: 1, color: "success.main" }}
    >
      {label}
    </Typography>
    <Box sx={{ lineHeight: 1.2 }}>
      <Typography component="span" variant="body2" sx={{ display: "block", fontWeight: 600 }}>per pay stub</Typography>
      <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>no subscription</Typography>
    </Box>
  </Stack>
);

const HeroPage: React.FC = () => {
  const navigate = useNavigate();
  const { label: price } = usePrice();

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EAF1FE 100%)", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" component="h1" sx={{ fontWeight: 700, fontSize: { xs: "2rem", md: "3rem" }, mb: 2 }}>
                Effortlessly generate accurate pay stubs
              </Typography>
              <Typography variant="h6" component="p" sx={{ color: "text.secondary", fontWeight: 400, mb: 3 }}>
                Create a professional pay stub in minutes — with federal, state and FICA taxes calculated
                for you — and download a print-ready PDF. {price ? `${price} per stub` : "Pay per stub"}, no subscription.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                <Button size="large" variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/create")}>
                  Get started today
                </Button>
                {price && <PriceBadge label={price} />}
                <Button size="large" variant="outlined" href="#how-it-works">
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
      <Container maxWidth="lg" id="how-it-works" sx={{ py: { xs: 6, md: 8 }, scrollMarginTop: 80 }}>
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

      {/* Pricing — stated up front. The price used to appear for the first time at checkout,
          after the customer had already done all the work. */}
      <Box sx={{ bgcolor: "background.paper", borderTop: 1, borderBottom: 1, borderColor: "divider", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="sm">
          <Typography variant="h4" component="h2" align="center" sx={{ mb: 1 }}>
            Simple, honest pricing
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Pay per stub. No subscription, no account, no recurring charge.
          </Typography>

          <Card variant="outlined" sx={{ borderColor: "primary.main", borderWidth: 2 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={1}>
                {price && <Typography variant="h3" component="p" sx={{ fontWeight: 700 }}>{price}</Typography>}
                <Typography variant="h6" component="p" color="text.secondary">{price ? "per pay stub" : "Priced per pay stub"}</Typography>
              </Stack>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                Need several? Generate {MIN_STUBS}–{MAX_STUBS} stubs for consecutive pay periods in one
                order{price ? ` — ${price} each` : ""}.
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={1.5}>
                {INCLUDED.map(item => (
                  <Stack key={item} direction="row" spacing={1.5} alignItems="flex-start">
                    <CheckIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
                    <Typography variant="body2">{item}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Button
                fullWidth size="large" variant="contained" endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/create")} sx={{ mt: 4 }}
              >
                Create your pay stub
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>Ready to create your pay stub?</Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            It only takes a few minutes. Pay once per stub — no subscription required.
          </Typography>
          <Button
            size="large"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate("/create")}
            sx={{ bgcolor: "common.white", color: "primary.main", "&:hover": { bgcolor: "grey.100" } }}
          >
            Get started today
          </Button>
        </Container>
      </Box>

      {/* What this is, stated plainly, on the page the customer actually reads. */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ display: "block", lineHeight: 1.8 }}>
          {CORE_DISCLAIMER}
        </Typography>
      </Container>
    </Box>
  );
};

export default HeroPage;
