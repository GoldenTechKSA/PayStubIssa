import React from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { toISODate } from "../../utils/date-calculator";

export interface StubPagerStub {
  periodStart: unknown;
  periodEnd: unknown;
  payDate: unknown;
}

interface StubPagerProps {
  count: number;
  active: number; // 0-based
  onChange: (index: number) => void;
  stubs: StubPagerStub[];
}

// 'YYYY-MM-DD' (or a Date) → 'MM/DD/YYYY', the way the stubs print dates.
const usDate = (value: unknown): string => {
  const iso = toISODate(value);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

/**
 * Pager above the Review preview for a multi-stub run: arrows, a caption naming the
 * stub and its dates, and one numbered dot per stub. Renders nothing for a single stub.
 * Left/Right arrow keys work while the pager has focus.
 */
export const StubPager: React.FC<StubPagerProps> = ({ count, active, onChange, stubs }) => {
  if (count <= 1) return null;

  const stub = stubs[active];
  const go = (i: number) => {
    if (i >= 0 && i < count && i !== active) onChange(i);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
  };

  const caption = stub
    ? `Pay stub ${active + 1} of ${count} · ${usDate(stub.periodStart)} – ${usDate(stub.periodEnd)} · Pay date ${usDate(stub.payDate)}`
    : `Pay stub ${active + 1} of ${count}`;

  return (
    <Box
      role="group"
      aria-label="Pay stubs in this run"
      tabIndex={0}
      onKeyDown={onKeyDown}
      sx={{
        mb: 1,
        borderRadius: 1,
        outline: "none",
        "&:focus-visible": { boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}` },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
        <IconButton aria-label="Previous pay stub" size="small" onClick={() => go(active - 1)} disabled={active === 0}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="body2" sx={{ textAlign: "center", fontWeight: 500, minWidth: 0 }}>
          {caption}
        </Typography>
        <IconButton aria-label="Next pay stub" size="small" onClick={() => go(active + 1)} disabled={active === count - 1}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>
      <Stack direction="row" justifyContent="center" flexWrap="wrap" useFlexGap sx={{ gap: 0.5, mt: 0.5 }}>
        {Array.from({ length: count }, (_, i) => {
          const current = i === active;
          return (
            <Box
              key={i}
              component="button"
              type="button"
              aria-label={`Pay stub ${i + 1}`}
              aria-current={current ? "true" : undefined}
              onClick={() => go(i)}
              sx={{
                width: 24,
                height: 24,
                p: 0,
                borderRadius: "50%",
                border: 1,
                borderColor: current ? "primary.main" : "divider",
                bgcolor: current ? "primary.main" : "background.paper",
                color: current ? "primary.contrastText" : "text.secondary",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1,
                cursor: current ? "default" : "pointer",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              {i + 1}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export default StubPager;
