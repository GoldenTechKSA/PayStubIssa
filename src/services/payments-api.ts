/**
 * payments-api
 * ------------
 * Browser client for the Phase 1 backend (`server/`). The server decides the
 * price, creates and captures the PayPal order, and hands back a signed unlock
 * token. The browser never sees the PayPal secret and never chooses an amount.
 *
 * Same-origin: `/api` is proxied to the Node service by Apache in staging and
 * production, and by the CRA dev proxy (`"proxy"` in package.json) locally.
 */

export type ItemType = 'paystub';

export interface CartItem {
  type: ItemType;
  qty: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
}

export interface OrderMeta {
  attestedAt?: string;
  templateId?: number | string;
}

export interface QuoteLine {
  type: ItemType;
  description: string;
  qty: number;
  unitCents: number;
  subtotalCents: number;
}

export interface QuoteDiscount {
  code: string;
  description: string;
  amountCents: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  discounts: QuoteDiscount[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export interface PaymentConfig {
  paypalEnv: 'sandbox' | 'live';
  clientId: string;
  currency: string;
  unitCents: Record<ItemType, number>;
  maxQty: number;
}

export interface CreatedOrder {
  orderId: string;
  quote: Quote;
}

export interface CapturedOrder {
  orderId: string;
  status: 'COMPLETED';
  token: string;
  expiresAt: string;
  quote: Quote;
}

/** What the browser keeps after a successful payment. */
export interface Unlock {
  token: string;
  orderId: string;
  expiresAt: string;
  qty: number;
}

export class PaymentsApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'PaymentsApiError';
  }
}

const BASE = '/api/payments';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
  } catch {
    throw new PaymentsApiError('Could not reach the payment service. Check your connection and try again.', 'NETWORK', 0);
  }
  // Apache's SPA fallback answers unknown paths with index.html and a 200. If the API is not
  // proxied (yet), treat that HTML as "service unavailable" rather than as an empty success.
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new PaymentsApiError('The payment service is temporarily unavailable. Please try again later.', 'UNAVAILABLE', res.status);
  }
  const text = await res.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* malformed JSON */ }
  if (!res.ok) {
    const err = body?.error || {};
    throw new PaymentsApiError(err.message || `Payment service error (${res.status})`, err.code || 'HTTP_ERROR', res.status, err.details);
  }
  return body as T;
}

export const paymentsApi = {
  getConfig: () => request<PaymentConfig>('/config'),

  quote: (cart: Cart) =>
    request<{ quote: Quote }>('/quote', { method: 'POST', body: JSON.stringify(cart) }).then(r => r.quote),

  createOrder: (cart: Cart, meta?: OrderMeta) =>
    request<CreatedOrder>('/orders', { method: 'POST', body: JSON.stringify({ ...cart, meta }) }),

  captureOrder: (orderId: string) =>
    request<CapturedOrder>(`/orders/${encodeURIComponent(orderId)}/capture`, { method: 'POST' }),

  verifyUnlock: (token: string) =>
    request<{ valid: true; orderId: string; qty: number; expiresAt: string }>('/unlock/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
};

export const centsToDollars = (cents: number): number => Math.round(cents) / 100;

/**
 * Session-scoped persistence of the unlock, so a reload on the Review step does
 * not lose a payment that was just made. The server re-validates it on restore.
 */
const UNLOCK_KEY = 'paystubissa.unlock.v1';

export const unlockStorage = {
  load(): Unlock | null {
    try {
      const raw = sessionStorage.getItem(UNLOCK_KEY);
      if (!raw) return null;
      const u = JSON.parse(raw) as Unlock;
      if (!u?.token || !u?.expiresAt || new Date(u.expiresAt).getTime() <= Date.now()) {
        sessionStorage.removeItem(UNLOCK_KEY);
        return null;
      }
      return u;
    } catch {
      return null;
    }
  },
  save(unlock: Unlock): void {
    try { sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(unlock)); } catch { /* storage unavailable */ }
  },
  clear(): void {
    try { sessionStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
  },
};
