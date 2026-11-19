import { describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HttpError } from '../src/lib/errors';
import { openDatabase } from '../src/db';
import { OrderService } from '../src/services/orders';
import { issueCorrectionCode, findCorrectionCode } from '../src/services/correction-codes';
import { FakePayPal, JWT_SECRET, makeService, rules } from './helpers';

const twoStubs = { items: [{ type: 'paystub' as const, qty: 2 }] };
const FP = 'c'.repeat(64);

async function completedOrder() {
  // Real clock: verifyUnlock checks the JWT against the real time.
  const ctx = makeService();
  const { orderId } = await ctx.service.createOrder(twoStubs);
  await ctx.service.captureOrder(orderId);
  return { ...ctx, orderId };
}

async function expectInvalidCoupon(p: Promise<unknown> | (() => unknown), message: RegExp) {
  try {
    if (typeof p === 'function') p();
    else await p;
  } catch (err) {
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(400);
    expect((err as HttpError).code).toBe('INVALID_COUPON');
    expect((err as HttpError).message).toMatch(message);
    return;
  }
  throw new Error('expected INVALID_COUPON');
}

describe('issueCorrectionCode', () => {
  it('issues a code only for a completed order', async () => {
    const { db, service } = makeService();
    const { orderId } = await service.createOrder(twoStubs); // still CREATED
    expect(() => issueCorrectionCode(db, orderId, { now: new Date(), ttlDays: 14 })).toThrowError('ORDER_NOT_COMPLETED');
    expect(() => issueCorrectionCode(db, 'NOPE', { now: new Date(), ttlDays: 14 })).toThrowError('ORDER_NOT_COMPLETED');
  });

  it('code matches the format and covers the order quantity', async () => {
    const { db, orderId } = await completedOrder();
    const issued = issueCorrectionCode(db, orderId, { now: new Date('2026-11-18T10:00:00Z'), ttlDays: 14 });
    expect(issued.code).toMatch(/^FIX-[A-HJ-NP-Z2-9]{10}$/);
    expect(issued.maxQty).toBe(2);
    expect(issued.expiresAt).toBe('2026-12-02T10:00:00.000Z');
    expect(findCorrectionCode(db, issued.code)).toMatchObject({ order_id: orderId, max_qty: 2, used_at: null });
  });
});

describe('redeeming a correction code', () => {
  async function withCode() {
    const ctx = await completedOrder();
    const issued = issueCorrectionCode(ctx.db, ctx.orderId, { now: new Date(), ttlDays: 14 });
    return { ...ctx, code: issued.code };
  }

  it('quotes a cart to zero with a valid code', async () => {
    const { service, code } = await withCode();
    const quote = service.quote({ ...twoStubs, couponCode: ` ${code.toLowerCase()} ` });
    expect(quote.totalCents).toBe(0);
    expect(quote.subtotalCents).toBeGreaterThan(0);
    expect(quote.discounts[0].description).toBe('Correction');
    expect(quote.discounts[0].code).toBe(code);
  });

  it('allows fewer stubs than the original order', async () => {
    const { service, code } = await withCode();
    expect(service.quote({ items: [{ type: 'paystub', qty: 1 }], couponCode: code }).totalCents).toBe(0);
  });

  it('refuses a code for more stubs than the original order', async () => {
    const { service, code } = await withCode();
    await expectInvalidCoupon(
      () => service.quote({ items: [{ type: 'paystub', qty: 3 }], couponCode: code }),
      /covers at most 2 pay stubs/,
    );
  });

  it('refuses an expired code', async () => {
    let clock = new Date('2026-11-18T10:00:00Z');
    const ctx = makeService({ now: () => clock });
    const { orderId } = await ctx.service.createOrder(twoStubs);
    await ctx.service.captureOrder(orderId);
    const { code } = issueCorrectionCode(ctx.db, orderId, { now: clock, ttlDays: 14 });
    clock = new Date('2026-12-03T10:00:00Z'); // issue + 15 days
    await expectInvalidCoupon(() => ctx.service.quote({ ...twoStubs, couponCode: code }), /has expired/);
  });

  it('completes a zero-total order without calling PayPal', async () => {
    const { service, paypal, orderId: originalOrderId, code } = await withCode();
    const createCallsBefore = paypal.createCalls;
    const r = await service.createOrder({ ...twoStubs, couponCode: code }, {}, 'c'.repeat(64));

    expect(paypal.createCalls).toBe(createCallsBefore);
    expect(paypal.captureCalls).toBe(1); // only the original order's capture
    expect(r.orderId).toMatch(/^C-[A-HJ-NP-Z2-9]{16}$/);
    expect(r.completed!.status).toBe('COMPLETED');
    expect(r.completed!.orderId).toBe(r.orderId);
    expect(r.completed!.quote.totalCents).toBe(0);
    expect(r.completed!.fingerprint).toBe('c'.repeat(64));
    expect(service.verifyUnlock(r.completed!.token).fingerprint).toBe('c'.repeat(64));

    const row = service.getRow(r.orderId)!;
    expect(row.status).toBe('COMPLETED');
    expect(row.paypal_env).toBe('none');
    expect(row.corrects_order_id).toBe(originalOrderId);
    expect(row.captured_cents).toBe(0);
    expect(row.captured_at).not.toBeNull();
    expect(row.content_fp).toBe('c'.repeat(64));

    const used = findCorrectionCode(service['deps'].db, code)!;
    expect(used.used_by_order_id).toBe(r.orderId);
    expect(used.used_at).not.toBeNull();
  });

  it('a code works once', async () => {
    const { service, code } = await withCode();
    await service.createOrder({ ...twoStubs, couponCode: code }, {}, FP);
    await expectInvalidCoupon(service.createOrder({ ...twoStubs, couponCode: code }, {}, FP), /already been used/);
  });

  it('two simultaneous redemptions complete exactly one order', async () => {
    const { service, db, code } = await withCode();
    const c = { ...twoStubs, couponCode: code };
    const results = await Promise.allSettled([service.createOrder(c, {}, FP), service.createOrder(c, {}, FP)]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const loser = results.find(r => r.status === 'rejected') as PromiseRejectedResult;
    await expectInvalidCoupon(Promise.reject(loser.reason), /already been used/);
    expect(db.prepare("SELECT COUNT(*) AS n FROM orders WHERE paypal_env = 'none'").get()).toEqual({ n: 1 });
  });

  it('the guarded update refuses a code spent after the quote saw it unused', async () => {
    const { service, db, code } = await withCode();
    const c = { ...twoStubs, couponCode: code };
    // Read the quote (with the row still unused), then spend the code for real.
    const stale = service['quoteWithCode'](c);
    expect(stale.correction!.used_at).toBeNull();
    await service.createOrder(c, {}, FP);
    // A second redemption that got past the quote-time check with the stale row.
    const spy = vi.spyOn(service as any, 'quoteWithCode').mockReturnValue(stale);
    try {
      await expectInvalidCoupon(service.createOrder(c, {}, FP), /already been used/);
    } finally {
      spy.mockRestore();
    }
    expect(db.prepare("SELECT COUNT(*) AS n FROM orders WHERE paypal_env = 'none'").get()).toEqual({ n: 1 });
  });

  it('refuses a free corrected order that carries no fingerprint, and leaves the code unused', async () => {
    const { service, db, code } = await withCode();
    try {
      await service.createOrder({ ...twoStubs, couponCode: code }, {});
      throw new Error('expected FINGERPRINT_REQUIRED');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(400);
      expect((err as HttpError).code).toBe('FINGERPRINT_REQUIRED');
    }
    expect(findCorrectionCode(db, code)!.used_at).toBeNull();
    expect(db.prepare("SELECT COUNT(*) AS n FROM orders WHERE paypal_env = 'none'").get()).toEqual({ n: 0 });
  });

  it('refuses a code already marked used in the database', async () => {
    const { service, db, code } = await withCode();
    db.prepare("UPDATE correction_codes SET used_at = '2026-01-01T00:00:00Z' WHERE code = ?").run(code);
    await expectInvalidCoupon(service.createOrder({ ...twoStubs, couponCode: code }, {}, FP), /already been used/);
  });

  it('an env coupon can never produce a zero-total order', async () => {
    const paypal = new FakePayPal();
    const service = new OrderService({
      db: openDatabase(':memory:'),
      paypal,
      pricing: { ...rules, coupons: { FREE: { code: 'FREE', description: 'Forged', kind: 'percent', value: 100 } } },
      jwtSecret: JWT_SECRET,
      tokenTtlMinutes: 60,
      correctionCodeTtlDays: 14,
    });
    await expectInvalidCoupon(service.createOrder({ ...twoStubs, couponCode: 'FREE' }), /not valid|cannot/i);
    expect(paypal.createCalls).toBe(0);
  });

  it('prune removes correction codes that expired before the order cutoff', async () => {
    let clock = new Date('2023-01-01T00:00:00Z');
    const ctx = makeService({ now: () => clock, retentionDays: 1095 });
    const { orderId } = await ctx.service.createOrder(twoStubs);
    await ctx.service.captureOrder(orderId);
    issueCorrectionCode(ctx.db, orderId, { now: clock, ttlDays: 14 });
    clock = new Date('2026-06-01T00:00:00Z');
    ctx.service.prune();
    expect(ctx.db.prepare('SELECT COUNT(*) AS n FROM correction_codes').get()).toEqual({ n: 0 });
  });
});

describe('scripts/correction-code.js', () => {
  const script = path.join(__dirname, '..', 'scripts', 'correction-code.js');

  function runScript(dbFile: string, orderId: string) {
    return spawnSync(process.execPath, [script, orderId], {
      env: { ...process.env, DATABASE_PATH: dbFile },
      encoding: 'utf8',
    });
  }

  it('prints a code for a completed order and exits 1 for an unknown or uncompleted one', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'psi-fix-'));
    const file = path.join(dir, 'orders.sqlite');
    const db = openDatabase(file);
    try {
      const ts = '2026-11-18T10:00:00.000Z';
      const insert = db.prepare(
        `INSERT INTO orders (id, status, paypal_env, currency, total_cents, quote_json, created_at, updated_at)
         VALUES (?, ?, 'sandbox', 'USD', 1598, ?, ?, ?)`,
      );
      const quote = JSON.stringify({ lines: [{ type: 'paystub', qty: 2 }] });
      insert.run('DONE1', 'COMPLETED', quote, ts, ts);
      insert.run('OPEN1', 'CREATED', quote, ts, ts);
      db.close();

      const ok = runScript(file, 'DONE1');
      expect(ok.status).toBe(0);
      expect(ok.stdout).toMatch(/FIX-[A-HJ-NP-Z2-9]{10}/);
      expect(ok.stdout).toMatch(/2 pay stubs/);

      const unknown = runScript(file, 'NOPE');
      expect(unknown.status).toBe(1);
      expect(unknown.stderr).toMatch(/NOPE/);

      expect(runScript(file, 'OPEN1').status).toBe(1);
    } finally {
      if (db.open) db.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
