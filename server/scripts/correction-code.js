#!/usr/bin/env node
/*
 * Issue a one-time correction code for a completed order.
 *
 *   node scripts/correction-code.js <orderId>
 *
 * Support emails the printed code to the customer by hand. Plain CommonJS like query.js: it runs
 * from dist-only deploys with production deps (better-sqlite3, dotenv) and no TypeScript toolchain,
 * so the SQL lives here (keep it in step with src/services/correction-codes.ts).
 */
const crypto = require('node:crypto');
const path = require('node:path');

const SERVER_ROOT = path.resolve(__dirname, '..');
const DAY_MS = 24 * 60 * 60 * 1000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function openFromEnv() {
  require('dotenv').config({ path: path.join(SERVER_ROOT, '.env') });
  const configured = process.env.DATABASE_PATH || './data/orders.sqlite';
  const file = configured === ':memory:' ? configured : path.resolve(SERVER_ROOT, configured);
  const Database = require('better-sqlite3');
  return new Database(file, { readonly: false, fileMustExist: true });
}

function ttlDays() {
  const n = Number(process.env.CORRECTION_CODE_TTL_DAYS);
  return Number.isInteger(n) && n > 0 ? n : 14;
}

/** Returns { code, maxQty, expiresAt }; throws Error('ORDER_NOT_COMPLETED') for an unknown or unpaid order. */
function issue(db, orderId, { now, ttlDays: days }) {
  const row = db.prepare('SELECT status, quote_json FROM orders WHERE id = ?').get(orderId);
  if (!row || row.status !== 'COMPLETED') throw new Error('ORDER_NOT_COMPLETED');
  const maxQty = JSON.parse(row.quote_json).lines.reduce((sum, l) => sum + l.qty, 0);
  let suffix = '';
  for (let i = 0; i < 10; i += 1) suffix += ALPHABET[crypto.randomInt(ALPHABET.length)];
  const code = `FIX-${suffix}`;
  const expiresAt = new Date(now.getTime() + days * DAY_MS).toISOString();
  db.prepare('INSERT INTO correction_codes (code, order_id, max_qty, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(code, orderId, maxQty, now.toISOString(), expiresAt);
  return { code, maxQty, expiresAt };
}

function main(argv) {
  const orderId = argv[0];
  if (!orderId) {
    console.error('Usage: node scripts/correction-code.js <orderId>');
    return 1;
  }
  let db;
  try {
    db = openFromEnv();
  } catch (err) {
    console.error(`Could not open the database: ${err.message}`);
    return 1;
  }
  try {
    const { code, maxQty, expiresAt } = issue(db, orderId, { now: new Date(), ttlDays: ttlDays() });
    console.log(`${code}  covers up to ${maxQty} pay stub${maxQty === 1 ? '' : 's'}, expires ${expiresAt.slice(0, 10)}`);
    return 0;
  } catch (err) {
    if (err && err.message === 'ORDER_NOT_COMPLETED') {
      console.error(`Order ${orderId} was not found or is not a completed order.`);
      return 1;
    }
    if (err && /no such table/.test(String(err.message))) {
      console.error(`${err.message}\nThe schema is created when the API starts; start it once and retry.`);
      return 1;
    }
    throw err;
  } finally {
    db.close();
  }
}

module.exports = { issue };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
