import jwt from 'jsonwebtoken';

export const TOKEN_ISSUER = 'paystubissa';
export const TOKEN_AUDIENCE = 'paystubissa-web';
const SCOPE = 'unlock';

export interface UnlockClaims {
  orderId: string;
  qty: number;
  currency: string;
  totalCents: number;
}

export interface IssuedToken {
  token: string;
  /** ISO timestamp. */
  expiresAt: string;
}

export interface VerifiedUnlock extends UnlockClaims {
  issuedAt: string;
  expiresAt: string;
}

export class TokenError extends Error {
  constructor(public readonly reason: 'expired' | 'invalid') {
    super(reason === 'expired' ? 'Unlock token has expired' : 'Unlock token is invalid');
    this.name = 'TokenError';
  }
}

export function issueUnlockToken(
  claims: UnlockClaims,
  opts: { secret: string; ttlMinutes: number; now?: Date },
): IssuedToken {
  const now = opts.now ?? new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + opts.ttlMinutes * 60;
  const token = jwt.sign(
    { scope: SCOPE, qty: claims.qty, cur: claims.currency, amt: claims.totalCents, iat, exp },
    opts.secret,
    { algorithm: 'HS256', subject: claims.orderId, issuer: TOKEN_ISSUER, audience: TOKEN_AUDIENCE },
  );
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

export function verifyUnlockToken(token: string, secret: string): VerifiedUnlock {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    }) as jwt.JwtPayload;
  } catch (err) {
    throw new TokenError(err instanceof jwt.TokenExpiredError ? 'expired' : 'invalid');
  }
  if (payload.scope !== SCOPE || typeof payload.sub !== 'string' || !payload.exp || !payload.iat) {
    throw new TokenError('invalid');
  }
  return {
    orderId: payload.sub,
    qty: Number(payload.qty),
    currency: String(payload.cur),
    totalCents: Number(payload.amt),
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}
