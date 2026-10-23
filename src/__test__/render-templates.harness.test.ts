/**
 * Render harness, not a real test. Skipped unless RENDER_DIR is set.
 *
 * Renders each template (or just RENDER_TEMPLATE) with the dev seed data to a standalone
 * HTML page that carries the same body typography (MUI CssBaseline), print rules
 * (wizard/print.css) and @page size the app uses. scripts/snapshot-templates.js then
 * opens those pages in headless Chrome for a screenshot and a PDF page count.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadPaystubConfig } from '../templates/components/paystub/xmlParser';
import { PaystubRenderer } from '../templates/components/PaystubRenderer';
import { buildPaystubModels } from '../templates/utils/buildPaystubModel';
import { initialState } from '../assets/data/initial-state';
import type { PayStubDetails } from '../assets/data/pay-stub-details';

/**
 * Realistic sample. The dev seed (initial-state.ts) has every income field at zero, which
 * hides column-width and wrapping problems, so the harness fills in a typical bi-weekly
 * hourly employee in a state with income tax.
 */
const SAMPLE: PayStubDetails = {
  ...initialState,
  companyInfo: { ...initialState.companyInfo, companyState: 'California', companyCity: 'Los Angeles', companyZipCode: '90016' },
  employeeInfo: { ...initialState.employeeInfo, employeeState: 'California', employeeCity: 'Los Angeles', employeeZipCode: '90016' },
  incomeDetails: {
    ...initialState.incomeDetails,
    wageType: 'Hourly',
    hourlyRate: 32.5,
    hoursWorked: 80,
    overtimeRate: 48.75,
    overtimeHours: 6,
    bonusAmount: 250,
    deduction401k: 150,
    medicalDeduction: 120.5,
    dentalDeduction: 25,
    visionDeduction: 10,
    otherDeduction: 0,
    periodType: 'Bi-Weekly',
    periodStartDate: new Date('2025-09-28T00:00:00'),
    periodEndDate: new Date('2025-10-11T00:00:00'),
    periodPayDate: new Date('2025-10-17T00:00:00'),
  },
  generalInfo: { ...initialState.generalInfo, payStubCount: 1, payStubNumber: 1024, checkNumber: 5001 },
};

const ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUT = process.env.RENDER_DIR;
const ONLY = process.env.RENDER_TEMPLATE;

const templates: { configFile: string; title: string }[] = JSON.parse(
  fs.readFileSync(path.join(PUBLIC_DIR, 'configs/template-configs.json'), 'utf8')
).filter((t: { configFile: string }) => !ONLY || t.configFile.includes(`/${ONLY}/`));

beforeAll(() => {
  (globalThis as any).fetch = async (url: string) => {
    const { pathname } = new URL(url, 'http://localhost/');
    const file = path.join(PUBLIC_DIR, decodeURIComponent(pathname));
    if (!fs.existsSync(file)) return { ok: false, status: 404, statusText: 'Not Found', text: async () => '' };
    return { ok: true, status: 200, statusText: 'OK', text: async () => fs.readFileSync(file, 'utf8') };
  };
});

/** A standalone page. `body` is the full body markup — the stub test passes #pdf-content itself,
 *  the review-shell test passes the Review step's whole ancestor chain around it. */
const page = (title: string, body: string, printCss: string, extraCss = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
/* What the app gives the stub: MUI CssBaseline + theme typography (src/theme/theme.ts). */
html { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
*, *::before, *::after { box-sizing: inherit; }
body { margin: 0; padding: 0; background: #fff; color: #0F172A;
  font-family: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 1rem; font-weight: 400; line-height: 1.5; letter-spacing: 0.00938em; }
/* The printable area: Letter minus the 0.5in margins = 7.5in x 10in = 720 x 960 px. */
@page { margin: 0.5in; size: letter; }
@media screen {
  body { width: 720px; margin: 0 auto; position: relative; min-height: 1000px; }
  .page-guide { position: absolute; top: 960px; left: 0; width: 720px; border-top: 2px dashed #DC2626; color: #DC2626; font: 11px/1 monospace; padding-top: 2px; }
}
@media print { .page-guide { display: none; } }
${extraCss}
${printCss}
</style></head>
<body class="print-paystub print-paystub-single">
${body}
<div class="page-guide">page bottom (960px) - anything below this prints on a second sheet</div>
</body></html>
`;

describe('render harness', () => {
  if (!OUT) {
    it('is skipped without RENDER_DIR', () => expect(true).toBe(true));
    return;
  }
  const printCss = fs.readFileSync(path.join(ROOT, 'src/components/wizard/print.css'), 'utf8');
  fs.mkdirSync(OUT, { recursive: true });

  it.each(templates.map(t => [t.configFile, t.title]))('%s renders', async (configFile, title) => {
    const config = await loadPaystubConfig(configFile);
    const model = buildPaystubModels(SAMPLE)[0];
    const stub = renderToStaticMarkup(
      React.createElement('div', { className: 'paystub-page' },
        React.createElement(PaystubRenderer, { config, data: model }))
    );
    const name = configFile.split('/')[2];
    fs.writeFileSync(path.join(OUT, `${name}.html`), page(title, `<div id="pdf-content">${stub}</div>`, printCss));
  });

  /**
   * The stub inside the Review step's ancestor chain, with the body classes handlePrint adds.
   * print.css hides the rest of the review page with `visibility`, which keeps it IN LAYOUT:
   * before #App was collapsed in print, this printed the stub and then the blank sheets the
   * hidden summary column and shell still paginated to. Inline styles stand in for the MUI
   * `sx` values of PaystubWizard / ReviewStep / FitPage; keep them in step when those change.
   */
  it('review-shell renders', async () => {
    const t = templates[0];
    if (!t) return;
    const config = await loadPaystubConfig(t.configFile);
    const model = buildPaystubModels(SAMPLE)[0];
    const stub = renderToStaticMarkup(
      React.createElement('div', { className: 'paystub-page' },
        React.createElement(PaystubRenderer, { config, data: model }))
    );
    const shell = `<div id="App"><div class="app-root">
<header class="no-print" style="height:64px;border-bottom:1px solid #ccc">header</header>
<main class="app-main"><div style="max-width:1200px;margin:0 auto;padding:40px 24px"><div style="padding:32px;border:1px solid #ddd">
<div style="height:120px">stepper + progress</div>
<div style="display:flex;gap:24px">
<div style="flex:0 0 40%"><div style="height:1500px;border:1px solid #ddd">summary cards, totals, payment, notes</div></div>
<div style="flex:1"><div style="background:#eee;padding:24px;max-height:75vh;overflow:auto;display:flex;justify-content:center;align-items:flex-start">
<div class="paystub-sheet" style="position:relative;width:100%;max-width:720px;min-height:480px;background:#fff;padding:24px">
<div class="paystub-fit-outer" style="width:100%"><div class="paystub-fit-box" style="width:504px;height:500px;margin:0 auto"><div class="paystub-scale" style="width:720px;transform-origin:top left;transform:scale(0.7)">
<div id="pdf-content">${stub}</div>
</div></div></div>
</div></div></div>
</div>
<div style="height:80px">back / start over</div>
</div></div></main>
<footer class="no-print" style="height:200px">footer</footer>
</div></div>`;
    const indexCss = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');
    fs.writeFileSync(path.join(OUT, 'review-shell.html'), page(`Review shell: ${t.title}`, shell, printCss, indexCss));
  });
});
