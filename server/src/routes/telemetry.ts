import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { badRequest } from '../lib/errors';
import { S } from '../telemetry/codes';
import { readTelemetryIds } from '../telemetry/request-ids';
import type { TelemetryService } from '../services/telemetry';
import { telemetryBatchSchema } from './schemas';

const BODY_LIMIT = '64kb';

/**
 * `POST /api/telemetry` — store a batch of anonymous client events.
 *
 * Mount this router BEFORE the app-wide `express.json({ limit: '16kb' })`: it carries its
 * own parsers because a batch can be larger than a payment request, and because the
 * browser's `navigator.sendBeacon` on unload arrives as `text/plain`.
 */
export function telemetryRouter(telemetry: TelemetryService): Router {
  const router = Router();

  router.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' } },
    }),
  );
  router.use(express.json({ limit: BODY_LIMIT }));
  router.use(express.text({ type: 'text/plain', limit: BODY_LIMIT }));

  router.post('/', (req, res) => {
    let body: unknown = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        telemetry.log(S.TELEMETRY_BATCH_REJECTED, { reason: 'BAD_JSON' });
        throw badRequest('BAD_JSON', 'Request body is not valid JSON');
      }
    }

    const parsed = telemetryBatchSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const reason = first ? `${first.path.join('.') || '(root)'}: ${first.message}` : 'invalid';
      telemetry.log(S.TELEMETRY_BATCH_REJECTED, { reason }, readTelemetryIds(req));
      throw badRequest('VALIDATION', 'Invalid telemetry batch', parsed.error.flatten());
    }

    const batch = parsed.data;
    const { stored } = telemetry.ingest(batch, req.get('user-agent'));
    telemetry.log(S.TELEMETRY_BATCH_ACCEPTED, { count: stored }, { sessionId: batch.sessionId, visitorId: batch.visitorId });
    res.status(204).end();
  });

  return router;
}
