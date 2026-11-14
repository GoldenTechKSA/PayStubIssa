#!/usr/bin/env node
/**
 * stamp-price
 * -----------
 * Stamps the price table into the client build so the very first paint of the site (and the
 * static <meta> description in index.html, which no script can update) already shows prices.
 * The browser still asks the server on every visit and swaps in the live table if it differs
 * (src/contexts/price-context.tsx), so the stamp is only ever "the prices as of this build".
 *
 * Runs automatically before `npm run build` (prebuild) and `npm start` (prestart, `--dev`).
 *
 * Where the table comes from, in order:
 *   1. PRICE_SOURCE_URL  — the site being deployed (the deploy workflows pass SITE_URL); its
 *      GET /api/payments/config is the same endpoint the browser reads.
 *   2. `--dev` only      — a local API on http://localhost:4000, if one is running.
 *   3. The server's own default for PRICE_TIERS in server/src/config.ts.
 * A server that answers WITHOUT a tier table (an API older than the tiers, which is what the
 * first deploy of them builds against: the client is built before the API is replaced) counts
 * as a miss and falls through to 3 — the default of the server code about to be deployed.
 * Nothing here is a hand-typed price: the server stays the single place it is set.
 *
 * Writes to `.env.production.local` (or `.env.development.local` with --dev), both gitignored:
 *   REACT_APP_PRICE_TIERS       the table as JSON, [{minQty,maxQty,unitCents},…]
 *   REACT_APP_STUB_PRICE        the single-stub price in dollars ("8.99")
 *   REACT_APP_STUB_PRICE_FROM   the lowest per-stub price in dollars ("5.99"), for index.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const dev = process.argv.includes('--dev');
const TIMEOUT_MS = dev ? 1500 : 8000;

const posInt = (v) => Number.isInteger(v) && v > 0;

/** A usable tier table: starts at one stub, contiguous ranges, whole positive cents. */
function validTiers(tiers) {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  let expectedMin = 1;
  const out = [];
  for (const t of tiers) {
    if (!t || !posInt(t.minQty) || !posInt(t.maxQty) || !posInt(t.unitCents)) return null;
    if (t.minQty !== expectedMin || t.maxQty < t.minQty) return null;
    expectedMin = t.maxQty + 1;
    out.push({ minQty: t.minQty, maxQty: t.maxQty, unitCents: t.unitCents });
  }
  return out;
}

/** The tiers in a GET /api/payments/config answer, or null when it carries none it can use. */
function tiersFromConfigBody(body) {
  return validTiers(body && body.tiers);
}

/** The default tier table, read out of the text of server/src/config.ts. */
function tiersFromServerDefault(configTs) {
  const tiersMatch = /PRICE_TIERS:[^\n]*\.default\('([^']+)'\)/.exec(configTs);
  const maxMatch = /MAX_STUBS_PER_ORDER:[^\n]*\.default\((\d+)\)/.exec(configTs);
  if (!tiersMatch || !maxMatch) {
    throw new Error('could not read the PRICE_TIERS / MAX_STUBS_PER_ORDER defaults from server/src/config.ts');
  }
  const maxQty = Number(maxMatch[1]);
  const pairs = tiersMatch[1].split(',').map(s => s.trim()).filter(Boolean).map(s => s.split(':').map(Number));
  const tiers = validTiers(pairs.map(([minQty, unitCents], i) => ({
    minQty,
    maxQty: i + 1 < pairs.length ? pairs[i + 1][0] - 1 : maxQty,
    unitCents,
  })));
  if (!tiers) throw new Error('the PRICE_TIERS default in server/src/config.ts is not a usable tier table');
  return tiers;
}

async function fromServer(baseUrl) {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/payments/config`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return tiersFromConfigBody(await res.json());
}

const dollars = (cents) => (cents / 100).toFixed(2);

async function main() {
  const sources = [];
  if (process.env.PRICE_SOURCE_URL) sources.push(process.env.PRICE_SOURCE_URL);
  if (dev) sources.push('http://localhost:4000');

  let tiers = null;
  let origin = '';
  for (const base of sources) {
    try {
      tiers = await fromServer(base);
      if (tiers) {
        origin = base;
        break;
      }
      console.log(`stamp-price: ${base} has no tiers yet; using the server default.`);
    } catch (err) {
      // In a deploy this is worth seeing in the Actions summary; locally it is routine.
      const prefix = process.env.GITHUB_ACTIONS ? '::warning::' : '';
      if (process.env.PRICE_SOURCE_URL === base) {
        console.warn(`${prefix}stamp-price: could not read the prices from ${base} (${err.message}); using the server default.`);
      }
    }
  }
  if (!tiers) {
    tiers = tiersFromServerDefault(fs.readFileSync(path.join(ROOT, 'server/src/config.ts'), 'utf8'));
    origin = 'server/src/config.ts default';
  }

  const single = dollars(tiers[0].unitCents);
  const from = dollars(Math.min(...tiers.map(t => t.unitCents)));
  const file = path.join(ROOT, dev ? '.env.development.local' : '.env.production.local');
  const marker = '# stamp-price (generated — do not edit)';
  const kept = fs.existsSync(file)
    ? fs.readFileSync(file, 'utf8').split(/\r?\n/)
        .filter(l => l && l !== marker && !/^REACT_APP_(STUB_PRICE(_CENTS|_FROM)?|PRICE_TIERS)=/.test(l))
    : [];
  fs.writeFileSync(file, [
    ...kept,
    marker,
    `REACT_APP_PRICE_TIERS=${JSON.stringify(tiers)}`,
    `REACT_APP_STUB_PRICE=${single}`,
    `REACT_APP_STUB_PRICE_FROM=${from}`,
    '',
  ].join('\n'));
  const summary = tiers
    .map(t => `${t.minQty === t.maxQty ? t.minQty : `${t.minQty}-${t.maxQty}`}: $${dollars(t.unitCents)}`)
    .join(', ');
  console.log(`stamp-price: ${summary} per stub (from ${origin}) -> ${path.basename(file)}`);
}

module.exports = { tiersFromConfigBody, tiersFromServerDefault };

if (require.main === module) {
  main().catch((err) => {
    console.error(`stamp-price: ${err.message}`);
    process.exit(1);
  });
}
