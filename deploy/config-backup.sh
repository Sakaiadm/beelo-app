#!/usr/bin/env bash
# Configura o backup diário do banco (Supabase) na VPS. A senha do banco é digitada aqui e fica só no arquivo /opt/rotina-ativa-backups/.conexao (somente o administrador lê).
#   bash deploy/config-backup.sh
set -euo pipefail
PASTA=/opt/rotina-ativa-backups
mkdir -p "$PASTA"; chmod 700 "$PASTA"
cd "$(cd "$(dirname "$0")/.." && pwd)"

echo "Cole o endereço de conexão do banco (Supabase > Connect > Session pooler)."
echo "Ele começa com postgresql:// e tem [YOUR-PASSWORD], que você troca pela senha do banco."
echo "Nada aparece na tela enquanto você cola."
while true; do
  read -r -s -p "Endereço: " U; echo
  U="${U// /}"
  if [[ "$U" == postgresql://* || "$U" == postgres://* ]] && [[ "$U" != *YOUR-PASSWORD* && "$U" != *'['* ]]; then break; fi
  echo "Não parece certo: deve começar com postgresql:// e a senha já trocada (sem [YOUR-PASSWORD]). Tente de novo."
done
umask 077
printf 'DATABASE_URL=%s\n' "$U" > "$PASTA/.conexao"
chmod 600 "$PASTA/.conexao"
cp deploy/backup-banco.sh /usr/local/bin/rotina-backup
chmod 755 /usr/local/bin/rotina-backup
echo '0 3 * * * root /usr/local/bin/rotina-backup >> /opt/rotina-ativa-backups/backup.log 2>&1' > /etc/cron.d/rotina-backup
chmod 644 /etc/cron.d/rotina-backup
echo "Configurado. Vou fazer o primeiro backup agora para testar..."
/usr/local/bin/rotina-backup
