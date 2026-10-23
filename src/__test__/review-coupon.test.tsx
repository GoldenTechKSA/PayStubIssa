import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import ReviewStep from '../components/wizard/steps/ReviewStep';
import { paymentsApi, PaymentsApiError, type Cart, type Quote } from '../services/payments-api';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';

/** A server-shaped quote: 25% off when the code is FRIEND, INVALID_COUPON for any other code. */
function fakeQuote(cart: Cart): Quote {
  const qty = cart.items.reduce((n, i) => n + i.qty, 0);
  const subtotalCents = 899 * qty;
  const code = (cart.couponCode ?? '').trim().toUpperCase();
  if (code && code !== 'FRIEND') throw new PaymentsApiError('That coupon code is not valid', 'INVALID_COUPON', 400);
  const discounts = code ? [{ code: 'FRIEND', description: '25% off', amountCents: Math.round(subtotalCents * 0.25) }] : [];
  const discountCents = discounts.reduce((n, d) => n + d.amountCents, 0);
  return {
    currency: 'USD',
    lines: [{ type: 'paystub', description: 'Pay stub', qty, unitCents: 899, subtotalCents }],
    discounts,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}

describe('Review step coupon code', () => {
  let quote: ReturnType<typeof jest.spyOn>;
  let emit: ReturnType<typeof jest.spyOn>;
  beforeEach(() => {
    quote = jest.spyOn(paymentsApi, 'quote').mockImplementation(async (cart: Cart) => fakeQuote(cart));
    emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    window.scrollTo = jest.fn() as any;
    (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    sessionStorage.clear();
  });
  afterEach(() => { quote.mockRestore(); emit.mockRestore(); });

  const renderReview = () => renderWithApp(<ReviewStep onBack={() => {}} onEdit={() => {}} />);

  it('re-quotes with the code and shows the discount line and reduced total', async () => {
    renderReview();
    expect(await screen.findByText('Total')).toBeTruthy();
    const firstCart = quote.mock.calls[0][0] as Cart;
    expect(firstCart.couponCode).toBeUndefined();
    const qty = firstCart.items[0].qty;

    await userEvent.type(screen.getByRole('textbox', { name: /coupon code/i }), 'friend');
    await userEvent.click(screen.getByRole('button', { name: /^apply$/i }));

    expect(await screen.findByText('25% off (FRIEND)')).toBeTruthy();
    const expected = fakeQuote({ items: [{ type: 'paystub', qty }], couponCode: 'friend' });
    expect(quote).toHaveBeenLastCalledWith({ items: [{ type: 'paystub', qty }], couponCode: 'friend' });
    const totalRow = screen.getByText('Total').parentElement as HTMLElement;
    expect(within(totalRow).getByText(`$${(expected.totalCents / 100).toFixed(2)}`)).toBeTruthy();
    expect(emit).toHaveBeenCalledWith(T.COUPON_APPLIED, { amountCents: expected.discountCents });
  });

  it('shows the server message for a bad code and keeps the full price', async () => {
    renderReview();
    expect(await screen.findByText('Total')).toBeTruthy();
    const qty = (quote.mock.calls[0][0] as Cart).items[0].qty;

    await userEvent.type(screen.getByRole('textbox', { name: /coupon code/i }), 'NOPE');
    await userEvent.click(screen.getByRole('button', { name: /^apply$/i }));

    expect(await screen.findByText('That coupon code is not valid')).toBeTruthy();
    expect(screen.queryByText(/% off/)).toBeNull();
    const totalRow = screen.getByText('Total').parentElement as HTMLElement;
    expect(within(totalRow).getByText(`$${((899 * qty) / 100).toFixed(2)}`)).toBeTruthy();
    expect(emit).toHaveBeenCalledWith(T.COUPON_REJECTED, { code: 'INVALID_COUPON' });
  });

  it('removing an applied code goes back to the full price', async () => {
    renderReview();
    expect(await screen.findByText('Total')).toBeTruthy();
    await userEvent.type(screen.getByRole('textbox', { name: /coupon code/i }), 'FRIEND');
    await userEvent.click(screen.getByRole('button', { name: /^apply$/i }));
    expect(await screen.findByText('25% off (FRIEND)')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /remove coupon/i }));
    expect(screen.queryByText('25% off (FRIEND)')).toBeNull();
    const last = quote.mock.calls[quote.mock.calls.length - 1][0] as Cart;
    expect(last.couponCode).toBeUndefined();
  });
});
