import { describe, it, expect } from '@jest/globals';
import { isValidUSPhone } from '../utils/util';

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
