import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithApp } from './test-utils';
import EarningsStep from '../components/wizard/steps/EarningsStep';
import { minOvertimeRate, overtimeRateTooLow } from '../utils/overtime-calculator';

/**
 * Federal law (FLSA, 29 U.S.C. § 207) sets overtime at no less than 1.5× the regular rate. The
 * Earnings step must not let a stub through with an overtime rate under that floor.
 */
describe('overtime rate floor', () => {
  it('is 1.5× the hourly rate, rounded up to the cent', () => {
    expect(minOvertimeRate(20)).toBe(30);
    expect(minOvertimeRate(32.5)).toBe(48.75);
    expect(minOvertimeRate(15.33)).toBe(23);
    expect(minOvertimeRate(0)).toBe(0);
  });

  it('rejects a rate under the floor and hours without a rate, and allows more or none', () => {
    expect(overtimeRateTooLow(20, 22, 5)).toBe(true);
    expect(overtimeRateTooLow(20, 29.99, 0)).toBe(true);
    expect(overtimeRateTooLow(20, 0, 5)).toBe(true);
    expect(overtimeRateTooLow(20, 30, 5)).toBe(false);
    expect(overtimeRateTooLow(20, 40, 5)).toBe(false);
    expect(overtimeRateTooLow(20, 0, 0)).toBe(false);
  });
});

describe('Earnings step overtime rate', () => {
  const field = (name: RegExp) => screen.getByRole('spinbutton', { name }) as HTMLInputElement;
  const next = () => screen.getByRole('button', { name: /choose a template/i }) as HTMLButtonElement;
  const renderStep = () => renderWithApp(<EarningsStep onNext={() => {}} onBack={() => {}} />);

  it('blocks Next and explains while the overtime rate is under 1.5× the hourly rate', () => {
    renderStep();
    fireEvent.change(field(/hourly rate/i), { target: { value: '20' } });
    fireEvent.change(field(/overtime hours/i), { target: { value: '5' } });
    fireEvent.change(field(/overtime rate/i), { target: { value: '22' } });
    expect(screen.getByText('Overtime must be at least 1.5× the hourly rate ($30.00).')).toBeTruthy();
    expect(next().disabled).toBe(true);

    fireEvent.change(field(/overtime rate/i), { target: { value: '30' } });
    expect(screen.queryByText(/Overtime must be/)).toBeNull();
    expect(next().disabled).toBe(false);
  });

  it('fills an empty overtime rate with the floor once overtime hours are entered', () => {
    renderStep();
    fireEvent.change(field(/hourly rate/i), { target: { value: '20' } });
    fireEvent.change(field(/overtime rate/i), { target: { value: '' } });
    fireEvent.change(field(/overtime hours/i), { target: { value: '5' } });
    fireEvent.blur(field(/overtime hours/i));
    expect(field(/overtime rate/i).value).toBe('30');
    expect(next().disabled).toBe(false);
  });
});
