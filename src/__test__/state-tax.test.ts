import { describe, it, expect } from '@jest/globals';
import { taxCalculator } from '../utils/tax-calculator';
import { STATE_NAMES, STATE_TAX_YEARS, stateTaxYearFor, stateTaxRulesFor } from '../assets/data/state-tax-data';
import { FilingStatus } from '../types/tax-rate-types';

// State income tax on a year of wages.
const state = (annualWages: number, stateCode: string, taxYear: number, filingStatus: FilingStatus = 'single') =>
  taxCalculator.calculateTaxes({ grossIncome: annualWages, filingStatus, stateCode, taxYear }).stateIncomeTax;

const NO_WAGE_TAX = ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'];

describe('state income tax data', () => {
  it('holds 2024, 2025 and 2026, each with the same 41 states and DC', () => {
    expect(STATE_TAX_YEARS.map(y => y.year)).toEqual([2024, 2025, 2026]);
    const taxed = Object.keys(STATE_NAMES).filter(code => !NO_WAGE_TAX.includes(code)).sort();
    expect(taxed).toHaveLength(42);
    STATE_TAX_YEARS.forEach(y => expect(Object.keys(y.states).sort()).toEqual(taxed));
  });

  it('names all 50 states and DC', () => {
    expect(Object.keys(STATE_NAMES)).toHaveLength(51);
    expect(taxCalculator.getAvailableStates()).toHaveLength(51);
  });

  it('has well-formed schedules: thresholds rise, rates are between 0% and 15%', () => {
    STATE_TAX_YEARS.forEach(({ year, states }) => {
      Object.entries(states).forEach(([code, rules]) => {
        const schedules = [rules.single, rules.marriedFilingJointly];
        if (rules.lowIncomeSchedule) schedules.push(rules.lowIncomeSchedule.brackets);
        schedules.forEach(schedule => {
          const label = `${code} ${year}`;
          expect([label, schedule.length > 0]).toEqual([label, true]);
          expect([label, schedule.every(bracket => bracket.rate >= 0 && bracket.rate <= 0.15)]).toEqual([label, true]);
          expect([label, schedule.every((bracket, i) => bracket.over >= 0 && (i === 0 || bracket.over > schedule[i - 1].over))])
            .toEqual([label, true]);
        });
        // A joint return never has a smaller deduction or exemption than a single one.
        const amounts = [rules.standardDeduction, rules.personalExemption, rules.personalCredit];
        expect([code, year, amounts.every(amount => !amount || amount.marriedFilingJointly >= amount.single)])
          .toEqual([code, year, true]);
      });
    });
  });

  it('uses the year asked for, and the nearest year on file outside the range', () => {
    expect(stateTaxYearFor(2019).year).toBe(2024);
    expect(stateTaxYearFor(2025).year).toBe(2025);
    expect(stateTaxYearFor(2031).year).toBe(2026);
    expect(stateTaxYearFor(undefined).year).toBe(2026);
    expect(stateTaxRulesFor('nc', 2026)).toBe(stateTaxRulesFor('NC', 2026));
    expect(stateTaxRulesFor('TX', 2026)).toBeUndefined();
    expect(stateTaxRulesFor('ZZ', 2026)).toBeUndefined();
  });
});

// Every figure below is worked by hand from the Tax Foundation table of that year; the sum is
// in the comment so it can be re-checked against the source without running the code.
describe('state income tax on a year of wages', () => {
  it('charges nothing in the nine states that do not tax wages', () => {
    NO_WAGE_TAX.forEach(code => {
      expect(state(90000, code, 2026)).toBe(0);
      expect(taxCalculator.stateHasIncomeTax(code)).toBe(false);
    });
    expect(taxCalculator.stateHasIncomeTax('CA')).toBe(true);
  });

  it('flat-rate states: wages less the deduction or exemption, times the rate', () => {
    expect(state(60000, 'PA', 2026)).toBeCloseTo(1842, 2);     // 60,000 x 3.07%
    expect(state(60000, 'MI', 2026)).toBeCloseTo(2299.25, 2);  // (60,000 - 5,900) x 4.25%
    expect(state(60000, 'KY', 2026)).toBeCloseTo(1982.4, 2);   // (60,000 - 3,360) x 3.5%
    expect(state(60000, 'GA', 2026)).toBeCloseTo(2245.5, 2);   // (60,000 - 15,000) x 4.99%
    expect(state(60000, 'IL', 2026)).toBeCloseTo(2825.21, 2);  // (60,000 - 2,925) x 4.95%
    expect(state(62875, 'LA', 2026)).toBeCloseTo(1500, 2);     // (62,875 - 12,875) x 3%
  });

  it('follows the rate cuts from year to year', () => {
    // North Carolina, (52,750 - 12,750) = 40,000 at 4.5%, 4.25%, 3.99%
    expect(state(52750, 'NC', 2024)).toBeCloseTo(1800, 2);
    expect(state(52750, 'NC', 2025)).toBeCloseTo(1700, 2);
    expect(state(52750, 'NC', 2026)).toBeCloseTo(1596, 2);
    // Indiana, (51,000 - 1,000) = 50,000 at 3.05%, 3%, 2.95%
    expect(state(51000, 'IN', 2024)).toBeCloseTo(1525, 2);
    expect(state(51000, 'IN', 2025)).toBeCloseTo(1500, 2);
    expect(state(51000, 'IN', 2026)).toBeCloseTo(1475, 2);
    // Georgia, (60,000 - 12,000) x 5.49% in 2024 and x 5.19% in 2025
    expect(state(60000, 'GA', 2024)).toBeCloseTo(2635.2, 2);
    expect(state(60000, 'GA', 2025)).toBeCloseTo(2491.2, 2);
    // A 2027 pay date uses 2026 until the next year is added.
    expect(state(52750, 'NC', 2027)).toBeCloseTo(1596, 2);
  });

  it('bracket states: California, with the exemption credit taken off the tax', () => {
    // taxable 60,000 - 5,540 = 54,460
    // 11,079 x 1% + 15,185 x 2% + 15,188 x 4% + 13,008 x 6% = 110.79 + 303.70 + 607.52 + 780.48
    // = 1,802.49, less the 153 credit
    expect(state(60000, 'CA', 2026)).toBeCloseTo(1649.49, 2);
  });

  it('bracket states: New York', () => {
    // taxable 60,000 - 8,000 = 52,000
    // 8,500 x 3.9% + 3,200 x 4.4% + 2,200 x 5.15% + 38,100 x 5.4% = 331.50 + 140.80 + 113.30 + 2,057.40
    expect(state(60000, 'NY', 2026)).toBeCloseTo(2643, 2);
  });

  it('bracket states with a 0% band: Ohio and Mississippi', () => {
    expect(state(66450, 'OH', 2026)).toBeCloseTo(1045, 2); // (66,450 - 2,400 - 26,050) x 2.75%
    expect(state(60000, 'MS', 2026)).toBeCloseTo(1668, 2); // (60,000 - 2,300 - 6,000 - 10,000) x 4%
  });

  it('gives a married couple filing jointly its own, wider schedule', () => {
    // Twice the wages on a joint return is twice the single tax where the state doubles everything.
    expect(state(120000, 'CA', 2026, 'marriedFilingJointly')).toBeCloseTo(2 * 1649.49, 2);
    // New York: joint amounts are not exact doubles, but joint is far below single on the same wages.
    expect(state(120000, 'NY', 2026, 'marriedFilingJointly')).toBeLessThan(state(120000, 'NY', 2026));
    // Head of household and married filing separately use the single schedule.
    expect(state(60000, 'CA', 2026, 'headOfHousehold')).toBe(state(60000, 'CA', 2026));
    expect(state(60000, 'CA', 2026, 'marriedFilingSeparately')).toBe(state(60000, 'CA', 2026));
  });

  it('gives a head of household the federal amount where the state uses the federal standard deduction', () => {
    expect(state(60000, 'CO', 2026)).toBeCloseTo(1931.6, 2);                    // (60,000 - 16,100) x 4.4%
    expect(state(60000, 'CO', 2026, 'headOfHousehold')).toBeCloseTo(1577.4, 2); // (60,000 - 24,150) x 4.4%
    expect(state(60000, 'CO', 2024, 'headOfHousehold')).toBeCloseTo(1676.4, 2);  // (60,000 - 21,900) x 4.4%
  });

  it('Wisconsin: the standard deduction shrinks as wages rise', () => {
    // deduction 13,960 - (60,000 - 20,119) x 12% = 9,174.28; exemption 700; taxable 50,125.72
    // 15,110 x 3.5% + 35,015.72 x 4.4% = 528.85 + 1,540.69
    expect(state(60000, 'WI', 2026)).toBeCloseTo(2069.54, 2);
    // Above 136,453 the deduction is gone: taxable 150,000 - 700 = 149,300
    // 528.85 + 36,840 x 4.4% + 97,350 x 5.3% = 528.85 + 1,620.96 + 5,159.55
    expect(state(150000, 'WI', 2026)).toBeCloseTo(7309.36, 2);
  });

  it('Connecticut: the personal exemption is gone 15,000 above its threshold', () => {
    expect(state(25000, 'CT', 2026)).toBeCloseTo(200, 2);  // (25,000 - 15,000) x 2%
    // exemption 15,000 - 10,000 = 5,000; taxable 35,000: 10,000 x 2% + 25,000 x 4.5%
    expect(state(40000, 'CT', 2026)).toBeCloseTo(1325, 2);
    // no exemption: 10,000 x 2% + 40,000 x 4.5% + 10,000 x 5.5%
    expect(state(60000, 'CT', 2026)).toBeCloseTo(2550, 2);
  });

  it('Utah: the taxpayer credit shrinks by 1.3 cents per dollar', () => {
    // 60,000 x 4.5% = 2,700; credit 966 - (60,000 - 18,213) x 1.3% = 422.77
    expect(state(60000, 'UT', 2026)).toBeCloseTo(2277.23, 2);
    // credit gone: 120,000 x 4.5%
    expect(state(120000, 'UT', 2026)).toBeCloseTo(5400, 2);
  });

  it('Arkansas: a standard table up to 94,700 of taxable income, another above it', () => {
    // taxable 60,000 - 2,470 = 57,530, standard table:
    // 5,600 x 2% + 4,800 x 3% + 10,400 x 3.4% + 31,130 x 3.7% = 112 + 144 + 353.60 + 1,151.81
    // = 1,761.41, less the 29 credit
    expect(state(60000, 'AR', 2026)).toBeCloseTo(1732.41, 2);
    // taxable 147,530, upper table: 4,700 x 2% + 142,830 x 3.7% = 94 + 5,284.71, less 29
    expect(state(150000, 'AR', 2026)).toBeCloseTo(5349.71, 2);
    // 2025, standard table up to 92,300: 5,400 x 2% + 4,700 x 3% + 10,100 x 3.4% + 31,890 x 3.9%
    // on taxable 60,000 - 2,410 = 57,590: 108 + 141 + 343.40 + 1,243.71 = 1,836.11, less 29
    expect(state(60000, 'AR', 2025)).toBeCloseTo(1807.11, 2);
  });

  it('West Virginia 2026: the rates after the 5% cut', () => {
    // taxable 60,000 - 2,000 = 58,000: 211 + 15,000 x 2.81% + 15,000 x 3.16% + 18,000 x 4.22%
    // = 211 + 421.50 + 474 + 759.60
    expect(state(60000, 'WV', 2026)).toBeCloseTo(1866.1, 2);
  });

  it('South Carolina 2026: two rates and a deduction that shrinks from 40,000 of wages', () => {
    expect(state(30000, 'SC', 2026)).toBeCloseTo(298.5, 2); // (30,000 - 15,000) x 1.99%
    // deduction 15,000 - 20,000 x 3/11 = 9,545.44; taxable 50,454.56
    // 30,000 x 1.99% + 20,454.56 x 5.21% = 597 + 1,065.68
    expect(state(60000, 'SC', 2026)).toBeCloseTo(1662.68, 2);
    // no deduction left at 95,000: 597 + 70,000 x 5.21%
    expect(state(100000, 'SC', 2026)).toBeCloseTo(4244, 2);
    // head of household: deduction 22,500 untouched below 60,000; taxable 27,500 x 1.99%
    expect(state(50000, 'SC', 2026, 'headOfHousehold')).toBeCloseTo(547.25, 2);
  });

  it('never goes below zero, and charges nothing under the deduction', () => {
    expect(state(10000, 'GA', 2026)).toBe(0);
    expect(state(6000, 'CA', 2026)).toBe(0);   // 460 x 1% is less than the credit
    expect(state(0, 'NY', 2026)).toBe(0);
  });

  it('takes pre-tax deductions out of the wages first', () => {
    const withPreTax = taxCalculator.calculateTaxes({
      grossIncome: 80000, filingStatus: 'single', stateCode: 'NC', taxYear: 2026, additionalDeductions: 5000,
    }).stateIncomeTax;
    expect(withPreTax).toBe(state(75000, 'NC', 2026));
  });
});
