# Apache include: proxy /api on paystubissa.com to the PRODUCTION Node API.
#
# Install as /etc/apache2/sites-available/paystubissa-api.inc and add
#     Include /etc/apache2/sites-available/paystubissa-api.inc
# inside BOTH production vhosts: paystubissa.com.conf (:80) and the
# certbot-generated paystubissa.com-le-ssl.conf (:443). HTTPS traffic is served
# by the -le-ssl vhost, so it is the one that actually matters.
#
# Requires: a2enmod proxy proxy_http headers (already enabled for staging).
#
# /api is matched during URL mapping, so it never reaches the SPA FallbackResource.
# PM2 app `paystub-api` binds 127.0.0.1:4000 only; this proxy is the sole public path.

ProxyPreserveHost On
ProxyPass        /api  http://127.0.0.1:4000/api  retry=0 timeout=30
ProxyPassReverse /api  http://127.0.0.1:4000/api

# Hand the real scheme to Express (`trust proxy` = 1).
RequestHeader set X-Forwarded-Proto "https" env=HTTPS
