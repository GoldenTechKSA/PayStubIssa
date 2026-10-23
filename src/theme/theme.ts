import { createTheme } from '@mui/material/styles';

/**
 * PayStubIssa design system — "Trust Blue + Profit Green" (light).
 *
 * Single source of truth for color, typography, shape, and motion across the app.
 * Token spec: docs/REDESIGN-PLAN.md §2. Use theme/sx values in components rather
 * than raw hex so the design stays consistent and themeable.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', contrastText: '#FFFFFF' },   // Trust blue
    secondary: { main: '#3B82F6', contrastText: '#FFFFFF' },  // Light blue
    success: { main: '#059669', contrastText: '#FFFFFF' },    // Profit green / accent
    error: { main: '#DC2626', contrastText: '#FFFFFF' },      // Destructive
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    divider: '#E4ECFC',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiAppBar: {
      defaultProps: { color: 'inherit', elevation: 0 },
    },
    MuiTextField: {
      // Compact fields everywhere (40px tall instead of 56px) so wizard steps fit the viewport.
      defaultProps: { size: "small" },
    },
    MuiFormLabel: {
      styleOverrides: {
        // Red required-field asterisk (instead of inheriting the label color).
        asterisk: ({ theme }) => ({ color: theme.palette.error.main }),
      },
    },
  },
});

export default theme;
