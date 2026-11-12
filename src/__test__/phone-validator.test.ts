import { describe, it, expect } from '@jest/globals';
import { isValidUSPhone, normalizeUSPhone } from '../utils/util';

describe('isValidUSPhone', () => {
  it('accepts the usual 10-digit domestic forms', () => {
    expect(isValidUSPhone('(555) 123-4567')).toBe(true);
    expect(isValidUSPhone('555-123-4567')).toBe(true);
    expect(isValidUSPhone('555.123.4567')).toBe(true);
    expect(isValidUSPhone('555 123 4567')).toBe(true);
    expect(isValidUSPhone('5551234567')).toBe(true);
  });

  it('accepts a leading US country code, as browser autofill writes it', () => {
    expect(isValidUSPhone('+1 (555) 123-4567')).toBe(true);
    expect(isValidUSPhone('+1 555-123-4567')).toBe(true);
    expect(isValidUSPhone('+1 555 123 4567')).toBe(true);
    expect(isValidUSPhone('+15551234567')).toBe(true);
    expect(isValidUSPhone('1-555-123-4567')).toBe(true);
    expect(isValidUSPhone('1 (555) 123-4567')).toBe(true);
  });

  it('rejects other country codes, short numbers and junk', () => {
    expect(isValidUSPhone('+44 20 7946 0958')).toBe(false);
    expect(isValidUSPhone('+2 555 123 4567')).toBe(false);
    expect(isValidUSPhone('555-1234')).toBe(false);
    expect(isValidUSPhone('55512345678')).toBe(false);
    expect(isValidUSPhone('')).toBe(false);
    expect(isValidUSPhone('phone')).toBe(false);
  });
});

describe('normalizeUSPhone', () => {
  it('drops a leading US country code and keeps the rest as typed', () => {
    expect(normalizeUSPhone('+1 (555) 123-4567')).toBe('(555) 123-4567');
    expect(normalizeUSPhone('+1 555-123-4567')).toBe('555-123-4567');
    expect(normalizeUSPhone('+15551234567')).toBe('5551234567');
    expect(normalizeUSPhone('1-555-123-4567')).toBe('555-123-4567');
    expect(normalizeUSPhone('1 (555) 123-4567')).toBe('(555) 123-4567');
  });

  it('trims whitespace and leaves a domestic number alone', () => {
    expect(normalizeUSPhone('  (555) 123-4567 ')).toBe('(555) 123-4567');
    expect(normalizeUSPhone('5551234567')).toBe('5551234567');
  });

  it('never strips a leading 1 that is part of the area code', () => {
    expect(normalizeUSPhone('1234567890')).toBe('1234567890');
    expect(normalizeUSPhone('(123) 456-7890')).toBe('(123) 456-7890');
  });

  it('leaves other country codes and junk untouched', () => {
    expect(normalizeUSPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    expect(normalizeUSPhone('')).toBe('');
  });
});
