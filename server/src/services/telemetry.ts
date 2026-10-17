import type Database from 'better-sqlite3';
import { S, formatLine, type Level, type SiteCode } from '../telemetry/codes';
import { scrubProps, type Props } from '../telemetry/scrub';

export interface TelemetryIds {
  sessionId?: string;
  visitorId?: string;
}

export interface IncomingEvent {
  code: number;
  name: string;
  level: Level;
  /** Client clock, milliseconds since the epoch. */
  ts: number;
  props?: Props;
}

export interface IncomingBatch {
  v: 1;
  visitorId: string;
  sessionId: string;
  events: IncomingEvent[];
}

export interface TelemetryServiceDeps {
  db: Database.Database;
  /** false = accept batches and discard them (kill switch). */
  enabled: boolean;
  retentionDays: number;
  /** Hard ceiling on stored rows; prune() deletes the oldest beyond it. */
  maxRows?: number;
  now?: () => Date;
  /** Where console lines go; defaults to console.log/warn/error by level. */
  out?: (line: string, level: Level) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Only payment milestones are persisted; intake bookkeeping (20xx) is stdout only. */
const PERSISTED_SERVER_CODE_MIN = 2100;
const USER_AGENT_MAX = 256;
const DEFAULT_MAX_ROWS = 2_000_000;
/** How many accepted batches between opportunistic prunes (the daily timer is the backstop). */
const PRUNE_EVERY_BATCHES = 1000;

const defaultOut = (line: string, level: Level): void => {
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

export class TelemetryService {
  private readonly now: () => Date;
  private readonly out: (line: string, level: Level) => void;
  private readonly insert: Database.Statement;
  private readonly insertMany: Database.Transaction<(rows: InsertRow[]) => void>;
  private pruneTimer: NodeJS.Timeout | null = null;
  private batchesSincePrune = 0;

  constructor(private readonly deps: TelemetryServiceDeps) {
    this.now = deps.now ?? (() => new Date());
    this.out = deps.out ?? defaultOut;
    this.insert = deps.db.prepare(
      `INSERT INTO telemetry_events (received_at, ts, source, visitor_id, session_id, code, name, level, props_json, user_agent)
       VALUES (@received_at, @ts, @source, @visitor_id, @session_id, @code, @name, @level, @props_json, @user_agent)`,
    );
    this.insertMany = deps.db.transaction((rows: InsertRow[]) => {
      for (const row of rows) this.insert.run(row);
    });
  }

  /** Scrub and store a client batch in one transaction. */
  ingest(batch: IncomingBatch, userAgent?: string): { stored: number; scrubbed: string[] } {
    const scrubbed: string[] = [];
    if (!this.deps.enabled) return { stored: 0, scrubbed };

    const receivedAt = this.now().toISOString();
    const ua = userAgent ? userAgent.slice(0, USER_AGENT_MAX) : null;
    const rows: InsertRow[] = batch.events.map(e => {
      const { props, removed } = scrubProps(e.props);
      scrubbed.push(...removed);
      return {
        received_at: receivedAt,
        ts: new Date(e.ts).toISOString(),
        source: 'client',
        visitor_id: batch.visitorId,
        session_id: batch.sessionId,
        code: e.code,
        name: e.name,
        level: e.level,
        props_json: props && Object.keys(props).length ? JSON.stringify(props) : null,
        user_agent: ua,
      };
    });
    this.insertMany(rows);
    if (++this.batchesSincePrune >= PRUNE_EVERY_BATCHES) {
      this.batchesSincePrune = 0;
      this.prune();
    }

    if (scrubbed.length) {
      this.log(S.TELEMETRY_SCRUBBED, { keys: scrubbed.join(',') }, { sessionId: batch.sessionId, visitorId: batch.visitorId });
    }
    return { stored: rows.length, scrubbed };
  }

  /**
   * Emit a server site code: always printed; persisted (source = 'server') only for the
   * 21xx payment milestones and only while telemetry is enabled.
   */
  log(site: SiteCode, props?: Props, ids: TelemetryIds = {}): void {
    this.out(formatLine(site, props), site.level);
    if (!this.deps.enabled || site.code < PERSISTED_SERVER_CODE_MIN) return;
    const ts = this.now().toISOString();
    try {
      this.insert.run({
        received_at: ts,
        ts,
        source: 'server',
        visitor_id: ids.visitorId ?? null,
        session_id: ids.sessionId ?? null,
        code: site.code,
        name: site.name,
        level: site.level,
        props_json: props && Object.keys(props).length ? JSON.stringify(props) : null,
        user_agent: null,
      });
    } catch (err) {
      // This runs on the payment path after money has moved; a telemetry failure must
      // never turn into a failed checkout. The stdout line above already carries the fact.
      console.error(`[telemetry] could not persist ${formatLine(site)}:`, err);
    }
  }

  /** Delete rows received more than `retentionDays` ago. Returns the number deleted. */
  prune(): number {
    const cutoff = new Date(this.now().getTime() - this.deps.retentionDays * DAY_MS).toISOString();
    const byAge = this.deps.db.prepare('DELETE FROM telemetry_events WHERE received_at < ?').run(cutoff).changes;
    const maxRows = this.deps.maxRows ?? DEFAULT_MAX_ROWS;
    const byCount = this.deps.db
      .prepare(
        `DELETE FROM telemetry_events
         WHERE id <= (SELECT id FROM telemetry_events ORDER BY id DESC LIMIT 1 OFFSET ?)`,
      )
      .run(maxRows).changes;
    return byAge + byCount;
  }

  /** Prune now and once a day after that. The timer never keeps the process alive. */
  startPruneTimer(): void {
    if (this.pruneTimer) return;
    this.prune();
    this.pruneTimer = setInterval(() => this.prune(), DAY_MS);
    this.pruneTimer.unref();
  }

  stopPruneTimer(): void {
    if (!this.pruneTimer) return;
    clearInterval(this.pruneTimer);
    this.pruneTimer = null;
  }
}

interface InsertRow {
  received_at: string;
  ts: string;
  source: 'client' | 'server';
  visitor_id: string | null;
  session_id: string | null;
  code: number;
  name: string;
  level: Level;
  props_json: string | null;
  user_agent: string | null;
}
