import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import ReviewStep from '../components/wizard/steps/ReviewStep';
import { paymentsApi, type Cart, type CapturedOrder, type Quote } from '../services/payments-api';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';
import { FINAL_ONCE_PAID } from '../constants/business-info';
import { saveEmployeeInfo, saveGeneralInfo, saveIncomeDetails, updateAppSettings } from '../redux/actions';

function fakeQuote(cart: Cart): Quote {
  const qty = cart.items.reduce((n, i) => n + i.qty, 0);
  const subtotalCents = 899 * qty;
  return {
    currency: 'USD',
    lines: [{ type: 'paystub', description: 'Pay stub', qty, unitCents: 899, subtotalCents }],
    discounts: [],
    subtotalCents,
    discountCents: 0,
    totalCents: subtotalCents,
  };
}

const NOTICE_TITLE = 'This is not the pay stub you paid for';
const NOTICE_BODY = 'You changed it after payment. Pay again for the new version, or go back to the one you bought.';

describe('Review step paid lock', () => {
  let spies: Array<{ mockRestore: () => void }>;
  let emit: any;
  let createOrder: any;
  let captureOrder: any;
  let buttons: any; // the options the PayPal component hands the SDK

  beforeEach(() => {
    sessionStorage.clear();
    buttons = null;
    window.scrollTo = jest.fn() as any;
    (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    // A stand-in PayPal SDK: it only records the callbacks the component registers.
    (window as any).paypal = {
      Buttons: (opts: any) => {
        buttons = opts;
        return { isEligible: () => true, render: async () => {}, close: () => {} };
      },
    };
    emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    createOrder = jest.spyOn(paymentsApi, 'createOrder').mockImplementation((async () => ({ orderId: 'ORDER1' })) as any);
    captureOrder = jest.spyOn(paymentsApi, 'captureOrder');
    spies = [
      emit, createOrder, captureOrder,
      jest.spyOn(paymentsApi, 'quote').mockImplementation(async (cart: Cart) => fakeQuote(cart)),
      jest.spyOn(paymentsApi, 'getConfig').mockImplementation(async () => ({
        paypalEnv: 'sandbox', clientId: 'x', currency: 'USD', unitCents: { paystub: 899 }, maxQty: 12,
      })),
    ];
  });
  afterEach(() => {
    spies.forEach(s => s.mockRestore());
    delete (window as any).paypal;
    jest.restoreAllMocks();
  });

  /** What the server answers for a capture of the order the browser just created. */
  const captured = (extra: Partial<CapturedOrder> = {}): CapturedOrder => {
    const cart = createOrder.mock.calls[0][0] as Cart;
    return {
      orderId: 'ORDER1', status: 'COMPLETED', token: 'tok',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      quote: fakeQuote(cart), ...extra,
    };
  };

  const renderReview = (route = '/create') =>
    renderWithApp(<ReviewStep onBack={() => {}} onEdit={() => {}} />, { route });

  /** Tick the clickwrap so the PayPal buttons mount, and wait for them. */
  const openCheckout = async () => {
    const view = renderReview();
    await userEvent.click(await screen.findByRole('checkbox', { name: /terms of use/i }));
    await waitFor(() => expect(buttons).not.toBeNull());
    return view;
  };

  /** Click the PayPal button (creates the order) and then deliver the capture. */
  const clickPay = async (capture?: () => CapturedOrder) => {
    await act(async () => { await buttons.createOrder(); });
    captureOrder.mockImplementation((async () => (capture ? capture() : captured())) as any);
    await act(async () => { await buttons.onApprove({ orderID: 'ORDER1' }, {}); });
  };

  const employeeName = (store: any) => store.getState().employeeInfo.employeeFirstName;
  const rename = (store: any, name: string) =>
    act(() => { store.dispatch(saveEmployeeInfo({ employeeFirstName: name })); });

  it('sends a 64-hex fingerprint with the order', async () => {
    await openCheckout();
    await act(async () => { await buttons.createOrder(); });
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ items: expect.any(Array) }),
      expect.objectContaining({ termsVersion: expect.any(String) }),
      expect.stringMatching(/^[0-9a-f]{64}$/),
    );
  });

  it('unlocks Print and Download after payment', async () => {
    await openCheckout();
    expect(screen.queryByRole('button', { name: /print pay stub/i })).toBeNull();
    await clickPay();
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeTruthy();
    expect(screen.queryByText('Watermarked until payment')).toBeNull();
  });

  it('re-locks when a field changes after payment and shows the notice', async () => {
    const { store } = await openCheckout();
    await clickPay();
    await screen.findByRole('button', { name: /print pay stub/i });
    await rename(store, 'Changedname');
    expect(await screen.findByText(NOTICE_TITLE)).toBeTruthy();
    expect(screen.getByText(NOTICE_BODY)).toBeTruthy();
    expect(screen.getByText('Watermarked until payment')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /print pay stub/i })).toBeNull();
    expect(emit).toHaveBeenCalledWith(T.UNLOCK_CONTENT_MISMATCH, { orderId: 'ORDER1' });
  });

  it('unlocks again when the change is undone', async () => {
    const { store } = await openCheckout();
    const original = employeeName(store);
    await clickPay();
    await rename(store, 'Changedname');
    await screen.findByText(NOTICE_TITLE);
    await rename(store, original);
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    expect(screen.queryByText(NOTICE_TITLE)).toBeNull();
  });

  it('Restore my paid stub brings back the paid content and the buttons', async () => {
    const { store } = await openCheckout();
    const original = employeeName(store);
    await clickPay();
    await rename(store, 'Changedname');
    await userEvent.click(await screen.findByRole('button', { name: 'Restore my paid stub' }));
    expect(employeeName(store)).toBe(original);
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    expect(screen.queryByText(NOTICE_TITLE)).toBeNull();
    expect(emit).toHaveBeenCalledWith(T.UNLOCK_PAID_RESTORED, { orderId: 'ORDER1' });
    expect(JSON.parse(sessionStorage.getItem('paystubissa.unlock.v1') as string).released).toBe(false);
  });

  it('Restore brings back the paid stub after a field that was empty at payment was filled in', async () => {
    const { store } = await openCheckout();
    expect(store.getState().generalInfo.payStubCount).toBe(1);
    expect(store.getState().incomeDetails.stubOverrides).toBeUndefined();
    await clickPay();
    await screen.findByRole('button', { name: /print pay stub/i });
    act(() => {
      store.dispatch(saveGeneralInfo({ payStubCount: 3 }));
      store.dispatch(saveIncomeDetails({ stubOverrides: [{}, { overtimeHours: 5 }] }));
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Restore my paid stub' }));
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    expect(store.getState().generalInfo.payStubCount).toBe(1);
    expect(screen.queryByText(NOTICE_TITLE)).toBeNull();
  });

  it('an edit made between order creation and capture is not what was paid for', async () => {
    const { store } = await openCheckout();
    const original = employeeName(store);
    await act(async () => { await buttons.createOrder(); }); // the fingerprint is taken here
    await rename(store, 'Changedname');                      // edited while PayPal is open
    captureOrder.mockImplementation((async () => captured()) as any);
    await act(async () => { await buttons.onApprove({ orderID: 'ORDER1' }, {}); });

    expect(await screen.findByText(NOTICE_TITLE)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /print pay stub/i })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Restore my paid stub' }));
    expect(employeeName(store)).toBe(original);
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
  });

  it('still unlocks when sessionStorage refuses the write', async () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    try {
      await openCheckout();
      await clickPay();
      expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    } finally {
      setItem.mockRestore();
    }
  });

  it('uses the server fingerprint when the capture answer carries one', async () => {
    const { store } = await openCheckout();
    const fromServer = 'f'.repeat(64);
    await clickPay(() => captured({ fingerprint: fromServer }));
    expect(store.getState().appSettings.unlock?.fingerprint).toBe(fromServer);
    // It is not the fingerprint the salt produces, so the stub does not match.
    expect(await screen.findByText(NOTICE_TITLE)).toBeTruthy();
  });

  it('shows the final-once-paid line before payment', async () => {
    await openCheckout();
    expect(screen.getByText(FINAL_ONCE_PAID)).toBeTruthy();
    expect(FINAL_ONCE_PAID).toBe(
      'Pay stubs are final once paid. Check every detail now; a change after payment needs a new purchase.',
    );
  });

  it('dev unlock still enables Print with no unlock object', async () => {
    const { store } = renderReview('/create?dev=unlock');
    act(() => { store.dispatch(updateAppSettings({ canPrint: true })); });
    expect(await screen.findByRole('button', { name: /print pay stub/i })).toBeTruthy();
    expect(screen.queryByText(NOTICE_TITLE)).toBeNull();
  });

  it('does not show the mismatch notice for an unpaid stub', async () => {
    renderReview();
    await screen.findByRole('checkbox', { name: /terms of use/i });
    expect(screen.queryByText(NOTICE_TITLE)).toBeNull();
  });
});
