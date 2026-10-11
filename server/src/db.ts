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
