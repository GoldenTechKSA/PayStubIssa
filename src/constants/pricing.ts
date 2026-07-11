/**
 * pricing
 * -------
 * Pricing is PER PAY STUB. The customer chooses how many stubs to generate
 * (generalInfo.payStubCount, 1–12) and is charged UNIT_PRICE for each one.
 *
 * NOTE: this is client-side pricing. The PayPal order is still built in the
 * browser, so the amount is not yet authoritative — see docs/BACKEND-PLAN.md
 * Phase 1, which moves order creation server-side. Keep this module as the one
 * place the price is defined so that migration is a single swap.
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
