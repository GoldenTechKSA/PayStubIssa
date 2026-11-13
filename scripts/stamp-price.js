#!/usr/bin/env node
/**
 * stamp-price
 * -----------
 * Stamps the per-stub price into the client build so the very first paint of the site (and the
 * static <meta> description in index.html, which no script can update) already shows a price.
 * The browser still asks the server on every visit and swaps in the live number if it differs
 * (src/contexts/price-context.tsx), so the stamp is only ever "the price as of this build".
 *
 * Runs automatically before `npm run build` (prebuild) and `npm start` (prestart, `--dev`).
 *
 * Where the number comes from, in order:
 *   1. PRICE_SOURCE_URL  — the site being deployed (the deploy workflows pass SITE_URL); its
 *      GET /api/payments/config is the same endpoint the browser reads.
 *   2. `--dev` only      — a local API on http://localhost:4000, if one is running.
 *   3. The server's own default for PRICE_PER_STUB_CENTS in server/src/config.ts.
 * Nothing here is a hand-typed price: the server stays the single place it is set.
 *
 * Writes REACT_APP_STUB_PRICE_CENTS and REACT_APP_STUB_PRICE to `.env.production.local`
 * (or `.env.development.local` with --dev). Both files are gitignored.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const dev = process.argv.includes('--dev');
const TIMEOUT_MS = dev ? 1500 : 8000;

const validCents = (v) => (Number.isInteger(v) && v > 0 ? v : null);

async function fromServer(baseUrl) {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/payments/config`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  const cents = validCents(body && body.unitCents && body.unitCents.paystub);
  if (!cents) throw new Error('no unitCents.paystub in the response');
  return cents;
}

function fromServerDefault() {
  const src = fs.readFileSync(path.join(ROOT, 'server/src/config.ts'), 'utf8');
  const m = /PRICE_PER_STUB_CENTS:[^\n]*\.default\((\d+)\)/.exec(src);
  const cents = m ? validCents(Number(m[1])) : null;
  if (!cents) throw new Error('could not read the PRICE_PER_STUB_CENTS default from server/src/config.ts');
  return cents;
}

async function main() {
  const sources = [];
  if (process.env.PRICE_SOURCE_URL) sources.push(process.env.PRICE_SOURCE_URL);
  if (dev) sources.push('http://localhost:4000');

  let cents = null;
  let origin = '';
  for (const base of sources) {
    try {
      cents = await fromServer(base);
      origin = base;
      break;
    } catch (err) {
      // In a deploy this is worth seeing in the Actions summary; locally it is routine.
      const prefix = process.env.GITHUB_ACTIONS ? '::warning::' : '';
      if (process.env.PRICE_SOURCE_URL === base) {
        console.warn(`${prefix}stamp-price: could not read the price from ${base} (${err.message}); using the server default.`);
      }
    }
  }
  if (!cents) {
    cents = fromServerDefault();
    origin = 'server/src/config.ts default';
  }

  const dollars = (cents / 100).toFixed(2);
  const file = path.join(ROOT, dev ? '.env.development.local' : '.env.production.local');
  const marker = '# stamp-price (generated — do not edit)';
  const kept = fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l && l !== marker && !/^REACT_APP_STUB_PRICE(_CENTS)?=/.test(l))
    : [];
  fs.writeFileSync(file, [...kept, marker, `REACT_APP_STUB_PRICE_CENTS=${cents}`, `REACT_APP_STUB_PRICE=${dollars}`, ''].join('\n'));
  console.log(`stamp-price: $${dollars} per stub (from ${origin}) -> ${path.basename(file)}`);
}

main().catch((err) => {
  console.error(`stamp-price: ${err.message}`);
  process.exit(1);
});
