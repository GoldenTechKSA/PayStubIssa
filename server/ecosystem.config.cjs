/**
 * PM2 process definitions for the PayStubIssa API.
 *
 * Each environment is its own checkout with its own `.env` (loaded by src/config.ts
 * relative to the server folder, so `cwd` is what selects the environment):
 *
 *   /srv/paystubissa/server          → paystub-api          (live PayPal,    :4000)
 *   /srv/paystubissa-staging/server  → paystub-api-staging  (sandbox PayPal, :4001)
 *
 * Usage (from the checkout's server/ folder, after `npm ci && npm run build`):
 *   pm2 start ecosystem.config.cjs --only paystub-api-staging
 *   pm2 save && pm2 startup       # persist across reboots (first time only)
 *   pm2 reload paystub-api-staging  # zero-downtime restart after a deploy
 *
 * HOST/PORT/PAYPAL_ENV here override `.env` as a guard rail so the wrong process can
 * never bind the other one's port or environment.
 */
module.exports = {
  apps: [
    {
      name: 'paystub-api',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: 4000, PAYPAL_ENV: 'live' },
    },
    {
      name: 'paystub-api-staging',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: 4001, PAYPAL_ENV: 'sandbox' },
    },
  ],
};
