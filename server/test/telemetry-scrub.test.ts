import { describe, expect, it } from 'vitest';
import { scrubProps, REDACTED } from '../src/telemetry/scrub';

describe('scrubProps', () => {
  it('drops keys that look like PII or wages', () => {
    const { props, removed } = scrubProps({ employeeName: 'Jane', hourlyRate: 20, ssn: '1', step: 2 });
    expect(props).toEqual({ step: 2 });
    expect(removed.sort()).toEqual(['employeeName', 'hourlyRate', 'ssn']);
  });

  it('keeps allow-listed keys even when they match a deny substring', () => {
    const { props, removed } = scrubProps({ templateId: 3, amountCents: 899, stubCount: 1, name: 'Pay period' });
    expect(props).toEqual({ templateId: 3, amountCents: 899, stubCount: 1, name: 'Pay period' });
    expect(removed).toEqual([]);
  });

  it('redacts SSN, EIN and long digit runs inside strings', () => {
    const { props, removed } = scrubProps({ message: 'ssn 123-45-6789 ein 12-3456789 card 4111111111111111' });
    expect(props?.message).toBe(`ssn ${REDACTED} ein ${REDACTED} card ${REDACTED}`);
    expect(removed).toEqual(['message:value']);
  });

  it('passes undefined through', () => {
    expect(scrubProps(undefined)).toEqual({ props: undefined, removed: [] });
  });
});
