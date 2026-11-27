// State income tax on wages, one entry per calendar year, for the 41 states and the District of
// Columbia that tax wages. Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee,
// Texas, Washington and Wyoming do not, and are simply absent from `states`.
//
// Source: Tax Foundation, "State Individual Income Tax Rates and Brackets", the 2024, 2025 and
// 2026 editions (rates as of January 1 of each year; the 2026 edition is dated February 11,
// 2026). Where a state had not published its inflation-adjusted figures in time, that edition
// carries the previous year's, and so does this file.
//
// What a state entry holds:
//   single / marriedFilingJointly — the rate schedule: `rate` applies to taxable income above
//       `over`. Income below the first `over` is taxed at 0%. Head of household and married
//       filing separately use the single schedule and the single amounts below, with one
//       exception: where a state's standard deduction is the federal one, a head of household
//       gets the federal head-of-household amount (`standardDeduction.headOfHousehold`).
//   standardDeduction, personalExemption — taken off wages before the schedule. The exemption
//       is the filer's own (two for a joint return); dependents are not modelled.
//   personalCredit — a personal exemption or standard deduction the state gives as a credit:
//       taken off the tax.
//   standardDeductionPhaseOut / personalExemptionPhaseOut / personalCreditPhaseOut — the amount
//       shrinks by `rate` for every dollar of wages above `over` (Wisconsin's sliding standard
//       deduction, Connecticut's exemption, Utah's taxpayer credit).
//   lowIncomeSchedule — a separate schedule for taxable income up to `upTo` (Arkansas).
//
// This is the state's rate schedule applied to a year of wages. It is NOT the state's own
// employer withholding formula, and it leaves out: the head-of-household schedules and
// deductions that some states have of their own (California, New York, Minnesota and others), local income taxes (Maryland counties, New
// York City, Ohio and Pennsylvania municipalities, Indiana counties and others), the deduction
// some states give for federal income tax paid (Alabama, Missouri, Oregon), high-income
// phase-outs and recapture rules other than the three named above, and anything that depends
// on dependents.
//
// Four standard deductions differ from the source table, each marked "corrected" below. These
// states start from federal taxable income, so the federal standard deduction applies: Iowa
// 2024 (the table shows none), New Mexico and North Dakota 2025 (the table's joint amount is
// the federal head-of-household figure) and South Carolina 2025 (the table shows 8,300, the
// level from before the 2017 federal increase, which still applied through 2025).
//
// Four states changed their 2026 tax by a law passed after the 2026 edition was published,
// each effective for the whole of 2026. Their 2026 entries follow the law, not the table:
//   Georgia — H.B. 463 (May 2026): 4.99%, standard deduction 15,000 / 30,000.
//   West Virginia — S.B. 392 (March 2026): every rate cut by 5% (2.11% to 4.58%).
//   Arkansas — H.B. 1001 (May 2026): top rate 3.7%, standard table up to 94,700.
//   South Carolina — H. 4216 (2026): 1.99% up to 30,000 and 5.21% above; its own deduction of
//       15,000 / 22,500 (head of household) / 30,000, gone in a straight line between 40,000
//       and 95,000 of income (60,000–142,500, 80,000–190,000).
// A state can do this in any year, so check for mid-year laws when a stub's state tax is queried.
//
// YEARLY REVIEW: the Tax Foundation publishes the new edition each February, and states cut
// rates on January 1. Add the new year here — a stub dated in a year that is missing uses the
// nearest year on file. state-tax.test.ts holds hand-worked figures for each year.

import { FilingStatus } from '../../types/tax-rate-types';

export interface StateBracket {
  over: number;
  rate: number;
}

interface PerStatus<T> {
  single: T;
  marriedFilingJointly: T;
}

export interface StatePhaseOut {
  over: number; // wages above which the amount starts to shrink
  rate: number; // dollars lost per dollar of wages above `over`
}

export interface StateIncomeTaxRules extends PerStatus<StateBracket[]> {
  standardDeduction?: PerStatus<number> & { headOfHousehold?: number };
  standardDeductionPhaseOut?: PerStatus<StatePhaseOut> & { headOfHousehold?: StatePhaseOut };
  personalExemption?: PerStatus<number>;
  personalExemptionPhaseOut?: PerStatus<StatePhaseOut>;
  personalCredit?: PerStatus<number>;
  personalCreditPhaseOut?: PerStatus<StatePhaseOut>;
  lowIncomeSchedule?: { upTo: number; brackets: StateBracket[] };
}

export interface StateTaxYear {
  year: number;
  states: Record<string, StateIncomeTaxRules>;
}

const b = (...rows: [number, number][]): StateBracket[] => rows.map(([over, rate]) => ({ over, rate }));

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

export const STATE_TAX_YEARS: StateTaxYear[] = [
  {
    year: 2024,
    states: {
      AL: {
        single: b([0, 0.02], [500, 0.04], [3000, 0.05]),
        marriedFilingJointly: b([0, 0.02], [1000, 0.04], [6000, 0.05]),
        standardDeduction: { single: 3000, marriedFilingJointly: 8500 },
        personalExemption: { single: 1500, marriedFilingJointly: 3000 },
      },
      AZ: {
        single: b([0, 0.025]),
        marriedFilingJointly: b([0, 0.025]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      AR: {
        single: b([0, 0.02], [4400, 0.04], [8800, 0.044]),
        marriedFilingJointly: b([0, 0.02], [4400, 0.04], [8800, 0.044]),
        standardDeduction: { single: 2340, marriedFilingJointly: 4680 },
        personalCredit: { single: 29, marriedFilingJointly: 58 },
        lowIncomeSchedule: { upTo: 87000, brackets: b([5300, 0.02], [10600, 0.03], [15100, 0.034], [25000, 0.044]) },
      },
      CA: {
        single: b([0, 0.01], [10412, 0.02], [24684, 0.04], [38959, 0.06], [54081, 0.08], [68350, 0.093], [349137, 0.103], [418961, 0.113], [698271, 0.123], [1000000, 0.133]),
        marriedFilingJointly: b([0, 0.01], [20824, 0.02], [49368, 0.04], [77918, 0.06], [108162, 0.08], [136700, 0.093], [698274, 0.103], [837922, 0.113], [1000000, 0.123], [1396542, 0.133]),
        standardDeduction: { single: 5363, marriedFilingJointly: 10726 },
        personalCredit: { single: 144, marriedFilingJointly: 288 },
      },
      CO: {
        single: b([0, 0.044]),
        marriedFilingJointly: b([0, 0.044]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      CT: {
        single: b([0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]),
        marriedFilingJointly: b([0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]),
        personalExemption: { single: 15000, marriedFilingJointly: 24000 },
        personalExemptionPhaseOut: { single: { over: 30000, rate: 1 }, marriedFilingJointly: { over: 48000, rate: 1 } },
      },
      DE: {
        single: b([2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]),
        marriedFilingJointly: b([2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]),
        standardDeduction: { single: 3250, marriedFilingJointly: 6500 },
        personalCredit: { single: 110, marriedFilingJointly: 220 },
      },
      GA: {
        single: b([0, 0.0549]),
        marriedFilingJointly: b([0, 0.0549]),
        standardDeduction: { single: 12000, marriedFilingJointly: 24000 },
      },
      HI: {
        single: b([0, 0.014], [2400, 0.032], [4800, 0.055], [9600, 0.064], [14400, 0.068], [19200, 0.072], [24000, 0.076], [36000, 0.079], [48000, 0.0825], [150000, 0.09], [175000, 0.1], [200000, 0.11]),
        marriedFilingJointly: b([0, 0.014], [4800, 0.032], [9600, 0.055], [19200, 0.064], [28800, 0.068], [38400, 0.072], [48000, 0.076], [72000, 0.079], [96000, 0.0825], [300000, 0.09], [350000, 0.1], [400000, 0.11]),
        standardDeduction: { single: 2200, marriedFilingJointly: 4400 },
        personalExemption: { single: 1144, marriedFilingJointly: 2288 },
      },
      ID: {
        single: b([4489, 0.058]),
        marriedFilingJointly: b([8978, 0.058]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      IL: {
        single: b([0, 0.0495]),
        marriedFilingJointly: b([0, 0.0495]),
        personalExemption: { single: 2775, marriedFilingJointly: 5550 },
      },
      IN: {
        single: b([0, 0.0305]),
        marriedFilingJointly: b([0, 0.0305]),
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      IA: {
        single: b([0, 0.044], [6210, 0.0482], [31050, 0.057]),
        marriedFilingJointly: b([0, 0.044], [12420, 0.0482], [62100, 0.057]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 }, // corrected, see the note at the top
        personalCredit: { single: 40, marriedFilingJointly: 80 },
      },
      KS: {
        single: b([0, 0.031], [15000, 0.0525], [30000, 0.057]),
        marriedFilingJointly: b([0, 0.031], [30000, 0.0525], [60000, 0.057]),
        standardDeduction: { single: 3500, marriedFilingJointly: 8000 },
        personalExemption: { single: 2250, marriedFilingJointly: 4500 },
      },
      KY: {
        single: b([0, 0.04]),
        marriedFilingJointly: b([0, 0.04]),
        standardDeduction: { single: 3160, marriedFilingJointly: 3160 },
      },
      LA: {
        single: b([0, 0.0185], [12500, 0.035], [50000, 0.04245]),
        marriedFilingJointly: b([0, 0.0185], [25000, 0.035], [100000, 0.04245]),
        personalExemption: { single: 4500, marriedFilingJointly: 9000 },
      },
      ME: {
        single: b([0, 0.058], [26050, 0.0675], [61600, 0.0715]),
        marriedFilingJointly: b([0, 0.058], [52100, 0.0675], [123250, 0.0715]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
        personalExemption: { single: 5000, marriedFilingJointly: 10000 },
      },
      MD: {
        single: b([0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575]),
        marriedFilingJointly: b([0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575]),
        standardDeduction: { single: 2550, marriedFilingJointly: 5150 },
        personalExemption: { single: 3200, marriedFilingJointly: 6400 },
      },
      MA: {
        single: b([0, 0.05], [1000000, 0.09]),
        marriedFilingJointly: b([0, 0.05], [1000000, 0.09]),
        personalExemption: { single: 4400, marriedFilingJointly: 8800 },
      },
      MI: {
        single: b([0, 0.0425]),
        marriedFilingJointly: b([0, 0.0425]),
        personalExemption: { single: 5600, marriedFilingJointly: 11200 },
      },
      MN: {
        single: b([0, 0.0535], [31690, 0.068], [104090, 0.0785], [193240, 0.0985]),
        marriedFilingJointly: b([0, 0.0535], [46330, 0.068], [184040, 0.0785], [321450, 0.0985]),
        standardDeduction: { single: 14575, marriedFilingJointly: 29150 },
      },
      MS: {
        single: b([10000, 0.047]),
        marriedFilingJointly: b([10000, 0.047]),
        standardDeduction: { single: 2300, marriedFilingJointly: 4600 },
        personalExemption: { single: 6000, marriedFilingJointly: 12000 },
      },
      MO: {
        single: b([1273, 0.02], [2546, 0.025], [3819, 0.03], [5092, 0.035], [6365, 0.04], [7638, 0.045], [8911, 0.048]),
        marriedFilingJointly: b([1207, 0.02], [2414, 0.025], [3621, 0.03], [4828, 0.035], [6035, 0.04], [7242, 0.045], [8449, 0.048]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      MT: {
        single: b([0, 0.047], [20500, 0.059]),
        marriedFilingJointly: b([0, 0.047], [41000, 0.059]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      NE: {
        single: b([0, 0.0246], [3700, 0.0351], [22170, 0.0501], [35730, 0.0584]),
        marriedFilingJointly: b([0, 0.0246], [7390, 0.0351], [44350, 0.0501], [71460, 0.0584]),
        standardDeduction: { single: 7900, marriedFilingJointly: 15800 },
        personalCredit: { single: 157, marriedFilingJointly: 314 },
      },
      NJ: {
        single: b([0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.05525], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]),
        marriedFilingJointly: b([0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.05525], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]),
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      NM: {
        single: b([0, 0.017], [5500, 0.032], [11000, 0.047], [16000, 0.049], [210000, 0.059]),
        marriedFilingJointly: b([0, 0.017], [8000, 0.032], [16000, 0.047], [24000, 0.049], [315000, 0.059]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      NY: {
        single: b([0, 0.04], [8500, 0.045], [11700, 0.0525], [13900, 0.055], [80650, 0.06], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]),
        marriedFilingJointly: b([0, 0.04], [17150, 0.045], [23600, 0.0525], [27900, 0.055], [161550, 0.06], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]),
        standardDeduction: { single: 8000, marriedFilingJointly: 16050 },
      },
      NC: {
        single: b([0, 0.045]),
        marriedFilingJointly: b([0, 0.045]),
        standardDeduction: { single: 12750, marriedFilingJointly: 25500 },
      },
      ND: {
        single: b([44725, 0.0195], [225975, 0.025]),
        marriedFilingJointly: b([74750, 0.0195], [275100, 0.025]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      OH: {
        single: b([26050, 0.0275], [92150, 0.035]),
        marriedFilingJointly: b([26050, 0.0275], [92150, 0.035]),
        personalExemption: { single: 2400, marriedFilingJointly: 4800 },
      },
      OK: {
        single: b([0, 0.0025], [1000, 0.0075], [2500, 0.0175], [3750, 0.0275], [4900, 0.0375], [7200, 0.0475]),
        marriedFilingJointly: b([0, 0.0025], [2000, 0.0075], [5000, 0.0175], [7500, 0.0275], [9800, 0.0375], [12200, 0.0475]),
        standardDeduction: { single: 6350, marriedFilingJointly: 12700 },
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      OR: {
        single: b([0, 0.0475], [4300, 0.0675], [10750, 0.0875], [125000, 0.099]),
        marriedFilingJointly: b([0, 0.0475], [8600, 0.0675], [21500, 0.0875], [250000, 0.099]),
        standardDeduction: { single: 2745, marriedFilingJointly: 5495 },
        personalCredit: { single: 249, marriedFilingJointly: 498 },
      },
      PA: {
        single: b([0, 0.0307]),
        marriedFilingJointly: b([0, 0.0307]),
      },
      RI: {
        single: b([0, 0.0375], [77450, 0.0475], [176050, 0.0599]),
        marriedFilingJointly: b([0, 0.0375], [77450, 0.0475], [176050, 0.0599]),
        standardDeduction: { single: 10550, marriedFilingJointly: 21150 },
        personalExemption: { single: 4950, marriedFilingJointly: 9900 },
      },
      SC: {
        single: b([0, 0], [3460, 0.03], [17330, 0.064]),
        marriedFilingJointly: b([0, 0], [3460, 0.03], [17330, 0.064]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
      UT: {
        single: b([0, 0.0465]),
        marriedFilingJointly: b([0, 0.0465]),
        personalCredit: { single: 876, marriedFilingJointly: 1752 },
        personalCreditPhaseOut: { single: { over: 16742, rate: 0.013 }, marriedFilingJointly: { over: 33484, rate: 0.013 } },
      },
      VT: {
        single: b([0, 0.0335], [45400, 0.066], [110050, 0.076], [229550, 0.0875]),
        marriedFilingJointly: b([0, 0.0335], [75850, 0.066], [183400, 0.076], [279450, 0.0875]),
        standardDeduction: { single: 7000, marriedFilingJointly: 14050 },
        personalExemption: { single: 4850, marriedFilingJointly: 9700 },
      },
      VA: {
        single: b([0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]),
        marriedFilingJointly: b([0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]),
        standardDeduction: { single: 8000, marriedFilingJointly: 16000 },
        personalExemption: { single: 930, marriedFilingJointly: 1860 },
      },
      WV: {
        single: b([0, 0.0236], [10000, 0.0315], [25000, 0.0354], [40000, 0.0472], [60000, 0.0512]),
        marriedFilingJointly: b([0, 0.0236], [10000, 0.0315], [25000, 0.0354], [40000, 0.0472], [60000, 0.0512]),
        personalExemption: { single: 2000, marriedFilingJointly: 4000 },
      },
      WI: {
        single: b([0, 0.035], [14320, 0.044], [28640, 0.053], [315310, 0.0765]),
        marriedFilingJointly: b([0, 0.035], [19090, 0.044], [38190, 0.053], [420420, 0.0765]),
        standardDeduction: { single: 13230, marriedFilingJointly: 24490 },
        standardDeductionPhaseOut: { single: { over: 19069, rate: 0.12 }, marriedFilingJointly: { over: 27519, rate: 0.19778 } },
        personalExemption: { single: 700, marriedFilingJointly: 1400 },
      },
      DC: {
        single: b([0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]),
        marriedFilingJointly: b([0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]),
        standardDeduction: { single: 14600, marriedFilingJointly: 29200, headOfHousehold: 21900 },
      },
    },
  },
  {
    year: 2025,
    states: {
      AL: {
        single: b([0, 0.02], [500, 0.04], [3000, 0.05]),
        marriedFilingJointly: b([0, 0.02], [1000, 0.04], [6000, 0.05]),
        standardDeduction: { single: 3000, marriedFilingJointly: 8500 },
        personalExemption: { single: 1500, marriedFilingJointly: 3000 },
      },
      AZ: {
        single: b([0, 0.025]),
        marriedFilingJointly: b([0, 0.025]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 },
      },
      AR: {
        single: b([0, 0.02], [4600, 0.039]),
        marriedFilingJointly: b([0, 0.02], [4600, 0.039]),
        standardDeduction: { single: 2410, marriedFilingJointly: 4820 },
        personalCredit: { single: 29, marriedFilingJointly: 58 },
        lowIncomeSchedule: { upTo: 92300, brackets: b([5500, 0.02], [10900, 0.03], [15600, 0.034], [25700, 0.039]) },
      },
      CA: {
        single: b([0, 0.01], [11079, 0.02], [26264, 0.04], [41452, 0.06], [57542, 0.08], [72724, 0.093], [371479, 0.103], [445771, 0.113], [742953, 0.123], [1000000, 0.133]),
        marriedFilingJointly: b([0, 0.01], [22158, 0.02], [52528, 0.04], [82904, 0.06], [115084, 0.08], [145448, 0.093], [742958, 0.103], [891542, 0.113], [1000000, 0.123], [1485906, 0.133]),
        standardDeduction: { single: 5706, marriedFilingJointly: 11412 },
        personalCredit: { single: 153, marriedFilingJointly: 306 },
      },
      CO: {
        single: b([0, 0.044]),
        marriedFilingJointly: b([0, 0.044]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 },
      },
      CT: {
        single: b([0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]),
        marriedFilingJointly: b([0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]),
        personalExemption: { single: 15000, marriedFilingJointly: 24000 },
        personalExemptionPhaseOut: { single: { over: 30000, rate: 1 }, marriedFilingJointly: { over: 48000, rate: 1 } },
      },
      DE: {
        single: b([2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]),
        marriedFilingJointly: b([2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]),
        standardDeduction: { single: 3250, marriedFilingJointly: 6500 },
        personalCredit: { single: 110, marriedFilingJointly: 220 },
      },
      GA: {
        single: b([0, 0.0519]),
        marriedFilingJointly: b([0, 0.0519]),
        standardDeduction: { single: 12000, marriedFilingJointly: 24000 },
      },
      HI: {
        single: b([0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.1], [325000, 0.11]),
        marriedFilingJointly: b([0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.1], [650000, 0.11]),
        standardDeduction: { single: 4400, marriedFilingJointly: 8800 },
        personalExemption: { single: 1144, marriedFilingJointly: 2288 },
      },
      ID: {
        single: b([4811, 0.053]),
        marriedFilingJointly: b([9622, 0.053]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 },
      },
      IL: {
        single: b([0, 0.0495]),
        marriedFilingJointly: b([0, 0.0495]),
        personalExemption: { single: 2850, marriedFilingJointly: 5700 },
      },
      IN: {
        single: b([0, 0.03]),
        marriedFilingJointly: b([0, 0.03]),
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      IA: {
        single: b([0, 0.038]),
        marriedFilingJointly: b([0, 0.038]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 },
        personalCredit: { single: 40, marriedFilingJointly: 80 },
      },
      KS: {
        single: b([0, 0.052], [23000, 0.0558]),
        marriedFilingJointly: b([0, 0.052], [46000, 0.0558]),
        standardDeduction: { single: 3605, marriedFilingJointly: 8240 },
        personalExemption: { single: 9160, marriedFilingJointly: 18320 },
      },
      KY: {
        single: b([0, 0.04]),
        marriedFilingJointly: b([0, 0.04]),
        standardDeduction: { single: 3270, marriedFilingJointly: 3270 },
      },
      LA: {
        single: b([0, 0.03]),
        marriedFilingJointly: b([0, 0.03]),
        standardDeduction: { single: 12500, marriedFilingJointly: 25000 },
      },
      ME: {
        single: b([0, 0.058], [27399, 0.0675], [64849, 0.0715]),
        marriedFilingJointly: b([0, 0.058], [54849, 0.0675], [129749, 0.0715]),
        standardDeduction: { single: 15000, marriedFilingJointly: 30000 },
        personalExemption: { single: 5150, marriedFilingJointly: 10300 },
      },
      MD: {
        single: b([0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575]),
        marriedFilingJointly: b([0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575]),
        standardDeduction: { single: 3350, marriedFilingJointly: 6700 },
        personalExemption: { single: 3200, marriedFilingJointly: 6400 },
      },
      MA: {
        single: b([0, 0.05], [1083150, 0.09]),
        marriedFilingJointly: b([0, 0.05], [1083150, 0.09]),
        personalExemption: { single: 4400, marriedFilingJointly: 8800 },
      },
      MI: {
        single: b([0, 0.0425]),
        marriedFilingJointly: b([0, 0.0425]),
        personalExemption: { single: 5800, marriedFilingJointly: 11600 },
      },
      MN: {
        single: b([0, 0.0535], [32570, 0.068], [106990, 0.0785], [198630, 0.0985]),
        marriedFilingJointly: b([0, 0.0535], [47620, 0.068], [189180, 0.0785], [330410, 0.0985]),
        standardDeduction: { single: 14950, marriedFilingJointly: 29900 },
      },
      MS: {
        single: b([10000, 0.044]),
        marriedFilingJointly: b([10000, 0.044]),
        standardDeduction: { single: 2300, marriedFilingJointly: 4600 },
        personalExemption: { single: 6000, marriedFilingJointly: 12000 },
      },
      MO: {
        single: b([1313, 0.02], [2626, 0.025], [3939, 0.03], [5252, 0.035], [6565, 0.04], [7878, 0.045], [9191, 0.047]),
        marriedFilingJointly: b([1313, 0.02], [2626, 0.025], [3939, 0.03], [5252, 0.035], [6565, 0.04], [7878, 0.045], [9191, 0.047]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 },
      },
      MT: {
        single: b([0, 0.047], [21100, 0.059]),
        marriedFilingJointly: b([0, 0.047], [42200, 0.059]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 },
      },
      NE: {
        single: b([0, 0.0246], [4030, 0.0351], [24120, 0.0501], [38870, 0.052]),
        marriedFilingJointly: b([0, 0.0246], [8040, 0.0351], [48250, 0.0501], [77730, 0.052]),
        standardDeduction: { single: 8600, marriedFilingJointly: 17200 },
        personalCredit: { single: 171, marriedFilingJointly: 342 },
      },
      NJ: {
        single: b([0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.05525], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]),
        marriedFilingJointly: b([0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.05525], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]),
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      NM: {
        single: b([0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]),
        marriedFilingJointly: b([0, 0.015], [8000, 0.032], [25000, 0.043], [50000, 0.047], [100000, 0.049], [315000, 0.059]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 }, // corrected, see the note at the top
      },
      NY: {
        single: b([0, 0.04], [8500, 0.045], [11700, 0.0525], [13900, 0.055], [80650, 0.06], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]),
        marriedFilingJointly: b([0, 0.04], [17150, 0.045], [23600, 0.0525], [27900, 0.055], [161550, 0.06], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]),
        standardDeduction: { single: 8000, marriedFilingJointly: 16050 },
      },
      NC: {
        single: b([0, 0.0425]),
        marriedFilingJointly: b([0, 0.0425]),
        standardDeduction: { single: 12750, marriedFilingJointly: 25500 },
      },
      ND: {
        single: b([48475, 0.0195], [244825, 0.025]),
        marriedFilingJointly: b([80975, 0.0195], [298075, 0.025]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 }, // corrected, see the note at the top
      },
      OH: {
        single: b([26050, 0.0275], [100000, 0.035]),
        marriedFilingJointly: b([26050, 0.0275], [100000, 0.035]),
        personalExemption: { single: 2400, marriedFilingJointly: 4800 },
      },
      OK: {
        single: b([0, 0.0025], [1000, 0.0075], [2500, 0.0175], [3750, 0.0275], [4900, 0.0375], [7200, 0.0475]),
        marriedFilingJointly: b([0, 0.0025], [2000, 0.0075], [5000, 0.0175], [7500, 0.0275], [9800, 0.0375], [14400, 0.0475]),
        standardDeduction: { single: 6350, marriedFilingJointly: 12700 },
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      OR: {
        single: b([0, 0.0475], [4400, 0.0675], [11050, 0.0875], [125000, 0.099]),
        marriedFilingJointly: b([0, 0.0475], [8800, 0.0675], [22100, 0.0875], [250000, 0.099]),
        standardDeduction: { single: 2800, marriedFilingJointly: 5600 },
        personalCredit: { single: 256, marriedFilingJointly: 512 },
      },
      PA: {
        single: b([0, 0.0307]),
        marriedFilingJointly: b([0, 0.0307]),
      },
      RI: {
        single: b([0, 0.0375], [79900, 0.0475], [181650, 0.0599]),
        marriedFilingJointly: b([0, 0.0375], [79900, 0.0475], [181650, 0.0599]),
        standardDeduction: { single: 10900, marriedFilingJointly: 21800 },
        personalExemption: { single: 5100, marriedFilingJointly: 10200 },
      },
      SC: {
        single: b([0, 0], [3560, 0.03], [17830, 0.062]),
        marriedFilingJointly: b([0, 0], [3560, 0.03], [17830, 0.062]),
        standardDeduction: { single: 15000, marriedFilingJointly: 30000 }, // corrected, see the note at the top
      },
      UT: {
        single: b([0, 0.0455]),
        marriedFilingJointly: b([0, 0.0455]),
        personalCredit: { single: 900, marriedFilingJointly: 1800 },
        personalCreditPhaseOut: { single: { over: 17652, rate: 0.013 }, marriedFilingJointly: { over: 35304, rate: 0.013 } },
      },
      VT: {
        single: b([0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]),
        marriedFilingJointly: b([0, 0.0335], [82500, 0.066], [199450, 0.076], [304000, 0.0875]),
        standardDeduction: { single: 7650, marriedFilingJointly: 15300 },
        personalExemption: { single: 5300, marriedFilingJointly: 10600 },
      },
      VA: {
        single: b([0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]),
        marriedFilingJointly: b([0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]),
        standardDeduction: { single: 8750, marriedFilingJointly: 17500 },
        personalExemption: { single: 930, marriedFilingJointly: 1860 },
      },
      WV: {
        single: b([0, 0.0222], [10000, 0.0296], [25000, 0.0333], [40000, 0.0444], [60000, 0.0482]),
        marriedFilingJointly: b([0, 0.0222], [10000, 0.0296], [25000, 0.0333], [40000, 0.0444], [60000, 0.0482]),
        personalExemption: { single: 2000, marriedFilingJointly: 4000 },
      },
      WI: {
        single: b([0, 0.035], [14680, 0.044], [50480, 0.053], [323290, 0.0765]),
        marriedFilingJointly: b([0, 0.035], [19580, 0.044], [67300, 0.053], [431060, 0.0765]),
        standardDeduction: { single: 13560, marriedFilingJointly: 25110 },
        standardDeductionPhaseOut: { single: { over: 19550, rate: 0.12 }, marriedFilingJointly: { over: 28210, rate: 0.19778 } },
        personalExemption: { single: 700, marriedFilingJointly: 1400 },
      },
      DC: {
        single: b([0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]),
        marriedFilingJointly: b([0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]),
        standardDeduction: { single: 15750, marriedFilingJointly: 31500, headOfHousehold: 23625 },
      },
    },
  },
  {
    year: 2026,
    states: {
      AL: {
        single: b([0, 0.02], [500, 0.04], [3000, 0.05]),
        marriedFilingJointly: b([0, 0.02], [1000, 0.04], [6000, 0.05]),
        standardDeduction: { single: 3000, marriedFilingJointly: 8500 },
        personalExemption: { single: 1500, marriedFilingJointly: 3000 },
      },
      AZ: {
        single: b([0, 0.025]),
        marriedFilingJointly: b([0, 0.025]),
        standardDeduction: { single: 8350, marriedFilingJointly: 16700 },
      },
      AR: {
        // Changed by a law passed during 2026, see the note at the top.
        single: b([0, 0.02], [4700, 0.037]),
        marriedFilingJointly: b([0, 0.02], [4700, 0.037]),
        standardDeduction: { single: 2470, marriedFilingJointly: 4940 },
        personalCredit: { single: 29, marriedFilingJointly: 58 },
        lowIncomeSchedule: { upTo: 94700, brackets: b([5600, 0.02], [11200, 0.03], [16000, 0.034], [26400, 0.037]) },
      },
      CA: {
        single: b([0, 0.01], [11079, 0.02], [26264, 0.04], [41452, 0.06], [57542, 0.08], [72724, 0.093], [371479, 0.103], [445771, 0.113], [742953, 0.123], [1000000, 0.133]),
        marriedFilingJointly: b([0, 0.01], [22158, 0.02], [52528, 0.04], [82904, 0.06], [115084, 0.08], [145448, 0.093], [742958, 0.103], [891542, 0.113], [1000000, 0.123], [1485906, 0.133]),
        standardDeduction: { single: 5540, marriedFilingJointly: 11080 },
        personalCredit: { single: 153, marriedFilingJointly: 306 },
      },
      CO: {
        single: b([0, 0.044]),
        marriedFilingJointly: b([0, 0.044]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
      },
      CT: {
        single: b([0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]),
        marriedFilingJointly: b([0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]),
        personalExemption: { single: 15000, marriedFilingJointly: 24000 },
        personalExemptionPhaseOut: { single: { over: 30000, rate: 1 }, marriedFilingJointly: { over: 48000, rate: 1 } },
      },
      DE: {
        single: b([2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]),
        marriedFilingJointly: b([2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]),
        standardDeduction: { single: 3250, marriedFilingJointly: 6500 },
        personalCredit: { single: 110, marriedFilingJointly: 220 },
      },
      GA: {
        // Changed by a law passed during 2026, see the note at the top.
        single: b([0, 0.0499]),
        marriedFilingJointly: b([0, 0.0499]),
        standardDeduction: { single: 15000, marriedFilingJointly: 30000 },
      },
      HI: {
        single: b([0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.1], [325000, 0.11]),
        marriedFilingJointly: b([0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.1], [650000, 0.11]),
        standardDeduction: { single: 4400, marriedFilingJointly: 8800 },
        personalExemption: { single: 1144, marriedFilingJointly: 2288 },
      },
      ID: {
        single: b([4811, 0.053]),
        marriedFilingJointly: b([9622, 0.053]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
      },
      IL: {
        single: b([0, 0.0495]),
        marriedFilingJointly: b([0, 0.0495]),
        personalExemption: { single: 2925, marriedFilingJointly: 5850 },
      },
      IN: {
        single: b([0, 0.0295]),
        marriedFilingJointly: b([0, 0.0295]),
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      IA: {
        single: b([0, 0.038]),
        marriedFilingJointly: b([0, 0.038]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
        personalCredit: { single: 40, marriedFilingJointly: 80 },
      },
      KS: {
        single: b([0, 0.052], [23000, 0.0558]),
        marriedFilingJointly: b([0, 0.052], [46000, 0.0558]),
        standardDeduction: { single: 3605, marriedFilingJointly: 8240 },
        personalExemption: { single: 9160, marriedFilingJointly: 18320 },
      },
      KY: {
        single: b([0, 0.035]),
        marriedFilingJointly: b([0, 0.035]),
        standardDeduction: { single: 3360, marriedFilingJointly: 3360 },
      },
      LA: {
        single: b([0, 0.03]),
        marriedFilingJointly: b([0, 0.03]),
        standardDeduction: { single: 12875, marriedFilingJointly: 25750 },
      },
      ME: {
        single: b([0, 0.058], [27399, 0.0675], [64849, 0.0715]),
        marriedFilingJointly: b([0, 0.058], [54849, 0.0675], [129749, 0.0715]),
        standardDeduction: { single: 8350, marriedFilingJointly: 16700 },
        personalExemption: { single: 5300, marriedFilingJointly: 10600 },
      },
      MD: {
        single: b([0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575], [500000, 0.0625], [1000000, 0.065]),
        marriedFilingJointly: b([0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575], [600000, 0.0625], [1200000, 0.065]),
        standardDeduction: { single: 3350, marriedFilingJointly: 6700 },
        personalExemption: { single: 3200, marriedFilingJointly: 6400 },
      },
      MA: {
        single: b([0, 0.05], [1083150, 0.09]),
        marriedFilingJointly: b([0, 0.05], [1083150, 0.09]),
        personalExemption: { single: 4400, marriedFilingJointly: 8800 },
      },
      MI: {
        single: b([0, 0.0425]),
        marriedFilingJointly: b([0, 0.0425]),
        personalExemption: { single: 5900, marriedFilingJointly: 11800 },
      },
      MN: {
        single: b([0, 0.0535], [33310, 0.068], [109430, 0.0785], [203150, 0.0985]),
        marriedFilingJointly: b([0, 0.0535], [48700, 0.068], [193480, 0.0785], [337930, 0.0985]),
        standardDeduction: { single: 15300, marriedFilingJointly: 30600 },
      },
      MS: {
        single: b([10000, 0.04]),
        marriedFilingJointly: b([10000, 0.04]),
        standardDeduction: { single: 2300, marriedFilingJointly: 4600 },
        personalExemption: { single: 6000, marriedFilingJointly: 12000 },
      },
      MO: {
        single: b([1348, 0.02], [2696, 0.025], [4044, 0.03], [5392, 0.035], [6740, 0.04], [8088, 0.045], [9436, 0.047]),
        marriedFilingJointly: b([1348, 0.02], [2696, 0.025], [4044, 0.03], [5392, 0.035], [6740, 0.04], [8088, 0.045], [9436, 0.047]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
      },
      MT: {
        single: b([0, 0.047], [47500, 0.0565]),
        marriedFilingJointly: b([0, 0.047], [95000, 0.0565]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
      },
      NE: {
        single: b([0, 0.0246], [4130, 0.0351], [24760, 0.0455]),
        marriedFilingJointly: b([0, 0.0246], [8250, 0.0351], [49530, 0.0455]),
        standardDeduction: { single: 8850, marriedFilingJointly: 17700 },
        personalCredit: { single: 176, marriedFilingJointly: 352 },
      },
      NJ: {
        single: b([0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.05525], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]),
        marriedFilingJointly: b([0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.05525], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]),
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      NM: {
        single: b([0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]),
        marriedFilingJointly: b([0, 0.015], [8000, 0.032], [25000, 0.043], [50000, 0.047], [100000, 0.049], [315000, 0.059]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
      },
      NY: {
        single: b([0, 0.039], [8500, 0.044], [11700, 0.0515], [13900, 0.054], [80650, 0.059], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]),
        marriedFilingJointly: b([0, 0.039], [17150, 0.044], [23600, 0.0515], [27900, 0.054], [161550, 0.059], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]),
        standardDeduction: { single: 8000, marriedFilingJointly: 16050 },
      },
      NC: {
        single: b([0, 0.0399]),
        marriedFilingJointly: b([0, 0.0399]),
        standardDeduction: { single: 12750, marriedFilingJointly: 25500 },
      },
      ND: {
        single: b([48475, 0.0195], [244825, 0.025]),
        marriedFilingJointly: b([80975, 0.0195], [298075, 0.025]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
      },
      OH: {
        single: b([26050, 0.0275]),
        marriedFilingJointly: b([26050, 0.0275]),
        personalExemption: { single: 2400, marriedFilingJointly: 4800 },
      },
      OK: {
        single: b([3750, 0.025], [4900, 0.035], [7200, 0.045]),
        marriedFilingJointly: b([7500, 0.025], [9800, 0.035], [14400, 0.045]),
        standardDeduction: { single: 6350, marriedFilingJointly: 12700 },
        personalExemption: { single: 1000, marriedFilingJointly: 2000 },
      },
      OR: {
        single: b([0, 0.0475], [4550, 0.0675], [11400, 0.0875], [125000, 0.099]),
        marriedFilingJointly: b([0, 0.0475], [9100, 0.0675], [22800, 0.0875], [250000, 0.099]),
        standardDeduction: { single: 2910, marriedFilingJointly: 5820 },
        personalCredit: { single: 256, marriedFilingJointly: 512 },
      },
      PA: {
        single: b([0, 0.0307]),
        marriedFilingJointly: b([0, 0.0307]),
      },
      RI: {
        single: b([0, 0.0375], [82050, 0.0475], [186450, 0.0599]),
        marriedFilingJointly: b([0, 0.0375], [82050, 0.0475], [186450, 0.0599]),
        standardDeduction: { single: 11200, marriedFilingJointly: 22400 },
        personalExemption: { single: 5250, marriedFilingJointly: 10500 },
      },
      SC: {
        // Changed by a law passed during 2026, see the note at the top.
        single: b([0, 0.0199], [30000, 0.0521]),
        marriedFilingJointly: b([0, 0.0199], [30000, 0.0521]),
        standardDeduction: { single: 15000, marriedFilingJointly: 30000, headOfHousehold: 22500 },
        standardDeductionPhaseOut: { single: { over: 40000, rate: 0.272728 }, marriedFilingJointly: { over: 80000, rate: 0.272728 }, headOfHousehold: { over: 60000, rate: 0.272728 } },
      },
      UT: {
        single: b([0, 0.045]),
        marriedFilingJointly: b([0, 0.045]),
        personalCredit: { single: 966, marriedFilingJointly: 1932 },
        personalCreditPhaseOut: { single: { over: 18213, rate: 0.013 }, marriedFilingJointly: { over: 36426, rate: 0.013 } },
      },
      VT: {
        single: b([0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]),
        marriedFilingJointly: b([0, 0.0335], [82500, 0.066], [199450, 0.076], [304000, 0.0875]),
        standardDeduction: { single: 7650, marriedFilingJointly: 15300 },
        personalExemption: { single: 5300, marriedFilingJointly: 10600 },
      },
      VA: {
        single: b([0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]),
        marriedFilingJointly: b([0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]),
        standardDeduction: { single: 8750, marriedFilingJointly: 17500 },
        personalExemption: { single: 930, marriedFilingJointly: 1860 },
      },
      WV: {
        // Changed by a law passed during 2026, see the note at the top.
        single: b([0, 0.0211], [10000, 0.0281], [25000, 0.0316], [40000, 0.0422], [60000, 0.0458]),
        marriedFilingJointly: b([0, 0.0211], [10000, 0.0281], [25000, 0.0316], [40000, 0.0422], [60000, 0.0458]),
        personalExemption: { single: 2000, marriedFilingJointly: 4000 },
      },
      WI: {
        single: b([0, 0.035], [15110, 0.044], [51950, 0.053], [332720, 0.0765]),
        marriedFilingJointly: b([0, 0.035], [20150, 0.044], [69260, 0.053], [443630, 0.0765]),
        standardDeduction: { single: 13960, marriedFilingJointly: 25840 },
        standardDeductionPhaseOut: { single: { over: 20119, rate: 0.12 }, marriedFilingJointly: { over: 29039, rate: 0.19778 } },
        personalExemption: { single: 700, marriedFilingJointly: 1400 },
      },
      DC: {
        single: b([0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]),
        marriedFilingJointly: b([0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]),
        standardDeduction: { single: 16100, marriedFilingJointly: 32200, headOfHousehold: 24150 },
      },
    },
  },
];

// The rules for a calendar year. A year before the first on file uses the first; a year after
// the last (or no usable year at all) uses the last.
export const stateTaxYearFor = (year?: number): StateTaxYear => {
  const last = STATE_TAX_YEARS[STATE_TAX_YEARS.length - 1];
  if (!year || !Number.isFinite(year)) return last;
  if (year <= STATE_TAX_YEARS[0].year) return STATE_TAX_YEARS[0];
  return STATE_TAX_YEARS.find(y => y.year === year) ?? last;
};

// A state's rules for the year, or undefined where the state does not tax wages (or the code
// is unknown).
export const stateTaxRulesFor = (stateCode: string, year?: number): StateIncomeTaxRules | undefined =>
  stateTaxYearFor(year).states[(stateCode || '').toUpperCase()];

// Which of the two columns a filing status reads.
export const stateStatusKey = (filingStatus: FilingStatus): 'single' | 'marriedFilingJointly' =>
  filingStatus === 'marriedFilingJointly' ? 'marriedFilingJointly' : 'single';
