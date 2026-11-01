import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { screen, within, waitFor, fireEvent } from '@testing-library/react';
import { renderWithApp } from './test-utils';
import ReviewStep from '../components/wizard/steps/ReviewStep';
import { paymentsApi, type Cart } from '../services/payments-api';
import { telemetry } from '../services/telemetry-service';
import { initialState } from '../assets/data/initial-state';
import { buildPaystubModels } from '../templates/utils/buildPaystubModel';
import { formatCurrency } from '../utils/util';

// The real template XML, served to the preview's fetch so the run renders end to end.
const XML = fs.readFileSync(path.join(__dirname, '../../public/configs/template-simple/paystub-config.xml'), 'utf8');

const pages = () => Array.from(document.querySelectorAll<HTMLElement>('#pdf-content .paystub-page'));
const visiblePages = () => pages().filter(p => !p.classList.contains('paystub-page-inactive'));

describe('Review step pages through a multi-stub run', () => {
  let quote: ReturnType<typeof jest.spyOn>;
  let emit: ReturnType<typeof jest.spyOn>;
  let realFetch: any;
  beforeEach(() => {
    quote = jest.spyOn(paymentsApi, 'quote').mockImplementation(async (cart: Cart) => {
      const qty = cart.items.reduce((n, i) => n + i.qty, 0);
      const subtotalCents = 899 * qty;
      return { currency: 'USD', lines: [{ type: 'paystub', description: 'Pay stub', qty, unitCents: 899, subtotalCents }], discounts: [], subtotalCents, discountCents: 0, totalCents: subtotalCents };
    });
    emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    window.scrollTo = jest.fn() as any;
    (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    realFetch = (globalThis as any).fetch;
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, status: 200, statusText: 'OK', text: async () => XML }));
    sessionStorage.clear();
  });
  afterEach(() => { quote.mockRestore(); emit.mockRestore(); (globalThis as any).fetch = realFetch; });

  const renderReview = (payStubCount: number) =>
    renderWithApp(<ReviewStep onBack={() => {}} onEdit={() => {}} />, {
      preloaded: {
        appSettings: { ...initialState.appSettings, configPath: '/configs/template-simple/paystub-config.xml', templateId: 0 },
        generalInfo: { ...initialState.generalInfo, payStubCount },
      },
    });

  it('renders every stub but shows only the first, with the pager naming it', async () => {
    renderReview(3);
    await waitFor(() => expect(pages()).toHaveLength(3));
    expect(visiblePages()).toHaveLength(1);
    expect(visiblePages()[0]).toBe(pages()[0]);
    expect(screen.getByText(/pay stub 1 of 3/i)).toBeTruthy();
  });

  it('Next shows the second stub and the pay summary follows it', async () => {
    const { store } = renderReview(3);
    await waitFor(() => expect(pages()).toHaveLength(3));
    const models = buildPaystubModels(store.getState());
    expect(models[1].netPayYTD).not.toBe(models[0].netPayYTD); // the periods really differ

    fireEvent.click(screen.getByRole('button', { name: /next pay stub/i }));
    expect(screen.getByText(/pay stub 2 of 3/i)).toBeTruthy();
    expect(visiblePages()[0]).toBe(pages()[1]);

    const summary = screen.getByText(/pay summary/i).closest('.MuiCardContent-root') as HTMLElement;
    expect(within(summary).getByText(formatCurrency(models[1].netPay))).toBeTruthy();
    expect(within(summary).getByText(formatCurrency(models[1].netPayYTD))).toBeTruthy();
  });

  it('a dot jumps straight to the third stub', async () => {
    renderReview(3);
    await waitFor(() => expect(pages()).toHaveLength(3));
    fireEvent.click(screen.getByRole('button', { name: /^pay stub 3$/i }));
    expect(visiblePages()[0]).toBe(pages()[2]);
    expect(screen.getByText(/pay stub 3 of 3/i)).toBeTruthy();
  });

  it('a single stub has no pager and nothing hidden', async () => {
    renderReview(1);
    await waitFor(() => expect(pages()).toHaveLength(1));
    expect(screen.queryByRole('button', { name: /next pay stub/i })).toBeNull();
    expect(visiblePages()).toHaveLength(1);
  });
});
