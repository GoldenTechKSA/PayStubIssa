import { z } from 'zod';
import { ITEM_TYPES } from '../services/pricing';

export const cartSchema = z.object({
  items: z
    .array(
      z.object({
        type: z.enum(ITEM_TYPES),
        qty: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(10),
  couponCode: z.string().trim().max(40).optional(),
});

export const createOrderSchema = cartSchema.extend({
  meta: z
    .object({
      attestedAt: z.string().datetime({ offset: true }).optional(),
      templateId: z.union([z.number().int(), z.string().max(64)]).optional(),
    })
    .strict()
    .optional(),
});

export const orderIdParam = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
});

export const verifyUnlockSchema = z.object({
  token: z.string().min(16).max(4096),
});

// --- Telemetry ---------------------------------------------------------------

/** `v_` visitor / `s_` session ids minted by the browser. */
export const telemetryIdRe = /^[vs]_[A-Za-z0-9_-]{8,48}$/;

const TELEMETRY_NAME_RE = /^[a-z0-9_.]{1,64}$/;
const TELEMETRY_TS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TELEMETRY_MAX_EVENTS = 100;
const TELEMETRY_MAX_PROP_KEYS = 32;
const TELEMETRY_MAX_STRING = 500;
const TELEMETRY_MAX_PROPS_JSON = 2048;

const telemetryPropsSchema = z
  .record(
    z.string().min(1).max(64),
    z.union([z.string().max(TELEMETRY_MAX_STRING), z.number().finite(), z.boolean(), z.null()]),
  )
  .refine(p => Object.keys(p).length <= TELEMETRY_MAX_PROP_KEYS, { message: `at most ${TELEMETRY_MAX_PROP_KEYS} keys` })
  .refine(p => JSON.stringify(p).length <= TELEMETRY_MAX_PROPS_JSON, {
    message: `props JSON must be at most ${TELEMETRY_MAX_PROPS_JSON} bytes`,
  });

const telemetryEventSchema = z
  .object({
    // Browsers may only report client codes; server codes come from the server itself.
    code: z.number().int().min(1000).max(1999),
    name: z.string().regex(TELEMETRY_NAME_RE),
    level: z.enum(['info', 'warn', 'error']),
    ts: z
      .number()
      .int()
      .refine(t => Math.abs(Date.now() - t) <= TELEMETRY_TS_WINDOW_MS, { message: 'timestamp is more than 7 days from now' }),
    props: telemetryPropsSchema.optional(),
  })
  .strict();

export const telemetryBatchSchema = z
  .object({
    v: z.literal(1),
    visitorId: z.string().regex(telemetryIdRe),
    sessionId: z.string().regex(telemetryIdRe),
    events: z.array(telemetryEventSchema).min(1).max(TELEMETRY_MAX_EVENTS),
  })
  .strict();
