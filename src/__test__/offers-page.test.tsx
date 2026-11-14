import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../theme/theme';
import { PriceProvider, type PriceTier } from '../contexts/price-context';
import OffersPage from '../components/common/offers-page';
import { BundleButton } from '../components/common/price-copy';
import userEvent from '@testing-library/user-event';
import { decomposeColor, getContrastRatio } from '@mui/material/styles';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';

/** Any CSS colour as "r,g,b", so a hex token and a computed rgb() can be compared. */
const rgb = (c: string) => decomposeColor(c).values.slice(0, 3).join(',');
const contrast = (a: string, b: string) => getContrastRatio(a, b);

const TIERS: PriceTier[] = [
  { minQty: 1, maxQty: 1, unitCents: 899 },
  { minQty: 2, maxQty: 4, unitCents: 799 },
  { minQty: 5, maxQty: 8, unitCents: 699 },
  { minQty: 9, maxQty: 12, unitCents: 599 },
];
const never = () => new Promise<PriceTier[]>(() => {});

const renderOffers = (stampedTiers: PriceTier[] | null) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <PriceProvider stampedTiers={stampedTiers} loadLive={never}><OffersPage /></PriceProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );

/** The cards in page order, each as a scoped query object. */
const cards = () => screen.getAllByTestId('offer-card').map(el => ({ el, q: within(el), text: el.textContent || '' }));
const NAMES = ['Single Stub', 'Starter Pack', 'Quarter Pack', 'Full Run'];

beforeEach(() => localStorage.clear());

describe('Offers page', () => {
  it('carries the heading and subtitle the owner chose', () => {
    renderOffers(TIERS);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Our Great Offers!');
    expect(screen.getByText('Select the best fit for you')).toBeTruthy();
  });

  it('shows one named card per tier, with the range and per-stub price from the server table', () => {
    renderOffers(TIERS);
    const list = cards();
    expect(list.map(c => c.q.getByRole('heading', { level: 2 }).textContent)).toEqual(NAMES);
    expect(list.map(c => c.q.getByTestId('offer-range').textContent)).toEqual([
      '1 pay stub', '2–4 pay stubs', '5–8 pay stubs', '9–12 pay stubs',
    ]);
    expect(list.map(c => c.q.getByTestId('offer-price').textContent)).toEqual([
      '$8.99/each', '$7.99/each', '$6.99/each', '$5.99/each',
    ]);
  });

  it('states the saving against the single-stub price on every bundle, and none on the single stub', () => {
    renderOffers(TIERS);
    const list = cards();
    expect(list[0].text).not.toMatch(/Save/);
    expect(list[1].q.getByText('Save $1.00 per stub')).toBeTruthy();
    expect(list[2].q.getByText('Save $2.00 per stub')).toBeTruthy();
    expect(list[3].q.getByText('Save $3.00 per stub')).toBeTruthy();
  });

  it('marks only the lowest per-stub tier as best value', () => {
    renderOffers(TIERS);
    expect(screen.getAllByText('Best value')).toHaveLength(1);
    expect(cards()[3].q.getByText('Best value')).toBeTruthy();
  });

  it('every card button opens the wizard with that tier\'s lowest stub count', () => {
    renderOffers(TIERS);
    const links = screen.getAllByRole('link', { name: /Make yours now!/ });
    expect(links.map(a => a.getAttribute('href'))).toEqual([
      '/create?stubs=1', '/create?stubs=2', '/create?stubs=5', '/create?stubs=9',
    ]);
  });

  it('follows a price change on the server without a code change', () => {
    renderOffers(TIERS.map(t => ({ ...t, unitCents: t.unitCents + 100 })));
    expect(cards().map(c => c.q.getByTestId('offer-price').textContent)).toEqual([
      '$9.99/each', '$8.99/each', '$7.99/each', '$6.99/each',
    ]);
  });

  it('drops the named cards for plain ones when the server\'s quantity ranges are different', () => {
    renderOffers([
      { minQty: 1, maxQty: 2, unitCents: 899 },
      { minQty: 3, maxQty: 12, unitCents: 799 },
    ]);
    const list = cards();
    expect(list.map(c => c.q.getByRole('heading', { level: 2 }).textContent)).toEqual(['1–2 Pay Stubs', '3–12 Pay Stubs']);
    NAMES.forEach(name => expect(screen.queryByText(name)).toBeNull());
    expect(list.map(c => c.q.getByTestId('offer-price').textContent)).toEqual(['$8.99/each', '$7.99/each']);
    expect(list[1].q.getByText('Best value')).toBeTruthy();
    expect(list[1].q.getByText('Save $1.00 per stub')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Make yours now!/ }).map(a => a.getAttribute('href')))
      .toEqual(['/create?stubs=1', '/create?stubs=3']);
  });

  it('shows the four cards without any number, never a guess, when prices are unknown', () => {
    const { container } = renderOffers(null);
    expect(cards().map(c => c.q.getByRole('heading', { level: 2 }).textContent)).toEqual(NAMES);
    expect(container.textContent).not.toMatch(/\$\d/);
    expect(screen.queryByText(/Save/)).toBeNull();
    expect(screen.getAllByRole('link', { name: /Make yours now!/ })).toHaveLength(4);
  });

  it('makes no claim the site cannot back', () => {
    const { container } = renderOffers(TIERS);
    expect(container.textContent).not.toMatch(/authentic|realistic|sent to you|proof of income/i);
  });

  it('describes the Starter Pack in words that hold for every pay frequency', () => {
    renderOffers(TIERS);
    // Two to four stubs are a month or two only on a bi-weekly or semi-monthly schedule.
    expect(cards()[1].text).not.toMatch(/month/i);
  });

  it('prints its green text and green controls in the darker green that passes contrast', () => {
    renderOffers(TIERS);
    const best = cards()[3];
    const dark = rgb(theme.palette.success.dark);
    expect(rgb(getComputedStyle(best.q.getByText('Save $3.00 per stub')).color)).toBe(dark);
    expect(rgb(getComputedStyle(best.q.getByText('Best value').parentElement!).backgroundColor)).toBe(dark);
    expect(rgb(getComputedStyle(best.q.getByRole('link', { name: /Make yours now!/ })).backgroundColor)).toBe(dark);
    // WCAG AA for normal-size text is 4.5:1.
    expect(contrast(theme.palette.success.dark, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('reports a "Bundle and Save" click with where the button sits', async () => {
    const emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter><BundleButton placement="pricing_card" /></MemoryRouter>
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Bundle and Save' }));
    expect(emit).toHaveBeenCalledWith(T.OFFERS_BUNDLE_CLICKED, { placement: 'pricing_card' });
    emit.mockRestore();
  });
});
