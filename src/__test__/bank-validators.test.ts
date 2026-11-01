import { describe, it, expect } from '@jest/globals';
import { isValidRoutingNumber, isValidBankAccountNumber } from '../utils/util';

describe('isValidRoutingNumber', () => {
  it('accepts a 9-digit number that passes the ABA checksum', () => {
    expect(isValidRoutingNumber('021000021')).toBe(true); // JPMorgan Chase NY
    expect(isValidRoutingNumber('011000015')).toBe(true); // Federal Reserve Bank Boston
  });

  it('rejects a 9-digit number that fails the checksum', () => {
    expect(isValidRoutingNumber('123456789')).toBe(false);
    expect(isValidRoutingNumber('021000022')).toBe(false);
  });

  it('rejects the wrong length or non-digits', () => {
    expect(isValidRoutingNumber('')).toBe(false);
    expect(isValidRoutingNumber('02100002')).toBe(false);
    expect(isValidRoutingNumber('0210000211')).toBe(false);
    expect(isValidRoutingNumber('02100002a')).toBe(false);
  });
});

describe('isValidBankAccountNumber', () => {
  it('accepts 4 to 17 digits', () => {
    expect(isValidBankAccountNumber('1234')).toBe(true);
    expect(isValidBankAccountNumber('12345678901234567')).toBe(true);
  });

  it('rejects too short, too long, or non-digits', () => {
    expect(isValidBankAccountNumber('')).toBe(false);
    expect(isValidBankAccountNumber('123')).toBe(false);
    expect(isValidBankAccountNumber('123456789012345678')).toBe(false);
    expect(isValidBankAccountNumber('1234-5678')).toBe(false);
  });
});
