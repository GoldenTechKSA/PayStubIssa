import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type OrderStatus = 'CREATED' | 'COMPLETED' | 'FAILED';

export interface OrderRow {
  id: string;
  status: OrderStatus;
  paypal_env: string;
  currency: string;
  total_cents: number;
  quote_json: string;
  coupon_code: string | null;
  client_meta_json: string | null;
  capture_id: string | null;
  captured_cents: number | null;
  capture_json: string | null;
  failure_reason: string | null;
  created_at: string;
  captured_at: string | null;
  updated_at: string;
}

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS orders (
     id               TEXT PRIMARY KEY,
     status           TEXT NOT NULL CHECK (status IN ('CREATED','COMPLETED','FAILED')),
     paypal_env       TEXT NOT NULL,
     currency         TEXT NOT NULL,
     total_cents      INTEGER NOT NULL,
     quote_json       TEXT NOT NULL,
     coupon_code      TEXT,
     client_meta_json TEXT,
     capture_id       TEXT,
     captured_cents   INTEGER,
     capture_json     TEXT,
     failure_reason   TEXT,
     created_at       TEXT NOT NULL,
     captured_at      TEXT,
     updated_at       TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS orders_status_created ON orders (status, created_at);`,

  // 2 — telemetry events (client journey + server payment milestones) and the funnel view.
  `CREATE TABLE IF NOT EXISTS telemetry_events (
     id          INTEGER PRIMARY KEY,
     received_at TEXT    NOT NULL,
     ts          TEXT    NOT NULL,
     source      TEXT    NOT NULL CHECK (source IN ('client','server')),
     visitor_id  TEXT,
     session_id  TEXT,
     code        INTEGER NOT NULL,
     name        TEXT    NOT NULL,
     level       TEXT    NOT NULL CHECK (level IN ('info','warn','error')),
     props_json  TEXT,
     user_agent  TEXT
   );
   CREATE INDEX IF NOT EXISTS telemetry_events_session ON telemetry_events (session_id, ts);
   CREATE INDEX IF NOT EXISTS telemetry_events_code    ON telemetry_events (code, ts);
   CREATE INDEX IF NOT EXISTS telemetry_events_time    ON telemetry_events (received_at);
   CREATE VIEW IF NOT EXISTS telemetry_sessions AS
   SELECT session_id,
          MIN(visitor_id)                                                         AS visitor_id,
          MIN(ts)                                                                 AS started_at,
          MAX(ts)                                                                 AS last_seen_at,
          COUNT(*)                                                                AS events,
          MAX(CASE WHEN code = 1101 THEN 1 ELSE 0 END)                            AS entered_wizard,
          MAX(CASE WHEN code = 1103 THEN json_extract(props_json, '$.step') END)  AS max_step_completed,
          MAX(CASE WHEN code = 1201 THEN 1 ELSE 0 END)                            AS picked_template,
          MAX(CASE WHEN code = 1302 THEN 1 ELSE 0 END)                            AS started_payment,
          MAX(CASE WHEN code IN (1304, 2102) THEN 1 ELSE 0 END)                   AS paid,
          COALESCE(MAX(CASE WHEN code = 2102 THEN json_extract(props_json, '$.orderId') END),
                   MAX(CASE WHEN code = 1304 THEN json_extract(props_json, '$.orderId') END)) AS order_id,
          MAX(CASE WHEN code IN (1401, 1403) THEN 1 ELSE 0 END)                   AS printed_or_downloaded,
          SUM(CASE WHEN level = 'error' THEN 1 ELSE 0 END)                        AS errors
   FROM telemetry_events
   WHERE session_id IS NOT NULL
   GROUP BY session_id;`,
];

/** Open (creating if needed) the SQLite file and bring the schema up to date. */
export function openDatabase(file: string): Database.Database {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const row = db.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined;
  let version = row?.version ?? 0;
  if (!row) db.prepare('INSERT INTO schema_version (version) VALUES (0)').run();

  const apply = db.transaction((sql: string, next: number) => {
    db.exec(sql);
    db.prepare('UPDATE schema_version SET version = ?').run(next);
  });
  while (version < MIGRATIONS.length) {
    apply(MIGRATIONS[version], version + 1);
    version += 1;
  }
}
