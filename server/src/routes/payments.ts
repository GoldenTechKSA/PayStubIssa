import { Router, type Request } from 'express';
import rateLimit from 'express-rate-limit';
import type { Config } from '../config';
import { badRequest } from '../lib/errors';
import type { OrderService } from '../services/orders';
import { cartSchema, createOrderSchema, orderIdParam, verifyUnlockSchema } from './schemas';
import type { z } from 'zod';

function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw badRequest('VALIDATION', 'Invalid request', result.error.flatten());
  }
  return result.data;
}

export function paymentsRouter(config: Config, orders: OrderService): Router {
  const router = Router();

  // Payment endpoints call PayPal; keep abusers from burning the API quota.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down.' } },
  });
  router.use(limiter);

  /** Public settings the browser needs to boot the PayPal SDK and display prices. */
  router.get('/config', (_req, res) => {
    res.json({
      paypalEnv: config.PAYPAL_ENV,
      clientId: config.PAYPAL_CLIENT_ID,
      currency: config.CURRENCY,
      unitCents: { paystub: config.PRICE_PER_STUB_CENTS },
      maxQty: config.MAX_STUBS_PER_ORDER,
    });
  });

  /** Price a cart without creating anything. */
  router.post('/quote', (req, res) => {
    const cart = parse(cartSchema, req.body);
    res.json({ quote: orders.quote(cart) });
  });

  router.post('/orders', async (req, res) => {
    const body = parse(createOrderSchema, req.body);
    const meta = { ...(body.meta ?? {}), userAgent: req.get('user-agent')?.slice(0, 256), ip: clientIp(req) };
    const result = await orders.createOrder({ items: body.items, couponCode: body.couponCode }, meta);
    res.status(201).json(result);
  });

  router.post('/orders/:id/capture', async (req, res) => {
    const { id } = parse(orderIdParam, req.params);
    const result = await orders.captureOrder(id);
    res.json(result);
  });

  router.post('/unlock/verify', (req, res) => {
    const { token } = parse(verifyUnlockSchema, req.body);
    const claims = orders.verifyUnlock(token);
    res.json({ valid: true, ...claims });
  });

  return router;
}

function clientIp(req: Request): string | undefined {
  return req.ip;
}
