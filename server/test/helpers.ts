import { openDatabase } from '../src/db';
import { OrderService } from '../src/services/orders';
import type { CaptureResult, CreatedOrder, CreateOrderInput, PayPalClient } from '../src/services/paypal';
import { PayPalError } from '../src/services/paypal';
import type { PricingRules } from '../src/services/pricing';
import type { Config } from '../src/config';

export const JWT_SECRET = 'test-secret-that-is-definitely-longer-than-32-chars';

export const rules: PricingRules = {
  currency: 'USD',
  unitCents: { paystub: 899 },
  maxQty: 12,
  coupons: {},
};

export const testConfig: Config = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: 0,
  TRUST_PROXY: 0,
  PAYPAL_ENV: 'sandbox',
  PAYPAL_CLIENT_ID: 'test-client-id',
  PAYPAL_CLIENT_SECRET: 'test-secret',
  PAYPAL_WEBHOOK_ID: undefined,
  JWT_SECRET,
  UNLOCK_TOKEN_TTL_MINUTES: 60,
  CURRENCY: 'USD',
  PRICE_PER_STUB_CENTS: 899,
  MAX_STUBS_PER_ORDER: 12,
  DATABASE_PATH: ':memory:',
  databasePath: ':memory:',
};

/**
 * In-memory stand-in for PayPal. Records every order it creates so a capture can
 * echo the right amount back, and lets a test override the next capture outcome.
 */
export class FakePayPal implements PayPalClient {
  readonly env = 'sandbox' as const;
  readonly created = new Map<string, CreateOrderInput>();
  captureCalls = 0;
  createCalls = 0;
  private seq = 0;
  /** If set, the next capture resolves/rejects with this instead of the happy path. */
  nextCapture: Partial<CaptureResult> | Error | null = null;
  /** If set, createOrder rejects with this. */
  failCreate: Error | null = null;

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    this.createCalls += 1;
    if (this.failCreate) throw this.failCreate;
    const id = `ORDER${++this.seq}`;
    this.created.set(id, input);
    return { id, status: 'CREATED' };
  }

  async captureOrder(orderId: string): Promise<CaptureResult> {
    this.captureCalls += 1;
    const override = this.nextCapture;
    this.nextCapture = null;
    if (override instanceof Error) throw override;
    const input = this.created.get(orderId);
    if (!input) throw new PayPalError('not found', 404, 'RESOURCE_NOT_FOUND');
    const happy: CaptureResult = {
      orderId,
      status: 'COMPLETED',
      captureId: `CAP-${orderId}`,
      captureStatus: 'COMPLETED',
      capturedCents: input.quote.totalCents,
      currency: input.quote.currency,
      raw: { id: orderId, status: 'COMPLETED' },
    };
    return { ...happy, ...(override ?? {}) };
  }

  async getOrder(orderId: string): Promise<CaptureResult> {
    return this.captureOrder(orderId);
  }
}

export function makeService(overrides: Partial<{ paypal: PayPalClient; now: () => Date }> = {}) {
  const db = openDatabase(':memory:');
  const paypal = overrides.paypal ?? new FakePayPal();
  const service = new OrderService({
    db,
    paypal,
    pricing: rules,
    jwtSecret: JWT_SECRET,
    tokenTtlMinutes: 60,
    now: overrides.now,
  });
  return { db, paypal: paypal as FakePayPal, service };
}
