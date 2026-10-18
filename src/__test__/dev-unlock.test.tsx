import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithApp } from './test-utils';
import PaystubWizard from '../components/wizard/PaystubWizard';
import { isDevUnlock } from '../utils/dev-flags';
import { telemetry } from '../services/telemetry-service';

describe('isDevUnlock', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => { (process.env as any).NODE_ENV = env; });

  it('is on only for ?dev=unlock', () => {
    expect(isDevUnlock('?dev=unlock')).toBe(true);
    expect(isDevUnlock('?foo=1&dev=unlock')).toBe(true);
    expect(isDevUnlock('?dev=nope')).toBe(false);
    expect(isDevUnlock('')).toBe(false);
  });

  it('is never on in a production build', () => {
    (process.env as any).NODE_ENV = 'production';
    expect(isDevUnlock('?dev=unlock')).toBe(false);
  });
});

describe('wizard ?dev=unlock', () => {
  let emit: ReturnType<typeof jest.spyOn>;
  beforeEach(() => {
    emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    window.scrollTo = jest.fn() as any;
    // jsdom has no ResizeObserver; FitPage (inside Review) observes its container with one.
    (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    localStorage.clear();
  });
  afterEach(() => emit.mockRestore());

  it('lands on Review with print/PDF unlocked', async () => {
    const { store } = renderWithApp(<PaystubWizard />, { route: '/create?dev=unlock' });
    expect(await screen.findByRole('heading', { name: /review & finalize/i })).toBeTruthy();
    expect(store.getState().appSettings.canPrint).toBe(true);
    expect(await screen.findByRole('button', { name: /download pdf/i })).toBeTruthy();
  });

  it('changes nothing without the flag', () => {
    const { store } = renderWithApp(<PaystubWizard />, { route: '/create' });
    expect(screen.getByRole('button', { name: /continue/i })).toBeTruthy();
    expect(store.getState().appSettings.canPrint).toBe(false);
  });
});
