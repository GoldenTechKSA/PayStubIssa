import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithApp } from './test-utils';
import CompanyStep from '../components/wizard/steps/CompanyStep';

const phone = () => screen.getByLabelText(/company phone/i) as HTMLInputElement;

describe('CompanyStep phone field', () => {
  it('accepts an autofilled number with the +1 country code', () => {
    renderWithApp(<CompanyStep onNext={() => {}} onBack={() => {}} />);
    fireEvent.change(phone(), { target: { value: '+1 (555) 123-4567' } });
    fireEvent.blur(phone());
    expect(screen.queryByText(/enter a valid 10-digit phone number/i)).toBeNull();
    expect((screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('still flags a number that is not a US phone', () => {
    renderWithApp(<CompanyStep onNext={() => {}} onBack={() => {}} />);
    fireEvent.change(phone(), { target: { value: '+44 20 7946 0958' } });
    fireEvent.blur(phone());
    expect(screen.getByText(/enter a valid 10-digit phone number/i)).toBeTruthy();
    expect((screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});
