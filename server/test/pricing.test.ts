import { describe, expect, it } from 'vitest';
import { centsToMoney, moneyToCents, quoteCart, PricingError, type PricingRules } from '../src/services/pricing';
import { rules } from './helpers';

describe('quoteCart', () => {
  it('prices a single pay stub at the unit price', () => {
    const q = quoteCart({ items: [{ type: 'paystub', qty: 1 }] }, rules);
    expect(q.totalCents).toBe(899);
    expect(q.subtotalCents).toBe(899);
    expect(q.discountCents).toBe(0);
    expect(q.lines).toEqual([
      { type: 'paystub', description: 'Pay stub', qty: 1, unitCents: 899, subtotalCents: 899 },
    ]);
  });

  it('multiplies by quantity without floating point drift', () => {
    const q = quoteCart({ items: [{ type: 'paystub', qty: 12 }] }, rules);
    expect(q.totalCents).toBe(10788);
    expect(q.lines[0].description).toBe('12 pay stubs');
  });

  it('merges duplicate item lines', () => {
    const q = quoteCart({ items: [{ type: 'paystub', qty: 2 }, { type: 'paystub', qty: 3 }] }, rules);
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0].qty).toBe(5);
  });

  it('rejects an empty cart, bad quantities and unknown items', () => {
    expect(() => quoteCart({ items: [] }, rules)).toThrow(PricingError);
    expect(() => quoteCart({ items: [{ type: 'paystub', qty: 0 }] }, rules)).toThrowError(/at least 1/);
    expect(() => quoteCart({ items: [{ type: 'paystub', qty: 1.5 }] }, rules)).toThrow(PricingError);
    expect(() => quoteCart({ items: [{ type: 'paystub', qty: 13 }] }, rules)).toThrowError(/at most 12/);
    expect(() => quoteCart({ items: [{ type: 'bogus' as any, qty: 1 }] }, rules)).toThrowError(/Unknown item/);
  });

  it('rejects unknown coupon codes but ignores blank ones', () => {
    expect(() => quoteCart({ items: [{ type: 'paystub', qty: 1 }], couponCode: 'NOPE' }, rules)).toThrowError(/coupon/);
    expect(quoteCart({ items: [{ type: 'paystub', qty: 1 }], couponCode: '   ' }, rules).totalCents).toBe(899);
  });

  it('applies percent and fixed coupons, capped at the subtotal', () => {
    const withCoupons: PricingRules = {
      ...rules,
      coupons: {
        TEN: { code: 'TEN', description: '10% off', kind: 'percent', value: 10 },
        BIG: { code: 'BIG', description: '$50 off', kind: 'fixed', value: 5000 },
      },
    };
    const pct = quoteCart({ items: [{ type: 'paystub', qty: 2 }], couponCode: 'ten' }, withCoupons);
    expect(pct.discountCents).toBe(180); // 1798 * 10% = 179.8 → 180
    expect(pct.totalCents).toBe(1618);
    expect(pct.discounts[0].code).toBe('TEN');

    const fixed = quoteCart({ items: [{ type: 'paystub', qty: 1 }], couponCode: 'BIG' }, withCoupons);
    expect(fixed.discountCents).toBe(899);
    expect(fixed.totalCents).toBe(0);
  });
});

describe('money helpers', () => {
  it('formats cents as a 2dp string', () => {
    expect(centsToMoney(899)).toBe('8.99');
    expect(centsToMoney(10788)).toBe('107.88');
    expect(centsToMoney(5)).toBe('0.05');
    expect(centsToMoney(0)).toBe('0.00');
  });

  it('parses PayPal amount strings', () => {
    expect(moneyToCents('8.99')).toBe(899);
    expect(moneyToCents('107.8')).toBe(10780);
    expect(moneyToCents('12')).toBe(1200);
    expect(() => moneyToCents('8.999')).toThrow();
    expect(() => moneyToCents('abc')).toThrow();
  });
});
