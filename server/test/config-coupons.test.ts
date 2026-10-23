import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadConfig, parseCoupons } from '../src/config';

const base = {
  PAYSTUB_ENV_FILE: path.join('test', 'does-not-exist.env'),
  PAYPAL_CLIENT_ID: 'id',
  PAYPAL_CLIENT_SECRET: 'secret',
  JWT_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
};

describe('parseCoupons', () => {
  it('turns CODE:PERCENT pairs into a percent coupon registry keyed by upper-cased code', () => {
    expect(parseCoupons('friend:25, LAUNCH:10')).toEqual({
      FRIEND: { code: 'FRIEND', description: '25% off', kind: 'percent', value: 25 },
      LAUNCH: { code: 'LAUNCH', description: '10% off', kind: 'percent', value: 10 },
    });
  });

  it('is empty when unset or blank', () => {
    expect(parseCoupons(undefined)).toEqual({});
    expect(parseCoupons('   ')).toEqual({});
  });

  it('rejects a 100% (free) coupon and anything outside 1–99', () => {
    expect(() => parseCoupons('FREE:100')).toThrow(/FREE/);
    expect(() => parseCoupons('ZERO:0')).toThrow(/ZERO/);
    expect(() => parseCoupons('HALF:12.5')).toThrow(/HALF/);
  });

  it('rejects malformed entries and duplicate codes', () => {
    expect(() => parseCoupons('NOPERCENT')).toThrow(/NOPERCENT/);
    expect(() => parseCoupons('BAD CODE:10')).toThrow(/BAD CODE/);
    expect(() => parseCoupons('A:10,a:20')).toThrow(/duplicate/i);
  });
});

describe('COUPONS config', () => {
  it('defaults to no coupons', () => {
    expect(loadConfig({ ...base }).coupons).toEqual({});
  });

  it('exposes the parsed registry', () => {
    expect(loadConfig({ ...base, COUPONS: 'FRIEND:25' }).coupons.FRIEND?.value).toBe(25);
  });

  it('fails startup on a bad value, naming COUPONS', () => {
    expect(() => loadConfig({ ...base, COUPONS: 'FREE:100' })).toThrow(/COUPONS/);
  });
});
