import { T, formatLine, type SiteCode } from '../telemetry/codes';
import type { Props, TelemetryConfig, TelemetryEvent, TelemetryIds } from '../types/telemetry';

export const VISITOR_KEY = 'paystubissa.telemetry.visitor';
/** JSON `{ id, lastSeen }` in sessionStorage: survives a reload, not a closed tab. */
export const SESSION_KEY = 'paystubissa.telemetry.session';
/** Key the previous telemetry client used; migrated on first run so return visitors keep their id. */
export const LEGACY_VISITOR_KEY = 'telemetry_user_id';
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const MAX_QUEUE = 200;
/** The server accepts at most this many events per batch; a backlog drains in chunks. */
export const MAX_BATCH = 100;
export const MAX_STRING = 500;

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
const ID_LEN = 16;
const ID_BODY_RE = /[^A-Za-z0-9_-]/g;

export interface TelemetryDeps {
  local?: Storage | null;
  session?: Storage | null;
  now?: () => number;
  fetch?: typeof fetch;
  sendBeacon?: (url: string, data: Blob) => boolean;
  setInterval?: typeof setInterval;
  clearInterval?: typeof clearInterval;
  echo?: (line: string) => void;
}

const DEFAULT_CONFIG: TelemetryConfig = {
  endpoint: '/api/telemetry',
  batchSize: 10,
  flushIntervalMs: 10_000,
  consoleEcho: false,
  enabled: process.env.NODE_ENV !== 'test',
};

function safeStorage(pick: () => Storage | null | undefined): Storage | null {
  try {
    return pick() ?? null;
  } catch {
    return null;
  }
}

function randomId(): string {
  const bytes = new Uint8Array(ID_LEN);
  const crypto = typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined;
  if (crypto && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < ID_LEN; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (let i = 0; i < ID_LEN; i++) out += ID_CHARS[bytes[i] % ID_CHARS.length];
  return out;
}

/**
 * Batches `[NNNN]`-coded events to the API. One instance per page; `start()` is idempotent
 * so React re-renders and provider remounts never lose the flush timer.
 */
export class TelemetryService {
  private config: TelemetryConfig = { ...DEFAULT_CONFIG };
  private readonly queue: TelemetryEvent[] = [];
  private readonly local: Storage | null;
  private readonly session: Storage | null;
  private readonly now: () => number;
  private readonly fetchFn: typeof fetch | undefined;
  private readonly beacon: ((url: string, data: Blob) => boolean) | undefined;
  private readonly setIntervalFn: typeof setInterval;
  private readonly clearIntervalFn: typeof clearInterval;
  private readonly echo: (line: string) => void;

  private visitorId: string;
  private sessionId: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private unloadInstalled = false;
  private warnedThisSession = false;
  private inFlight: Promise<void> | null = null;

  constructor(deps: TelemetryDeps = {}) {
    this.local = deps.local !== undefined ? deps.local : safeStorage(() => window.localStorage);
    this.session = deps.session !== undefined ? deps.session : safeStorage(() => window.sessionStorage);
    this.now = deps.now ?? (() => Date.now());
    this.fetchFn = deps.fetch ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined);
    this.beacon =
      deps.sendBeacon ??
      (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
        ? navigator.sendBeacon.bind(navigator)
        : undefined);
    // Wrapped, not stored: browsers throw "Illegal invocation" when window.setInterval is
    // called with any `this` other than the window.
    this.setIntervalFn = deps.setInterval ?? (((fn: () => void, ms: number) => setInterval(fn, ms)) as typeof setInterval);
    this.clearIntervalFn = deps.clearInterval ?? (((id: ReturnType<typeof setInterval>) => clearInterval(id)) as typeof clearInterval);
    this.echo = deps.echo ?? ((line: string) => console.log(line));

    this.visitorId = this.loadVisitorId();
    this.sessionId = this.loadSessionId();
  }

  /** Apply config and install the flush timer + unload beacon once. Safe to call repeatedly. */
  start(config: Partial<TelemetryConfig> = {}): void {
    this.config = { ...this.config, ...config };
    if (this.started) return;
    this.started = true;
    if (!this.config.enabled) return;
    this.timer = this.setIntervalFn(() => { void this.flush(); }, this.config.flushIntervalMs);
    this.installUnloadHandler();
  }

  /** Tests only: clear the timer. */
  stop(): void {
    if (this.timer !== null) this.clearIntervalFn(this.timer);
    this.timer = null;
    this.started = false;
  }

  ids(): TelemetryIds {
    return { visitorId: this.visitorId, sessionId: this.sessionId };
  }

  queueLength(): number {
    return this.queue.length;
  }

  /** Queue one event. Never throws; a no-op when telemetry is disabled. */
  emit(site: SiteCode, props?: Props): void {
    if (!this.config.enabled) return;
    try {
      const clean = props ? this.truncate(props) : undefined;
      const event: TelemetryEvent = { code: site.code, name: site.name, level: site.level, ts: this.now() };
      if (clean && Object.keys(clean).length) event.props = clean;
      this.push(event);
      this.touchSession();
      if (this.config.consoleEcho) this.echo(formatLine(site, clean));
      if (this.queue.length >= this.config.batchSize) void this.flush();
    } catch {
      /* telemetry must never surface into the app */
    }
  }

  /**
   * POST everything queued. Network failures and 5xx put the batch back (oldest dropped
   * past MAX_QUEUE); any 4xx means the server will never accept it, so it is dropped.
   */
  async flush(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    if (this.queue.length === 0 || !this.fetchFn) return;
    const events = this.queue.splice(0, Math.min(MAX_BATCH, this.queue.length));
    const body = this.serialize(events);
    this.inFlight = (async () => {
      let retry = false;
      try {
        const res = await this.fetchFn!(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        });
        if (!res.ok && res.status >= 500) retry = true;
      } catch {
        retry = true;
      }
      if (retry) {
        this.queue.unshift(...events);
        this.trimQueue();
        this.warnOnce();
      } else if (this.queue.length >= this.config.batchSize) {
        // A backlog from an outage: keep draining while the server is answering.
        this.inFlight = null;
        await this.flush();
      }
    })();
    try {
      await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  /** Report uncaught errors and rejections as 1901 / 1902. */
  installGlobalErrorHandlers(target: Window): void {
    target.addEventListener('error', (e: ErrorEvent) => {
      this.emit(T.ERROR_WINDOW, { message: String(e?.message ?? 'unknown error') });
    });
    target.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      const reason: any = e?.reason;
      const message = reason && typeof reason === 'object' && 'message' in reason ? String(reason.message) : String(reason);
      this.emit(T.ERROR_UNHANDLED_REJECTION, { message });
    });
  }

  // --- internals -------------------------------------------------------------

  private push(event: TelemetryEvent): void {
    this.queue.push(event);
    this.trimQueue();
  }

  private trimQueue(): void {
    if (this.queue.length > MAX_QUEUE) this.queue.splice(0, this.queue.length - MAX_QUEUE);
  }

  private truncate(props: Props): Props {
    const out: Props = {};
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined) continue;
      out[k] = typeof v === 'string' && v.length > MAX_STRING ? v.slice(0, MAX_STRING) : v;
    }
    return out;
  }

  private serialize(events: TelemetryEvent[]): string {
    return JSON.stringify({ v: 1, visitorId: this.visitorId, sessionId: this.sessionId, events });
  }

  private warnOnce(): void {
    if (this.warnedThisSession) return;
    this.warnedThisSession = true;
    console.warn('[telemetry] could not reach /api/telemetry; events are buffered and will be retried.');
  }

  private installUnloadHandler(): void {
    if (this.unloadInstalled || typeof window === 'undefined') return;
    this.unloadInstalled = true;
    const send = () => {
      if (this.queue.length === 0 || !this.beacon) return;
      const events = this.queue.slice(0, MAX_BATCH);
      const body = this.serialize(events);
      try {
        if (this.beacon(this.config.endpoint, new Blob([body], { type: 'application/json' }))) {
          this.queue.splice(0, events.length);
        }
      } catch {
        /* beacon is best-effort */
      }
    };
    window.addEventListener('pagehide', send);
    window.addEventListener('beforeunload', send);
  }

  private loadVisitorId(): string {
    const read = (k: string) => { try { return this.local?.getItem(k) ?? null; } catch { return null; } };
    const write = (k: string, v: string) => { try { this.local?.setItem(k, v); } catch { /* unavailable */ } };
    const remove = (k: string) => { try { this.local?.removeItem(k); } catch { /* unavailable */ } };

    const existing = read(VISITOR_KEY);
    if (existing) return existing;

    const legacy = read(LEGACY_VISITOR_KEY);
    const id = legacy ? `v_${legacy.replace(ID_BODY_RE, '').slice(0, 48)}` : `v_${randomId()}`;
    write(VISITOR_KEY, id);
    if (legacy) remove(LEGACY_VISITOR_KEY);
    return id;
  }

  private loadSessionId(): string {
    const t = this.now();
    try {
      const raw = this.session?.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { id?: string; lastSeen?: number };
        if (saved.id && typeof saved.lastSeen === 'number' && t - saved.lastSeen < SESSION_IDLE_MS) {
          this.saveSession(saved.id, t);
          return saved.id;
        }
      }
    } catch {
      /* fall through to a fresh id */
    }
    const id = `s_${randomId()}`;
    this.saveSession(id, t);
    return id;
  }

  private touchSession(): void {
    this.saveSession(this.sessionId, this.now());
  }

  private saveSession(id: string, lastSeen: number): void {
    try {
      this.session?.setItem(SESSION_KEY, JSON.stringify({ id, lastSeen }));
    } catch {
      /* unavailable */
    }
  }
}

/** The app-wide instance. Not started until the TelemetryProvider mounts. */
export const telemetry = new TelemetryService();
export default TelemetryService;
