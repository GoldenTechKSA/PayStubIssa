/**
 * Thin PayPal Orders v2 client over the REST API (no SDK; Node's built-in fetch).
 *
 * Only the server holds the client secret. Every amount PayPal sees comes from
 * the pricing service, and every capture is checked against that quote.
 */
import { randomUUID } from 'node:crypto';
import { centsToMoney, moneyToCents, type Quote } from './pricing';

export type PayPalEnv = 'sandbox' | 'live';

export interface CreateOrderInput {
  quote: Quote;
  /** Shown to the buyer in the PayPal approval UI. */
  description: string;
  /** Our own id for the purchase unit; echoed back by PayPal. */
  referenceId?: string;
}

export interface CreatedOrder {
  id: string;
  status: string;
}

export interface CaptureResult {
  orderId: string;
  /** Order status reported by PayPal, e.g. COMPLETED. */
  status: string;
  captureId: string | null;
  /** Status of the capture itself, e.g. COMPLETED, PENDING, DECLINED. */
  captureStatus: string | null;
  capturedCents: number | null;
  currency: string | null;
  /** Full PayPal response for the audit row. */
  raw: unknown;
}

export interface PayPalClient {
  readonly env: PayPalEnv;
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  captureOrder(orderId: string): Promise<CaptureResult>;
  getOrder(orderId: string): Promise<CaptureResult>;
}

export class PayPalError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly issue?: string,
    public readonly debugId?: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'PayPalError';
  }
}

const BASE_URL: Record<PayPalEnv, string> = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
};

interface ClientOptions {
  env: PayPalEnv;
  clientId: string;
  clientSecret: string;
  fetchImpl?: typeof fetch;
  /** Overridable for tests. */
  baseUrl?: string;
}

export function createPayPalClient(opts: ClientOptions): PayPalClient {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? BASE_URL[opts.env];
  let cached: { token: string; expiresAt: number } | null = null;

  async function accessToken(force = false): Promise<string> {
    if (!force && cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
    const basic = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64');
    const res = await fetchImpl(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });
    const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
    if (!res.ok || !body.access_token) {
      throw new PayPalError(`PayPal auth failed: ${body.error_description ?? res.status}`, res.status, 'AUTH_FAILED', undefined, body);
    }
    cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
    return cached.token;
  }

  async function call<T>(method: 'GET' | 'POST', pathname: string, body?: unknown, requestId?: string, retry = true): Promise<{ status: number; data: T }> {
    const token = await accessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (requestId) headers['PayPal-Request-Id'] = requestId;
    const res = await fetchImpl(`${baseUrl}${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.status === 401 && retry) {
      await accessToken(true);
      return call<T>(method, pathname, body, requestId, false);
    }
    const text = await res.text();
    const data = (text ? JSON.parse(text) : {}) as T;
    return { status: res.status, data };
  }

  function raise(status: number, data: any, fallback: string): never {
    const issue: string | undefined = data?.details?.[0]?.issue ?? data?.name;
    const message: string = data?.details?.[0]?.description ?? data?.message ?? fallback;
    throw new PayPalError(message, status, issue, data?.debug_id, data);
  }

  function summarize(order: any): CaptureResult {
    const unit = order?.purchase_units?.[0];
    const captures: any[] = unit?.payments?.captures ?? [];
    // Prefer a completed capture; otherwise report whatever PayPal has.
    const capture = captures.find(c => c?.status === 'COMPLETED') ?? captures[0] ?? null;
    return {
      orderId: String(order?.id ?? ''),
      status: String(order?.status ?? ''),
      captureId: capture?.id ?? null,
      captureStatus: capture?.status ?? null,
      capturedCents: capture?.amount?.value != null ? moneyToCents(String(capture.amount.value)) : null,
      currency: capture?.amount?.currency_code ?? null,
      raw: order,
    };
  }

  return {
    env: opts.env,

    async createOrder(input) {
      const { quote } = input;
      const amount: Record<string, unknown> = {
        currency_code: quote.currency,
        value: centsToMoney(quote.totalCents),
        breakdown: {
          item_total: { currency_code: quote.currency, value: centsToMoney(quote.subtotalCents) },
          ...(quote.discountCents > 0
            ? { discount: { currency_code: quote.currency, value: centsToMoney(quote.discountCents) } }
            : {}),
        },
      };
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: input.referenceId ?? 'default',
            description: input.description,
            amount,
            items: quote.lines.map(line => ({
              name: line.description,
              quantity: String(line.qty),
              category: 'DIGITAL_GOODS',
              unit_amount: { currency_code: quote.currency, value: centsToMoney(line.unitCents) },
            })),
          },
        ],
        application_context: {
          brand_name: 'PayStubIssa',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      };
      const { status, data } = await call<any>('POST', '/v2/checkout/orders', payload, randomUUID());
      if (status !== 201 && status !== 200) raise(status, data, 'PayPal could not create the order');
      if (!data?.id) raise(status, data, 'PayPal returned no order id');
      return { id: String(data.id), status: String(data.status ?? '') };
    },

    async captureOrder(orderId) {
      // A stable request id makes PayPal treat a retried capture as the same request.
      const { status, data } = await call<any>('POST', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, `capture-${orderId}`);
      if (status === 201 || status === 200) return summarize(data);
      if (status === 422 && data?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED') {
        return this.getOrder(orderId);
      }
      return raise(status, data, 'PayPal could not capture the payment');
    },

    async getOrder(orderId) {
      const { status, data } = await call<any>('GET', `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      if (status !== 200) raise(status, data, 'PayPal could not find the order');
      return summarize(data);
    },
  };
}
