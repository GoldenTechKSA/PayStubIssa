import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import ReviewStep from '../components/wizard/steps/ReviewStep';
import { paymentsApi, PaymentsApiError, type Cart, type CapturedOrder, type Quote } from '../services/payments-api';
import { telemetry } from '../services/telemetry-service';

const CODE = 'FIXIT';
const FREE_BUTTON = 'Get my corrected pay stub';
const FREE_NOTE = 'Your correction code covers this order. Nothing will be charged.';
const USED_MESSAGE = 'This correction code has already been used.';
const UNAVAILABLE = 'This code could not be applied. Please try again.';
const CHECKING = 'Checking your code…';
const CHECK_FAILED = 'We could not check that code. Try again.';

/** A normal quote, or the zero-total quote a correction code earns. */
function fakeQuote(cart: Cart): Quote {
  const qty = cart.items.reduce((n, i) => n + i.qty, 0);
  const subtotalCents = 899 * qty;
  const free = cart.couponCode === CODE;
  return {
    currency: 'USD',
    lines: [{ type: 'paystub', description: 'Pay stub', qty, unitCents: 899, subtotalCents }],
    discounts: free ? [{ code: CODE, description: 'Correction', amountCents: subtotalCents }] : [],
    subtotalCents,
    discountCents: free ? subtotalCents : 0,
    totalCents: free ? 0 : subtotalCents,
  };
}

describe('Review step correction code', () => {
  let createOrder: any;
  let captureOrder: any;
  let quote: any;
  let payPalMounted: number;
  let buttons: any; // the options the PayPal component hands the SDK

  beforeEach(() => {
    sessionStorage.clear();
    payPalMounted = 0;
    buttons = null;
    window.scrollTo = jest.fn() as any;
    (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    (window as any).paypal = {
      Buttons: (opts: any) => {
        payPalMounted += 1;
        buttons = opts;
        return { isEligible: () => true, render: async () => {}, close: () => {} };
      },
    };
    jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    createOrder = jest.spyOn(paymentsApi, 'createOrder');
    captureOrder = jest.spyOn(paymentsApi, 'captureOrder');
    quote = jest.spyOn(paymentsApi, 'quote').mockImplementation(async (cart: Cart) => fakeQuote(cart));
    jest.spyOn(paymentsApi, 'getConfig').mockImplementation(async () => ({
      paypalEnv: 'sandbox', clientId: 'x', currency: 'USD', unitCents: { paystub: 899 }, maxQty: 12,
    }));
  });
  afterEach(() => {
    delete (window as any).paypal;
    jest.restoreAllMocks();
  });

  const completedFor = (cart: Cart): CapturedOrder => ({
    orderId: 'FREE1', status: 'COMPLETED', token: 'tok',
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    quote: fakeQuote(cart),
  });

  /** Type the correction code into the coupon field and apply it. */
  const applyCode = async () => {
    const view = renderWithApp(<ReviewStep onBack={() => {}} onEdit={() => {}} />, { route: '/create' });
    await userEvent.type(await screen.findByLabelText('Coupon code'), CODE);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(quote).toHaveBeenCalledWith(expect.objectContaining({ couponCode: CODE })));
    return view;
  };
  const tick = () => userEvent.click(screen.getByRole('checkbox', { name: /terms of use/i }));

  it('offers the free button instead of PayPal when the total is zero', async () => {
    await applyCode();
    await tick();
    expect(await screen.findByRole('button', { name: FREE_BUTTON })).toBeTruthy();
    expect(screen.getByText(FREE_NOTE)).toBeTruthy();
    expect(payPalMounted).toBe(0);
  });

  it('still requires the clickwrap box', async () => {
    await applyCode();
    await screen.findByText('Confirm the statement above to continue to payment.');
    expect(screen.queryByRole('button', { name: FREE_BUTTON })).toBeNull();
    expect(screen.queryByText(FREE_NOTE)).toBeNull();
  });

  it('completes without PayPal and unlocks the stub', async () => {
    createOrder.mockImplementation((async (cart: Cart) => ({
      orderId: 'FREE1', quote: fakeQuote(cart), completed: completedFor(cart),
    })) as any);
    await applyCode();
    await tick();
    await userEvent.click(await screen.findByRole('button', { name: FREE_BUTTON }));
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    expect(captureOrder).not.toHaveBeenCalled();
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ couponCode: CODE }),
      expect.objectContaining({ termsVersion: expect.any(String), attestedAt: expect.any(String) }),
      expect.stringMatching(/^[0-9a-f]{64}$/),
    );
  });

  it('shows the server message when the code was already used', async () => {
    quote.mockImplementation((async (cart: Cart) => {
      if (cart.couponCode === CODE) throw new PaymentsApiError(USED_MESSAGE, 'INVALID_COUPON', 400);
      return fakeQuote(cart);
    }) as any);
    await applyCode();
    expect(await screen.findByText(USED_MESSAGE)).toBeTruthy();
    await tick();
    expect(screen.queryByRole('button', { name: FREE_BUTTON })).toBeNull();
  });

  it('disables the button while the order is being created', async () => {
    let finish: (v: unknown) => void = () => {};
    createOrder.mockImplementation(((cart: Cart) => new Promise(res => {
      finish = () => res({ orderId: 'FREE1', quote: fakeQuote(cart), completed: completedFor(cart) });
    })) as any);
    await applyCode();
    await tick();
    await userEvent.click(await screen.findByRole('button', { name: FREE_BUTTON }));
    await waitFor(() => expect((screen.getByRole('button', { name: FREE_BUTTON }) as HTMLButtonElement).disabled).toBe(true));
    expect(createOrder).toHaveBeenCalledTimes(1);
    await act(async () => { finish(null); });
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
  });

  it('treats an answer without a completed order as an error', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    createOrder.mockImplementation((async (cart: Cart) => ({ orderId: 'X', quote: fakeQuote(cart) })) as any);
    await applyCode();
    await tick();
    await userEvent.click(await screen.findByRole('button', { name: FREE_BUTTON }));
    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    expect(alertSpy.mock.calls[0][0]).toBe(UNAVAILABLE);
    expect(screen.queryByRole('button', { name: /print pay stub/i })).toBeNull();
    expect((screen.getByRole('button', { name: FREE_BUTTON }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('offers neither payment control while the code is being checked', async () => {
    quote.mockImplementation(((cart: Cart) =>
      cart.couponCode === CODE ? new Promise(() => {}) : Promise.resolve(fakeQuote(cart))) as any);
    renderWithApp(<ReviewStep onBack={() => {}} onEdit={() => {}} />, { route: '/create' });
    await tick();
    await waitFor(() => expect(payPalMounted).toBe(1)); // no code yet: PayPal as usual
    await userEvent.type(screen.getByLabelText('Coupon code'), CODE);
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText(CHECKING)).toBeTruthy();
    expect(screen.queryByRole('button', { name: FREE_BUTTON })).toBeNull();
    expect(screen.queryByText(/secure checkout via paypal/i)).toBeNull();
    expect(payPalMounted).toBe(1);
  });

  it('when the code cannot be checked, offers Try again instead of payment', async () => {
    let fail = true;
    quote.mockImplementation((async (cart: Cart) => {
      if (cart.couponCode === CODE && fail) throw new PaymentsApiError('Service unavailable', 'HTTP_503', 503);
      return fakeQuote(cart);
    }) as any);
    await applyCode();
    await tick();
    expect(await screen.findByText(CHECK_FAILED)).toBeTruthy();
    expect(screen.queryByRole('button', { name: FREE_BUTTON })).toBeNull();
    expect(payPalMounted).toBe(0);

    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: FREE_BUTTON })).toBeTruthy();
    expect(screen.queryByText(CHECK_FAILED)).toBeNull();
    expect(payPalMounted).toBe(0);
  });

  it('when the code cannot be checked, Remove code goes back to the full price', async () => {
    quote.mockImplementation((async (cart: Cart) => {
      if (cart.couponCode === CODE) throw new PaymentsApiError('Service unavailable', 'HTTP_503', 503);
      return fakeQuote(cart);
    }) as any);
    await applyCode();
    await tick();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove code' }));
    await waitFor(() => expect(payPalMounted).toBe(1));
    expect(screen.queryByText(CHECK_FAILED)).toBeNull();
    expect(buttons).not.toBeNull();
  });

  it('a completed answer to the PayPal button unlocks the stub with no error and no PayPal step', async () => {
    // The client holds a non-zero quote (a stale answer, or an older build), but the server
    // completes the order with the correction code when PayPal asks for it.
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    quote.mockImplementation((async (cart: Cart) => ({ ...fakeQuote(cart), totalCents: 100 })) as any);
    createOrder.mockImplementation((async (cart: Cart) => ({
      orderId: 'C-FREE1', quote: fakeQuote(cart), completed: completedFor(cart),
    })) as any);
    await applyCode();
    await tick();
    await waitFor(() => expect(buttons).not.toBeNull());

    // The SDK calls createOrder; a rejection abandons the flow and the SDK reports it to onError.
    let rejection: unknown = null;
    await act(async () => {
      try { await buttons.createOrder(); } catch (err) { rejection = err; }
    });
    expect(rejection).not.toBeNull();
    await act(async () => { buttons.onError(rejection); });

    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(captureOrder).not.toHaveBeenCalled();
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ couponCode: CODE }), expect.anything(), expect.stringMatching(/^[0-9a-f]{64}$/));
  });
});
