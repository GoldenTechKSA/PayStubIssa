/**
 * Server-side privacy backstop for telemetry props. The client is built never to send
 * form values, but this runs on every incoming event regardless, so a client bug cannot
 * put an SSN, EIN, name or wage figure into the database.
 */
export type Primitive = string | number | boolean | null;
export type Props = Record<string, Primitive>;

/** A key whose lowercase form contains any of these is dropped unless allow-listed. */
export const DENY_SUBSTRINGS: readonly string[] = [
  'ssn', 'ein', 'name', 'email', 'phone', 'address', 'street', 'city', 'zip',
  'salary', 'wage', 'rate', 'pay', 'gross', 'net', 'bonus', 'overtime', 'hours', 'tax',
];

/** Keys the registry is allowed to emit even though they match a deny substring. */
export const ALLOW_KEYS: ReadonlySet<string> = new Set([
  'templateId', 'amountCents', 'stubCount', 'step', 'path', 'ms', 'orderId', 'code',
  'message', 'pages', 'attested', 'draftRestored', 'from', 'to', 'lastStep', 'component',
  'count', 'keys', 'reason', 'totalCents', 'captureId', 'capturedCents', 'currency',
]);

export const REDACTED = '[redacted]';

/**
 * `name` is the likeliest accidental PII key, so it is allowed only when the value is one of
 * the wizard's step labels (the 11xx events). Any other value is dropped.
 */
export const STEP_LABELS: ReadonlySet<string> = new Set(['Company', 'Employee', 'Pay period', 'Earnings', 'Template', 'Review']);

const SSN_RE = /\b\d{3}-?\d{2}-?\d{4}\b/g;
const EIN_RE = /\b\d{2}-?\d{7}\b/g;
const DIGIT_RUN_RE = /\d{9,}/g;

function isDenied(key: string, value: Primitive): boolean {
  if (key === 'name') return !(typeof value === 'string' && STEP_LABELS.has(value));
  if (ALLOW_KEYS.has(key)) return false;
  const k = key.toLowerCase();
  return DENY_SUBSTRINGS.some(s => k.includes(s));
}

function redact(value: string): string {
  return value.replace(SSN_RE, REDACTED).replace(EIN_RE, REDACTED).replace(DIGIT_RUN_RE, REDACTED);
}

/**
 * Returns a copy of `props` with denied keys removed and identifier-shaped digit runs
 * replaced. `removed` lists what changed: `key` for a dropped key, `key:value` for a
 * redacted string, so the caller can log a `[2003]` warning naming the leak.
 */
export function scrubProps(props: Props | undefined): { props: Props | undefined; removed: string[] } {
  if (!props) return { props: undefined, removed: [] };
  const out: Props = {};
  const removed: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (isDenied(key, value)) {
      removed.push(key);
      continue;
    }
    if (typeof value === 'string') {
      const clean = redact(value);
      if (clean !== value) removed.push(`${key}:value`);
      out[key] = clean;
    } else {
      out[key] = value;
    }
  }
  return { props: out, removed };
}
