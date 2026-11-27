# Deployment — paystubissa.com

Authoritative deployment guide. Supersedes any older FTP notes.

**Target:** an existing Hostinger VPS that already runs Apache2 with other
websites. **Serving:** static React build via Apache. **Delivery:** GitHub
Actions builds on push to `master` and rsyncs `build/` to the site's docroot
over SSH.

> **Safety rule for every server step below:** this VPS hosts other sites.
> Everything here is *additive* — a new vhost file, a new docroot, a dedicated
> deploy user. Never edit or disable another site's config. Always run
> `sudo apache2ctl configtest` before reloading, and use
> `sudo systemctl reload apache2` (graceful) — never `restart`.

Values used below (change if yours differ):

| Thing            | Value                          |
| ---------------- | ------------------------------ |
| Domain           | `paystubissa.com` (+ `www`)    |
| Docroot          | `/var/www/paystubissa.com`     |
| Deploy SSH user  | `paystubissa`               |
| SSH port         | `22`                           |

---

## 1. Recon — see what's already on the box (don't break it)

SSH into the VPS, then:

```bash
# All configured vhosts, their ports and docroots — confirm paystubissa isn't
# already here and note which docroots belong to OTHER sites (leave them alone).
sudo apache2ctl -S
ls -l /etc/apache2/sites-enabled/

# Confirm the domain resolves to THIS server's public IP before you request TLS.
curl -s ifconfig.me; echo            # this VPS's public IP
dig +short paystubissa.com
dig +short www.paystubissa.com
```

If `dig` does not yet return this VPS's IP, do steps 2–4 now but **defer the TLS
step (5) until DNS points here.** See "DNS cutover" at the bottom.

## 2. Create the docroot and a dedicated deploy user

```bash
# Dedicated, unprivileged user that owns ONLY this site's docroot. Key-only login.
sudo adduser --disabled-password --gecos "" paystubissa

sudo mkdir -p /var/www/paystubissa.com
sudo chown -R paystubissa:www-data /var/www/paystubissa.com
sudo chmod -R 755 /var/www/paystubissa.com

# Placeholder page so the vhost + TLS can be verified before the first CI deploy.
echo '<h1>paystubissa.com is live</h1>' | sudo tee /var/www/paystubissa.com/index.html
sudo chown paystubissa:www-data /var/www/paystubissa.com/index.html
```

Apache (`www-data`) only needs to *read* these files; the `755`/`644` perms rsync
sets (see the workflow) give "other" read access, which is enough.

## 3. Make an SSH key for GitHub Actions

Generate a key pair dedicated to CI (do NOT reuse a personal key):

```bash
sudo -u paystubissa ssh-keygen -t ed25519 -N "" \
  -C "github-actions-paystubissa" \
  -f /home/paystubissa/.ssh/gh-deploy

# Authorize the public half for the deploy user.
sudo -u paystubissa bash -c '
  cat /home/paystubissa/.ssh/gh-deploy.pub >> /home/paystubissa/.ssh/authorized_keys
  chmod 700 /home/paystubissa/.ssh
  chmod 600 /home/paystubissa/.ssh/authorized_keys
'

# Print the PRIVATE key — copy ALL of it (incl. BEGIN/END lines) into the
# GitHub secret SSH_PRIVATE_KEY (step 6). Then delete it from the server.
sudo cat /home/paystubissa/.ssh/gh-deploy
sudo rm /home/paystubissa/.ssh/gh-deploy      # server keeps only authorized_keys

# Pinned host key — copy this whole output into the GitHub secret SSH_KNOWN_HOSTS.
ssh-keyscan -p 22 "$(curl -s ifconfig.me)"
```

## 4. Install the Apache vhost (additive)

Copy [apache-paystubissa.com.conf](apache-paystubissa.com.conf) to the server as
`/etc/apache2/sites-available/paystubissa.com.conf`, then:

```bash
sudo a2enmod rewrite                 # FallbackResource needs mod_rewrite present
sudo a2ensite paystubissa.com.conf   # enables ONLY this new site
sudo apache2ctl configtest           # must print "Syntax OK"
sudo systemctl reload apache2        # graceful; existing sites keep serving

# Verify (if DNS already points here; otherwise test locally with a Host header):
curl -I http://paystubissa.com
curl -I -H 'Host: paystubissa.com' http://127.0.0.1
```

## 5. Enable HTTPS (only after DNS points to this VPS)

```bash
# Install the plugin if it isn't already present (harmless if it is):
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-apache

# Touches ONLY the paystubissa vhost: creates paystubissa.com-le-ssl.conf and
# adds the HTTP->HTTPS redirect. Choose "redirect" when prompted.
sudo certbot --apache -d paystubissa.com -d www.paystubissa.com

sudo apache2ctl configtest && sudo systemctl reload apache2
curl -I https://paystubissa.com      # expect HTTP/2 200
```

Certbot installs its own renewal timer; no extra cron needed.

## 6. Wire up GitHub Actions

In the GitHub repo: **Settings → Secrets and variables → Actions → New repository
secret**, add:

| Secret            | Value                                             |
| ----------------- | ------------------------------------------------- |
| `SSH_PRIVATE_KEY` | the private key printed in step 3                 |
| `SSH_KNOWN_HOSTS` | the `ssh-keyscan` output from step 3              |

Then check the `env:` block in
[.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) matches your
box: `SSH_HOST` (this VPS's public IP), `SSH_USER: paystubissa`, `SSH_PORT`,
`DEPLOY_PATH: /var/www/paystubissa.com`.

The workflow runs on **push to `master`** (and via manual "Run workflow"). Merge
this branch to `master`, then either push a change or trigger it manually from the
**Actions** tab. It builds, rsyncs `build/` into the docroot (with `--delete`, so
the docroot exactly mirrors the build), and smoke-tests `https://paystubissa.com/`.

---

## DNS cutover (from the old shared host)

The site is static, so there's nothing to migrate — cutover = deploy here, then
flip DNS.

1. **Lower TTL** on the `paystubissa.com` A/AAAA records (e.g. 300s) ahead of time.
2. Do steps 1–4 and 6 while DNS still points at the old host (deploy works; TLS waits).
3. Point the apex **and** `www` A records at this VPS's IP.
4. Once `dig` shows the new IP, run step 5 (certbot) and verify `https://`.
5. **Rollback** = point the A records back to the old host; keep it untouched until
   propagation is confirmed. **Only touch A/AAAA (and `www`) — leave MX/TXT/email records alone.**

## Note: `homepage` in package.json

`homepage` is `"/"` (changed 2026-11-11): the site is served at the domain root
on the VPS, so the build emits absolute asset paths (`/static/...`) and deep
routes such as `/create` can never 404 on their assets. The earlier `"."` was a
leftover from the old subfolder FTP hosting. If the site ever moves under a
path prefix, set `homepage` to that prefix.

## Cache and security headers (sudo, once)

Apache sends the static site with no `Cache-Control` and no security headers until
[apache-paystubissa-headers.inc](apache-paystubissa-headers.inc) is installed. The file is
shared by staging and production and explains each header in its comments. In short:

- `index.html` and the other un-hashed files are re-checked with the server on every visit,
  so a deploy reaches returning visitors at once; `/static/*` (hashed names) is kept for a year.
- HTTPS only, no MIME guessing, no framing by other sites, a short referrer, no camera /
  microphone / location.
- An enforced Content-Security-Policy: scripts, images, connections and frames may come only
  from the site itself and PayPal.

The deploy user has no sudo and `AllowOverride None` rules out `.htaccess`, so this is a
manual step. Nothing changes until an `Include` line points at the file; staging gets it first.

```bash
# 1. Put the headers file on the server (paste the repo file's contents, save).
sudo nano /etc/apache2/sites-available/paystubissa-headers.inc

# 2. STAGING: add the Include to the API include both staging vhosts already load.
echo 'Include /etc/apache2/sites-available/paystubissa-headers.inc' \
  | sudo tee -a /etc/apache2/sites-available/paystubissa-api-staging.inc
sudo apache2ctl configtest          # must print "Syntax OK"; if not, do NOT reload
sudo systemctl reload apache2

# 3. Check staging.
curl -sI https://staging.paystubissa.com/ | grep -iE 'cache-control|strict-transport|content-security|x-frame|x-content|referrer|permissions'
#   expect Cache-Control: no-cache and the security headers
curl -sI https://staging.paystubissa.com/create | grep -i cache-control        # no-cache (served from index.html)
JS=$(curl -s https://staging.paystubissa.com/ | grep -o '/static/js/main[^"]*')
curl -sI "https://staging.paystubissa.com$JS" | grep -i cache-control
#   expect public, max-age=31536000, immutable
curl -sI https://staging.paystubissa.com/api/health | grep -ic content-security-policy
#   expect 1: the API's own header, not a second copy

# 4. PRODUCTION, once staging is right: same line into the production include.
echo 'Include /etc/apache2/sites-available/paystubissa-headers.inc' \
  | sudo tee -a /etc/apache2/sites-available/paystubissa-api.inc
sudo apache2ctl configtest && sudo systemctl reload apache2
```

**Roll back** by deleting that `Include` line from the `.inc` file and reloading Apache.

**Updating the file later.** Staging and production share it, so a paste changes both at
once. Replace the whole file, then check syntax before reloading:

```bash
sudo truncate -s 0 /etc/apache2/sites-available/paystubissa-headers.inc
sudo nano /etc/apache2/sites-available/paystubissa-headers.inc
sudo apache2ctl configtest && sudo systemctl reload apache2
```

**Changing the content policy.** A wrong list breaks the PayPal buttons, so never change the
enforced list blind. Either send the new list as a second header,
`Content-Security-Policy-Report-Only` (it blocks nothing; the browser console shows what it
would block), or enforce it on staging only with a second
`<DirectoryMatch "^/var/www/staging\.paystubissa\.com(/|$)">` section placed after the main
one. Then make a sandbox purchase on staging with the console open, download the PDF, and only
then give production the same list. This is how the list was first enforced on 2026-11-27.

---

## Backend (Node API)

Phase 1 adds a Node service behind Apache `mod_proxy` on the same vhost. The
static deploy above is unchanged; the API is an extra PM2 process per
environment (`paystub-api-staging` on `127.0.0.1:4001`, `paystub-api` on
`127.0.0.1:4000`). One-time VPS setup, the Apache proxy include, and the
per-deploy flow are in [BACKEND-DEPLOY.md](BACKEND-DEPLOY.md). Enable the proxy
**before** deploying a client build that calls `/api`, otherwise the SPA
fallback answers API calls with `index.html`.
