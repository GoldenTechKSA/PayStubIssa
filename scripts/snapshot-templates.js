#!/usr/bin/env node
/**
 * Snapshot pay-stub templates the way they print.
 *
 *   node scripts/snapshot-templates.js [template-name ...] [--out <dir>]
 *
 * 1. Runs the Jest render harness (src/__test__/render-templates.harness.test.ts), which
 *    writes one standalone HTML page per template using the dev seed data.
 * 2. Opens each page in headless Chrome at the 720px printable width and writes
 *    <name>.png (screen, with a red line at the 960px page bottom) and <name>.pdf
 *    (real print path: @page letter, 0.5in margins, print.css).
 * 3. Reports the PDF page count. One stub must be one page.
 *
 * The harness also writes review-shell.html: the first template inside a model of the Review
 * step's ancestor chain, printed the way the Print button prints. It is always included and
 * must be one page too (see print.css on why the hidden review page once added blank sheets).
 *
 * Default output: <repo>/.snapshots (gitignored).
 */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = path.resolve(outIdx >= 0 ? args[outIdx + 1] : path.join(ROOT, '.snapshots'));
const names = args.filter((a, i) => a !== '--out' && (outIdx < 0 || i !== outIdx + 1));

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => fs.existsSync(p));
if (!CHROME) {
  console.error('Chrome not found');
  process.exit(2);
}

fs.mkdirSync(OUT, { recursive: true });

const renderOne = (name) => {
  const env = { ...process.env, CI: 'true', RENDER_DIR: OUT };
  if (name) env.RENDER_TEMPLATE = name;
  const r = spawnSync('npx', ['react-scripts', 'test', '--watchAll=false', 'render-templates.harness'],
    { cwd: ROOT, env, shell: true, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    process.exit(1);
  }
};

const chrome = (file, extra) => execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--virtual-time-budget=4000', '--run-all-compositor-stages-before-draw',
  ...extra, 'file:///' + file.replace(/\\/g, '/'),
], { stdio: 'pipe' });

const pdfPages = (pdf) => {
  const bytes = fs.readFileSync(pdf, 'latin1');
  const m = bytes.match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : 0;
};

if (names.length) names.forEach(n => renderOne(n)); else renderOne();

const pages = fs.readdirSync(OUT)
  .filter(f => f.endsWith('.html') && (!names.length || names.includes(f.replace(/\.html$/, '')) || f === 'review-shell.html'));
const rows = [];
for (const html of pages) {
  const name = html.replace(/\.html$/, '');
  const file = path.join(OUT, html);
  const png = path.join(OUT, name + '.png');
  const pdf = path.join(OUT, name + '.pdf');
  chrome(file, ['--window-size=720,1400', '--screenshot=' + png]);
  chrome(file, ['--no-pdf-header-footer', '--print-to-pdf=' + pdf]);
  rows.push({ name, pages: pdfPages(pdf) });
}
for (const r of rows) console.log(String(r.pages).padStart(2) + ' page(s)  ' + r.name);
console.log('\noutput: ' + OUT);
const bad = rows.filter(r => r.pages !== 1);
if (bad.length) console.log(bad.length + ' page(s) do not print as one sheet');
