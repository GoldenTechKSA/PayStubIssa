/**
 * pricing
 * -------
 * Pricing is PER PAY STUB. The customer chooses how many stubs to generate
 * (generalInfo.payStubCount, 1–12) and is charged the same per-stub price for each one.
 *
 * The PRICE itself is not here, on purpose. The server (`server/`,
 * PRICE_PER_STUB_CENTS) is the only place it is set: it quotes the cart and
 * creates the PayPal order, and every mention of the price on the site reads it
 * through contexts/price-context.tsx (stamped into the build, then confirmed
 * live). Do not add a price constant back.
 */

export const CURRENCY = 'USD';

export const MIN_STUBS = 1;
export const MAX_STUBS = 12;

/** Clamp a possibly-stringy stub count into the supported range. */
export const normalizeStubCount = (count: unknown): number => {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n)) return MIN_STUBS;
  return Math.min(MAX_STUBS, Math.max(MIN_STUBS, n));
};
