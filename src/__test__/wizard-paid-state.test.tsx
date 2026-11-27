import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import PaystubWizard from '../components/wizard/PaystubWizard';
import { paymentsApi, PaymentsApiError, type Cart, type Quote, type Unlock } from '../services/payments-api';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';
import { createAppStore } from '../redux/store';
import { contentOf, fingerprintOf, newSalt, type PaidSnapshot } from '../utils/paid-lock';

// These tests render the whole wizard and click through it. On the deploy runner the longest
// one ("Make another pay stub reopens editing…") ran past Jest's default 5 s twice on
// 2026-11-27 and blocked a deploy, while passing in ~1–2 s locally. The limit is raised for
// this file only; a real hang still fails, just later.
jest.setTimeout(20000);

const DRAFT_KEY = 'paystubissa.draft.v1';
const UNLOCK_KEY = 'paystubissa.unlock.v1';
const SIMPLE = '/configs/template-simple/paystub-config.xml';
const MODERN = '/configs/template-modern/paystub-config.xml';

function fakeQuote(cart: Cart): Quote {
  const qty = cart.items.reduce((n, i) => n + i.qty, 0);
  return {
    currency: 'USD',
    lines: [{ type: 'paystub', description: 'Pay stub', qty, unitCents: 100, subtotalCents: 100 * qty }],
    discounts: [],
    subtotalCents: 100 * qty,
    discountCents: 0,
    totalCents: 100 * qty,
  };
}

const expiresAt = () => new Date(Date.now() + 3600_000).toISOString();

/** The content the customer paid for: the store's seed with a chosen template and a known name. */
function paidContent(configPath = SIMPLE, templateId: number | string = 0, firstName = 'Paidname'): PaidSnapshot {
  const state = createAppStore().getState() as any;
  return contentOf({
    ...state,
    employeeInfo: { ...state.employeeInfo, employeeFirstName: firstName },
    appSettings: { ...state.appSettings, configPath, templateId },
  });
}

/** A stored unlock with its fingerprint, salt and snapshot, as the payment flow writes it. */
function paidUnlock(snapshot: PaidSnapshot, extra: Partial<Unlock> = {}): Unlock {
  const salt = newSalt();
  return {
    token: 'tok', orderId: 'ORDER1', expiresAt: expiresAt(), qty: 1,
    fingerprint: fingerprintOf(snapshot, salt), salt, snapshot, released: false,
    ...extra,
  };
}

const storeUnlock = (u: Unlock) => sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(u));
const storedUnlock = (): Unlock | null => {
  const raw = sessionStorage.getItem(UNLOCK_KEY);
  return raw ? JSON.parse(raw) : null;
};

const PRINT = /print (pay stub|\d+ pay stubs)/i;
const RESTORE_FAILED = 'We could not confirm your payment just now. You do not need to pay again.';
const stepLabel = (name: string) => screen.getByText(name, { selector: '.MuiStepLabel-label' });
/** The cursor over a stepper label; its `sx` sits on the StepLabel root around the text. */
const stepCursor = (name: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  window.getComputedStyle(stepLabel(name).closest('.MuiStepLabel-root') as Element).cursor;
const editButtons = () => screen.queryAllByRole('button', { name: 'Edit' });

describe('wizard paid state', () => {
  let emit: any;
  let verify: any;
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.scrollTo = jest.fn() as any;
    (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    // The preview's template XML is not under test; keep its request from hitting the network.
    originalFetch = window.fetch;
    window.fetch = (() => new Promise(() => {})) as any;
    emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    verify = jest.spyOn(paymentsApi, 'verifyUnlock');
    jest.spyOn(paymentsApi, 'quote').mockImplementation(async (cart: Cart) => fakeQuote(cart));
    jest.spyOn(paymentsApi, 'getConfig').mockImplementation(async () => ({
      paypalEnv: 'sandbox', clientId: 'x', currency: 'USD', unitCents: { paystub: 100 }, maxQty: 12,
    }));
  });
  afterEach(() => {
    window.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  /** verifyUnlock answers for the token with what the server holds for the order. */
  const verifyAnswers = (u: Unlock, fingerprint: string | undefined = u.fingerprint) =>
    verify.mockImplementation(async () => ({
      valid: true, orderId: u.orderId, qty: u.qty, expiresAt: u.expiresAt, ...(fingerprint ? { fingerprint } : {}),
    }));

  const open = (route = '/create') => renderWithApp(<PaystubWizard />, { route });

  /** Reload with a paid, unreleased stub on file and wait for the paid Review step. */
  const openPaid = async (snapshot = paidContent()) => {
    const u = paidUnlock(snapshot);
    storeUnlock(u);
    verifyAnswers(u);
    const view = open();
    await screen.findByRole('button', { name: PRINT });
    return { ...view, unlock: u };
  };

  it('opens on Review in the paid state after a reload', async () => {
    const { store } = await openPaid();
    expect(screen.getByText('Payment complete: your pay stub is ready.')).toBeTruthy();
    expect(screen.getByText(
      'This is your final document. Save the PDF now; it stays available in this browser tab for about an hour.',
    )).toBeTruthy();
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Make another pay stub' })).toBeTruthy();
    expect(editButtons()).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(store.getState().employeeInfo.employeeFirstName).toBe('Paidname');
    expect(store.getState().appSettings.canPrint).toBe(true);
    expect(emit).toHaveBeenCalledWith(T.UNLOCK_RESTORED, { orderId: 'ORDER1' });
  });

  it('shows a progress bar instead of the step while the token is checked', async () => {
    const u = paidUnlock(paidContent());
    storeUnlock(u);
    let answer: (v: any) => void = () => {};
    verify.mockImplementation(() => new Promise(resolve => { answer = resolve; }));
    open();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText('Company information')).toBeNull();
    answer({ valid: true, orderId: u.orderId, qty: u.qty, expiresAt: u.expiresAt, fingerprint: u.fingerprint });
    expect(await screen.findByRole('button', { name: PRINT })).toBeTruthy();
  });

  it('restores the paid template, not the default one', async () => {
    const { store } = await openPaid(paidContent(MODERN, 3));
    expect(store.getState().appSettings.configPath).toBe(MODERN);
    expect(store.getState().appSettings.templateId).toBe(3);
  });

  it('keeps the template of an unpaid draft across a reload', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ template: { configPath: MODERN, templateId: 3 } }));
    const { store } = open();
    expect(store.getState().appSettings.configPath).toBe(MODERN);
    expect(store.getState().appSettings.templateId).toBe(3);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(DRAFT_KEY) as string).template).toEqual({ configPath: MODERN, templateId: 3 }));
  });

  it('a rejected token clears the unlock and starts at step 1', async () => {
    storeUnlock(paidUnlock(paidContent()));
    verify.mockImplementation(async () => { throw new PaymentsApiError('Invalid token', 'INVALID_TOKEN', 401); });
    const { store } = open();
    expect(await screen.findByText('Company information')).toBeTruthy();
    expect(sessionStorage.getItem(UNLOCK_KEY)).toBeNull();
    expect(store.getState().appSettings.unlock).toBeUndefined();
  });

  it('a network failure keeps the stored unlock, says so on every step, offers no payment, and can retry', async () => {
    const u = paidUnlock(paidContent());
    storeUnlock(u);
    verify.mockImplementation(async () => { throw new PaymentsApiError('Offline', 'NETWORK', 0); });
    const { store } = open();
    expect(await screen.findByText('Company information')).toBeTruthy();
    expect(screen.getByText(RESTORE_FAILED)).toBeTruthy();
    expect(storedUnlock()?.token).toBe('tok');
    expect(store.getState().appSettings.unlock).toBeUndefined();
    expect(screen.queryByRole('button', { name: PRINT })).toBeNull();

    // Walk to Review: the notice stays, and no way to pay is offered.
    for (const next of ['Continue', 'Continue', 'Continue', 'Choose a template', 'Continue to review']) {
      await userEvent.click(await screen.findByRole('button', { name: next }));
      expect(screen.getByText(RESTORE_FAILED)).toBeTruthy();
    }
    expect(await screen.findByText('Review & finalize')).toBeTruthy();
    expect(screen.getByText(RESTORE_FAILED)).toBeTruthy();
    await userEvent.click(screen.getByRole('checkbox', { name: /terms of use/i }));
    expect(screen.queryByText(/secure checkout via paypal/i)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Get my corrected pay stub' })).toBeNull();
    expect(screen.queryByText('Pay to unlock')).toBeTruthy();

    // Try again: this time the server answers, and the paid stub comes back.
    verifyAnswers(u);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: PRINT })).toBeTruthy();
    expect(screen.queryByText(RESTORE_FAILED)).toBeNull();
    expect(store.getState().employeeInfo.employeeFirstName).toBe('Paidname');
    expect(store.getState().appSettings.unlock?.orderId).toBe('ORDER1');
  });

  it('Try again after a failed check clears the notice when the server rejects the token', async () => {
    storeUnlock(paidUnlock(paidContent()));
    verify.mockImplementation(async () => { throw new PaymentsApiError('Offline', 'NETWORK', 0); });
    const { store } = open();
    expect(await screen.findByText(RESTORE_FAILED)).toBeTruthy();
    verify.mockImplementation(async () => { throw new PaymentsApiError('Invalid token', 'INVALID_TOKEN', 401); });
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByText(RESTORE_FAILED)).toBeNull());
    expect(sessionStorage.getItem(UNLOCK_KEY)).toBeNull();
    expect(store.getState().appSettings.unlock).toBeUndefined();
    expect(screen.getByText('Company information')).toBeTruthy();
  });

  it('does not pull a released customer back to Review', async () => {
    // Content equal to the store's seed, so the stub matches; released, so nothing is frozen.
    const u = paidUnlock(paidContent(SIMPLE, 0, createAppStore().getState().employeeInfo.employeeFirstName), { released: true });
    storeUnlock(u);
    verifyAnswers(u);
    const { store } = open();
    await waitFor(() => expect(store.getState().appSettings.unlock?.orderId).toBe('ORDER1'));
    expect(screen.getByText('Company information')).toBeTruthy();
    expect(screen.queryByRole('button', { name: PRINT })).toBeNull();
    expect(emit).not.toHaveBeenCalledWith(T.UNLOCK_RESTORED, expect.anything());
  });

  it('while paid, the stepper and Back do not navigate', async () => {
    await openPaid();
    expect(stepCursor('Company')).toBe('default');
    await userEvent.click(stepLabel('Company'));
    await userEvent.click(stepLabel('Earnings'));
    expect(screen.getByRole('button', { name: PRINT })).toBeTruthy();
    expect(screen.queryByText('Company information')).toBeNull();
    expect(emit).not.toHaveBeenCalledWith(T.WIZARD_STEP_JUMPED, expect.anything());
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(screen.queryByText('Start over from Company')).toBeNull();
  });

  it('Make another pay stub reopens editing after confirmation', async () => {
    const { store } = await openPaid();
    await userEvent.click(screen.getByRole('button', { name: 'Make another pay stub' }));
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByText('Make another pay stub?')).toBeTruthy();
    expect(screen.getByText(
      'Your details stay filled in so you can change them. A changed pay stub needs a new purchase. You can come back to the one you just bought for as long as it is available in this tab.',
    )).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    expect(editButtons()).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    // Nothing changed yet, so the paid stub can still be printed.
    expect(screen.getByRole('button', { name: PRINT })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Make another pay stub' })).toBeNull();
    expect(storedUnlock()?.released).toBe(true);
    expect(store.getState().appSettings.unlock?.released).toBe(true);
    expect(emit).toHaveBeenCalledWith(T.UNLOCK_RELEASED, { orderId: 'ORDER1' });
    expect(stepCursor('Company')).toBe('pointer');

    await userEvent.click(editButtons()[0]);
    expect(await screen.findByText('Company information')).toBeTruthy();
  });

  it('Cancel in the dialog changes nothing', async () => {
    const { store } = await openPaid();
    await userEvent.click(screen.getByRole('button', { name: 'Make another pay stub' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    expect(editButtons()).toHaveLength(0);
    expect(storedUnlock()?.released).toBe(false);
    expect(store.getState().appSettings.unlock?.released).toBe(false);
    expect(emit).not.toHaveBeenCalledWith(T.UNLOCK_RELEASED, expect.anything());
  });

  it('an unlock stored by an older build still unlocks by quantity', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ generalInfo: { payStubCount: 2 } }));
    const u: Unlock = { token: 'tok', orderId: 'OLD1', expiresAt: expiresAt(), qty: 2 };
    storeUnlock(u);
    verifyAnswers(u, undefined);
    open();
    expect(await screen.findByRole('button', { name: /print 2 pay stubs/i })).toBeTruthy();
    expect(screen.getByText('Payment complete: your 2 pay stubs are ready.')).toBeTruthy();
  });

  it('a stored unlock whose fingerprint was deleted is still held to the server\'s fingerprint', async () => {
    const full = paidUnlock(paidContent());
    const { fingerprint, salt, ...stripped } = full;
    storeUnlock(stripped);
    verifyAnswers(full, fingerprint);
    const { store } = open();
    expect(await screen.findByText('This is not the pay stub you paid for')).toBeTruthy();
    expect(screen.queryByRole('button', { name: PRINT })).toBeNull();
    expect(store.getState().appSettings.unlock?.fingerprint).toBe(fingerprint);
    expect(storedUnlock()?.fingerprint).toBe(fingerprint);
    expect(salt).toBeTruthy();
  });

  it('?dev=unlock is not frozen', async () => {
    const u = paidUnlock(paidContent());
    storeUnlock(u);
    verifyAnswers(u);
    open('/create?dev=unlock');
    expect(await screen.findByRole('button', { name: PRINT })).toBeTruthy();
    await waitFor(() => expect(verify).toHaveBeenCalled());
    await screen.findByText('Payment complete: your pay stub is ready.');
    expect(editButtons()).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });
});
