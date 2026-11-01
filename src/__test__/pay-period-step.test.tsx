import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import PayPeriodStep from '../components/wizard/steps/PayPeriodStep';
import { prodInitialState } from '../assets/data/production-initial-state';
import { calculateEndDate, calculatePayDate, defaultPeriodStart, toISODate } from '../utils/date-calculator';

const startInput = () => screen.getByLabelText(/period start date/i) as HTMLInputElement;
const endInput = () => screen.getByLabelText(/period end date/i) as HTMLInputElement;
const payInput = () => screen.getByLabelText(/^pay date/i) as HTMLInputElement;
const continueButton = () => screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;

const pickFrequency = async (name: string) => {
  await userEvent.click(screen.getByRole('combobox', { name: /pay frequency/i }));
  await userEvent.click(screen.getByRole('option', { name }));
};

const renderStep = (incomeDetails: Partial<typeof prodInitialState.incomeDetails> = {}) =>
  renderWithApp(<PayPeriodStep onNext={() => {}} onBack={() => {}} />, {
    preloaded: {
      incomeDetails: { ...prodInitialState.incomeDetails, ...incomeDetails },
      generalInfo: prodInitialState.generalInfo,
    } as any,
  });

describe('production seed', () => {
  it('starts one week in the past so the first Weekly period has already ended', () => {
    const start = defaultPeriodStart('Weekly');
    expect(toISODate(prodInitialState.incomeDetails.periodStartDate)).toBe(start);
    expect(toISODate(prodInitialState.incomeDetails.periodEndDate)).toBe(calculateEndDate(start, 'Weekly'));
    expect(toISODate(prodInitialState.incomeDetails.periodPayDate)).toBe(calculatePayDate(calculateEndDate(start, 'Weekly')));
    expect(prodInitialState.incomeDetails.periodType).toBe('Weekly');
  });
});

describe('PayPeriodStep', () => {
  it('shows the seeded start with end and pay date computed from it', () => {
    renderStep();
    const start = defaultPeriodStart('Weekly');
    expect(startInput().value).toBe(start);
    expect(endInput().value).toBe(calculateEndDate(start, 'Weekly'));
    expect(payInput().value).toBe(calculatePayDate(calculateEndDate(start, 'Weekly')));
    expect(continueButton().disabled).toBe(false);
  });

  it('end date and pay date are read-only', () => {
    renderStep();
    expect(endInput().readOnly).toBe(true);
    expect(payInput().readOnly).toBe(true);
  });

  it('changing the frequency snaps the start to that frequency default', async () => {
    renderStep();
    fireEvent.change(startInput(), { target: { value: '2024-01-01' } }); // a hand-typed start
    await pickFrequency('Bi-Weekly');
    const start = defaultPeriodStart('Bi-Weekly');
    expect(startInput().value).toBe(start);
    expect(endInput().value).toBe(calculateEndDate(start, 'Bi-Weekly'));
    expect(payInput().value).toBe(calculatePayDate(calculateEndDate(start, 'Bi-Weekly')));
  });

  it('typing a new start recomputes the read-only end and pay dates', () => {
    renderStep();
    fireEvent.change(startInput(), { target: { value: '2024-03-04' } });
    expect(endInput().value).toBe('2024-03-10');
    expect(payInput().value).toBe('2024-03-11');
  });

  it('rejects a start less than one period in the past and disables Continue', () => {
    renderStep();
    fireEvent.change(startInput(), { target: { value: toISODate(new Date()) } });
    fireEvent.blur(startInput());
    expect(screen.getByText(/at least one week before today/i)).toBeTruthy();
    expect(continueButton().disabled).toBe(true);
  });

  it('saves all three dates to the store on Continue', async () => {
    const { store } = renderStep();
    fireEvent.change(startInput(), { target: { value: '2024-03-04' } });
    await userEvent.click(continueButton());
    const saved = store.getState().incomeDetails;
    expect(saved.periodStartDate).toBe('2024-03-04');
    expect(saved.periodEndDate).toBe('2024-03-10');
    expect(saved.periodPayDate).toBe('2024-03-11');
    expect(saved.periodType).toBe('Weekly');
  });

  it('offers only Direct Deposit, Physical Check and Others as payment methods', async () => {
    renderStep();
    await userEvent.click(screen.getByRole('combobox', { name: /payment method/i }));
    const options = screen.getAllByRole('option').map(o => o.textContent);
    expect(options).toEqual(['Direct Deposit', 'Physical Check', 'Others']);
  });

  it('pay stub number defaults to 1 for a fresh visitor', () => {
    renderStep();
    expect(prodInitialState.generalInfo.payStubNumber).toBe(1);
    expect((screen.getByLabelText(/pay stub number/i) as HTMLInputElement).value).toBe('1');
  });
});
