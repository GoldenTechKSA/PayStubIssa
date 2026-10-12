# Backend deploy — Node API behind Apache

One-time VPS setup for the PayStubIssa API, then how each deploy runs. Staging
first; production is the same recipe with the values in the last section.

> Same safety rule as [DEPLOYMENT.md](DEPLOYMENT.md): this VPS hosts other sites.
> Every step is additive. `sudo apache2ctl configtest` before every reload, and
> `systemctl reload apache2` (graceful), never `restart`.

| Thing | Staging | Production (later) |
| --- | --- | --- |
| Hostname | `staging.paystubissa.com` | `paystubissa.com` |
| Docroot | `/var/www/staging.paystubissa.com` | `/var/www/paystubissa.com` |
| API folder | `/home/paystubissa/apps/staging/server` | `/home/paystubissa/apps/production/server` |
| PM2 app | `paystub-api-staging` | `paystub-api` |
| Port (loopback) | `4001` | `4000` |
| PayPal | sandbox | live |
| Workflow | `deploy-staging.yml` (push to `staging`, or manual) | `deploy.yml` (push to `master`) |

Everything under `/home/paystubissa` is owned by the deploy user, so the
workflow needs no sudo. Only the steps marked **sudo** are one-time root work.

---

## 1. Install Node LTS and PM2 (sudo, once per VPS)

System-wide install (NodeSource), so `node`/`pm2` are on `PATH` for the
non-interactive SSH session the workflow uses. `nvm` would not be.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
node -v && npm -v                    # expect v22.x

sudo npm install -g pm2
pm2 -v
```

Make PM2 start the deploy user's apps at boot. Run the printed command exactly:

```bash
sudo -u paystubissa pm2 startup systemd -u paystubissa --hp /home/paystubissa
# ↑ prints a `sudo env PATH=... pm2 startup ...` line — copy and run it.
```

## 2. Enable the Apache proxy modules (sudo, once per VPS)

```bash
sudo a2enmod proxy proxy_http headers
sudo apache2ctl configtest && sudo systemctl reload apache2
```

## 3. Staging docroot ownership (sudo, once)

The workflow rsyncs the client build as `paystubissa`, so that user must own
the staging docroot (same as production):

```bash
sudo mkdir -p /var/www/staging.paystubissa.com
sudo chown -R paystubissa:www-data /var/www/staging.paystubissa.com
sudo chmod -R 755 /var/www/staging.paystubissa.com
```

## 4. API folder and `.env` (as the deploy user, once per environment)

```bash
sudo -iu paystubissa
mkdir -p ~/apps/staging/server/data
cd ~/apps/staging/server

# Generate the token secret:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# Create .env — SANDBOX credentials for staging. Nothing else from the laptop's
# .env needs to come along; HOST/PORT/PAYPAL_ENV are pinned by ecosystem.config.cjs.
cat > .env <<'ENV'
NODE_ENV=production
HOST=127.0.0.1
PORT=4001
TRUST_PROXY=1
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=<sandbox client id>
PAYPAL_CLIENT_SECRET=<sandbox secret>
JWT_SECRET=<the generated secret>
UNLOCK_TOKEN_TTL_MINUTES=60
CURRENCY=USD
PRICE_PER_STUB_CENTS=899
MAX_STUBS_PER_ORDER=12
DATABASE_PATH=./data/orders.sqlite
ENV
chmod 600 .env
exit
```

`.env` and `data/` are excluded from the deploy's `--delete`, so they survive
every deploy. `data/orders.sqlite` is the sales ledger: include
`/home/paystubissa/apps/*/server/data` in the VPS backup.

## 5. Apache: proxy `/api` on the staging vhosts (sudo, once)

Copy [apache-paystubissa-api-staging.inc](apache-paystubissa-api-staging.inc) to
`/etc/apache2/sites-available/paystubissa-api-staging.inc`, and replace the
`:80` vhost with the updated [apache-staging.paystubissa.com.conf](apache-staging.paystubissa.com.conf)
(it now carries the `Include`).

HTTPS is served by the certbot-generated `:443` vhost, so it needs the same one
line. This is the only hand edit that file gets; certbot renewals do not rewrite it:

```bash
sudo nano /etc/apache2/sites-available/staging.paystubissa.com-le-ssl.conf
# inside <VirtualHost *:443>, e.g. right after the DocumentRoot line, add:
#     Include /etc/apache2/sites-available/paystubissa-api-staging.inc

sudo apache2ctl configtest          # must print "Syntax OK"
sudo systemctl reload apache2
```

Until the API process is running, `https://staging.paystubissa.com/api/health`
returns a 503 from Apache. That is expected at this point.

## 6. First deploy

Push the branch as `staging` (or run **Deploy to staging** manually from the
Actions tab on your branch). The workflow:

1. tests and builds the client and the server;
2. rsyncs `server/dist`, the manifests and `ecosystem.config.cjs` to the API folder;
3. runs `npm ci --omit=dev` there (builds/downloads the native SQLite binary for
   the VPS's Node) and `pm2 startOrReload … paystub-api-staging`;
4. rsyncs `build/` to the staging docroot;
5. smoke-tests the homepage and `/api/health` (expects `paypalEnv: sandbox`).

Then verify by hand:

```bash
curl -s https://staging.paystubissa.com/api/health
pm2 status                                   # as paystubissa
pm2 logs paystub-api-staging --lines 50
```

and make a sandbox purchase on `https://staging.paystubissa.com/create`. Check
the ledger afterwards:

```bash
cd ~/apps/staging/server
node -e "const D=require('better-sqlite3');console.table(new D('data/orders.sqlite',{readonly:true}).prepare('select id,status,total_cents,captured_cents,captured_at from orders order by created_at desc limit 5').all())"
```

## Troubleshooting

- **`/api/health` is 503** — Node is not listening on the port. `pm2 status`,
  `pm2 logs paystub-api-staging`. A config error (missing `.env` value) exits at
  startup with the exact field named.
- **`/api/health` returns HTML** — the proxy `Include` is missing from the
  `-le-ssl.conf` vhost (step 5), so the SPA fallback answered.
- **Checkout says "temporarily unavailable"** — same cause as above, seen from
  the browser.
- **Checkout shows "payment options could not be loaded"** — the PayPal SDK rejected the
  client id. Usually a paste glitch in `.env`. Check the length without printing the value
  (a PayPal client id is 80–82 characters):
  `grep '^PAYPAL_CLIENT_ID=' .env | cut -d= -f2- | tr -d '
' | wc -c`
  Re-paste the id in `nano .env`, then `pm2 restart <app> --update-env`.
- **PayPal popup asks for a real login / phone code** — the server is on the
  wrong credentials. `/api/health` must say `sandbox` on staging.
- **`npm ci` fails on better-sqlite3** — `build-essential` missing (step 1), or
  Node major changed since the lockfile; re-run step 1.

---

## Production (after staging passes)

Same recipe with the production column of the table: API folder
`~/apps/production/server`, `.env` with **live** credentials and `PORT=4000`,
include file `paystubissa-api.inc` pointing at `127.0.0.1:4000`, `Include`d from
`paystubissa.com.conf` and `paystubissa.com-le-ssl.conf`, PM2 app `paystub-api`.
Then extend `deploy.yml` with the same server steps as `deploy-staging.yml`.
Order matters: the production API must answer `/api/health` **before** the
client build that calls it is merged to `master`.
