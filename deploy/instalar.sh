#!/usr/bin/env bash
# Instala/atualiza o beelo (antigo Rotina Ativa) na VPS. Uso (como root):
#   bash deploy/instalar.sh beeloapp.com rotina.sakaiadm.tech
# 1º endereço = o principal (www também entra, se já apontar para a VPS).
# 2º endereço (opcional) = o antigo, que passa a levar direto para o principal.
set -euo pipefail
DOMINIO="${1:-beeloapp.com}"
ANTIGO="${2:-}"
MEUS_IPS=" $(hostname -I 2>/dev/null) $(curl -s -m 5 https://api.ipify.org 2>/dev/null || true) "
ip_de() { getent ahostsv4 "$1" 2>/dev/null | awk 'NR==1{print $1}'; }
aponta() { local ip; ip=$(ip_de "$1"); [ -n "$ip" ] && echo "$MEUS_IPS" | grep -q " $ip "; }
IP_DOMINIO=$(ip_de "$DOMINIO")
if ! aponta "$DOMINIO"; then
  echo "PAREI SEM MUDAR NADA: $DOMINIO ainda não aponta para esta VPS (aponta para: ${IP_DOMINIO:-nenhum})."
  echo "Confira o DNS na Hostinger, espere alguns minutos e rode o comando de novo."
  exit 1
fi
WWW=""; aponta "www.$DOMINIO" && WWW="www.$DOMINIO"
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
# Endereço público usado nos e-mails de convite e nos avisos: sempre o principal
sed -i '/^APP_URL=/d' .env; echo "APP_URL=https://$DOMINIO" >> .env
sed -i "s#^VAPID_ASSUNTO=.*#VAPID_ASSUNTO=https://$DOMINIO#" .env
chmod 600 .env

docker compose up -d --build
echo "App rodando em 127.0.0.1:$PORTA"

# Proxy reverso com HTTPS
if command -v caddy >/dev/null && [ -f /etc/caddy/Caddyfile ]; then
  grep -q "^$DOMINIO" /etc/caddy/Caddyfile || printf '\n%s {\n  reverse_proxy 127.0.0.1:%s\n}\n' "$DOMINIO${WWW:+, $WWW}" "$PORTA" >> /etc/caddy/Caddyfile
  if [ -n "$ANTIGO" ]; then
    sed -i "/^$ANTIGO {/,/^}/d" /etc/caddy/Caddyfile
    printf '\n%s {\n  redir https://%s{uri} permanent\n}\n' "$ANTIGO" "$DOMINIO" >> /etc/caddy/Caddyfile
  fi
  systemctl reload caddy
elif docker ps --format '{{.Image}}' | grep -qi traefik; then
  echo "Traefik detectado: adicione as labels do Traefik no docker-compose.yml para $DOMINIO (ou me avise)."
else
  command -v nginx >/dev/null || { apt-get update && apt-get install -y nginx; }
  cat > /etc/nginx/sites-available/rotina-ativa <<NGX
server {
  listen 80;
  server_name $DOMINIO $WWW;
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
  if [ -n "$ANTIGO" ]; then
    cat >> /etc/nginx/sites-available/rotina-ativa <<NGX

# Endereço antigo: leva direto para o novo, mantendo a página
server {
  listen 80;
  server_name $ANTIGO;
  return 301 https://$DOMINIO\$request_uri;
}
NGX
  fi
  ln -sf /etc/nginx/sites-available/rotina-ativa /etc/nginx/sites-enabled/rotina-ativa
  nginx -t && systemctl reload nginx
  command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
  NOMES=(-d "$DOMINIO"); [ -n "$WWW" ] && NOMES+=(-d "$WWW"); [ -n "$ANTIGO" ] && aponta "$ANTIGO" && NOMES+=(-d "$ANTIGO")
  certbot --nginx "${NOMES[@]}" --cert-name "$DOMINIO" --expand --non-interactive --agree-tos --register-unsafely-without-email --redirect --reinstall \
    || certbot --nginx -d "$DOMINIO" --cert-name "$DOMINIO" --non-interactive --agree-tos --register-unsafely-without-email --redirect --reinstall \
    || echo "Certificado HTTPS não emitido. Confira se o domínio já aponta para a VPS e rode de novo."
fi
[ -z "$WWW" ] && echo "Aviso: www.$DOMINIO ainda não aponta para a VPS (ficou de fora). Quando apontar, rode o comando de novo."
echo "Pronto: https://$DOMINIO"
if [ -n "$SEGREDO_NOVO" ]; then
  echo
  echo "=== ÚLTIMO PASSO (uma vez só): liberar os avisos no celular ==="
  echo "Abra https://supabase.com/dashboard/project/gvaxypupzgimgftshqng/sql/new , cole a linha abaixo e clique em Run:"
  echo
  echo "select public.ra_push_definir_segredo('$SEGREDO_NOVO');"
  echo
fi
