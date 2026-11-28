import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { HttpError } from '../lib/errors';
import type { TelemetryService } from '../services/telemetry';
import { ATTENTION_OUTCOMES, readSignature, type WebhookService } from '../services/webhooks';
import { S } from '../telemetry/codes';

const BODY_LIMIT = '256kb';

/**
 * POST /api/payments/webhook — PayPal's own notifications (see services/webhooks.ts).
 *
 * Mount this router BEFORE the app-wide `express.json()` and outside the payments router: the
 * signature covers the body exactly as sent, so it is read as text and never re-serialised,
 * and PayPal's deliveries must not share the customers' payment rate limit.
 *
 * Answers: 200 once the event is recorded (also for a repeat or an event that needs no action),
 * 400 for anything that is not a verifiable PayPal event, 502 when PayPal's verify call fails
 * and 503 while no webhook id is configured. PayPal re-sends on anything but a 2xx.
 */
export function webhookRouter(webhooks: WebhookService, telemetry: TelemetryService): Router {
  const router = Router();

  // Every request costs a call to PayPal's verify API; cap what an anonymous caller can spend.
  router.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' } },
    }),
  );
  router.use(express.text({ type: () => true, limit: BODY_LIMIT }));

  router.post('/', async (req, res) => {
    const rawBody = typeof req.body === 'string' ? req.body : '';
    let result;
    try {
      result = await webhooks.receive(rawBody, readSignature(name => req.get(name)));
    } catch (err) {
      telemetry.log(S.PAYMENTS_WEBHOOK_REJECTED, { code: err instanceof HttpError ? err.code : 'INTERNAL' });
      throw err;
    }
    const props = { eventType: result.eventType, outcome: result.outcome, ...(result.orderId ? { orderId: result.orderId } : {}) };
    if (ATTENTION_OUTCOMES.includes(result.outcome)) telemetry.log(S.PAYMENTS_WEBHOOK_ATTENTION, props);
    else telemetry.log(S.PAYMENTS_WEBHOOK_PROCESSED, props);
    res.json({ ok: true, outcome: result.outcome });
  });

  return router;
}
