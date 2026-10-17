import { describe, it, expect } from '@jest/globals';
import { T, CLIENT_CODE_MIN, CLIENT_CODE_MAX, NAME_RE, ALLOWED_PROP_KEYS, formatLine, type SiteCode } from '../telemetry/codes';

describe('client site codes', () => {
  const all: readonly SiteCode[] = Object.values(T);

  it('are unique, in range, and well named', () => {
    expect(new Set(all.map(s => s.code)).size).toBe(all.length);
    expect(new Set(all.map(s => s.name)).size).toBe(all.length);
    for (const s of all) {
      expect(s.code).toBeGreaterThanOrEqual(CLIENT_CODE_MIN);
      expect(s.code).toBeLessThanOrEqual(CLIENT_CODE_MAX);
      expect(s.name).toMatch(NAME_RE);
    }
  });

  it('declare only props the server scrubber allows', () => {
    for (const s of all) for (const k of s.props ?? []) expect(ALLOWED_PROP_KEYS.has(k)).toBe(true);
  });

  it('pin the journey codes the SQL view depends on', () => {
    expect(T.WIZARD_ENTERED.code).toBe(1101);
    expect(T.WIZARD_STEP_COMPLETED.code).toBe(1103);
    expect(T.TEMPLATE_SELECTED.code).toBe(1201);
    expect(T.PAYMENT_ORDER_CREATED.code).toBe(1302);
    expect(T.PAYMENT_SUCCEEDED.code).toBe(1304);
    expect(T.PRINT_CLICKED.code).toBe(1401);
    expect(T.PDF_GENERATED.code).toBe(1403);
  });

  it('formats a console line', () => {
    expect(formatLine(T.WIZARD_STEP_COMPLETED, { step: 2 })).toBe('[1103] wizard.step.completed {"step":2}');
  });
});
