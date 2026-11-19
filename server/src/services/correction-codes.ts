/**
 * Correction codes: a one-time code support hands to a customer whose pay stub had a mistake,
 * good for a free re-issue of at most as many stubs as the original order covered. Redeeming
 * one quotes the cart to zero and completes an order without PayPal (see OrderService).
 */
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';
import type { OrderRow } from '../db';
import type { Quote } from './pricing';

const DAY_MS = 24 * 60 * 60 * 1000;

/** No 0/O/1/I/L: a code is read out of an email and typed by hand. */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface CorrectionCodeRow {
  code: string;
  order_id: string;
  max_qty: number;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by_order_id: string | null;
}

export function randomChars(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return out;
}

export function issueCorrectionCode(
  db: Database.Database,
  orderId: string,
  opts: { now: Date; ttlDays: number },
): { code: string; maxQty: number; expiresAt: string } {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRow | undefined;
  if (!row || row.status !== 'COMPLETED') throw new Error('ORDER_NOT_COMPLETED');

  const quote = JSON.parse(row.quote_json) as Quote;
  const maxQty = quote.lines.reduce((sum, l) => sum + l.qty, 0);
  const code = `FIX-${randomChars(10)}`;
  const expiresAt = new Date(opts.now.getTime() + opts.ttlDays * DAY_MS).toISOString();

  db.prepare(
    'INSERT INTO correction_codes (code, order_id, max_qty, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
  ).run(code, orderId, maxQty, opts.now.toISOString(), expiresAt);
  return { code, maxQty, expiresAt };
}

/** `code` is already normalised (trimmed, upper-case). */
export function findCorrectionCode(db: Database.Database, code: string): CorrectionCodeRow | undefined {
  return db.prepare('SELECT * FROM correction_codes WHERE code = ?').get(code) as CorrectionCodeRow | undefined;
}
