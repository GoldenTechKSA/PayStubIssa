# Apache include: proxy /api on staging.paystubissa.com to the staging Node API.
#
# Install as /etc/apache2/sites-available/paystubissa-api-staging.inc and add
#     Include /etc/apache2/sites-available/paystubissa-api-staging.inc
# inside BOTH staging vhosts: staging.paystubissa.com.conf (:80) and the
# certbot-generated staging.paystubissa.com-le-ssl.conf (:443). HTTPS traffic
# is served by the -le-ssl vhost, so it is the one that actually matters; the
# single Include line is the only edit that file needs.
#
# Requires: a2enmod proxy proxy_http headers
#
# /api is matched during URL mapping, so it never reaches the SPA FallbackResource.
# The Node process binds 127.0.0.1 only; this proxy is the sole public path to it.

ProxyPreserveHost On
ProxyPass        /api  http://127.0.0.1:4001/api  retry=0 timeout=30
ProxyPassReverse /api  http://127.0.0.1:4001/api

# Hand the real client IP and scheme to Express (`trust proxy` = 1).
RequestHeader set X-Forwarded-Proto "https" env=HTTPS

# Cache and security headers for the static files (index.html must be re-checked on every
# visit, /static may be kept for a year). Pulled in from here because this file is already
# included by both vhosts, so the certbot-written :443 vhost needs no further hand edit.
Include /etc/apache2/sites-available/paystubissa-headers.inc
