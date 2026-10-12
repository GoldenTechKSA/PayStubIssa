import { describe, expect, it } from 'vitest';
import { HttpError } from '../src/lib/errors';
import { PayPalError } from '../src/services/paypal';
import { makeService } from './helpers';

const cart = { items: [{ type: 'paystub' as const, qty: 3 }] };

async function expectHttp(p: Promise<unknown>, status: number, code: string) {
  try {
    await p;
  } catch (err) {
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(status);
    expect((err as HttpError).code).toBe(code);
    return err as HttpError;
  }
  throw new Error(`expected HttpError ${status} ${code}`);
}

describe('OrderService', () => {
  it('creates an order with a server-side quote and records it', async () => {
    const { service, paypal } = makeService();
    const created = await service.createOrder(cart, { attestedAt: '2026-10-10T10:00:00Z', templateId: 0 });

    expect(created.orderId).toBe('ORDER1');
    expect(created.quote.totalCents).toBe(2697);
    // PayPal saw exactly the quoted amount, not anything the client chose.
    expect(paypal.created.get('ORDER1')!.quote.totalCents).toBe(2697);
    expect(paypal.created.get('ORDER1')!.description).toBe('3 pay stubs');

    const row = service.getRow('ORDER1')!;
    expect(row.status).toBe('CREATED');
    expect(row.total_cents).toBe(2697);
    expect(JSON.parse(row.client_meta_json!)).toMatchObject({ attestedAt: '2026-10-10T10:00:00Z', templateId: 0 });
  });

  it('turns pricing failures into 400s and PayPal failures into 502s', async () => {
    const { service, paypal } = makeService();
    await expectHttp(service.createOrder({ items: [{ type: 'paystub', qty: 99 }] }), 400, 'INVALID_QTY');
    await expectHttp(service.createOrder({ ...cart, couponCode: 'FREE' }), 400, 'INVALID_COUPON');

    paypal.failCreate = new PayPalError('boom', 500, 'INTERNAL_SERVICE_ERROR', 'dbg1');
    const err = await expectHttp(service.createOrder(cart), 502, 'PAYPAL_ERROR');
    expect(err.details).toEqual({ issue: 'INTERNAL_SERVICE_ERROR', debugId: 'dbg1' });
  });

  it('captures, verifies the amount and issues a token that verifies', async () => {
    const { service } = makeService();
    const { orderId } = await service.createOrder(cart);
    const captured = await service.captureOrder(orderId);

    expect(captured.status).toBe('COMPLETED');
    expect(captured.token).toBeTypeOf('string');
    expect(captured.quote.totalCents).toBe(2697);

    const row = service.getRow(orderId)!;
    expect(row.status).toBe('COMPLETED');
    expect(row.capture_id).toBe(`CAP-${orderId}`);
    expect(row.captured_cents).toBe(2697);

    const claims = service.verifyUnlock(captured.token);
    expect(claims).toMatchObject({ orderId, qty: 3, currency: 'USD', totalCents: 2697 });
  });

  it('is idempotent: a second capture re-issues a token without calling PayPal again', async () => {
    const { service, paypal } = makeService();
    const { orderId } = await service.createOrder(cart);
    await service.captureOrder(orderId);
    expect(paypal.captureCalls).toBe(1);

    const again = await service.captureOrder(orderId);
    expect(again.status).toBe('COMPLETED');
    expect(paypal.captureCalls).toBe(1);
  });

  it('serializes concurrent captures of the same order', async () => {
    const { service, paypal } = makeService();
    const { orderId } = await service.createOrder(cart);
    const [a, b, c] = await Promise.all([service.captureOrder(orderId), service.captureOrder(orderId), service.captureOrder(orderId)]);
    expect(paypal.captureCalls).toBe(1);
    expect([a, b, c].every(r => r.status === 'COMPLETED')).toBe(true);
  });

  it('refuses to capture orders it did not create', async () => {
    const { service } = makeService();
    await expectHttp(service.captureOrder('SOMEBODY-ELSES'), 404, 'ORDER_NOT_FOUND');
  });

  it('fails the order when PayPal captured a different amount', async () => {
    const { service, paypal } = makeService();
    const { orderId } = await service.createOrder(cart);
    paypal.nextCapture = { capturedCents: 1 };
    const err = await expectHttp(service.captureOrder(orderId), 402, 'PAYMENT_NOT_VERIFIED');
    expect(err.message).toMatch(/amount 1 != 2697/);

    const row = service.getRow(orderId)!;
    expect(row.status).toBe('FAILED');
    expect(row.failure_reason).toMatch(/amount/);

    // And it stays failed: no second chance at a mismatched capture.
    await expectHttp(service.captureOrder(orderId), 409, 'ORDER_FAILED');
  });

  it('fails the order when the capture is not COMPLETED', async () => {
    const { service, paypal } = makeService();
    const { orderId } = await service.createOrder(cart);
    paypal.nextCapture = { status: 'COMPLETED', captureStatus: 'DECLINED' };
    await expectHttp(service.captureOrder(orderId), 402, 'PAYMENT_NOT_VERIFIED');
    expect(service.getRow(orderId)!.status).toBe('FAILED');
  });

  it('leaves a PENDING capture open for a later retry', async () => {
    const { service, paypal } = makeService();
    const { orderId } = await service.createOrder(cart);
    paypal.nextCapture = { status: 'APPROVED', captureStatus: 'PENDING' };
    await expectHttp(service.captureOrder(orderId), 402, 'PAYMENT_PENDING');
    expect(service.getRow(orderId)!.status).toBe('CREATED');

    const later = await service.captureOrder(orderId);
    expect(later.status).toBe('COMPLETED');
  });

  it('maps a declined instrument to 402 and keeps the order open', async () => {
    const { service, paypal } = makeService();
    const { orderId } = await service.createOrder(cart);
    paypal.nextCapture = new PayPalError('declined', 422, 'INSTRUMENT_DECLINED');
    await expectHttp(service.captureOrder(orderId), 402, 'INSTRUMENT_DECLINED');
    expect(service.getRow(orderId)!.status).toBe('CREATED');
  });

  it('rejects unlock tokens whose order is not completed', async () => {
    const { service } = makeService();
    const { orderId } = await service.createOrder(cart);
    const captured = await service.captureOrder(orderId);

    // Same signature, but flip the ledger underneath it.
    const { db } = makeService();
    void db;
    const other = makeService({ now: () => new Date() });
    expect(() => other.service.verifyUnlock(captured.token)).toThrowError(/completed order/);
    expect(() => service.verifyUnlock('garbage')).toThrowError(/invalid/);
  });
});
