/**
 * Tests for buildPaystubModel — the data-assembly layer that feeds the XML renderer.
 * Focuses on the contract guarantees rather than exact tax figures (which depend on
 * the tax tables): earnings/gross basis, deduction totals, net-pay identity, the
 * filing-status fix (no NaN for married filers), and the YTD multiplier.
 */

import { describe, it, expect } from '@jest/globals';
import { buildPaystubModel, buildPaystubModels } from '../templates/utils/buildPaystubModel';
import { periodsElapsedAt, buildPayPeriods, calculateEndDate } from '../utils/date-calculator';
import { normalizeStubCount } from '../constants/pricing';
import { PayStubDetails } from '../assets/data/pay-stub-details';

const makeStore = (overrides: Partial<PayStubDetails['incomeDetails']> = {},
                   employeeOverrides: Partial<PayStubDetails['employeeInfo']> = {},
                   generalOverrides: Partial<PayStubDetails['generalInfo']> = {}): PayStubDetails => ({
  appSettings: { templateId: 0, nextTabStep: 'template', canPrint: false, configPath: '' },
  companyInfo: {
    companyName: 'Acme', companyEIN: '11-2233445', companyAddress1: '1 St', companyAddress2: '',
    companyCity: 'Seattle', companyState: 'WA', companyZipCode: '98000', companyLogo: '',
    companyPhone: '555', companyEmail: 'a@b.com',
  },
  employeeInfo: {
    employeeFirstName: 'John', employeeMiddleInitial: '', employeeLastName: 'Doe',
    employeeAddress1: '2 St', employeeAddress2: '', employeeCity: 'Redmond', employeeState: 'WA',
    employeeZipCode: '98000', employeeSSN: '000-11-2222', employeeID: '1', employeePhone: '555',
    employeeEmail: 'e@c.com', employeeMarriedStatus: 'single', employeeExemptions: 0,
    employeeHireDate: new Date('2020-01-01'),
    ...employeeOverrides,
  },
  incomeDetails: {
    annualSalary: 0, wageType: 'Hourly', hourlyRate: 25, hoursWorked: 40, overtimeRate: 37.5,
    overtimeHours: 2, bonusAmount: 100, deduction401k: 0.02, medicalDeduction: 50, dentalDeduction: 10,
    visionDeduction: 5, otherDeduction: 0, unionDues: 0,
    periodStartDate: new Date('2025-01-01'), periodEndDate: new Date('2025-01-07'),
    periodPayDate: new Date('2025-01-08'), periodType: 'Weekly',
    ...overrides,
  },
  generalInfo: {
    employmentType: 'Employee', paymentMethod: 'Direct Deposit', paymentFrequency: 'Weekly',
    payStubCount: 1, payStubNumber: 1, checkNumber: 5001, extraNotes: '',
    bankRoutingNumber: '021000021', bankAccountType: 'Checking', bankAccountNumber: '000123456789',
    ...generalOverrides,
  },
});

describe('buildPaystubModel', () => {
  it('computes gross from regular + overtime + bonus (hourly)', () => {
    const m = buildPaystubModel(makeStore());
    expect(m.regularPay).toBe(1000);     // 25 * 40
    expect(m.overtimePay).toBe(75);      // 37.5 * 2
    expect(m.otherEarnings).toBe(100);   // bonus
    expect(m.grossPay).toBe(1175);
  });

  it('derives per-period regular pay from salary when wageType is Salary', () => {
    const m = buildPaystubModel(makeStore({ wageType: 'Salary', annualSalary: 52000, hourlyRate: 0, hoursWorked: 0, overtimeRate: 0, overtimeHours: 0, bonusAmount: 0 }));
    expect(m.regularPay).toBe(1000);     // 52000 / 52 weekly periods
    expect(m.grossPay).toBe(1000);
  });

  it('sums deductions and satisfies the net-pay identity', () => {
    const m = buildPaystubModel(makeStore());
    expect(m.retirement401k).toBeCloseTo(23.5, 5);   // 2% of the 1,175 gross
    expect(m.totalDeductions).toBeCloseTo(88.5, 5);  // 50 + 10 + 5 + 23.50
    // paidLeave is the fifth component of totalTaxes — a mandatory withholding in the
    // dozen states running a paid family/medical leave fund (this store is WA, which does).
    expect(m.totalTaxes).toBeCloseTo(
      m.federalTax + m.stateTax + m.socialSecurity + m.medicare + m.paidLeave, 5);
    expect(m.netPay).toBeCloseTo(m.grossPay - m.totalTaxes - m.totalDeductions, 5);
  });

  it('withholds a state paid-leave premium only where the state runs a program', () => {
    const wa = buildPaystubModel(makeStore({}, { employeeState: 'WA' }));
    expect(wa.paidLeave).toBeGreaterThan(0);
    expect(wa.paidLeaveLabel).toBe('WA PFML');

    const tx = buildPaystubModel(makeStore({}, { employeeState: 'TX' }));
    expect(tx.paidLeave).toBe(0);
    expect(tx.paidLeaveLabel).toBe('');
  });

  it('produces real, finite tax numbers via the tax engine', () => {
    const m = buildPaystubModel(makeStore());
    expect(Number.isFinite(m.socialSecurity)).toBe(true);
    expect(m.socialSecurity).toBeGreaterThan(0);
    expect(Number.isFinite(m.medicare)).toBe(true);
    expect(m.medicare).toBeGreaterThan(0);
    expect(Number.isFinite(m.federalTax)).toBe(true);
  });

  it('handles married filing statuses without producing NaN (filing-status fix)', () => {
    const joint = buildPaystubModel(makeStore({}, { employeeMarriedStatus: 'marriedFilingJointly' }));
    expect(Number.isFinite(joint.federalTax)).toBe(true);
    expect(Number.isFinite(joint.medicare)).toBe(true);

    const legacy = buildPaystubModel(makeStore({}, { employeeMarriedStatus: 'Married' }));
    expect(Number.isFinite(legacy.federalTax)).toBe(true);
  });

  it('projects recurring pay and deductions over the periods elapsed as of THIS stub\'s pay date', () => {
    const m = buildPaystubModel(makeStore());
    // Not "as of today" — as of the stub's own pay date, so a run of stubs shows YTD growing.
    const multiplier = periodsElapsedAt('Weekly', m.incomeDetails.periodPayDate);
    expect(multiplier).toBeGreaterThan(1); // the test only means something if YTD != current
    expect(m.regularPayYTD).toBeCloseTo(m.regularPay * multiplier, 5);
    // Flat deductions and the 401(k) on regular pay recur; the 401(k) on the one-time
    // overtime and bonus (2% of 175) is counted once.
    expect(m.totalDeductionsYTD).toBeCloseTo((65 + 20) * multiplier + 3.5, 5);
    expect(m.retirement401kYTD).toBeCloseTo(20 * multiplier + 3.5, 5);
  });

  it('turns the 401(k) and union dues percentages into dollar amounts of gross pay', () => {
    const m = buildPaystubModel(makeStore({ deduction401k: 0.05, unionDues: 0.01, otherDeduction: 12 }));
    expect(m.retirement401k).toBeCloseTo(58.75, 5);  // 5% of 1,175
    expect(m.unionDues).toBeCloseTo(11.75, 5);       // 1% of 1,175
    // Union dues print on the catch-all "Other" line unless a template gives them their own row.
    expect(m.otherDeductions).toBeCloseTo(23.75, 5);
    expect(m.otherDeductionsExUnion).toBe(12);
    expect(m.totalDeductions).toBeCloseTo(50 + 10 + 5 + 12 + 58.75 + 11.75, 5);
    expect(m.netPay).toBeCloseTo(m.grossPay - m.totalTaxes - m.totalDeductions, 5);
  });

  it('takes the 401(k) out before income tax, but not before Social Security or Medicare', () => {
    // Virginia has a state income tax, so both income taxes can be seen to drop.
    const without = buildPaystubModel(makeStore({ deduction401k: 0 }, { employeeState: 'VA' }));
    const withK = buildPaystubModel(makeStore({ deduction401k: 0.1 }, { employeeState: 'VA' }));
    // Same as withholding on a gross that is 10% lower, with no 401(k).
    const lowerGross = buildPaystubModel(makeStore(
      { deduction401k: 0, hourlyRate: 22.5, overtimeRate: 33.75, bonusAmount: 90 }, { employeeState: 'VA' }));

    expect(withK.federalTax).toBeLessThan(without.federalTax);
    expect(withK.stateTax).toBeLessThan(without.stateTax);
    expect(withK.federalTax).toBeCloseTo(lowerGross.federalTax, 2);
    expect(withK.stateTax).toBeCloseTo(lowerGross.stateTax, 2);
    expect(withK.socialSecurity).toBeCloseTo(without.socialSecurity, 5);
    expect(withK.medicare).toBeCloseTo(without.medicare, 5);
    expect(withK.grossPay).toBe(without.grossPay);
  });

  it('ignores a 401(k) or union-dues rate that is not a fraction of gross', () => {
    // An old saved draft can still carry the retired dev seed's `deduction401k: 150` (dollars).
    // Read as a rate that is 15,000% of gross, and as a pre-tax amount it wiped out federal tax.
    const clean = buildPaystubModel(makeStore({ deduction401k: 0 }));
    const stale = buildPaystubModel(makeStore({ deduction401k: 150, unionDues: 7 }));
    expect(clean.federalTax).toBeGreaterThan(0);
    expect(stale.retirement401k).toBe(0);
    expect(stale.unionDues).toBe(0);
    expect(stale.federalTax).toBeCloseTo(clean.federalTax, 5);
    expect(stale.netPay).toBeCloseTo(clean.netPay, 5);
  });

  it('prints tax lines in whole cents that add up exactly to Total Taxes, on every stub', () => {
    const cents = (v: number) => Math.round(v * 100);
    const models = buildPaystubModels({
      ...makeStore({ hourlyRate: 32.57, hoursWorked: 79.25, deduction401k: 0.0375 }, { employeeState: 'OR' }),
      generalInfo: { ...makeStore().generalInfo, payStubCount: 3 },
    });
    models.forEach(m => {
      [m.federalTax, m.stateTax, m.socialSecurity, m.medicare, m.paidLeave].forEach(v =>
        expect(v * 100).toBeCloseTo(cents(v), 6));
      expect(cents(m.totalTaxes)).toBe(
        cents(m.federalTax) + cents(m.stateTax) + cents(m.socialSecurity) + cents(m.medicare) + cents(m.paidLeave));
      expect(cents(m.totalTaxesYTD)).toBe(
        cents(m.federalTaxYTD) + cents(m.stateTaxYTD) + cents(m.socialSecurityYTD) + cents(m.medicareYTD) + cents(m.paidLeaveYTD));
    });
  });

  it('withholds federal tax under the tables of the year the stub is PAID in', () => {
    const paidIn = (payDate: string) => buildPaystubModel(makeStore({
      periodStartDate: new Date(`${payDate.slice(0, 4)}-03-02`), periodEndDate: new Date(`${payDate.slice(0, 4)}-03-08`),
      periodPayDate: payDate as unknown as Date, deduction401k: 0, overtimeRate: 0, overtimeHours: 0, bonusAmount: 0,
    }, { employeeState: 'TX' }));
    // 1,000 a week, single: 52,000 a year. IRS 2026: 52,000 - 8,600 = 43,400 adjusted;
    // 10% of (19,900 - 7,500) + 12% of (43,400 - 19,900) = 4,060 a year = 78.08 a week.
    expect(paidIn('2026-03-13').federalTax).toBeCloseTo(78.08, 2);
    // IRS 2025: 10% of (18,325 - 6,400) + 12% of (43,400 - 18,325) = 4,201.50 = 80.80 a week.
    expect(paidIn('2025-03-13').federalTax).toBeCloseTo(80.8, 2);
  });

  it('keeps the deduction lines adding up to the total, current and YTD, across a run', () => {
    const models = buildPaystubModels({
      ...makeStore({ deduction401k: 0.05, unionDues: 0.01, otherDeduction: 12 }),
      generalInfo: { ...makeStore().generalInfo, payStubCount: 3 },
    });
    models.forEach(m => {
      expect(m.totalDeductions).toBeCloseTo(
        m.medical + m.dental + m.vision + m.retirement401k + m.otherDeductions, 5);
      expect(m.totalDeductionsYTD).toBeCloseTo(
        m.medicalYTD + m.dentalYTD + m.visionYTD + m.retirement401kYTD + m.otherDeductionsYTD, 5);
      expect(m.otherDeductionsYTD).toBeCloseTo(m.otherDeductionsExUnionYTD + m.unionDuesYTD, 5);
      expect(m.netPayYTD).toBeCloseTo(m.grossPayYTD - m.totalTaxesYTD - m.totalDeductionsYTD, 5);
    });
    // Later stubs pay regular wages only, so their 401(k) is 5% of 1,000.
    expect(models[1].retirement401k).toBeCloseTo(50, 5);
  });

  it('counts overtime and bonus in YTD once — they are one-time, not recurring', () => {
    const m = buildPaystubModel(makeStore());
    const multiplier = periodsElapsedAt('Weekly', m.incomeDetails.periodPayDate);
    expect(m.overtimePayYTD).toBe(75);
    expect(m.otherEarningsYTD).toBe(100);
    expect(m.grossPayYTD).toBeCloseTo(m.regularPay * multiplier + 75 + 100, 5);
  });

  it('keeps the YTD net-pay identity when YTD mixes recurring and one-time amounts', () => {
    const m = buildPaystubModel(makeStore());
    expect(m.totalTaxesYTD).toBeCloseTo(
      m.federalTaxYTD + m.stateTaxYTD + m.socialSecurityYTD + m.medicareYTD + m.paidLeaveYTD, 5);
    expect(m.netPayYTD).toBeCloseTo(m.grossPayYTD - m.totalTaxesYTD - m.totalDeductionsYTD, 5);
  });

  it('bases YTD taxes on regular pay, plus the extra tax the one-time pay actually drew', () => {
    const withExtras = buildPaystubModel(makeStore());
    const regularOnly = buildPaystubModel(makeStore({ overtimeRate: 0, overtimeHours: 0, bonusAmount: 0 }));
    const multiplier = periodsElapsedAt('Weekly', withExtras.incomeDetails.periodPayDate);
    // Taxes on a regular-only period recur; the difference the overtime/bonus made is added once.
    const extraTax = withExtras.totalTaxes - regularOnly.totalTaxes;
    expect(extraTax).toBeGreaterThan(0);
    expect(withExtras.totalTaxesYTD).toBeCloseTo(regularOnly.totalTaxes * multiplier + extraTax, 5);
  });
});

describe('paymentMethodLabel', () => {
  it('names the account type and the last four digits for Direct Deposit', () => {
    const m = buildPaystubModel(makeStore());
    expect(m.paymentMethodLabel).toBe('Direct Deposit to Checking ****6789');
  });

  it('never carries the routing number or more than four account digits', () => {
    const m = buildPaystubModel(makeStore());
    expect(m.paymentMethodLabel).not.toContain('021000021');
    expect(m.paymentMethodLabel).not.toContain('123456789');
  });

  it('is just the method for Direct Deposit with no account number yet', () => {
    const m = buildPaystubModel(makeStore({}, {}, { bankAccountNumber: '', bankAccountType: '' }));
    expect(m.paymentMethodLabel).toBe('Direct Deposit');
  });

  it('is just the method for any other payment method, even if bank fields linger', () => {
    const m = buildPaystubModel(makeStore({}, {}, { paymentMethod: 'Physical Check' }));
    expect(m.paymentMethodLabel).toBe('Physical Check');
  });

  it('falls back to a dash when no method is chosen', () => {
    const m = buildPaystubModel(makeStore({}, {}, { paymentMethod: '' }));
    expect(m.paymentMethodLabel).toBe('—');
  });
});

describe('buildPaystubModels — the purchased run of stubs', () => {
  // Weekly, 25 an hour × 40 hours; the entered (most recent) period is 2025-03-05 to 2025-03-11.
  const runOf = (
    payStubCount: number,
    income: Partial<PayStubDetails['incomeDetails']> = {},
    general: Partial<PayStubDetails['generalInfo']> = {},
  ) => buildPaystubModels(makeStore(
    { periodStartDate: '2025-03-05' as unknown as Date, periodEndDate: '2025-03-11' as unknown as Date,
      periodPayDate: '2025-03-18' as unknown as Date, ...income },
    {},
    { payStubCount, ...general },
  ));

  it('returns one model per purchased stub', () => {
    const models = runOf(4);
    expect(models).toHaveLength(4);
    expect(models.map(m => m.stubIndex)).toEqual([0, 1, 2, 3]);
    expect(models.every(m => m.stubCount === 4)).toBe(true);
  });

  it('walks consecutive, gapless pay periods BACK from the entered period, most recent first', () => {
    const models = runOf(3);
    expect(models.map(m => String(m.incomeDetails.periodStartDate))).toEqual(['2025-03-05', '2025-02-26', '2025-02-19']);
    expect(models.map(m => String(m.incomeDetails.periodEndDate))).toEqual(['2025-03-11', '2025-03-04', '2025-02-25']);
  });

  it('matches the owner\'s example: bi-weekly 10/28–11/10/2026 is followed by 10/14–10/27', () => {
    const models = runOf(3, { periodType: 'Bi-Weekly', periodStartDate: '2026-10-28' as unknown as Date, periodPayDate: '2026-11-17' as unknown as Date });
    expect(models.map(m => `${m.incomeDetails.periodStartDate} ${m.incomeDetails.periodEndDate}`)).toEqual([
      '2026-10-28 2026-11-10', '2026-10-14 2026-10-27', '2026-09-30 2026-10-13',
    ]);
  });

  it('carries the chosen gap between end date and pay date onto every stub of the run', () => {
    const run = (periodPayDate: unknown) =>
      runOf(3, { periodPayDate: periodPayDate as Date }).map(m => String(m.incomeDetails.periodPayDate));

    // Weekly periods ending 2025-03-11, -03-04, -02-25.
    expect(run('2025-03-14')).toEqual(['2025-03-14', '2025-03-07', '2025-02-28']); // 3 days after
    expect(run('2025-03-11')).toEqual(['2025-03-11', '2025-03-04', '2025-02-25']); // on the end date
    // A pay date before the end date, or none at all, falls back to the 7-day default.
    expect(run('2025-03-07')).toEqual(['2025-03-18', '2025-03-11', '2025-03-04']);
    expect(run('')).toEqual(['2025-03-18', '2025-03-11', '2025-03-04']);
  });

  it('counts the check and stub numbers DOWN from the entered ones', () => {
    const models = runOf(3, {}, { checkNumber: 5001, payStubNumber: 12 });
    expect(models.map(m => m.checkNumber)).toEqual([5001, 5000, 4999]);
    expect(models.map(m => m.stubNumber)).toEqual([12, 11, 10]);
  });

  it('uses a check or stub number the customer typed for one stub', () => {
    const models = runOf(3, { stubOverrides: [{}, { checkNumber: 4990 }, { payStubNumber: 3 }] }, { checkNumber: 5001, payStubNumber: 12 });
    expect(models.map(m => m.checkNumber)).toEqual([5001, 4990, 4999]);
    expect(models.map(m => m.stubNumber)).toEqual([12, 11, 3]);
  });

  it('pays overtime and bonus on the entered period only, unless an earlier stub is given some', () => {
    const plain = runOf(3);
    expect(plain.map(m => m.grossPay)).toEqual([1175, 1000, 1000]);
    expect(plain.slice(1).every(m => m.overtimePay === 0 && m.otherEarnings === 0)).toBe(true);

    const adjusted = runOf(3, { stubOverrides: [{}, { overtimeHours: 4 }, { bonusAmount: 250 }] });
    expect(adjusted.map(m => m.overtimePay)).toEqual([75, 150, 0]);
    expect(adjusted.map(m => m.otherEarnings)).toEqual([100, 0, 250]);
  });

  it('pays each stub at its own rate and hours, and at the most recent stub\'s where none were given', () => {
    const models = runOf(4, { stubOverrides: [{ hoursWorked: 1 }, { hoursWorked: 30 }, { hourlyRate: 20, hoursWorked: 36, overtimeRate: 30, overtimeHours: 2 }] });
    // Entry 0 is never read: the most recent stub is the base fields.
    expect(models.map(m => m.regularPay)).toEqual([1000, 750, 720, 1000]);
    expect(models.map(m => m.overtimePay)).toEqual([75, 0, 60, 0]);
    expect(models.map(m => m.incomeDetails.hourlyRate)).toEqual([25, 25, 20, 25]);
  });

  it('pays each stub its own salary', () => {
    const models = runOf(2, { wageType: 'Salary', annualSalary: 52000, overtimeHours: 0, bonusAmount: 0, stubOverrides: [{}, { annualSalary: 46800 }] });
    expect(models.map(m => m.regularPay)).toEqual([1000, 900]);
  });

  it('ignores per-stub adjustments left over from a longer run when there is one stub', () => {
    const [only] = runOf(1, { stubOverrides: [{ hoursWorked: 10 }] });
    expect(only.regularPay).toBe(1000);
  });

  it('builds YTD from the earliest stub\'s regular pay before the run plus the actual stubs of the run', () => {
    const models = runOf(3, { hoursWorked: 36, stubOverrides: [{}, { hoursWorked: 30, bonusAmount: 250 }, { hoursWorked: 40 }] });
    const [latest, middle, oldest] = models;
    // Periods of the year paid before the oldest stub of the run: each like it (1,000 regular).
    const before = periodsElapsedAt('Weekly', oldest.incomeDetails.periodPayDate) - 1;
    expect(before).toBeGreaterThan(0);

    expect(oldest.regularPayYTD).toBeCloseTo(1000 * before + 1000, 5);
    expect(middle.regularPayYTD).toBeCloseTo(1000 * before + 1000 + 750, 5);
    expect(latest.regularPayYTD).toBeCloseTo(1000 * before + 1000 + 750 + 900, 5);
    // One-time pay counts once, from the stub that paid it onward.
    expect(models.map(m => m.otherEarningsYTD)).toEqual([350, 250, 0]);
    expect(models.map(m => m.overtimePayYTD)).toEqual([75, 0, 0]);
    // Taxes: typical withholding before the run, then what each stub actually withheld.
    const typicalTax = oldest.totalTaxes; // the oldest stub has no overtime or bonus
    expect(latest.totalTaxesYTD).toBeCloseTo(typicalTax * before + oldest.totalTaxes + middle.totalTaxes + latest.totalTaxes, 5);
  });

  it('never lets YTD fall from an earlier stub to a later one, even after a short period', () => {
    const models = runOf(6, { stubOverrides: [{ hoursWorked: 8 }, {}, { hoursWorked: 12 }] });
    // models are most recent first, so walk them oldest to newest.
    const chronological = [...models].reverse();
    for (let i = 1; i < chronological.length; i++) {
      (['grossPayYTD', 'totalTaxesYTD', 'totalDeductionsYTD', 'netPayYTD'] as const).forEach(key =>
        expect(chronological[i][key]).toBeGreaterThan(chronological[i - 1][key]));
    }
  });

  it('keeps the YTD identities on every stub of an adjusted run', () => {
    const models = runOf(4, { deduction401k: 0.05, unionDues: 0.01, stubOverrides: [{ hoursWorked: 36 }, { overtimeHours: 5 }, { bonusAmount: 80 }] });
    for (const m of models) {
      expect(m.grossPayYTD).toBeCloseTo(m.regularPayYTD + m.overtimePayYTD + m.otherEarningsYTD, 5);
      expect(m.netPayYTD).toBeCloseTo(m.grossPayYTD - m.totalTaxesYTD - m.totalDeductionsYTD, 5);
      expect(m.totalTaxesYTD).toBeCloseTo(
        m.federalTaxYTD + m.stateTaxYTD + m.socialSecurityYTD + m.medicareYTD + m.paidLeaveYTD, 5);
    }
  });

  it('starts the new year\'s YTD from zero when a run crosses January 1', () => {
    // Weekly periods paid 2025-01-14, 2025-01-07 and 2024-12-31.
    const models = runOf(3, {
      periodStartDate: '2025-01-01' as unknown as Date, periodPayDate: '2025-01-14' as unknown as Date,
      overtimeHours: 0, bonusAmount: 0,
    });
    expect(models.map(m => String(m.incomeDetails.periodPayDate))).toEqual(['2025-01-14', '2025-01-07', '2024-12-31']);
    expect(models[1].grossPayYTD).toBeCloseTo(1000, 5);  // first pay day of 2025
    expect(models[0].grossPayYTD).toBeCloseTo(2000, 5);
    expect(models[2].grossPayYTD).toBeCloseTo(52000, 5); // the last pay day of 2024: a full year
  });

  it('clamps the stub count to the supported 1–12 range', () => {
    expect(runOf(0)).toHaveLength(1);
    expect(runOf(99)).toHaveLength(12);
  });

  it('always yields at least one model even with no start date entered yet', () => {
    const models = runOf(1, { periodStartDate: '' as unknown as Date });
    expect(models).toHaveLength(1);
    expect(Number.isFinite(models[0].grossPay)).toBe(true);
  });
});

describe('buildPayPeriods — walking back through each pay frequency', () => {
  const run = (type: string, start: string, count = 3) =>
    buildPayPeriods(start, type, count).map(p => `${p.startDate} ${p.endDate}`);

  it('steps back by calendar blocks for the calendar frequencies', () => {
    expect(run('Semi-Monthly', '2026-03-01')).toEqual(['2026-03-01 2026-03-15', '2026-02-16 2026-02-28', '2026-02-01 2026-02-15']);
    expect(run('Semi-Monthly', '2026-03-16')).toEqual(['2026-03-16 2026-03-31', '2026-03-01 2026-03-15', '2026-02-16 2026-02-28']);
    expect(run('Monthly', '2026-02-01')).toEqual(['2026-02-01 2026-02-28', '2026-01-01 2026-01-31', '2025-12-01 2025-12-31']);
    expect(run('Quarterly', '2026-04-01')).toEqual(['2026-04-01 2026-06-30', '2026-01-01 2026-03-31', '2025-10-01 2025-12-31']);
    expect(run('Semiannually', '2026-01-01', 2)).toEqual(['2026-01-01 2026-06-30', '2025-07-01 2025-12-31']);
    expect(run('Annually', '2025-01-01', 2)).toEqual(['2025-01-01 2025-12-31', '2024-01-01 2024-12-31']);
  });

  it('leaves no gap and no overlap, and every earlier period is one calculateEndDate agrees with', () => {
    ['Weekly', 'Bi-Weekly', 'Semi-Monthly', 'Monthly', 'Quarterly', 'Semiannually', 'Annually'].forEach(type => {
      const periods = buildPayPeriods('2026-07-01', type, 12);
      expect(periods).toHaveLength(12);
      for (let i = 1; i < periods.length; i++) {
        const dayAfterEnd = new Date(`${periods[i].endDate}T00:00:00Z`);
        dayAfterEnd.setUTCDate(dayAfterEnd.getUTCDate() + 1);
        expect(dayAfterEnd.toISOString().slice(0, 10)).toBe(periods[i - 1].startDate);
        expect(calculateEndDate(periods[i].startDate, type)).toBe(periods[i].endDate);
      }
    });
  });
});

describe('pricing — stub count', () => {
  it('clamps out-of-range and junk counts rather than pricing a nonsense quantity', () => {
    expect(normalizeStubCount(0)).toBe(1);
    expect(normalizeStubCount(-5)).toBe(1);
    expect(normalizeStubCount(4)).toBe(4);
    expect(normalizeStubCount(99)).toBe(12);
    expect(normalizeStubCount('abc')).toBe(1);
  });
});
