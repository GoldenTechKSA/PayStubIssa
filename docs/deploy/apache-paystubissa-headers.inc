# Apache include: cache and security headers for the static site, shared by production
# and staging.
#
# Install as /etc/apache2/sites-available/paystubissa-headers.inc. It is pulled in by
# paystubissa-api.inc and paystubissa-api-staging.inc, which every vhost of the site
# already includes (:80 and the certbot :443 one), so no vhost file needs a hand edit.
# Steps and checks: docs/deploy/DEPLOYMENT.md, "Cache and security headers".
#
# Requires: a2enmod headers (already enabled for the API proxy).
#
# Everything is inside <DirectoryMatch> on purpose: the headers go on files served from
# the docroot only. /api is proxied to Node and never maps to a directory, so its
# responses keep the headers the API sets itself (helmet) and nothing is sent twice.
# `always` puts a header on every response from the docroot, 304s and error pages too.

# --- Every file of the site ---------------------------------------------------------
<DirectoryMatch "^/var/www/(staging\.)?paystubissa\.com(/|$)">
    # CACHE. "no-cache" does not mean "do not store": the browser keeps its copy but
    # asks the server "has this changed?" before using it (a tiny 304 answer when it
    # has not). index.html names the current /static/js/main.<hash>.js, so a browser
    # that reuses an old index.html without asking keeps running the old site after a
    # deploy. The template configs, thumbnails and favicon keep their file names from
    # deploy to deploy, so they need the same check.
    Header always set Cache-Control "no-cache"

    # SECURITY.
    # Use HTTPS only, for a year, on this domain and its subdomains (the API already
    # says the same).
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    # Trust the Content-Type we send; do not guess that a file is a script.
    Header always set X-Content-Type-Options "nosniff"
    # No other website may show this site inside a frame (clickjacking). The
    # Content-Security-Policy below says the same for current browsers.
    Header always set X-Frame-Options "SAMEORIGIN"
    # Other sites learn the domain a visitor came from, never the page.
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    # The site never needs the camera, microphone or location.
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"

    # CONTENT POLICY (enforced): the list of where scripts, styles, images, fonts,
    # connections and frames may come from: the site itself and PayPal. The browser
    # refuses anything else. Anything new the site loads from another domain has to be
    # added here first, or it will not load.
    #
    # script-src carries 'unsafe-inline' because PayPal's button code writes a small
    # script straight into the page; without it the buttons are refused. The stricter way
    # is a per-visit nonce handed to the PayPal script as data-csp-nonce, which needs the
    # server to make one on every visit. style-src carries 'unsafe-inline' for MUI, which
    # writes its styles into the page.
    #
    # History: ran report-only first; a sandbox purchase on 2026-11-27 showed the inline
    # script as the one thing missing. Enforced on staging first, where a sandbox purchase
    # and a PDF download worked, then on production.
    #
    # To try a change without risk, send the new list as
    # Content-Security-Policy-Report-Only next to this header: it blocks nothing and the
    # browser console shows what it would block.
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.paypal.com https://*.paypalobjects.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.paypal.com https://*.paypalobjects.com; font-src 'self' data:; connect-src 'self' https://*.paypal.com https://*.paypalobjects.com; frame-src https://*.paypal.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
</DirectoryMatch>

# --- /static: the build's hashed files ----------------------------------------------
# main.<hash>.js and friends get a new name whenever their content changes, so a copy
# can be kept for a year and never re-checked. This section comes last, so its
# Cache-Control replaces the one at the top. A request for a /static file that no longer
# exists is answered with index.html by FallbackResource; that file is in the docroot,
# not in /static, so it correctly gets "no-cache" and is never stored for a year.
<DirectoryMatch "^/var/www/(staging\.)?paystubissa\.com/static(/|$)">
    Header always set Cache-Control "public, max-age=31536000, immutable"
</DirectoryMatch>
