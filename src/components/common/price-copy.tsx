/**
 * price-copy
 * ----------
 * The sentences and the one button the pages share when they talk about price. Every number
 * comes from the server's tier table (contexts/price-context.tsx); with no table they fall
 * back to wording that names no amount.
 */
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@mui/material";
import { formatPrice, usePrice } from "contexts/price-context";
import { telemetry } from "services/telemetry-service";
import { T } from "telemetry/codes";

/**
 * "$X for one pay stub, less per stub when you order more" — the price in one clause.
 * `lower` is for mid-sentence use, where the number-free fallback must not be capitalised.
 */
export const PriceSummary: React.FC<{ lower?: boolean }> = ({ lower = false }) => {
  const { label } = usePrice();
  const lead = label ? `${label} for one pay stub` : lower ? "priced per pay stub" : "Priced per pay stub";
  return <>{lead}, less per stub when you order more</>;
};

/** A worked total for `qty` stubs at the price an order of that size is really charged. */
export const StubExample: React.FC<{ qty: number }> = ({ qty }) => {
  const { priceFor } = usePrice();
  const unit = priceFor(qty);
  if (unit === null) return <>{qty} times the per-stub price for an order of that size</>;
  return <>{formatPrice(unit)} × {qty} = {formatPrice(unit * qty)}</>;
};

/** A link to the Offers page, for use inside a sentence. */
export const OffersLink: React.FC<{ children?: React.ReactNode }> = ({ children = "Offers" }) => (
  <RouterLink to="/offers">{children}</RouterLink>
);

/**
 * The orange "Bundle and Save" button that leads to the Offers page. `placement` says which
 * one was clicked ('hero' | 'pricing_card'); this component is the one emit site for it.
 */
export const BundleButton: React.FC<{ placement: "hero" | "pricing_card"; fullWidth?: boolean }> = ({
  placement,
  fullWidth = false,
}) => (
  <Button
    size="large"
    variant="contained"
    fullWidth={fullWidth}
    color="bundle"
    component={RouterLink}
    to="/offers"
    onClick={() => telemetry.emit(T.OFFERS_BUNDLE_CLICKED, { placement })}
  >
    Bundle and Save
  </Button>
);
