import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithApp } from './test-utils';
import EarningsStep from '../components/wizard/steps/EarningsStep';
import { initialState } from '../assets/data/initial-state';
import { buildPaystubModels } from '../templates/utils/buildPaystubModel';

/**
 * A run of 2+ pay stubs shows one card per stub on the Earnings step, most recent period first.
 * Each card holds that stub's own controls: rates, hours, overtime, bonus, check and stub number.
 */
describe('Earnings step — one card per pay stub', () => {
  // Bi-weekly, 20 an hour × 80 hours; the entered (most recent) period is 10/28–11/10/2026.
  const preloaded = (payStubCount: number, income: Record<string, unknown> = {}) => ({
    incomeDetails: {
      ...initialState.incomeDetails,
      wageType: 'Hourly', hourlyRate: 20, hoursWorked: 80, overtimeRate: 30, overtimeHours: 6, bonusAmount: 0,
      periodType: 'Bi-Weekly',
      periodStartDate: '2026-10-28' as unknown as Date, periodEndDate: '2026-11-10' as unknown as Date,
      periodPayDate: '2026-11-17' as unknown as Date,
      ...income,
    },
    generalInfo: { ...initialState.generalInfo, payStubCount, checkNumber: 5000, payStubNumber: 12 },
  });
  const renderStep = (count = 3, income: Record<string, unknown> = {}) =>
    renderWithApp(<EarningsStep onNext={() => {}} onBack={() => {}} />, { preloaded: preloaded(count, income) });
  const card = (stub: number) => within(screen.getByRole('group', { name: `Pay stub ${stub}` }));
  const field = (stub: number, name: RegExp) => card(stub).getByRole('spinbutton', { name }) as HTMLInputElement;
  const next = () => screen.getByRole('button', { name: /choose a template/i }) as HTMLButtonElement;

  it('keeps the plain form, with no cards, for a single stub', () => {
    renderStep(1);
    expect(screen.queryByRole('group', { name: /pay stub 1/i })).toBeNull();
    expect(screen.getByRole('spinbutton', { name: /overtime hours/i })).toBeTruthy();
    expect(screen.queryByRole('spinbutton', { name: /check number/i })).toBeNull();
  });

  it('shows a card per stub, most recent first, each with its own full set of controls', () => {
    renderStep();
    expect(card(1).getByText('10/28/2026 – 11/10/2026')).toBeTruthy();
    expect(card(2).getByText('10/14/2026 – 10/27/2026')).toBeTruthy();
    expect(card(3).getByText('09/30/2026 – 10/13/2026')).toBeTruthy();

    [1, 2, 3].forEach(stub => {
      expect(field(stub, /hourly rate/i).value).toBe('20');
      expect(field(stub, /hours worked/i).value).toBe('80');
      expect(field(stub, /overtime rate/i).value).toBe('30');
    });
    expect([1, 2, 3].map(s => field(s, /overtime hours/i).value)).toEqual(['6', '', '']);
    expect([1, 2, 3].map(s => field(s, /check number/i).value)).toEqual(['5000', '4999', '4998']);
    expect([1, 2, 3].map(s => field(s, /pay stub number/i).value)).toEqual(['12', '11', '10']);
    expect(next().disabled).toBe(false);
  });

  it('builds each stub from its own card, including its own rate', () => {
    const { store } = renderStep();
    fireEvent.change(field(2, /hours worked/i), { target: { value: '72' } });
    fireEvent.change(field(3, /hourly rate/i), { target: { value: '18' } });
    fireEvent.change(field(3, /overtime rate/i), { target: { value: '27' } });
    fireEvent.change(field(3, /bonus/i), { target: { value: '250' } });
    fireEvent.change(field(3, /check number/i), { target: { value: '4990' } });
    fireEvent.click(next());

    const models = buildPaystubModels(store.getState() as any);
    expect(models.map(m => m.grossPay)).toEqual([1780, 1440, 1690]); // 1,600 + 180 · 72 × 20 · 80 × 18 + 250
    expect(models.map(m => m.incomeDetails.hourlyRate)).toEqual([20, 20, 18]);
    expect(models.map(m => m.checkNumber)).toEqual([5000, 4999, 4990]);
    expect(models.map(m => m.stubNumber)).toEqual([12, 11, 10]);
  });

  it('a card the customer typed in keeps its value when the first card changes', () => {
    renderStep();
    fireEvent.change(field(2, /hours worked/i), { target: { value: '72' } });
    fireEvent.change(field(1, /hours worked/i), { target: { value: '75' } });
    expect([1, 2, 3].map(s => field(s, /hours worked/i).value)).toEqual(['75', '72', '75']);
  });

  it('copies the first card to every other card, but not the check and stub numbers', () => {
    renderStep();
    fireEvent.change(field(2, /hours worked/i), { target: { value: '72' } });
    fireEvent.change(field(2, /check number/i), { target: { value: '4500' } });
    fireEvent.click(screen.getByRole('button', { name: /copy these values to all pay stubs/i }));

    expect([1, 2, 3].map(s => field(s, /hours worked/i).value)).toEqual(['80', '80', '80']);
    expect([1, 2, 3].map(s => field(s, /overtime hours/i).value)).toEqual(['6', '6', '6']);
    expect([1, 2, 3].map(s => field(s, /check number/i).value)).toEqual(['5000', '4500', '4998']);
  });

  it('refuses a repeated check number and a stub number that cannot count down, on the card itself', () => {
    renderStep();
    fireEvent.change(field(3, /check number/i), { target: { value: '5000' } });
    expect(card(3).getByText('Already used on another pay stub.')).toBeTruthy();
    expect(next().disabled).toBe(true);
    fireEvent.change(field(3, /check number/i), { target: { value: '4998' } });
    expect(next().disabled).toBe(false);

    // Stub number 2 on a run of three: the third card cannot be pre-filled and must be typed.
    fireEvent.change(field(1, /pay stub number/i), { target: { value: '2' } });
    expect([1, 2, 3].map(s => field(s, /pay stub number/i).value)).toEqual(['2', '1', '']);
    expect(card(3).getByText('Enter a whole number above 0.')).toBeTruthy();
    expect(next().disabled).toBe(true);
  });

  it('applies the 1.5× overtime floor to each card against that card\'s own hourly rate', () => {
    renderStep();
    fireEvent.change(field(3, /hourly rate/i), { target: { value: '24' } });
    fireEvent.change(field(3, /overtime hours/i), { target: { value: '4' } });
    // 30 an hour is fine against 20, but under 1.5 × 24.
    expect(card(3).getByText('Overtime must be at least 1.5× the hourly rate ($36.00).')).toBeTruthy();
    expect(next().disabled).toBe(true);
    fireEvent.change(field(3, /overtime rate/i), { target: { value: '36' } });
    expect(next().disabled).toBe(false);
  });

  it('folds the earlier cards of a long run to a summary line that opens on click', () => {
    renderStep(6);
    expect(card(1).getByRole('spinbutton', { name: /hours worked/i })).toBeTruthy();
    expect(card(4).queryByRole('spinbutton', { name: /hours worked/i })).toBeNull();
    expect(card(4).getByText('Gross $1,600.00')).toBeTruthy();

    fireEvent.click(card(4).getByRole('button', { expanded: false }));
    expect(field(4, /hours worked/i).value).toBe('80');
  });

  it('gives a salaried run a salary, bonus and numbers on each card', () => {
    const { store } = renderStep(2, { wageType: 'Salary', annualSalary: 52000 });
    expect(card(2).queryByRole('spinbutton', { name: /hours worked/i })).toBeNull();
    fireEvent.change(field(2, /annual salary/i), { target: { value: '46800' } });
    fireEvent.click(next());
    const models = buildPaystubModels(store.getState() as any);
    expect(models.map(m => m.regularPay)).toEqual([2000, 1800]); // bi-weekly: ÷ 26
  });
});
