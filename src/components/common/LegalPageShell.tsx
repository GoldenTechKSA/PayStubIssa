import React from "react";
import { Container, Box } from "@mui/material";

/**
 * Shared shell for content-heavy legal pages (Privacy, Terms, Accessibility).
 * Wraps raw heading/paragraph/list/table markup and applies consistent MUI
 * theme typography and spacing so the pages match the rest of the redesign
 * without rewriting their copy.
 */
const LegalPageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
    <Box
      sx={{
        "& h2": { typography: "h4", mb: 1 },
        "& h4": { typography: "h6", mt: 4, mb: 1, color: "primary.main" },
        "& p": { color: "text.secondary", lineHeight: 1.7, mb: 2 },
        "& ul": { color: "text.secondary", lineHeight: 1.7, pl: 3, mb: 2 },
        "& li": { mb: 1 },
        "& a": { color: "primary.main" },
        "& table": { width: "100%", borderCollapse: "collapse", mb: 2 },
        "& th, & td": { border: 1, borderColor: "divider", p: 1, textAlign: "left", verticalAlign: "top" },
        "& th": { bgcolor: "background.default", fontWeight: 600 },
      }}
    >
      {children}
    </Box>
  </Container>
);

export default LegalPageShell;
