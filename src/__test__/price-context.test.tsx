import { describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../theme/theme';
import { PriceProvider, Price, usePrice, formatPrice, type PriceTier } from '../contexts/price-context';
import HeroPage from '../components/common/hero-page';
import TermsOfUse from '../components/common/terms-of-use';
import FAQPage from '../components/common/faq-page';
import AboutUsPage from '../components/common/about-us-page';

const TIERS: PriceTier[] = [
  { minQty: 1, maxQty: 1, unitCents: 899 },
  { minQty: 2, maxQty: 4, unitCents: 799 },
  { minQty: 5, maxQty: 8, unitCents: 699 },
  { minQty: 9, maxQty: 12, unitCents: 599 },
];
const DEARER: PriceTier[] = TIERS.map(t => ({ ...t, unitCents: t.unitCents + 200 }));

const Probe = () => {
  const { label, unitCents, fromLabel, fromCents, tiers, priceFor } = usePrice();
  return (
    <div data-testid="probe">
      {label ?? 'unknown'}|{String(unitCents)}|{fromLabel ?? 'unknown'}|{String(fromCents)}|{tiers.length}|
      {[1, 4, 5, 8, 9, 12, 0, 13].map(q => String(priceFor(q))).join(',')}
    </div>
  );
};
const probe = () => screen.getByTestId('probe').textContent!.replace(/\s+/g, '');
const never = () => new Promise<PriceTier[]>(() => {});
const KNOWN = '$8.99|899|$5.99|599|4|899,799,699,699,599,599,899,599';
const LIVE = '$10.99|1099|$7.99|799|4|1099,999,899,899,799,799,1099,799';
const flush = async () => { await act(async () => { await Promise.resolve(); }); };

beforeEach(() => localStorage.clear());

describe('PriceProvider — stamped, then live', () => {
  it('shows the stamped prices on the very first render, before the server answers', () => {
    render(<PriceProvider stampedTiers={TIERS} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe(KNOWN);
  });

  it('swaps in the live server prices when they differ from the stamp', async () => {
    render(<PriceProvider stampedTiers={TIERS} loadLive={() => Promise.resolve(DEARER)}><Probe /></PriceProvider>);
    await waitFor(() => expect(probe()).toBe(LIVE));
  });

  it('keeps the stamped prices when the server cannot be reached', async () => {
    render(<PriceProvider stampedTiers={TIERS} loadLive={() => Promise.reject(new Error('down'))}><Probe /></PriceProvider>);
    await flush();
    expect(probe()).toBe(KNOWN);
  });

  it.each([
    ['an empty table', []],
    ['no table at all (an API older than the tiers)', undefined],
    ['fractional cents', [{ minQty: 1, maxQty: 12, unitCents: 8.99 }]],
    ['a table that does not start at one stub', [{ minQty: 2, maxQty: 12, unitCents: 799 }]],
    ['ranges with a gap', [{ minQty: 1, maxQty: 1, unitCents: 899 }, { minQty: 3, maxQty: 12, unitCents: 799 }]],
  ])('ignores a live answer with %s', async (_what, answer) => {
    render(<PriceProvider stampedTiers={TIERS} loadLive={() => Promise.resolve(answer as any)}><Probe /></PriceProvider>);
    await flush();
    expect(probe()).toBe(KNOWN);
  });

  it('a returning visitor starts on the last live prices, while the build stamp is unchanged', async () => {
    const first = render(<PriceProvider stampedTiers={TIERS} loadLive={() => Promise.resolve(DEARER)}><Probe /></PriceProvider>);
    await waitFor(() => expect(probe()).toBe(LIVE));
    first.unmount();

    const second = render(<PriceProvider stampedTiers={TIERS} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe(LIVE);
    second.unmount();

    // A new deploy carries a newer stamp than that old visit: the remembered prices are dropped.
    const newer = TIERS.map(t => ({ ...t, unitCents: t.unitCents + 100 }));
    render(<PriceProvider stampedTiers={newer} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe('$9.99|999|$6.99|699|4|999,899,799,799,699,699,999,699');
  });

  it('ignores what an older build or a broken write left in storage', () => {
    localStorage.setItem('paystubissa.price.v1', JSON.stringify({ cents: 100, stamp: 899 }));
    localStorage.setItem('paystubissa.price.v2', '{not json');
    const a = render(<PriceProvider stampedTiers={TIERS} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe(KNOWN);
    a.unmount();

    localStorage.setItem('paystubissa.price.v2', JSON.stringify({ stamp: JSON.stringify(TIERS), tiers: [{ minQty: 1 }] }));
    render(<PriceProvider stampedTiers={TIERS} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe(KNOWN);
  });

  it('reports no price, and <Price> prints its fallback, when there is no stamp and no answer', () => {
    render(
      <PriceProvider stampedTiers={null} loadLive={never}>
        <Probe />
        <span data-testid="text"><Price fallback="one flat price" /></span>
        <span data-testid="from"><Price from fallback="less" /></span>
      </PriceProvider>,
    );
    expect(probe()).toBe('unknown|null|unknown|null|0|null,null,null,null,null,null,null,null');
    expect(screen.getByTestId('text').textContent).toBe('one flat price');
    expect(screen.getByTestId('from').textContent).toBe('less');
  });

  it('<Price> prints the single-stub price, <Price from> the lowest per-stub price', () => {
    render(
      <PriceProvider stampedTiers={TIERS} loadLive={never}>
        <span data-testid="text"><Price /></span><span data-testid="from"><Price from /></span>
      </PriceProvider>,
    );
    expect(screen.getByTestId('text').textContent).toBe('$8.99');
    expect(screen.getByTestId('from').textContent).toBe('$5.99');
  });

  it('formats cents as dollars', () => {
    expect(formatPrice(899)).toBe('$8.99');
    expect(formatPrice(1000)).toBe('$10.00');
  });
});

const renderPage = (ui: React.ReactElement, stampedTiers: PriceTier[] | null) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <PriceProvider stampedTiers={stampedTiers} loadLive={never}>{ui}</PriceProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('home page price', () => {
  it('shows the server price in the badge beside the main button and in the pricing card', () => {
    renderPage(<HeroPage />, DEARER);
    expect(screen.getByLabelText('$10.99 per pay stub, no subscription')).toBeTruthy();
    expect(screen.getAllByText('$10.99').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the single-stub price up front and says bundles cost less', () => {
    renderPage(<HeroPage />, TIERS);
    expect(screen.getByLabelText('$8.99 per pay stub, no subscription')).toBeTruthy();
    expect(screen.getByText(/\$8\.99 for one stub, less each when you bundle/)).toBeTruthy();
    expect(screen.getByText(/from \$5\.99 each/)).toBeTruthy();
  });

  it('offers an orange "Bundle and Save" way to the Offers page, by the main button and in the pricing card', () => {
    renderPage(<HeroPage />, TIERS);
    const links = screen.getAllByRole('link', { name: 'Bundle and Save' });
    expect(links).toHaveLength(2);
    links.forEach(a => expect(a.getAttribute('href')).toBe('/offers'));
  });

  it('shows no number at all, rather than a guess, when the price is unknown', () => {
    const { container } = renderPage(<HeroPage />, null);
    expect(container.textContent).not.toMatch(/\$\d/);
    expect(screen.getByText(/Pay per stub, no subscription/)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Bundle and Save' })).toHaveLength(2);
  });
});

describe('FAQ and About — prices follow the tier table', () => {
  it('works the four-stub example at the price four stubs are really charged', () => {
    const { container } = renderPage(<FAQPage />, TIERS);
    const text = container.textContent!;
    expect(text).toMatch(/\$7\.99 × 4 = \$31\.96/);
    expect(text).not.toMatch(/\$8\.99 × 4/);
    expect(text).not.toMatch(/flat price/i);
  });

  it('FAQ and About name no number when prices are unknown, and never call the price flat', () => {
    const faq = renderPage(<FAQPage />, null);
    expect(faq.container.textContent).not.toMatch(/\$\d/);
    expect(faq.container.textContent).not.toMatch(/flat price/i);
    faq.unmount();
    const about = renderPage(<AboutUsPage />, null);
    expect(about.container.textContent).not.toMatch(/flat price/i);
  });

  it('About states the single-stub price and that bundles cost less', () => {
    const { container } = renderPage(<AboutUsPage />, TIERS);
    expect(container.textContent).toMatch(/\$8\.99 for one pay stub, less per stub when you order more/);
  });
});

describe('the price is set in one place only', () => {
  it('Terms of Use state no dollar price; they point to the price shown at checkout', () => {
    const { container } = renderPage(<TermsOfUse />, TIERS);
    const pricing = container.textContent!.split('8. Pricing, Payment, and Refunds')[1].split('Discount Codes')[0];
    expect(pricing).toMatch(/shown\s+to you at checkout before you pay/);
    expect(pricing).toMatch(/The price per pay stub depends on how many pay stubs are in your order\./);
    expect(pricing).not.toMatch(/each charged at that per-stub price/);
    expect(pricing).not.toMatch(/\$\d/);
  });

  it('no client source file hard-codes a price', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === '__test__' ? undefined : walk(full);
      if (!/\.(ts|tsx)$/.test(entry.name)) return;
      const text = fs.readFileSync(full, 'utf8');
      if (/UNIT_PRICE|\$\d+\.\d{2}/.test(text)) offenders.push(path.relative(process.cwd(), full));
    });
    walk(path.resolve(__dirname, '..'));
    expect(offenders).toEqual([]);
    expect(fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf8')).not.toMatch(/\$\d/);
  });
});
