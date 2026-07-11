import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, Stack, Link, Typography, Divider } from "@mui/material";
import PayPalImg from "../../assets/images/paypal.png";
import {
  BRAND_NAME, CORE_DISCLAIMER, FRAUD_WARNING, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_HREF,
} from "constants/business-info";

const AppFooter = () => {
  return (
    <Box
      component="footer"
      className="no-print"
      sx={{ bgcolor: "background.paper", borderTop: 1, borderColor: "divider", py: 3, mt: 6 }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            © {BRAND_NAME} 2020–{new Date().getFullYear()}. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={3} component="nav" flexWrap="wrap" useFlexGap justifyContent="center">
            <Link component={RouterLink} to="/accessibility" underline="hover" color="text.secondary">
              Accessibility
            </Link>
            <Link component={RouterLink} to="/privacy" underline="hover" color="text.secondary">
              Privacy
            </Link>
            <Link component={RouterLink} to="/terms" underline="hover" color="text.secondary">
              Terms of Use
            </Link>
            <Link href={`mailto:${SUPPORT_EMAIL}`} underline="hover" color="text.secondary">
              {SUPPORT_EMAIL}
            </Link>
            <Link href={SUPPORT_PHONE_HREF} underline="hover" color="text.secondary">
              {SUPPORT_PHONE}
            </Link>
          </Stack>

          <Box component="img" src={PayPalImg} alt="PayPal Acceptance Mark" sx={{ height: 28, borderRadius: 1 }} />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* The disclaimer belongs on every page, not just the Terms nobody opens. */}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.7 }}>
          {CORE_DISCLAIMER} {FRAUD_WARNING}
        </Typography>
      </Container>
    </Box>
  );
};

export default AppFooter;
