import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, CardContent, Chip, Container, Grid, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { formatPrice, usePrice, type PriceTier } from "contexts/price-context";
import { telemetry } from "services/telemetry-service";
import { T } from "telemetry/codes";
import { NAMED_OFFERS, genericOffer, rangeLabel, type OfferCopy } from "./offer-cards";

interface Offer extends OfferCopy {
  /** Price of one stub in this tier, in cents; null when prices are not known. */
  unitCents: number | null;
  /** What each stub costs less than a single stub does, in cents (0 when nothing). */
  saveCents: number;
  bestValue: boolean;
}

/**
 * One card per tier of the server's price table. The named copy is used only while the
 * table's ranges are the ones that copy describes; with no table at all (prices unknown) the
 * named cards still show, without a number.
 */
const buildOffers = (tiers: PriceTier[]): Offer[] => {
  if (tiers.length === 0) {
    return NAMED_OFFERS.map(copy => ({ ...copy, unitCents: null, saveCents: 0, bestValue: false }));
  }
  const named =
    tiers.length === NAMED_OFFERS.length &&
    tiers.every((t, i) => t.minQty === NAMED_OFFERS[i].minQty && t.maxQty === NAMED_OFFERS[i].maxQty);
  const single = tiers[0].unitCents;
  const lowest = Math.min(...tiers.map(t => t.unitCents));
  return tiers.map((t, i) => ({
    ...(named ? NAMED_OFFERS[i] : genericOffer(t.minQty, t.maxQty)),
    unitCents: t.unitCents,
    saveCents: Math.max(0, single - t.unitCents),
    // Only a tier that really is cheaper than buying one stub, and cheapest of all.
    bestValue: tiers.length > 1 && t.unitCents === lowest && t.unitCents < single,
  }));
};

// The green of this page is the DARK shade of the theme's success colour: white text on the
// regular shade, and that shade as text on white, fall short of WCAG AA (about 3.8:1) at these
// sizes; the dark shade clears 4.5:1 both ways.
const GREEN = { bgcolor: "success.dark", color: "common.white" } as const;

const OfferCard: React.FC<{ offer: Offer }> = ({ offer }) => (
  <Card
    data-testid="offer-card"
    variant="outlined"
    sx={{
      height: "100%",
      display: "flex",
      position: "relative",
      // Same border width on every card, so the best-value card does not sit a pixel lower.
      borderWidth: 2,
      borderColor: offer.bestValue ? "success.dark" : "divider",
    }}
  >
    <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", flexGrow: 1, "&:last-child": { pb: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ minHeight: 32 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {offer.name}
        </Typography>
        {offer.bestValue && <Chip label="Best value" size="small" sx={{ ...GREEN, fontWeight: 600 }} />}
      </Stack>
      <Typography data-testid="offer-range" variant="subtitle2" color="primary" sx={{ mt: 0.5 }}>
        {rangeLabel(offer.minQty, offer.maxQty)}
      </Typography>

      {/* A fixed-height description keeps the price rows of all four cards on one line. */}
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2, minHeight: { sm: 120, md: 150, lg: 104 } }}>
        {offer.description}
      </Typography>

      <Box sx={{ mt: 2, minHeight: 76 }}>
        {offer.unitCents !== null && (
          <>
            <Typography data-testid="offer-price" component="p" sx={{ lineHeight: 1.1 }}>
              <Box component="span" sx={{ fontSize: "2.5rem", fontWeight: 700 }}>
                {formatPrice(offer.unitCents)}
              </Box>
              <Box component="span" sx={{ fontSize: "1.125rem", color: "text.secondary" }}>/each</Box>
            </Typography>
            {offer.saveCents > 0 && (
              <Typography variant="body2" sx={{ color: "success.dark", fontWeight: 600, mt: 0.5 }}>
                Save {formatPrice(offer.saveCents)} per stub
              </Typography>
            )}
          </>
        )}
      </Box>

      <Stack component="ul" spacing={1.25} sx={{ listStyle: "none", p: 0, m: 0, mt: 2, mb: 3, flexGrow: 1 }}>
        {offer.bullets.map(bullet => (
          <Stack key={bullet} component="li" direction="row" spacing={1} alignItems="flex-start">
            <CheckCircleOutlineIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
            <Typography variant="body2">{bullet}</Typography>
          </Stack>
        ))}
      </Stack>

      <Button
        component={RouterLink}
        to={`/create?stubs=${offer.minQty}`}
        fullWidth
        size="large"
        variant="contained"
        color="primary"
        sx={offer.bestValue ? { ...GREEN, "&:hover": { bgcolor: "success.dark", filter: "brightness(0.9)" } } : undefined}
        endIcon={<ArrowForwardIcon />}
        onClick={() => telemetry.emit(T.OFFERS_TIER_SELECTED, { stubCount: offer.minQty })}
      >
        Make yours now!
      </Button>
    </CardContent>
  </Card>
);

const OffersPage: React.FC = () => {
  const { tiers } = usePrice();
  const offers = buildOffers(tiers);
  // Four cards sit four across on a desktop; any other count shares the row evenly.
  const mdSize = offers.length >= 4 ? 3 : 12 / offers.length;

  return (
    <Box sx={{ py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" component="h1" align="center" sx={{ fontWeight: 700, fontSize: { xs: "2rem", md: "2.75rem" } }}>
          Our Great <Box component="span" sx={{ color: "primary.main" }}>Offers!</Box>
        </Typography>
        <Typography variant="h6" component="p" align="center" sx={{ fontWeight: 400, mt: 1, mb: { xs: 4, md: 6 } }}>
          Select the best fit for you
        </Typography>

        <Grid container spacing={3} alignItems="stretch" justifyContent="center">
          {offers.map(offer => (
            <Grid key={offer.minQty} size={{ xs: 12, sm: 6, md: mdSize }}>
              <OfferCard offer={offer} />
            </Grid>
          ))}
        </Grid>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
          Every pay stub in an order is charged at the price of the pack the order falls in. You choose
          the number of pay stubs in the Pay period step, and the total is shown before you pay.
        </Typography>
      </Container>
    </Box>
  );
};

export default OffersPage;
