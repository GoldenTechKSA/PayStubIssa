/**
 * Server-side site codes. Every log line the API emits carries one of these so a
 * `[NNNN]` in the database or in PM2 output points at exactly one place in the code.
 *
 * Ranges: client 1000–1999 (see src/telemetry/codes.ts in the web app), server 2000–2999.
 * One emit site per code: never reuse a code at a second call site.
 */
export type Level = 'info' | 'warn' | 'error';

export interface SiteCode {
  readonly code: number;
  readonly name: string;
  readonly level: Level;
}

export const CLIENT_CODE_MIN = 1000;
export const CLIENT_CODE_MAX = 1999;
export const SERVER_CODE_MIN = 2000;
export const SERVER_CODE_MAX = 2999;

export const NAME_RE = /^[a-z0-9_.]{1,64}$/;

export const S = {
  // 20xx — telemetry intake (stdout only, never stored)
  TELEMETRY_BATCH_ACCEPTED: { code: 2001, name: 'telemetry.batch.accepted', level: 'info' },
  TELEMETRY_BATCH_REJECTED: { code: 2002, name: 'telemetry.batch.rejected', level: 'warn' },
  TELEMETRY_SCRUBBED: { code: 2003, name: 'telemetry.scrubbed', level: 'warn' },

  // 21xx — payments (stdout + stored under the browser's session id)
  PAYMENTS_ORDER_CREATED: { code: 2101, name: 'payments.order.created', level: 'info' },
  PAYMENTS_ORDER_CAPTURED: { code: 2102, name: 'payments.order.captured', level: 'info' },
  PAYMENTS_CAPTURE_FAILED: { code: 2103, name: 'payments.capture.failed', level: 'error' },
  PAYMENTS_ORDER_CREATE_FAILED: { code: 2104, name: 'payments.order.create_failed', level: 'error' },
} as const satisfies Record<string, SiteCode>;

/** `[2102] payments.order.captured {"orderId":"X"}` — the one line format used everywhere. */
export function formatLine(site: SiteCode, props?: Record<string, unknown>): string {
  const head = `[${String(site.code).padStart(4, '0')}] ${site.name}`;
  if (!props || Object.keys(props).length === 0) return head;
  return `${head} ${JSON.stringify(props)}`;
}
