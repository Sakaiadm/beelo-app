#!/usr/bin/env bash
# @arquivo  config-email.sh: guarda o e-mail de envio dos convites (SMTP) no .env da VPS.
# @tipo     infra
# Guarda o e-mail de envio dos convites na VPS. A senha é digitada aqui e fica só no arquivo .env da VPS.
#   bash deploy/config-email.sh
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"

echo "Vou fazer 4 perguntas. Responda uma de cada vez."
echo

while true; do
  echo "1) Servidor de envio. Para Gmail é: smtp.gmail.com  (toque Enter para usar esse)"
  read -r -p "   Servidor [smtp.gmail.com]: " H; H="${H:-smtp.gmail.com}"; H="${H// /}"
  if [[ "$H" == *.* && "$H" != *@* ]]; then break; fi
  echo "   Isso não parece um servidor (deve ter ponto, como smtp.gmail.com). Tente de novo."
done

while true; do
  echo "2) Porta. Use 465  (toque Enter para usar essa)"
  read -r -p "   Porta [465]: " P; P="${P:-465}"
  if [[ "$P" =~ ^[0-9]+$ ]]; then break; fi
  echo "   A porta é só número, por exemplo 465. Tente de novo."
done

while true; do
  echo "3) O seu e-mail completo, que vai enviar os convites. Exemplo: nome@gmail.com"
  read -r -p "   E-mail: " U; U="${U// /}"
  if [[ "$U" == *@*.* ]]; then break; fi
  echo "   Isso não parece um e-mail (falta o @ ou o ponto). Tente de novo."
done

while true; do
  echo "4) A senha de app de 16 letras (não a senha normal). Ela não aparece na tela enquanto você cola."
  read -r -s -p "   Senha de app: " S; echo
  S="${S// /}"
  if [[ ${#S} -ge 8 ]]; then break; fi
  echo "   A senha ficou vazia ou curta demais. Tente de novo."
done

[ -f .env ] || touch .env
grep -v -E '^(SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASS|SMTP_DE)=' .env > .env.novo || true
{ echo "SMTP_HOST=$H"; echo "SMTP_PORT=$P"; echo "SMTP_USER=$U"; echo "SMTP_PASS=$S"; echo "SMTP_DE=beelo <$U>"; } >> .env.novo
mv .env.novo .env; chmod 600 .env
docker compose up -d
echo
echo "Pronto. Guardei: servidor=$H  porta=$P  e-mail=$U  (a senha foi guardada, mas não aparece aqui)."
echo "Agora teste: Cadastros > Pessoas > Convidar."
