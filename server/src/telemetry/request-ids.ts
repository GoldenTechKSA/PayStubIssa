import type { Request } from 'express';
import { telemetryIdRe } from '../routes/schemas';
import type { TelemetryIds } from '../services/telemetry';

export const SESSION_HEADER = 'x-telemetry-session';
export const VISITOR_HEADER = 'x-telemetry-visitor';

/**
 * The browser sends its telemetry ids on payment calls so server-side milestones land
 * under the same session as the client journey. Anything malformed is simply absent.
 */
export function readTelemetryIds(req: Request): TelemetryIds {
  const pick = (header: string): string | undefined => {
    const raw = req.get(header);
    return raw && telemetryIdRe.test(raw) ? raw : undefined;
  };
  return { sessionId: pick(SESSION_HEADER), visitorId: pick(VISITOR_HEADER) };
}
