#!/usr/bin/env bash
# Roda a trilha do banco num Postgres local descartável (não toca no Supabase real).
# Uso: bash testes/banco-local.sh   (precisa de PostgreSQL 16 instalado)
set -e
D=${PGRA_DIR:-/var/tmp/pgra}; BIN=/usr/lib/postgresql/16/bin; R=$(cd "$(dirname "$0")/.." && pwd)
if ! [ -S "$D/.s.PGSQL.5499" ]; then
  rm -rf "$D"; mkdir -p "$D"; chown postgres "$D"
  su postgres -c "$BIN/initdb -D $D/data -A trust >/dev/null && $BIN/pg_ctl -D $D/data -o '-k $D -p 5499 -c listen_addresses=' -l $D/log start >/dev/null"
  sleep 2
fi
P="psql -h $D -p 5499 -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists ra" -c "create database ra" >/dev/null
$P -d ra -f "$R/supabase/testes/stub_supabase_local.sql"
# @cuidado: a coluna "sexo" existe em produção mas nenhuma migração a cria; aqui ela é criada antes da 0020 para o banco de teste montar.
for f in "$R"/supabase/migrations/*.sql; do
  case "$f" in *0020_*) $P -d ra -c "alter table public.ra_membros add column if not exists sexo text" ;; esac
  $P -d ra -f "$f" 2>&1 | grep -v NOTICE || true
done
$P -d ra -c "insert into public.ra_familias(nome) values ('Nossa família')"
$P -d ra -f "$R/supabase/testes/trilha_banco.sql" 2>&1 | sed -n '/RELATORIO_TESTES/,/CONTEXT/p' | grep -v CONTEXT
