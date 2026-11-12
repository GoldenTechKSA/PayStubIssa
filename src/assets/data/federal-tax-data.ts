// Federal income tax WITHHOLDING tables, one entry per calendar year, copied from IRS
// Publication 15-T ("Federal Income Tax Withholding Methods"), section 1, "Percentage Method
// Tables for Automated Payroll Systems" — the STANDARD withholding rate schedules, i.e. a Form
// W-4 from 2020 or later with the Step 2 box NOT checked and nothing entered in Steps 3 and 4.
//
// How the IRS method reads them (Worksheet 1A):
//   adjusted annual wage = annual taxable wages − `step2UncheckedAllowance` (line 1g)
//   tax = each slice of the adjusted annual wage above an `over` threshold × that row's `rate`
// The 0% first row of each schedule is the gap before the first `over`. Together with line 1g
// it is that year's standard deduction, which is why none is stored separately.
//
// YEARLY REVIEW: the IRS issues a new Publication 15-T each December. Add the new year here
// (and its Social Security wage base, from Publication 15) — a stub dated in a year that is
// missing uses the nearest year on file, which over-withholds as soon as the tables are stale.
// federal-tax.test.ts checks every schedule against the IRS's own "tentative amount" column.
//
// Sources: Publication 15-T for use in 2024, 2025 and 2026; Publication 15 for the wage bases.

export type FederalSchedule = 'marriedFilingJointly' | 'single' | 'headOfHousehold';

export interface FederalBracket {
  over: number; // adjusted annual wage above which `rate` applies (column A)
  rate: number; // column D
}

export interface FederalTaxYear {
  year: number;
  // Worksheet 1A line 1g, Step 2 box not checked.
  step2UncheckedAllowance: { marriedFilingJointly: number; other: number };
  // "Single" is the IRS's "Single or Married Filing Separately" schedule.
  schedules: Record<FederalSchedule, FederalBracket[]>;
  socialSecurityWageBase: number;
}

const RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
const schedule = (...over: number[]): FederalBracket[] => over.map((o, i) => ({ over: o, rate: RATES[i] }));

export const FEDERAL_TAX_YEARS: FederalTaxYear[] = [
  {
    year: 2024,
    step2UncheckedAllowance: { marriedFilingJointly: 12900, other: 8600 },
    schedules: {
      marriedFilingJointly: schedule(16300, 39500, 110600, 217350, 400200, 503750, 747500),
      single: schedule(6000, 17600, 53150, 106525, 197950, 249725, 615350),
      headOfHousehold: schedule(13300, 29850, 76400, 113800, 205250, 257000, 622650),
    },
    socialSecurityWageBase: 168600,
  },
  {
    year: 2025,
    step2UncheckedAllowance: { marriedFilingJointly: 12900, other: 8600 },
    schedules: {
      marriedFilingJointly: schedule(17100, 40950, 114050, 223800, 411700, 518150, 768700),
      single: schedule(6400, 18325, 54875, 109750, 203700, 256925, 632750),
      headOfHousehold: schedule(13900, 30900, 78750, 117250, 211200, 264400, 640250),
    },
    socialSecurityWageBase: 176100,
  },
  {
    year: 2026,
    step2UncheckedAllowance: { marriedFilingJointly: 12900, other: 8600 },
    schedules: {
      marriedFilingJointly: schedule(19300, 44100, 120100, 230700, 422850, 531750, 788000),
      single: schedule(7500, 19900, 57900, 113200, 209275, 263725, 648100),
      headOfHousehold: schedule(15550, 33250, 83000, 121250, 217300, 271750, 656150),
    },
    socialSecurityWageBase: 184500,
  },
];

// The tables for a calendar year. A year before the first on file uses the first; a year after
// the last (or no usable year at all) uses the last.
export const federalTaxYearFor = (year?: number): FederalTaxYear => {
  const last = FEDERAL_TAX_YEARS[FEDERAL_TAX_YEARS.length - 1];
  if (!year || !Number.isFinite(year)) return last;
  if (year <= FEDERAL_TAX_YEARS[0].year) return FEDERAL_TAX_YEARS[0];
  return FEDERAL_TAX_YEARS.find(y => y.year === year) ?? last;
};
