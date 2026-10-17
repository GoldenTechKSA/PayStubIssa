import { describe, expect, it } from 'vitest';
import { S, SERVER_CODE_MIN, SERVER_CODE_MAX, NAME_RE, formatLine } from '../src/telemetry/codes';

describe('server site codes', () => {
  const all = Object.values(S);

  it('are unique, in range, and well named', () => {
    expect(new Set(all.map(s => s.code)).size).toBe(all.length);
    expect(new Set(all.map(s => s.name)).size).toBe(all.length);
    for (const s of all) {
      expect(s.code).toBeGreaterThanOrEqual(SERVER_CODE_MIN);
      expect(s.code).toBeLessThanOrEqual(SERVER_CODE_MAX);
      expect(s.name).toMatch(NAME_RE);
      expect(['info', 'warn', 'error']).toContain(s.level);
    }
  });

  it('formats a console line', () => {
    expect(formatLine(S.PAYMENTS_ORDER_CAPTURED, { orderId: 'X' })).toBe('[2102] payments.order.captured {"orderId":"X"}');
    expect(formatLine(S.TELEMETRY_BATCH_ACCEPTED)).toBe('[2001] telemetry.batch.accepted');
  });
});
