import { describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../theme/theme';
import { PriceProvider, Price, usePrice, formatPrice } from '../contexts/price-context';
import HeroPage from '../components/common/hero-page';
import TermsOfUse from '../components/common/terms-of-use';

const Probe = () => {
  const { label, unitCents } = usePrice();
  return <div data-testid="probe">{label ?? 'unknown'}|{String(unitCents)}</div>;
};
const probe = () => screen.getByTestId('probe').textContent;
const never = () => new Promise<number>(() => {});

beforeEach(() => localStorage.clear());

describe('PriceProvider — stamped, then live', () => {
  it('shows the stamped price on the very first render, before the server answers', () => {
    render(<PriceProvider stampedCents={899} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe('$8.99|899');
  });

  it('swaps in the live server price when it differs from the stamp', async () => {
    render(<PriceProvider stampedCents={899} loadLive={() => Promise.resolve(1099)}><Probe /></PriceProvider>);
    await waitFor(() => expect(probe()).toBe('$10.99|1099'));
  });

  it('keeps the stamped price when the server cannot be reached', async () => {
    render(<PriceProvider stampedCents={899} loadLive={() => Promise.reject(new Error('down'))}><Probe /></PriceProvider>);
    await Promise.resolve();
    expect(probe()).toBe('$8.99|899');
  });

  it('ignores a live answer that is not a positive whole number of cents', async () => {
    render(<PriceProvider stampedCents={899} loadLive={() => Promise.resolve(0)}><Probe /></PriceProvider>);
    await Promise.resolve();
    expect(probe()).toBe('$8.99|899');
  });

  it('a returning visitor starts on the last live price, while the build stamp is unchanged', async () => {
    const first = render(<PriceProvider stampedCents={899} loadLive={() => Promise.resolve(1099)}><Probe /></PriceProvider>);
    await waitFor(() => expect(probe()).toBe('$10.99|1099'));
    first.unmount();

    const second = render(<PriceProvider stampedCents={899} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe('$10.99|1099');
    second.unmount();

    // A new deploy carries a newer stamp than that old visit: the remembered price is dropped.
    render(<PriceProvider stampedCents={1299} loadLive={never}><Probe /></PriceProvider>);
    expect(probe()).toBe('$12.99|1299');
  });

  it('reports no price, and <Price> prints its fallback, when there is no stamp and no answer', () => {
    render(
      <PriceProvider stampedCents={null} loadLive={never}>
        <Probe /><span data-testid="text"><Price fallback="one flat price" /></span>
      </PriceProvider>,
    );
    expect(probe()).toBe('unknown|null');
    expect(screen.getByTestId('text').textContent).toBe('one flat price');
  });

  it('formats cents as dollars', () => {
    expect(formatPrice(899)).toBe('$8.99');
    expect(formatPrice(1000)).toBe('$10.00');
  });
});

const renderPage = (ui: React.ReactElement, stampedCents: number | null) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <PriceProvider stampedCents={stampedCents} loadLive={never}>{ui}</PriceProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('home page price', () => {
  it('shows the server price in the badge beside the main button and in the pricing card', () => {
    renderPage(<HeroPage />, 1099);
    expect(screen.getByLabelText('$10.99 per pay stub, no subscription')).toBeTruthy();
    expect(screen.getAllByText('$10.99').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/\$10\.99 per stub, no subscription/)).toBeTruthy();
  });

  it('shows no number at all, rather than a guess, when the price is unknown', () => {
    const { container } = renderPage(<HeroPage />, null);
    expect(container.textContent).not.toMatch(/\$\d/);
    expect(screen.getByText(/Pay per stub, no subscription/)).toBeTruthy();
  });
});

describe('the price is set in one place only', () => {
  it('Terms of Use state no dollar price; they point to the price shown at checkout', () => {
    const { container } = renderPage(<TermsOfUse />, 899);
    const pricing = container.textContent!.split('8. Pricing, Payment, and Refunds')[1].split('Discount Codes')[0];
    expect(pricing).toMatch(/shown\s+to you at checkout before you pay/);
    expect(pricing).not.toMatch(/\$\d/);
  });

  it('no client source file hard-codes a price', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === '__test__' ? undefined : walk(full);
      if (!/\.(ts|tsx)$/.test(entry.name)) return;
      const text = fs.readFileSync(full, 'utf8');
      if (/UNIT_PRICE|\b8\.99\b/.test(text)) offenders.push(path.relative(process.cwd(), full));
    });
    walk(path.resolve(__dirname, '..'));
    expect(offenders).toEqual([]);
    expect(fs.readFileSync(path.resolve(__dirname, '../../public/index.html'), 'utf8')).not.toMatch(/\$\d/);
  });
});
