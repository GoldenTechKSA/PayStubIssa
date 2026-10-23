import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { z } from 'zod';
import type { Coupon } from './services/pricing';

/** The server/ folder, independent of the process cwd (PM2, tsx, node dist/ all differ). */
export const SERVER_ROOT = path.resolve(__dirname, '..');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(4000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string().min(1, 'PAYPAL_CLIENT_ID is required'),
  PAYPAL_CLIENT_SECRET: z.string().min(1, 'PAYPAL_CLIENT_SECRET is required'),
  PAYPAL_WEBHOOK_ID: z.string().optional().transform(v => (v && v.length > 0 ? v : undefined)),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  UNLOCK_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(60),

  CURRENCY: z.string().length(3).transform(s => s.toUpperCase()).default('USD'),
  PRICE_PER_STUB_CENTS: z.coerce.number().int().positive().default(899),
  MAX_STUBS_PER_ORDER: z.coerce.number().int().positive().default(12),
  // `CODE:PERCENT,CODE:PERCENT` — hand-made percent-off codes. Parsed at boot so a typo
  // (or a 100% "free" code, which PayPal cannot process) stops the API instead of a customer.
  COUPONS: z
    .string()
    .optional()
    .transform((v, ctx) => {
      try {
        return parseCoupons(v);
      } catch (err) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: (err as Error).message });
        return z.NEVER;
      }
    }),

  DATABASE_PATH: z.string().min(1).default('./data/orders.sqlite'),

  // z.coerce.boolean() would turn the string 'false' into true; parse the usual spellings
  // explicitly so a kill-switch typo cannot stop the API (and payments) from booting.
  TELEMETRY_ENABLED: z
    .string()
    .default('true')
    .transform((v, ctx) => {
      const s = v.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(s)) return true;
      if (['false', '0', 'no', 'off'].includes(s)) return false;
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'TELEMETRY_ENABLED must be true/false (also 1/0, yes/no, on/off)' });
      return z.NEVER;
    }),
  TELEMETRY_RETENTION_DAYS: z.coerce.number().int().positive().default(90),
  TELEMETRY_MAX_ROWS: z.coerce.number().int().positive().default(2_000_000),
});

export type Config = Omit<z.infer<typeof schema>, 'COUPONS'> & {
  databasePath: string;
  /** Keyed by upper-cased code; what `COUPONS` parsed to. */
  coupons: Record<string, Coupon>;
};

const COUPON_CODE_RE = /^[A-Z0-9_-]{1,40}$/;

/**
 * Parse `COUPONS="FRIEND:25, LAUNCH:10"` into the pricing registry. Percent only, whole
 * numbers 1–99: no fixed amounts yet, and never 100% (a $0 order has no PayPal path).
 */
export function parseCoupons(raw: string | undefined): Record<string, Coupon> {
  const coupons: Record<string, Coupon> = {};
  const text = (raw ?? '').trim();
  if (!text) return coupons;

  for (const entry of text.split(',')) {
    const pair = entry.trim();
    if (!pair) continue;
    const m = /^([^:]+):([^:]+)$/.exec(pair);
    if (!m) throw new Error(`COUPONS entry "${pair}" must look like CODE:PERCENT`);
    const code = m[1].trim().toUpperCase();
    const percentText = m[2].trim();
    if (!COUPON_CODE_RE.test(code)) {
      throw new Error(`COUPONS code "${m[1].trim()}" may only use letters, digits, "-" and "_" (max 40)`);
    }
    if (!/^\d+$/.test(percentText)) {
      throw new Error(`COUPONS entry "${code}" percent must be a whole number 1–99, got "${percentText}"`);
    }
    const value = Number(percentText);
    if (value < 1 || value > 99) {
      throw new Error(`COUPONS entry "${code}" percent must be 1–99 (100% off is not supported), got ${value}`);
    }
    if (coupons[code]) throw new Error(`COUPONS has a duplicate code "${code}"`);
    coupons[code] = { code, description: `${value}% off`, kind: 'percent', value };
  }
  return coupons;
}

export class ConfigError extends Error {}

/**
 * Load and validate configuration. Reads `server/.env` (or the file named by
 * PAYSTUB_ENV_FILE) first, then lets real environment variables override it.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const envFile = env.PAYSTUB_ENV_FILE
    ? path.resolve(SERVER_ROOT, env.PAYSTUB_ENV_FILE)
    : path.join(SERVER_ROOT, '.env');
  const fromFile = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {};
  const merged: Record<string, string | undefined> = { ...fromFile, ...env };

  const parsed = schema.safeParse(merged);
  if (!parsed.success) {
    const lines = parsed.error.issues.map(i => `  ${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new ConfigError(`Invalid configuration (checked ${envFile}):\n${lines.join('\n')}`);
  }
  const cfg = parsed.data;

  if (cfg.NODE_ENV === 'production' && cfg.PAYPAL_ENV !== 'live') {
    // Not fatal: staging runs NODE_ENV=production with sandbox on purpose. Make it loud.
    console.warn('[config] NODE_ENV=production but PAYPAL_ENV=sandbox — no real money will move.');
  }
  if (cfg.NODE_ENV !== 'production' && cfg.PAYPAL_ENV === 'live') {
    console.warn('[config] PAYPAL_ENV=live outside production — real cards will be charged.');
  }

  const databasePath = cfg.DATABASE_PATH === ':memory:'
    ? cfg.DATABASE_PATH
    : path.resolve(SERVER_ROOT, cfg.DATABASE_PATH);

  const { COUPONS: coupons, ...rest } = cfg;
  return { ...rest, coupons, databasePath };
}
