import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadConfig, parsePriceTiers } from '../src/config';

const base = {
  PAYSTUB_ENV_FILE: path.join('test', 'does-not-exist.env'),
  PAYPAL_CLIENT_ID: 'id',
  PAYPAL_CLIENT_SECRET: 'secret',
  JWT_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
};

const DEFAULT = [
  { minQty: 1, unitCents: 899 },
  { minQty: 2, unitCents: 799 },
  { minQty: 5, unitCents: 699 },
  { minQty: 9, unitCents: 599 },
];

describe('parsePriceTiers', () => {
  it('falls back to the four default tiers when unset or blank', () => {
    expect(parsePriceTiers(undefined, 12)).toEqual(DEFAULT);
    expect(parsePriceTiers('   ', 12)).toEqual(DEFAULT);
  });

  it('parses MINQTY:CENTS pairs, forgiving spaces and a trailing comma', () => {
    expect(parsePriceTiers(' 1:899, 2:799 ,5:699,9:599, ', 12)).toEqual(DEFAULT);
  });

  it('requires at least two tiers: the site tells every visitor that ordering more costs less per stub', () => {
    expect(() => parsePriceTiers('1:1000', 12)).toThrow(/at least two/);
  });

  it('requires the first tier to start at one stub', () => {
    expect(() => parsePriceTiers('2:799', 12)).toThrow(/2:799/);
  });

  it('requires quantities to rise and stay within the order limit', () => {
    expect(() => parsePriceTiers('1:899,5:699,2:599', 12)).toThrow(/2:599/);
    expect(() => parsePriceTiers('1:899,2:799,2:699', 12)).toThrow(/2:699/);
    expect(() => parsePriceTiers('1:899,13:500', 12)).toThrow(/13:500/);
  });

  it('requires the price per stub to fall as the quantity rises', () => {
    expect(() => parsePriceTiers('1:899,2:899', 12)).toThrow(/2:899/);
    expect(() => parsePriceTiers('1:899,2:999', 12)).toThrow(/2:999/);
  });

  it('rejects malformed entries and prices that are not positive whole cents', () => {
    expect(() => parsePriceTiers('1-899', 12)).toThrow(/1-899/);
    expect(() => parsePriceTiers('1:0', 12)).toThrow(/1:0/);
    expect(() => parsePriceTiers('1:-5', 12)).toThrow(/1:-5/);
    expect(() => parsePriceTiers('1:8.99', 12)).toThrow(/1:8\.99/);
    expect(() => parsePriceTiers('1:899,x:799', 12)).toThrow(/x:799/);
  });
});

describe('loadConfig — PRICE_TIERS', () => {
  it('exposes the default tiers as priceTiers', () => {
    expect(loadConfig({ ...base }).priceTiers).toEqual(DEFAULT);
  });

  it('reads PRICE_TIERS from the environment', () => {
    expect(loadConfig({ ...base, PRICE_TIERS: '1:999,3:899' }).priceTiers).toEqual([
      { minQty: 1, unitCents: 999 },
      { minQty: 3, unitCents: 899 },
    ]);
  });

  it('refuses to boot on a bad table, naming the entry', () => {
    expect(() => loadConfig({ ...base, PRICE_TIERS: '1:899,2:999' })).toThrow(/2:999/);
  });

  it('checks tier quantities against MAX_STUBS_PER_ORDER', () => {
    expect(() => loadConfig({ ...base, MAX_STUBS_PER_ORDER: '4', PRICE_TIERS: '1:899,5:699' })).toThrow(/5:699/);
  });
});
