/**
 * offer-cards
 * -----------
 * The WORDS on the Offers page cards. No prices here: quantity ranges and prices come from
 * the server's tier table (contexts/price-context.tsx).
 *
 * The four named cards describe the ranges 1 / 2–4 / 5–8 / 9–12 ("a quarter of bi-weekly
 * pay" is only true of 5–8 stubs). They are used only while the server's table has exactly
 * those ranges; any other table gets `genericOffer` cards, whose copy is true of any range.
 * Keep each description true for EVERY pay frequency the wizard offers, or name the frequency
 * it holds for.
 *
 * Every line has to be one the product actually backs (see CLAUDE.md, "Legal copy").
 */
import { TEMPLATE_COUNT } from "constants/business-info";

export interface OfferCopy {
  minQty: number;
  maxQty: number;
  name: string;
  description: string;
  bullets: string[];
}

const DOWNLOAD = "Download as a PDF or print right after payment";
const TAXES = "Federal, state, Social Security and Medicare withholding calculated for you";
const TEMPLATES = `Choose from ${TEMPLATE_COUNT} templates`;
const ONE_PAGE = "Fits one US Letter page, no special paper needed";
const PERIODS = "Consecutive pay periods filled in for you";
const YTD = "Year-to-date totals carried across the run";
const NO_SUBSCRIPTION = "No subscription, no recurring charge";

export const NAMED_OFFERS: OfferCopy[] = [
  {
    minQty: 1,
    maxQty: 1,
    name: "Single Stub",
    description: "One pay period, one pay stub. For when a single record is all you need.",
    bullets: [DOWNLOAD, TAXES, TEMPLATES, ONE_PAGE, NO_SUBSCRIPTION],
  },
  {
    minQty: 2,
    maxQty: 4,
    name: "Starter Pack",
    description: "A few consecutive pay periods in one order, at a lower price for every stub.",
    bullets: [DOWNLOAD, TAXES, PERIODS, YTD, NO_SUBSCRIPTION],
  },
  {
    minQty: 5,
    maxQty: 8,
    name: "Quarter Pack",
    description: "Covers about a quarter of bi-weekly pay, with year-to-date figures carried across every stub.",
    bullets: [DOWNLOAD, TAXES, PERIODS, YTD, NO_SUBSCRIPTION],
  },
  {
    minQty: 9,
    maxQty: 12,
    name: "Full Run",
    description: "Our lowest price per stub, for a long run of consecutive pay periods.",
    bullets: [DOWNLOAD, TAXES, PERIODS, YTD, NO_SUBSCRIPTION],
  },
];

/** "1 pay stub", "2–4 pay stubs". */
export const rangeLabel = (minQty: number, maxQty: number): string =>
  minQty === maxQty ? `${minQty} pay stub${minQty === 1 ? "" : "s"}` : `${minQty}–${maxQty} pay stubs`;

/** A card for a range the named copy does not cover: nothing in it depends on the range. */
export const genericOffer = (minQty: number, maxQty: number): OfferCopy => {
  const several = maxQty > 1;
  return {
    minQty,
    maxQty,
    name: minQty === maxQty ? `${minQty} Pay Stub${minQty === 1 ? "" : "s"}` : `${minQty}–${maxQty} Pay Stubs`,
    description: several
      ? "Pay stubs for consecutive pay periods in one order, each charged at this price."
      : "One pay period, one pay stub.",
    bullets: several
      ? [DOWNLOAD, TAXES, PERIODS, YTD, NO_SUBSCRIPTION]
      : [DOWNLOAD, TAXES, TEMPLATES, ONE_PAGE, NO_SUBSCRIPTION],
  };
};
