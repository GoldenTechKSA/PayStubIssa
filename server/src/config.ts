import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { z } from 'zod';

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

  DATABASE_PATH: z.string().min(1).default('./data/orders.sqlite'),
});

export type Config = z.infer<typeof schema> & { databasePath: string };

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

  return { ...cfg, databasePath };
}
