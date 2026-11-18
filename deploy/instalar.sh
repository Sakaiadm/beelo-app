#!/usr/bin/env bash
# Instala/atualiza o Rotina Ativa na VPS. Uso (como root):
#   bash deploy/instalar.sh rotina.sakaiadm.tech
set -euo pipefail
DOMINIO="${1:-rotina.sakaiadm.tech}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORTA=3010
cd "$DIR"

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

[ -f .env ] || cat > .env <<ENV
NEXT_PUBLIC_SUPABASE_URL=https://gvaxypupzgimgftshqng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_VhjURXLbhocvYRlnJsocdw_dnpVBNAv
ENV

# Avisos no celular (push): chaves próprias geradas aqui na VPS, só na primeira vez. Ficam no .env (que não vai para o GitHub).
SEGREDO_NOVO=""
if ! grep -q '^VAPID_PRIVATE_KEY=' .env; then
  CHAVES=$(docker run --rm node:22-alpine node -e "
    const c=require('crypto');const k=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
    const a=k.publicKey.export({format:'jwk'}),b=k.privateKey.export({format:'jwk'});
    console.log(Buffer.concat([Buffer.from([4]),Buffer.from(a.x,'base64url'),Buffer.from(a.y,'base64url')]).toString('base64url'));
    console.log(b.d);")
  {
    echo "VAPID_PUBLIC_KEY=$(echo "$CHAVES" | sed -n 1p)"
    echo "VAPID_PRIVATE_KEY=$(echo "$CHAVES" | sed -n 2p)"
    echo "VAPID_ASSUNTO=https://$DOMINIO"
  } >> .env
fi
if ! grep -q '^PUSH_SEGREDO=' .env; then
  SEGREDO_NOVO=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  echo "PUSH_SEGREDO=$SEGREDO_NOVO" >> .env
fi
chmod 600 .env

docker compose up -d --build
echo "App rodando em 127.0.0.1:$PORTA"

# Proxy reverso com HTTPS
if command -v caddy >/dev/null && [ -f /etc/caddy/Caddyfile ]; then
  grep -q "$DOMINIO" /etc/caddy/Caddyfile || printf '\n%s {\n  reverse_proxy 127.0.0.1:%s\n}\n' "$DOMINIO" "$PORTA" >> /etc/caddy/Caddyfile
  systemctl reload caddy
elif docker ps --format '{{.Image}}' | grep -qi traefik; then
  echo "Traefik detectado: adicione as labels do Traefik no docker-compose.yml para $DOMINIO (ou me avise)."
else
  command -v nginx >/dev/null || { apt-get update && apt-get install -y nginx; }
  cat > /etc/nginx/sites-available/rotina-ativa <<NGX
server {
  listen 80;
  server_name $DOMINIO;
  client_max_body_size 6m;
  # O login (Google/Supabase) devolve cookies grandes; sem isso o nginx dá 502 Bad Gateway.
  proxy_buffer_size 128k;
  proxy_buffers 4 256k;
  proxy_busy_buffers_size 256k;
  large_client_header_buffers 4 32k;
  location / {
    proxy_pass http://127.0.0.1:$PORTA;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGX
  ln -sf /etc/nginx/sites-available/rotina-ativa /etc/nginx/sites-enabled/rotina-ativa
  nginx -t && systemctl reload nginx
  command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos --register-unsafely-without-email --redirect --reinstall || echo "Certificado HTTPS não emitido; rode: certbot --nginx -d $DOMINIO"
fi
echo "Pronto: https://$DOMINIO"
if [ -n "$SEGREDO_NOVO" ]; then
  echo
  echo "=== ÚLTIMO PASSO (uma vez só): liberar os avisos no celular ==="
  echo "Abra https://supabase.com/dashboard/project/gvaxypupzgimgftshqng/sql/new , cole a linha abaixo e clique em Run:"
  echo
  echo "select public.ra_push_definir_segredo('$SEGREDO_NOVO');"
  echo
fi
