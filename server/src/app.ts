import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import type { Config } from './config';
import { HttpError } from './lib/errors';
import type { OrderService } from './services/orders';
import { paymentsRouter } from './routes/payments';
import { telemetryRouter } from './routes/telemetry';
import type { TelemetryService } from './services/telemetry';

export interface AppDeps {
  config: Config;
  orders: OrderService;
  telemetry: TelemetryService;
}

export function createApp({ config, orders, telemetry }: AppDeps): express.Express {
  const app = express();
  const startedAt = Date.now();

  app.set('trust proxy', config.TRUST_PROXY);
  app.disable('x-powered-by');
  app.use(helmet());

  // Telemetry owns its parsers (bigger bodies, text/plain beacons), so it is mounted
  // ahead of the app-wide JSON parser.
  app.use('/api/telemetry', telemetryRouter(telemetry));

  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      env: config.NODE_ENV,
      paypalEnv: config.PAYPAL_ENV,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      time: new Date().toISOString(),
    });
  });

  app.use('/api/payments', paymentsRouter(config, orders, telemetry));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No such endpoint' } });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    // Malformed JSON from body-parser carries a status; everything else is a 500.
    const status = typeof (err as any)?.status === 'number' ? (err as any).status : 500;
    if (status >= 500) console.error('[app] unhandled error', err);
    res.status(status).json({
      error: {
        code: status === 400 ? 'BAD_JSON' : 'INTERNAL',
        message: status === 400 ? 'Request body is not valid JSON' : 'Something went wrong on our side',
      },
    });
  });

  return app;
}
