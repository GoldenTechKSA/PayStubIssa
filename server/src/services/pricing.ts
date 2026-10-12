/**
 * Pricing — the single server-side authority on what a cart costs.
 *
 * All money is handled in integer cents. The shape deliberately carries `items[]`
 * and `couponCode` from day one so volume discounts and coupons slot in here
 * without touching the payment routes or the client.
 */

export const ITEM_TYPES = ['paystub'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export interface CartItem {
  type: ItemType;
  qty: number;
}

export interface CartInput {
  items: CartItem[];
  couponCode?: string;
}

export interface QuoteLine {
  type: ItemType;
  description: string;
  qty: number;
  unitCents: number;
  subtotalCents: number;
}

export interface QuoteDiscount {
  code: string;
  description: string;
  amountCents: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  discounts: QuoteDiscount[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export interface Coupon {
  code: string;
  description: string;
  kind: 'percent' | 'fixed';
  /** Percent (0–100) for `percent`, cents for `fixed`. */
  value: number;
}

export interface PricingRules {
  currency: string;
  unitCents: Record<ItemType, number>;
  /** Maximum quantity per item type in a single order. */
  maxQty: number;
  /** Keyed by upper-cased code. Empty in Phase 1. */
  coupons: Record<string, Coupon>;
}

export type PricingErrorCode = 'EMPTY_CART' | 'INVALID_ITEM' | 'INVALID_QTY' | 'INVALID_COUPON';

export class PricingError extends Error {
  constructor(public readonly code: PricingErrorCode, message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

const DESCRIPTIONS: Record<ItemType, (qty: number) => string> = {
  paystub: qty => (qty === 1 ? 'Pay stub' : `${qty} pay stubs`),
};

export function normalizeCouponCode(code: string | undefined): string | undefined {
  const trimmed = (code ?? '').trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function quoteCart(input: CartInput, rules: PricingRules): Quote {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new PricingError('EMPTY_CART', 'The cart is empty');
  }

  // Merge duplicate item types so `[{paystub,1},{paystub,2}]` is one line of 3.
  const qtyByType = new Map<ItemType, number>();
  for (const item of input.items) {
    if (!ITEM_TYPES.includes(item.type)) {
      throw new PricingError('INVALID_ITEM', `Unknown item type: ${String(item.type)}`);
    }
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      throw new PricingError('INVALID_QTY', 'Quantity must be a whole number of at least 1');
    }
    qtyByType.set(item.type, (qtyByType.get(item.type) ?? 0) + item.qty);
  }

  const lines: QuoteLine[] = [];
  for (const [type, qty] of qtyByType) {
    if (qty > rules.maxQty) {
      throw new PricingError('INVALID_QTY', `You can order at most ${rules.maxQty} ${type}s at a time`);
    }
    const unitCents = rules.unitCents[type];
    lines.push({ type, description: DESCRIPTIONS[type](qty), qty, unitCents, subtotalCents: unitCents * qty });
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.subtotalCents, 0);

  const discounts: QuoteDiscount[] = [];
  const code = normalizeCouponCode(input.couponCode);
  if (code) {
    const coupon = rules.coupons[code];
    if (!coupon) throw new PricingError('INVALID_COUPON', 'That coupon code is not valid');
    const raw = coupon.kind === 'percent'
      ? Math.round((subtotalCents * coupon.value) / 100)
      : coupon.value;
    discounts.push({ code: coupon.code, description: coupon.description, amountCents: Math.min(raw, subtotalCents) });
  }

  const discountCents = discounts.reduce((sum, d) => sum + d.amountCents, 0);
  return {
    currency: rules.currency,
    lines,
    discounts,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}

/** `899` → `"8.99"` — the exact 2dp string PayPal requires. */
export function centsToMoney(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** `"8.99"` → `899`. Throws on anything that isn't a plain decimal amount. */
export function moneyToCents(value: string): number {
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!m) throw new Error(`Unparseable money value: ${value}`);
  const cents = Number(m[2]) * 100 + Number((m[3] ?? '0').padEnd(2, '0'));
  return m[1] ? -cents : cents;
}
