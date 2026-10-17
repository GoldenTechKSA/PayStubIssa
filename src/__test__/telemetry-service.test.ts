import { describe, it, expect, jest } from '@jest/globals';
import {
  TelemetryService, VISITOR_KEY, SESSION_KEY, LEGACY_VISITOR_KEY, SESSION_IDLE_MS, MAX_QUEUE, MAX_STRING,
} from '../services/telemetry-service';
import { T } from '../telemetry/codes';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}

type Res = { ok: boolean; status: number };
const mockFetch = () => jest.fn<Promise<Res>, [string, RequestInit?]>();
type FetchMock = ReturnType<typeof mockFetch>;

const throwing = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); },
} as unknown as Storage;

function make(over: Partial<{ local: Storage | null; session: Storage | null; now: () => number; fetch: FetchMock }> = {}) {
  const local = over.local === undefined ? new MemStorage() : over.local;
  const session = over.session === undefined ? new MemStorage() : over.session;
  const fetch: FetchMock = over.fetch ?? mockFetch().mockResolvedValue({ ok: true, status: 204 });
  const timers: Array<() => void> = [];
  const svc = new TelemetryService({
    local,
    session,
    now: over.now ?? (() => 1_700_000_000_000),
    fetch: fetch as any,
    setInterval: ((fn: () => void) => { timers.push(fn); return 1; }) as any,
    clearInterval: (() => {}) as any,
    echo: () => {},
  });
  svc.start({ enabled: true, batchSize: 10, flushIntervalMs: 10_000, consoleEcho: false, endpoint: '/api/telemetry' });
  return { svc, local, session, fetch, tick: () => timers.forEach(f => f()) };
}

describe('TelemetryService', () => {
  it('mints v_/s_ ids and persists them', () => {
    const { svc, local, session } = make();
    const { visitorId, sessionId } = svc.ids();
    expect(visitorId).toMatch(/^v_[A-Za-z0-9_-]{8,48}$/);
    expect(sessionId).toMatch(/^s_[A-Za-z0-9_-]{8,48}$/);
    expect(local!.getItem(VISITOR_KEY)).toBe(visitorId);
    expect(JSON.parse(session!.getItem(SESSION_KEY)!).id).toBe(sessionId);
  });

  it('migrates the legacy visitor key', () => {
    const local = new MemStorage();
    local.setItem(LEGACY_VISITOR_KEY, 'user_1700000000000_abc123xyz');
    const { svc } = make({ local });
    expect(svc.ids().visitorId).toBe('v_user_1700000000000_abc123xyz');
    expect(local.getItem(LEGACY_VISITOR_KEY)).toBeNull();
  });

  it('keeps the session across a reload and rolls it after 30 idle minutes', () => {
    const session = new MemStorage();
    let t = 1_700_000_000_000;
    const a = make({ session, now: () => t }).svc.ids().sessionId;
    t += 5 * 60 * 1000;
    expect(make({ session, now: () => t }).svc.ids().sessionId).toBe(a);
    t += SESSION_IDLE_MS + 1;
    expect(make({ session, now: () => t }).svc.ids().sessionId).not.toBe(a);
  });

  it('works when storage throws', () => {
    const { svc, fetch } = make({ local: throwing, session: throwing });
    expect(svc.ids().visitorId).toMatch(/^v_/);
    svc.emit(T.APP_LOADED, { path: '/' });
    expect(svc.queueLength()).toBe(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('flushes at batch size with the wire format', async () => {
    const { svc, fetch } = make();
    for (let i = 0; i < 10; i++) svc.emit(T.WIZARD_STEP_VIEWED, { step: i, name: 'x' });
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/telemetry');
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({ v: 1, visitorId: svc.ids().visitorId, sessionId: svc.ids().sessionId });
    expect(body.events).toHaveLength(10);
    expect(body.events[0]).toMatchObject({ code: 1102, name: 'wizard.step.viewed', level: 'info', props: { step: 0, name: 'x' } });
    expect(svc.queueLength()).toBe(0);
  });

  it('flushes on the timer', async () => {
    const { svc, fetch, tick } = make();
    svc.emit(T.APP_LOADED, { path: '/' });
    tick();
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('re-queues on network failure and 5xx, drops on 4xx, caps the queue', async () => {
    const fetch: FetchMock = mockFetch()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 400 });
    const { svc } = make({ fetch });
    svc.emit(T.APP_LOADED, { path: '/' });
    await svc.flush();
    expect(svc.queueLength()).toBe(1);
    await svc.flush();
    expect(svc.queueLength()).toBe(1);
    await svc.flush();
    expect(svc.queueLength()).toBe(0);
    for (let i = 0; i < MAX_QUEUE + 50; i++) svc.emit(T.PAGE_VIEWED, { path: '/x' });
    expect(svc.queueLength()).toBeLessThanOrEqual(MAX_QUEUE);
  });

  it('calls the global timers unbound (browsers reject window.setInterval with a foreign this)', () => {
    const realSet = globalThis.setInterval;
    const realClear = globalThis.clearInterval;
    const strict = function (this: unknown, fn: () => void, ms: number) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      return realSet(fn, ms);
    };
    const strictClear = function (this: unknown, id: any) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      return realClear(id);
    };
    globalThis.setInterval = strict as any;
    globalThis.clearInterval = strictClear as any;
    try {
      const svc = new TelemetryService({ local: new MemStorage(), session: new MemStorage(), echo: () => {} });
      expect(() => svc.start({ enabled: true })).not.toThrow();
      expect(() => svc.stop()).not.toThrow();
    } finally {
      globalThis.setInterval = realSet;
      globalThis.clearInterval = realClear;
    }
  });

  it('drains a backlog in server-sized chunks after an outage', async () => {
    const fetch: FetchMock = mockFetch();
    fetch.mockRejectedValue(new Error('offline'));
    const { svc } = make({ fetch });
    for (let i = 0; i < 150; i++) svc.emit(T.PAGE_VIEWED, { path: '/x' });
    await svc.flush();
    await svc.flush();
    expect(svc.queueLength()).toBe(150);
    fetch.mockResolvedValue({ ok: true, status: 204 });
    const before = fetch.mock.calls.length;
    await svc.flush();
    const sizes = fetch.mock.calls.slice(before).map(c => JSON.parse(String(c[1]?.body)).events.length);
    expect(sizes).toEqual([100, 50]);
    expect(svc.queueLength()).toBe(0);
  });

  it('truncates long strings and is a no-op when disabled', () => {
    const { svc } = make();
    svc.emit(T.ERROR_WINDOW, { message: 'm'.repeat(2000) });
    expect((svc as any).queue[0].props.message).toHaveLength(MAX_STRING);

    const off = new TelemetryService({ local: new MemStorage(), session: new MemStorage(), echo: () => {} });
    off.start({ enabled: false });
    off.emit(T.APP_LOADED, { path: '/' });
    expect(off.queueLength()).toBe(0);
  });
});
