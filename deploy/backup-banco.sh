#!/usr/bin/env bash
# Backup do banco (esquema public, onde ficam todos os dados do Rotina Ativa). Guarda as 14 cópias mais recentes.
set -euo pipefail
PASTA=/opt/rotina-ativa-backups
MANTER=14
[ -f "$PASTA/.conexao" ] || { echo "Falta configurar: bash deploy/config-backup.sh"; exit 1; }
# shellcheck disable=SC1091
source "$PASTA/.conexao"
ARQ="$PASTA/rotina-$(date +%Y%m%d-%H%M).dump"
docker run --rm -e DATABASE_URL="$DATABASE_URL" postgres:17-alpine \
  sh -c 'pg_dump "$DATABASE_URL" --schema=public --no-owner --no-privileges -Fc' > "$ARQ.parcial"
TAM=$(stat -c %s "$ARQ.parcial")
if [ "$TAM" -lt 10000 ]; then rm -f "$ARQ.parcial"; echo "$(date) ERRO: backup vazio ou incompleto"; exit 1; fi
mv "$ARQ.parcial" "$ARQ"; chmod 600 "$ARQ"
ls -1t "$PASTA"/rotina-*.dump | tail -n +$((MANTER + 1)) | xargs -r rm -f
echo "$(date) OK: $(basename "$ARQ") ($((TAM / 1024)) KB). Cópias guardadas: $(ls -1 "$PASTA"/rotina-*.dump | wc -l)"
