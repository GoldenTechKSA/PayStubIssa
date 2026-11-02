import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import ReviewStep from '../components/wizard/steps/ReviewStep';
import { paymentsApi, PaymentsApiError, type Cart, type Quote } from '../services/payments-api';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';
import { ATTESTATION_TEXT } from '../constants/business-info';

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

/**
 * The checkout box is the clickwrap: the one place the customer agrees to the Terms and attests
 * that the figures are real. Courts enforce terms a customer actively agreed to, not terms that
 * only sit behind a footer link, so the label has to name and link both documents, carry the
 * attestation quoted in the Terms, and keep payment hidden until the box is ticked.
 */
describe('Review step checkout agreement', () => {
  let quote: ReturnType<typeof jest.spyOn>;
  let getConfig: ReturnType<typeof jest.spyOn>;
  let emit: ReturnType<typeof jest.spyOn>;
  beforeEach(() => {
    quote = jest.spyOn(paymentsApi, 'quote').mockImplementation(async (cart: Cart) => fakeQuote(cart));
    // Ticking the box mounts the PayPal buttons; keep them from reaching for the network.
    getConfig = jest.spyOn(paymentsApi, 'getConfig').mockImplementation(async () => {
      throw new PaymentsApiError('offline', 'NETWORK', 0);
    });
    emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    window.scrollTo = jest.fn() as any;
    (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    sessionStorage.clear();
  });
  afterEach(() => { quote.mockRestore(); getConfig.mockRestore(); emit.mockRestore(); });

  const renderReview = () => renderWithApp(<ReviewStep onBack={() => {}} onEdit={() => {}} />);

  it('names and links the Terms and Privacy Policy and carries the accuracy attestation', async () => {
    renderReview();
    const box = await screen.findByRole('checkbox', { name: /terms of use and privacy policy/i });
    const label = box.closest('label') as HTMLElement;
    expect(label.textContent).toContain(
      `I have read and agree to the Terms of Use and Privacy Policy, and ${ATTESTATION_TEXT}`,
    );
    expect(screen.getByRole('link', { name: 'Terms of Use' }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe('/privacy');
  });

  it('withholds payment until the box is ticked, then records the agreement', async () => {
    renderReview();
    const box = await screen.findByRole('checkbox', { name: /terms of use/i });
    const gate = 'Confirm the statement above to continue to payment.';
    expect(screen.getByText(gate)).toBeTruthy();

    await userEvent.click(box);

    expect(screen.queryByText(gate)).toBeNull();
    expect(emit).toHaveBeenCalledWith(T.REVIEW_ATTESTED, { attested: true });
  });
});
