import { describe, it, expect } from '@jest/globals';
import {
  defaultPeriodStart,
  periodHasEnded,
  periodLengthLabel,
  calculateEndDate,
} from '../utils/date-calculator';

// Local-midnight "today" so the helpers can't be tripped by UTC/local drift.
const day = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

describe('defaultPeriodStart', () => {
  it('Weekly: one week before today', () => {
    expect(defaultPeriodStart('Weekly', day('2026-10-31'))).toBe('2026-10-24');
  });

  it('Bi-Weekly: two weeks before today', () => {
    expect(defaultPeriodStart('Bi-Weekly', day('2026-10-31'))).toBe('2026-10-17');
  });

  it('Weekly crosses a month and a year boundary', () => {
    expect(defaultPeriodStart('Weekly', day('2026-01-03'))).toBe('2025-12-27');
  });

  it('Semi-Monthly: 1st of this month once the first half has ended', () => {
    expect(defaultPeriodStart('Semi-Monthly', day('2026-10-31'))).toBe('2026-10-01');
    expect(defaultPeriodStart('Semi-Monthly', day('2026-10-16'))).toBe('2026-10-01');
  });

  it('Semi-Monthly: 16th of last month while the first half is still running', () => {
    expect(defaultPeriodStart('Semi-Monthly', day('2026-10-15'))).toBe('2026-09-16');
    expect(defaultPeriodStart('Semi-Monthly', day('2026-01-05'))).toBe('2025-12-16');
  });

  it('Monthly: 1st of last month', () => {
    expect(defaultPeriodStart('Monthly', day('2026-10-31'))).toBe('2026-09-01');
    expect(defaultPeriodStart('Monthly', day('2026-01-01'))).toBe('2025-12-01');
  });

  it('Quarterly: 1st of the month three months back', () => {
    expect(defaultPeriodStart('Quarterly', day('2026-10-31'))).toBe('2026-07-01');
    expect(defaultPeriodStart('Quarterly', day('2026-02-10'))).toBe('2025-11-01');
  });

  it('Semiannually: 1st of the month six months back', () => {
    expect(defaultPeriodStart('Semiannually', day('2026-10-31'))).toBe('2026-04-01');
    expect(defaultPeriodStart('Semiannually', day('2026-03-31'))).toBe('2025-09-01');
  });

  it('Annually: 1st of the same month last year', () => {
    expect(defaultPeriodStart('Annually', day('2026-10-31'))).toBe('2025-10-01');
  });

  it('every default yields a period that ends before today', () => {
    const today = day('2026-10-31');
    for (const type of ['Weekly', 'Bi-Weekly', 'Semi-Monthly', 'Monthly', 'Quarterly', 'Semiannually', 'Annually']) {
      const start = defaultPeriodStart(type, today);
      expect(calculateEndDate(start, type) < '2026-10-31').toBe(true);
      expect(periodHasEnded(start, type, today)).toBe(true);
    }
  });

  it('month-end today does not overflow into the wrong month', () => {
    // 31 Mar minus one month must be 1 Feb, not "31 Feb" rolled into March.
    expect(defaultPeriodStart('Monthly', day('2026-03-31'))).toBe('2026-02-01');
    expect(defaultPeriodStart('Weekly', day('2026-03-07'))).toBe('2026-02-28');
  });

  it('unknown frequency falls back to one week', () => {
    expect(defaultPeriodStart('Nonsense', day('2026-10-31'))).toBe('2026-10-24');
  });
});

describe('periodHasEnded', () => {
  const today = day('2026-10-31');

  it('is true when the computed end date is before today', () => {
    expect(periodHasEnded('2026-10-24', 'Weekly', today)).toBe(true); // ends 10-30
  });

  it('is false when the period ends today', () => {
    expect(periodHasEnded('2026-10-25', 'Weekly', today)).toBe(false); // ends 10-31
  });

  it('is false when the period ends in the future', () => {
    expect(periodHasEnded('2026-10-31', 'Weekly', today)).toBe(false);
    expect(periodHasEnded('2026-10-01', 'Monthly', today)).toBe(false); // ends 10-31
  });

  it('is false for an empty or malformed start', () => {
    expect(periodHasEnded('', 'Weekly', today)).toBe(false);
    expect(periodHasEnded('not-a-date', 'Weekly', today)).toBe(false);
  });
});

describe('periodLengthLabel', () => {
  it('names each frequency length in plain words', () => {
    expect(periodLengthLabel('Weekly')).toBe('one week');
    expect(periodLengthLabel('Bi-Weekly')).toBe('two weeks');
    expect(periodLengthLabel('Semi-Monthly')).toBe('half a month');
    expect(periodLengthLabel('Monthly')).toBe('one month');
    expect(periodLengthLabel('Quarterly')).toBe('three months');
    expect(periodLengthLabel('Semiannually')).toBe('six months');
    expect(periodLengthLabel('Annually')).toBe('one year');
  });
});
