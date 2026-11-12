import { describe, it, expect } from '@jest/globals';
import { taxCalculator } from '../utils/tax-calculator';
import { FEDERAL_TAX_YEARS, federalTaxYearFor } from '../assets/data/federal-tax-data';
import { FilingStatus } from '../types/tax-rate-types';

// Federal withholding on a year of wages, in a state with no income tax or paid-leave program.
const federal = (annualWages: number, filingStatus: FilingStatus, taxYear: number) =>
  taxCalculator.calculateTaxes({ grossIncome: annualWages, filingStatus, stateCode: 'TX', taxYear }).federalIncomeTax;

// IRS Publication 15-T, "Percentage Method Tables for Automated Payroll Systems", STANDARD
// schedules: [adjusted annual wage (column A), tentative amount to withhold (column C)] for the
// 22% row and the top 37% row of every schedule. Column C at a row is the tax on everything
// below it, so matching the top row proves every threshold and rate beneath it.
const IRS_COLUMN_C: Record<number, Record<'marriedFilingJointly' | 'single' | 'headOfHousehold', [number, number][]>> = {
  2024: {
    marriedFilingJointly: [[110600, 10852], [747500, 196669.5]],
    single: [[53150, 5426], [615350, 183647.25]],
    headOfHousehold: [[76400, 7241], [622650, 181954.5]],
  },
  2025: {
    marriedFilingJointly: [[114050, 11157], [768700, 202154.5]],
    single: [[54875, 5578.5], [632750, 188769.75]],
    headOfHousehold: [[78750, 7442], [640250, 187031.5]],
  },
  2026: {
    marriedFilingJointly: [[120100, 11600], [788000, 206583.5]],
    single: [[57900, 5800], [648100, 192979.25]],
    headOfHousehold: [[83000, 7740], [656150, 191171]],
  },
};

describe('federal income tax withholding (IRS Publication 15-T percentage method)', () => {
  Object.entries(IRS_COLUMN_C).forEach(([year, schedules]) => {
    Object.entries(schedules).forEach(([status, rows]) => {
      it(`${year} ${status} matches the IRS tentative-amount column`, () => {
        const allowance = status === 'marriedFilingJointly' ? 12900 : 8600; // Worksheet 1A line 1g
        rows.forEach(([adjustedAnnualWage, tentative]) => {
          expect(federal(adjustedAnnualWage + allowance, status as FilingStatus, Number(year))).toBeCloseTo(tentative, 2);
        });
      });
    });
  });

  it('withholds nothing until wages pass line 1g plus the 0% band (the standard deduction)', () => {
    expect(federal(16100, 'single', 2026)).toBe(0);            // 8,600 + 7,500
    expect(federal(16200, 'single', 2026)).toBeCloseTo(10, 2); // 10% of the next 100
    expect(federal(32200, 'marriedFilingJointly', 2026)).toBe(0); // 12,900 + 19,300
    expect(federal(24150, 'headOfHousehold', 2026)).toBe(0);      // 8,600 + 15,550
  });

  it('gives each filing status its own schedule; married filing separately uses the single one', () => {
    const wages = 120000;
    const single = federal(wages, 'single', 2026);
    expect(federal(wages, 'marriedFilingSeparately', 2026)).toBe(single);
    expect(federal(wages, 'headOfHousehold', 2026)).toBeLessThan(single);
    expect(federal(wages, 'marriedFilingJointly', 2026)).toBeLessThan(federal(wages, 'headOfHousehold', 2026));
  });

  it('takes pre-tax deductions out of the wages before the tables', () => {
    const withPreTax = taxCalculator.calculateTaxes({
      grossIncome: 80000, filingStatus: 'single', stateCode: 'TX', taxYear: 2026, additionalDeductions: 5000,
    }).federalIncomeTax;
    expect(withPreTax).toBe(federal(75000, 'single', 2026));
  });

  it('uses the tables of the year asked for, and the nearest year on file outside the range', () => {
    expect(federal(60000, 'single', 2024)).toBeGreaterThan(federal(60000, 'single', 2025));
    expect(federal(60000, 'single', 2025)).toBeGreaterThan(federal(60000, 'single', 2026));
    expect(federalTaxYearFor(2019).year).toBe(2024);
    expect(federalTaxYearFor(2031).year).toBe(FEDERAL_TAX_YEARS[FEDERAL_TAX_YEARS.length - 1].year);
    expect(federalTaxYearFor(undefined).year).toBe(FEDERAL_TAX_YEARS[FEDERAL_TAX_YEARS.length - 1].year);
  });

  it('caps Social Security at the wage base of the year paid', () => {
    const ss = (year: number) => taxCalculator.calculateTaxes({
      grossIncome: 500000, filingStatus: 'single', stateCode: 'TX', taxYear: year,
    }).socialSecurityTax;
    expect(ss(2024)).toBeCloseTo(168600 * 0.062, 2);
    expect(ss(2025)).toBeCloseTo(176100 * 0.062, 2);
    expect(ss(2026)).toBeCloseTo(184500 * 0.062, 2);
  });

  it('charges head of household the additional Medicare tax above $200,000', () => {
    const medicare = taxCalculator.calculateTaxes({
      grossIncome: 300000, filingStatus: 'headOfHousehold', stateCode: 'TX', taxYear: 2026,
    }).medicareTax;
    expect(medicare).toBeCloseTo(300000 * 0.0145 + 100000 * 0.009, 2);
  });
});
