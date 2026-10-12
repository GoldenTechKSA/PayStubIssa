/**
 * pricing
 * -------
 * Pricing is PER PAY STUB. The customer chooses how many stubs to generate
 * (generalInfo.payStubCount, 1–12) and is charged UNIT_PRICE for each one.
 *
 * NOTE: the server (`server/`, PRICE_PER_STUB_CENTS) is the pricing authority:
 * it quotes the cart and creates the PayPal order. These constants are only a
 * display fallback for the moment before `POST /api/payments/quote` answers
 * (see services/payments-api.ts). Keep them in sync with the server default.
 */

export const CURRENCY = 'USD';

/** Price charged for each pay stub generated. */
export const UNIT_PRICE = 8.99;

export const MIN_STUBS = 1;
export const MAX_STUBS = 12;

/** Clamp a possibly-stringy stub count into the supported range. */
export const normalizeStubCount = (count: unknown): number => {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n)) return MIN_STUBS;
  return Math.min(MAX_STUBS, Math.max(MIN_STUBS, n));
};

/** Total charge for `count` stubs, rounded to cents. */
export const orderTotal = (count: unknown): number =>
  Math.round(normalizeStubCount(count) * UNIT_PRICE * 100) / 100;
