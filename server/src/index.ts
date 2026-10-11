import { loadConfig, ConfigError } from './config';
import { openDatabase } from './db';
import { createPayPalClient } from './services/paypal';
import { OrderService } from './services/orders';
import { createApp } from './app';

function main(): void {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }

  const db = openDatabase(config.databasePath);
  const paypal = createPayPalClient({
    env: config.PAYPAL_ENV,
    clientId: config.PAYPAL_CLIENT_ID,
    clientSecret: config.PAYPAL_CLIENT_SECRET,
  });
  const orders = new OrderService({
    db,
    paypal,
    pricing: {
      currency: config.CURRENCY,
      unitCents: { paystub: config.PRICE_PER_STUB_CENTS },
      maxQty: config.MAX_STUBS_PER_ORDER,
      coupons: {},
    },
    jwtSecret: config.JWT_SECRET,
    tokenTtlMinutes: config.UNLOCK_TOKEN_TTL_MINUTES,
  });

  const app = createApp({ config, orders });
  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(
      `[api] listening on http://${config.HOST}:${config.PORT} ` +
        `(env=${config.NODE_ENV}, paypal=${config.PAYPAL_ENV}, db=${config.databasePath})`,
    );
  });

  const shutdown = (signal: string) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(() => {
      db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
