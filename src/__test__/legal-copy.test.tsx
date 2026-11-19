import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../theme/theme';
import { PriceProvider } from '../contexts/price-context';
import TermsOfUse from '../components/common/terms-of-use';
import FAQPage from '../components/common/faq-page';
import PrivacyPolicy from '../components/common/privacy-policy';
import { FINAL_ONCE_PAID, POLICIES_LAST_UPDATED, POLICIES_VERSION } from '../constants/business-info';

const textOf = (ui: React.ReactElement) => {
  const { container } = render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <PriceProvider stampedTiers={null} loadLive={() => new Promise(() => {})}>{ui}</PriceProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
  return (container.textContent ?? '').replace(/\s+/g, ' ');
};

describe('legal copy: a paid document is final, corrections come by code', () => {
  it('the Terms say a document is final once paid', () => {
    const t = textOf(<TermsOfUse />);
    expect(t).toMatch(/A document is final once paid/i);
    expect(t).toMatch(/the changed document is a new purchase/);
  });

  it('the Terms still promise a free corrected document and say how', () => {
    const t = textOf(<TermsOfUse />);
    expect(t).toMatch(/we will always give you a free corrected document/);
    expect(t).toMatch(/one-time correction code/);
    expect(t).not.toMatch(/Just tell us what was wrong/);
  });

  it('the FAQ no longer says to correct it and print again', () => {
    const t = textOf(<FAQPage />);
    expect(t).not.toMatch(/correct it and print again/);
    expect(t).toMatch(/we will send you a correction code so you can fix it and download it again free of charge/);
    expect(t).toMatch(/we will send you a one-time correction code/);
  });

  it('the FAQ repeats the final-once-paid sentence in the unlock answer', () => {
    expect(textOf(<FAQPage />)).toContain(FINAL_ONCE_PAID);
  });

  it('the FAQ says edits are free until you pay', () => {
    const t = textOf(<FAQPage />);
    expect(t).toMatch(/Edits are unlimited and free right up until you pay/);
    expect(t).toMatch(/Once you pay, the document is final\./);
    expect(t).not.toMatch(/right up until you download or print/);
  });

  it('the Privacy Policy describes the fingerprint and the paid copy in session storage', () => {
    const t = textOf(<PrivacyPolicy />);
    expect(t).toMatch(/one-way fingerprint of your document/);
    expect(t).toMatch(/cannot be turned back into its contents/);
    expect(t).toMatch(/which earlier order it corrects/);
    expect(t).toMatch(/and a copy of the paid document/);
    expect(t).toMatch(/cleared when the tab closes/);
  });

  it('the policy date and version moved together', () => {
    expect(POLICIES_LAST_UPDATED).toBe('November 18, 2026');
    expect(POLICIES_VERSION).toBe('2026-11-18');
  });
});
