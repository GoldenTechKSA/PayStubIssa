import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, Stack, Link, Typography } from "@mui/material";
import PayPalImg from "../../assets/images/paypal.png";

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
            © PayStubIssa 2020–2025. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={3} component="nav">
            <Link component={RouterLink} to="/accessibility" underline="hover" color="text.secondary">
              Accessibility
            </Link>
            <Link component={RouterLink} to="/privacy" underline="hover" color="text.secondary">
              Privacy
            </Link>
            <Link component={RouterLink} to="/terms" underline="hover" color="text.secondary">
              Terms of Use
            </Link>
          </Stack>

          <Box component="img" src={PayPalImg} alt="PayPal Acceptance Mark" sx={{ height: 28, borderRadius: 1 }} />
        </Stack>
      </Container>
    </Box>
  );
};

export default AppFooter;
