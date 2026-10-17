/**
 * Client-side site codes. Every telemetry event carries one of these so a `[NNNN]` in the
 * database points at exactly one place in the code.
 *
 * Ranges: client 1000–1999 (here), server 2000–2999 (server/src/telemetry/codes.ts).
 * Hundreds digit groups by area: 10xx app/page, 11xx wizard, 12xx template, 13xx payment,
 * 14xx print/PDF, 19xx errors. One emit site per code: never reuse a code at a second call
 * site — add a new entry instead.
 *
 * `props` lists the keys an emit site is allowed to send. The server scrubber drops any
 * key that looks like PII or a wage figure; the registry test asserts every declared key is
 * on its allow list, so a leak is caught before it ships.
 */
export type Level = 'info' | 'warn' | 'error';

export interface SiteCode {
  readonly code: number;
  readonly name: string;
  readonly level: Level;
  readonly props?: readonly string[];
}

export const CLIENT_CODE_MIN = 1000;
export const CLIENT_CODE_MAX = 1999;

export const NAME_RE = /^[a-z0-9_.]{1,64}$/;

/** Mirrors ALLOW_KEYS in server/src/telemetry/scrub.ts. Keep the two in sync. */
export const ALLOWED_PROP_KEYS: ReadonlySet<string> = new Set([
  'templateId', 'amountCents', 'stubCount', 'step', 'name', 'path', 'ms', 'orderId', 'code',
  'message', 'pages', 'attested', 'draftRestored', 'from', 'to', 'lastStep', 'component',
  'count', 'keys', 'reason', 'totalCents', 'captureId', 'capturedCents', 'currency',
]);

export const T = {
  // 10xx — app / page
  APP_LOADED: { code: 1001, name: 'app.loaded', level: 'info', props: ['path'] },
  PAGE_VIEWED: { code: 1002, name: 'page.viewed', level: 'info', props: ['path'] },
  PERF_PAGE_LOAD: { code: 1003, name: 'perf.page_load', level: 'info', props: ['ms'] },

  // 11xx — wizard
  WIZARD_ENTERED: { code: 1101, name: 'wizard.entered', level: 'info', props: ['draftRestored'] },
  WIZARD_STEP_VIEWED: { code: 1102, name: 'wizard.step.viewed', level: 'info', props: ['step', 'name'] },
  WIZARD_STEP_COMPLETED: { code: 1103, name: 'wizard.step.completed', level: 'info', props: ['step', 'name'] },
  WIZARD_STEP_BACK: { code: 1104, name: 'wizard.step.back', level: 'info', props: ['step'] },
  WIZARD_STEP_JUMPED: { code: 1105, name: 'wizard.step.jumped', level: 'info', props: ['from', 'to'] },
  WIZARD_EXITED: { code: 1106, name: 'wizard.exited', level: 'info', props: ['lastStep'] },

  // 12xx — template
  TEMPLATE_SELECTED: { code: 1201, name: 'template.selected', level: 'info', props: ['templateId'] },

  // 13xx — review & payment
  REVIEW_ATTESTED: { code: 1301, name: 'review.attested', level: 'info', props: ['attested'] },
  PAYMENT_ORDER_CREATED: { code: 1302, name: 'payment.order_created', level: 'info', props: ['orderId'] },
  PAYMENT_CAPTURE_STARTED: { code: 1303, name: 'payment.capture_started', level: 'info', props: ['orderId'] },
  PAYMENT_SUCCEEDED: {
    code: 1304, name: 'payment.succeeded', level: 'info',
    props: ['orderId', 'amountCents', 'currency', 'stubCount', 'templateId'],
  },
  PAYMENT_FAILED: { code: 1305, name: 'payment.failed', level: 'error', props: ['orderId', 'code', 'message'] },
  PAYMENT_CANCELLED: { code: 1306, name: 'payment.cancelled', level: 'info', props: ['orderId'] },
  PAYMENT_BUTTONS_FAILED: { code: 1307, name: 'payment.buttons_failed', level: 'error', props: ['message'] },
  UNLOCK_RESTORED: { code: 1308, name: 'unlock.restored', level: 'info', props: ['orderId'] },

  // 14xx — print / PDF
  PRINT_CLICKED: { code: 1401, name: 'print.clicked', level: 'info' },
  PDF_CLICKED: { code: 1402, name: 'pdf.clicked', level: 'info' },
  PDF_GENERATED: { code: 1403, name: 'pdf.generated', level: 'info', props: ['pages'] },
  PDF_FAILED: { code: 1404, name: 'pdf.failed', level: 'error', props: ['message'] },

  // 19xx — errors
  ERROR_WINDOW: { code: 1901, name: 'error.window', level: 'error', props: ['message'] },
  ERROR_UNHANDLED_REJECTION: { code: 1902, name: 'error.unhandled_rejection', level: 'error', props: ['message'] },
  ERROR_BOUNDARY: { code: 1903, name: 'error.boundary', level: 'error', props: ['component', 'message'] },
} as const satisfies Record<string, SiteCode>;

/** `[1103] wizard.step.completed {"step":2}` — the one line format used everywhere. */
export function formatLine(site: SiteCode, props?: Record<string, unknown>): string {
  const head = `[${String(site.code).padStart(4, '0')}] ${site.name}`;
  if (!props || Object.keys(props).length === 0) return head;
  return `${head} ${JSON.stringify(props)}`;
}
