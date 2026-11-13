/**
 * Tests for buildPaystubModel — the data-assembly layer that feeds the XML renderer.
 * Focuses on the contract guarantees rather than exact tax figures (which depend on
 * the tax tables): earnings/gross basis, deduction totals, net-pay identity, the
 * filing-status fix (no NaN for married filers), and the YTD multiplier.
 */

import { describe, it, expect } from '@jest/globals';
import { buildPaystubModel, buildPaystubModels } from '../templates/utils/buildPaystubModel';
import { periodsElapsedAt } from '../utils/date-calculator';
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
  it('returns one model per purchased stub', () => {
    const models = buildPaystubModels({ ...makeStore(), generalInfo: { ...makeStore().generalInfo, payStubCount: 4 } });
    expect(models).toHaveLength(4);
    expect(models.map(m => m.stubIndex)).toEqual([0, 1, 2, 3]);
    expect(models.every(m => m.stubCount === 4)).toBe(true);
  });

  it('walks consecutive, gapless pay periods forward from the entered start date', () => {
    const models = buildPaystubModels({ ...makeStore(), generalInfo: { ...makeStore().generalInfo, payStubCount: 3 } });

    // Weekly, starting 2025-01-01.
    expect(models.map(m => String(m.incomeDetails.periodStartDate))).toEqual(['2025-01-01', '2025-01-08', '2025-01-15']);
    expect(models.map(m => String(m.incomeDetails.periodEndDate))).toEqual(['2025-01-07', '2025-01-14', '2025-01-21']);
    // Each period begins the day after the previous one ended — no gaps, no overlaps.
    expect(String(models[1].incomeDetails.periodStartDate)).toBe('2025-01-08');
  });

  it('carries the chosen gap between end date and pay date onto every stub of the run', () => {
    const run = (periodPayDate: unknown) => buildPaystubModels({
      ...makeStore(),
      incomeDetails: { ...makeStore().incomeDetails, periodPayDate: periodPayDate as Date },
      generalInfo: { ...makeStore().generalInfo, payStubCount: 3 },
    }).map(m => String(m.incomeDetails.periodPayDate));

    // Weekly periods ending 2025-01-07, -14, -21.
    expect(run('2025-01-10')).toEqual(['2025-01-10', '2025-01-17', '2025-01-24']); // 3 days after
    expect(run('2025-01-07')).toEqual(['2025-01-07', '2025-01-14', '2025-01-21']); // on the end date
    // A pay date before the end date, or none at all, falls back to the 7-day default.
    expect(run('2025-01-03')).toEqual(['2025-01-14', '2025-01-21', '2025-01-28']);
    expect(run('')).toEqual(['2025-01-14', '2025-01-21', '2025-01-28']);
  });

  it('increments the check and stub numbers across the run', () => {
    const models = buildPaystubModels({ ...makeStore(), generalInfo: { ...makeStore().generalInfo, payStubCount: 3 } });
    expect(models.map(m => m.checkNumber)).toEqual([5001, 5002, 5003]);
    expect(models.map(m => m.stubNumber)).toEqual([1, 2, 3]);
  });

  it('grows YTD across the run while regular pay stays constant', () => {
    const models = buildPaystubModels({ ...makeStore(), generalInfo: { ...makeStore().generalInfo, payStubCount: 6 } });

    // Same regular wages every period...
    expect(new Set(models.map(m => m.regularPay)).size).toBe(1);
    // ...but YTD is non-decreasing, and the last stub's YTD is strictly greater than the first's.
    for (let i = 1; i < models.length; i++) {
      expect(models[i].grossPayYTD).toBeGreaterThanOrEqual(models[i - 1].grossPayYTD);
    }
    expect(models[models.length - 1].grossPayYTD).toBeGreaterThan(models[0].grossPayYTD);
  });

  it('pays overtime and bonus on the entered period only; later stubs get none', () => {
    const models = buildPaystubModels({ ...makeStore(), generalInfo: { ...makeStore().generalInfo, payStubCount: 3 } });

    expect(models[0].overtimePay).toBe(75);
    expect(models[0].otherEarnings).toBe(100);
    expect(models[0].grossPay).toBe(1175);
    for (const later of models.slice(1)) {
      expect(later.overtimePay).toBe(0);
      expect(later.otherEarnings).toBe(0);
      expect(later.grossPay).toBe(1000); // regular only
    }
  });

  it('carries the one-time overtime and bonus forward in later stubs\' YTD, once', () => {
    const models = buildPaystubModels({ ...makeStore(), generalInfo: { ...makeStore().generalInfo, payStubCount: 3 } });

    for (const m of models) {
      const multiplier = periodsElapsedAt('Weekly', m.incomeDetails.periodPayDate);
      expect(m.overtimePayYTD).toBe(75);
      expect(m.otherEarningsYTD).toBe(100);
      expect(m.grossPayYTD).toBeCloseTo(m.regularPay * multiplier + 75 + 100, 5);
      expect(m.netPayYTD).toBeCloseTo(m.grossPayYTD - m.totalTaxesYTD - m.totalDeductionsYTD, 5);
    }
  });

  it('grows YTD taxes between later stubs by the regular-only tax times the periods added', () => {
    const models = buildPaystubModels({ ...makeStore(), generalInfo: { ...makeStore().generalInfo, payStubCount: 3 } });
    const [first, second, third] = models;
    const mult = (m: typeof first) => periodsElapsedAt('Weekly', m.incomeDetails.periodPayDate);

    // Stubs 2 and 3 are regular-only, so their per-period tax is the recurring base.
    expect(third.totalTaxes).toBeCloseTo(second.totalTaxes, 5);
    expect(third.totalTaxesYTD - second.totalTaxesYTD)
      .toBeCloseTo(second.totalTaxes * (mult(third) - mult(second)), 5);
    // The first stub's extra tax (from overtime + bonus) is in every stub's YTD exactly once.
    const extraTax = first.totalTaxes - second.totalTaxes;
    expect(extraTax).toBeGreaterThan(0);
    expect(second.totalTaxesYTD).toBeCloseTo(second.totalTaxes * mult(second) + extraTax, 5);
  });

  it('clamps the stub count to the supported 1–12 range', () => {
    const base = makeStore();
    expect(buildPaystubModels({ ...base, generalInfo: { ...base.generalInfo, payStubCount: 0 } })).toHaveLength(1);
    expect(buildPaystubModels({ ...base, generalInfo: { ...base.generalInfo, payStubCount: 99 } })).toHaveLength(12);
  });

  it('always yields at least one model even with no start date entered yet', () => {
    const base = makeStore();
    const models = buildPaystubModels({
      ...base,
      incomeDetails: { ...base.incomeDetails, periodStartDate: '' as unknown as Date },
    });
    expect(models).toHaveLength(1);
    expect(Number.isFinite(models[0].grossPay)).toBe(true);
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
