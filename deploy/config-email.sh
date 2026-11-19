#!/usr/bin/env bash
# Guarda o e-mail de envio dos convites na VPS. A senha é digitada aqui e fica só no arquivo .env da VPS.
#   bash deploy/config-email.sh
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"
read -r -p "Servidor de envio [smtp.hostinger.com]: " H; H="${H:-smtp.hostinger.com}"
read -r -p "Porta [465]: " P; P="${P:-465}"
read -r -p "E-mail que vai enviar (ex.: convite@sakaiadm.tech): " U
read -r -s -p "Senha desse e-mail (não aparece na tela): " S; echo
[ -f .env ] || touch .env
grep -v -E '^(SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|SMTP_DE)=' .env > .env.novo || true
{ echo "SMTP_HOST=$H"; echo "SMTP_PORT=$P"; echo "SMTP_USER=$U"; echo "SMTP_PASS=$S"; echo "SMTP_DE=Rotina Ativa <$U>"; } >> .env.novo
mv .env.novo .env; chmod 600 .env
docker compose up -d
echo "Pronto. O envio de convites está configurado."
