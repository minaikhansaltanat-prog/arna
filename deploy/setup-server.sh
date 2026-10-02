#!/usr/bin/env bash
# ARNA: install or update the site on an Ubuntu 24.04 VPS (nginx + static export). Run as root:
#   curl -fsSL https://raw.githubusercontent.com/minaikhansaltanat-prog/arna/main/deploy/setup-server.sh | DOMAIN=arna.kz EMAIL=you@mail.kz bash
# DOMAIN and EMAIL are optional (HTTPS via Let's Encrypt). Without DOMAIN the site is served over http on the server IP.
# "/" opens the standalone demo app by default; ROOT_VIEW=site makes "/" the landing page. Run it again any time to pull the latest code and rebuild. Optional: NEXT_PUBLIC_LEAD_ENDPOINT=https://... for the form.
set -euo pipefail

REPO="${REPO:-https://github.com/minaikhansaltanat-prog/arna.git}"
APP=/opt/arna
WEB=/var/www/arna
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

[ "$(id -u)" = 0 ] || { echo "Run as root (sudo -i)."; exit 1; }
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y git nginx curl ca-certificates rsync

# Node 22 (the build needs 20.9 or newer)
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# `next build` needs roughly 1.5 GB: add 2 GB of swap on small servers
if [ "$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)" -lt 2500 ] && [ -z "$(swapon --show --noheadings)" ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# code
if [ -d "$APP/.git" ]; then git -C "$APP" pull --ff-only; else git clone "$REPO" "$APP"; fi
cd "$APP"
SITE="${DOMAIN:+https://$DOMAIN}"
SITE="${SITE:-http://$(hostname -I | awk '{print $1}')}"
PUPPETEER_SKIP_DOWNLOAD=true npm install --no-audit --no-fund
NEXT_PUBLIC_SITE_URL="$SITE" NEXT_PUBLIC_ROOT_VIEW="${ROOT_VIEW:-demo}" npm run build

# publish
mkdir -p "$WEB"
rsync -a --delete apps/web/out/ "$WEB/"

cat > /etc/nginx/sites-available/arna <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name __SERVER_NAME__;
    root /var/www/arna;
    index index.html;
    charset utf-8;

    gzip on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json image/svg+xml text/plain application/xml;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header X-Frame-Options SAMEORIGIN always;

    location / { try_files $uri $uri/ =404; }
    location /fonts/ { expires 1y; add_header Cache-Control "public, immutable"; add_header X-Content-Type-Options nosniff always; }
    location /_next/static/ { expires 1y; add_header Cache-Control "public, immutable"; add_header X-Content-Type-Options nosniff always; }
    location ~* ^/(brand|images)/ { expires 1d; add_header X-Content-Type-Options nosniff always; }

    error_page 404 /404.html;
}
NGINX
sed -i "s/__SERVER_NAME__/${DOMAIN:-_}/" /etc/nginx/sites-available/arna
ln -sf /etc/nginx/sites-available/arna /etc/nginx/sites-enabled/arna
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null
fi

if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
fi

echo "Done: $SITE/"
