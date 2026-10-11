import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { issueUnlockToken, verifyUnlockToken, TokenError, TOKEN_ISSUER, TOKEN_AUDIENCE } from '../src/lib/token';
import { JWT_SECRET } from './helpers';

const claims = { orderId: 'ORDER1', qty: 2, currency: 'USD', totalCents: 1798 };

describe('unlock token', () => {
  it('round-trips claims', () => {
    // Whole seconds: JWT timestamps are integer seconds.
    const now = new Date(Math.floor(Date.now() / 1000) * 1000);
    const issued = issueUnlockToken(claims, { secret: JWT_SECRET, ttlMinutes: 30, now });
    expect(issued.expiresAt).toBe(new Date(now.getTime() + 30 * 60_000).toISOString());

    const verified = verifyUnlockToken(issued.token, JWT_SECRET);
    expect(verified).toMatchObject({ ...claims, issuedAt: now.toISOString(), expiresAt: issued.expiresAt });
  });

  it('rejects tampering, wrong secret and expiry', () => {
    const issued = issueUnlockToken(claims, { secret: JWT_SECRET, ttlMinutes: 30 });
    expect(() => verifyUnlockToken(issued.token, 'another-secret-that-is-also-32-chars-long')).toThrow(TokenError);
    expect(() => verifyUnlockToken(issued.token.slice(0, -2) + 'xx', JWT_SECRET)).toThrow(TokenError);

    const expired = issueUnlockToken(claims, { secret: JWT_SECRET, ttlMinutes: 1, now: new Date(Date.now() - 10 * 60_000) });
    try {
      verifyUnlockToken(expired.token, JWT_SECRET);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(TokenError);
      expect((err as TokenError).reason).toBe('expired');
    }
  });

  it('rejects a validly signed token with the wrong scope or audience', () => {
    const wrongScope = jwt.sign({ scope: 'other' }, JWT_SECRET, { subject: 'X', issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, expiresIn: '5m' });
    expect(() => verifyUnlockToken(wrongScope, JWT_SECRET)).toThrow(TokenError);
    const wrongAud = jwt.sign({ scope: 'unlock' }, JWT_SECRET, { subject: 'X', issuer: TOKEN_ISSUER, audience: 'someone-else', expiresIn: '5m' });
    expect(() => verifyUnlockToken(wrongAud, JWT_SECRET)).toThrow(TokenError);
    const none = jwt.sign({ scope: 'unlock' }, '', { algorithm: 'none', subject: 'X', issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE, expiresIn: '5m' });
    expect(() => verifyUnlockToken(none, JWT_SECRET)).toThrow(TokenError);
  });
});
