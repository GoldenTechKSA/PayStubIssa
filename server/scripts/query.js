#!/usr/bin/env node
/*
 * Read the telemetry / orders database without needing the sqlite3 CLI on the VPS.
 *
 *   node scripts/query.js sessions                 # a named query from sql/telemetry-queries.sql
 *   node scripts/query.js timeline s_xxxxxxxx      # positional args bind to `?` in order
 *   node scripts/query.js --sql "SELECT * FROM telemetry_sessions WHERE paid = 1"
 *   node scripts/query.js --json funnel            # JSON instead of a table
 *
 * Plain CommonJS on purpose: it runs from dist-only deploys with production deps
 * (better-sqlite3, dotenv) and no TypeScript toolchain.
 */
const fs = require('node:fs');
const path = require('node:path');

const SERVER_ROOT = path.resolve(__dirname, '..');
const QUERIES_FILE = path.join(SERVER_ROOT, 'sql', 'telemetry-queries.sql');

/** Split a `.sql` file on `-- name: <id>` headers into { id: sql }. */
function loadNamedQueries(file) {
  const text = fs.readFileSync(file, 'utf8');
  const queries = {};
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const m = /^--\s*name:\s*([A-Za-z0-9_-]+)\s*$/.exec(line);
    if (m) {
      current = m[1];
      queries[current] = '';
      continue;
    }
    if (current !== null) queries[current] += line + '\n';
  }
  for (const k of Object.keys(queries)) queries[k] = queries[k].trim();
  return queries;
}

/** Run one statement and return its rows (an empty array for statements without rows). */
function run(db, sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.reader ? stmt.all(...params) : (stmt.run(...params), []);
}

function openFromEnv() {
  require('dotenv').config({ path: path.join(SERVER_ROOT, '.env') });
  const configured = process.env.DATABASE_PATH || './data/orders.sqlite';
  const file = configured === ':memory:' ? configured : path.resolve(SERVER_ROOT, configured);
  const Database = require('better-sqlite3');
  return new Database(file, { readonly: false, fileMustExist: false });
}

function main(argv) {
  const args = [...argv];
  const json = args.includes('--json');
  if (json) args.splice(args.indexOf('--json'), 1);

  let sql;
  let params = [];
  if (args[0] === '--sql') {
    sql = args[1];
    params = args.slice(2);
    if (!sql) return usage(1);
  } else {
    const queries = loadNamedQueries(QUERIES_FILE);
    const name = args[0];
    if (!name || !queries[name]) return usage(1, Object.keys(queries));
    sql = queries[name];
    params = args.slice(1);
  }

  const db = openFromEnv();
  try {
    const rows = run(db, sql, params);
    if (json) console.log(JSON.stringify(rows, null, 2));
    else if (rows.length === 0) console.log('(no rows)');
    else console.table(rows);
  } catch (err) {
    if (err && /no such table/.test(String(err.message))) {
      console.error(`${err.message}\nThe schema is created when the API starts; start it once (npm run dev / pm2) and retry.`);
      return 1;
    }
    throw err;
  } finally {
    db.close();
  }
  return 0;
}

function usage(code, names = []) {
  const list = names.length ? `\nNamed queries: ${names.join(', ')}` : '';
  console.error(`Usage: node scripts/query.js <name> [args…] | --sql "<statement>" [args…]   [--json]${list}`);
  return code;
}

module.exports = { loadNamedQueries, run };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
