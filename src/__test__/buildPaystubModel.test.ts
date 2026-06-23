/**
 * Tests for buildPaystubModel — the data-assembly layer that feeds the XML renderer.
 * Focuses on the contract guarantees rather than exact tax figures (which depend on
 * the tax tables): earnings/gross basis, deduction totals, net-pay identity, the
 * filing-status fix (no NaN for married filers), and the YTD multiplier.
 */

import { describe, it, expect } from '@jest/globals';
import { buildPaystubModel } from '../templates/utils/buildPaystubModel';
import { periodsToDateThisYear } from '../utils/date-calculator';
import { PayStubDetails } from '../assets/data/pay-stub-details';

const makeStore = (overrides: Partial<PayStubDetails['incomeDetails']> = {},
                   employeeOverrides: Partial<PayStubDetails['employeeInfo']> = {}): PayStubDetails => ({
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
    employeeEmail: 'e@c.com', employeeMarriedStatus: 'single', employeeHireDate: new Date('2020-01-01'),
    ...employeeOverrides,
  },
  incomeDetails: {
    annualSalary: 0, wageType: 'Hourly', hourlyRate: 25, hoursWorked: 40, overtimeRate: 37.5,
    overtimeHours: 2, bonusAmount: 100, deduction401k: 20, medicalDeduction: 50, dentalDeduction: 10,
    visionDeduction: 5, otherDeduction: 0, unionDues: 0,
    periodStartDate: new Date('2025-01-01'), periodEndDate: new Date('2025-01-07'),
    periodPayDate: new Date('2025-01-08'), periodType: 'Weekly',
    ...overrides,
  },
  generalInfo: {
    employmentType: 'Employee', paymentMethod: 'Direct Deposit', paymentFrequency: 'Weekly',
    payStubCount: 1, payStubNumber: 1, checkNumber: 5001, extraNotes: '',
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
    expect(m.totalDeductions).toBe(85);  // 50 + 10 + 5 + 20
    expect(m.totalTaxes).toBeCloseTo(m.federalTax + m.stateTax + m.socialSecurity + m.medicare, 5);
    expect(m.netPay).toBeCloseTo(m.grossPay - m.totalTaxes - m.totalDeductions, 5);
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

  it('computes YTD as the current amount times periods elapsed this year', () => {
    const m = buildPaystubModel(makeStore());
    const multiplier = periodsToDateThisYear('Weekly');
    expect(m.grossPayYTD).toBeCloseTo(m.grossPay * multiplier, 5);
    expect(m.netPayYTD).toBeCloseTo(m.netPay * multiplier, 5);
    expect(m.totalDeductionsYTD).toBeCloseTo(m.totalDeductions * multiplier, 5);
  });
});
