import React from "react";
import { Card, CardContent, Box, Button, Typography, Divider } from "@mui/material";

interface WizardStepLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  /** Optional content rendered to the right of the title, top-aligned with it (e.g. a mode toggle). */
  headerAction?: React.ReactNode;
}

/**
 * Shared shell for a wizard step: titled card + a Back/Next footer.
 * Steps own their fields, validation, and Redux dispatch; this only lays them out.
 */
export const WizardStepLayout: React.FC<WizardStepLayoutProps> = ({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = "Continue",
  backLabel = "Back",
  headerAction,
}) => (
  <Card variant="outlined" sx={{ borderColor: "divider" }}>
    <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {headerAction}
      </Box>
      <Box sx={{ mt: 2 }}>{children}</Box>
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onBack} color="inherit">
          {backLabel}
        </Button>
        <Button onClick={onNext} variant="contained" disabled={nextDisabled}>
          {nextLabel}
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export default WizardStepLayout;
