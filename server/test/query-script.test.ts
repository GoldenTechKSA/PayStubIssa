import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { openDatabase } from '../src/db';
import { TelemetryService } from '../src/services/telemetry';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { loadNamedQueries, run } = require('../scripts/query.js');

describe('scripts/query.js', () => {
  const queries = loadNamedQueries(path.join(__dirname, '..', 'sql', 'telemetry-queries.sql'));

  it('ships the five starter queries', () => {
    expect(Object.keys(queries).sort()).toEqual(['errors', 'funnel', 'paid', 'sessions', 'timeline']);
  });

  it('every starter query runs against an empty database', () => {
    const db = openDatabase(':memory:');
    new TelemetryService({ db, enabled: true, retentionDays: 90, out: () => {} });
    for (const [name, sql] of Object.entries(queries)) {
      const params = name === 'timeline' ? ['s_abcdefghij'] : [];
      expect(() => run(db, sql as string, params), name).not.toThrow();
    }
  });
});
