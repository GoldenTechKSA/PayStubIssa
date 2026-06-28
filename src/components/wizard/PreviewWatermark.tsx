import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Slanted "PREVIEW" watermark overlay for unpaid paystub previews. Renders three
 * marks — top, middle, bottom — so the whole stub is covered (not just the center),
 * making it harder to crop a clean copy out of a screenshot/preview. Purely visual:
 * non-interactive and unselectable. The parent must be `position: relative`.
 */
export const PreviewWatermark: React.FC = () => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      py: "8%",
      pointerEvents: "none",
    }}
  >
    {[0, 1, 2].map(i => (
      <Typography
        key={i}
        variant="h3"
        sx={{ transform: "rotate(-25deg)", color: "rgba(37,99,235,0.12)", fontWeight: 800, letterSpacing: 4, userSelect: "none" }}
      >
        PREVIEW
      </Typography>
    ))}
  </Box>
);

export default PreviewWatermark;
