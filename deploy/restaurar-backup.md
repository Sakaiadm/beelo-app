# Restaurar um backup

Os backups ficam em /opt/rotina-ativa-backups (rotina-AAAAMMDD-HHMM.dump).

Para conferir o conteúdo de um backup sem mudar nada:

    docker run --rm -v /opt/rotina-ativa-backups:/b postgres:17-alpine pg_restore -l /b/ARQUIVO.dump | head -30

Para restaurar de verdade (apaga e recria as tabelas do esquema public com as do backup), com o endereço do banco em mãos:

    source /opt/rotina-ativa-backups/.conexao
    docker run --rm -e DATABASE_URL="$DATABASE_URL" -v /opt/rotina-ativa-backups:/b postgres:17-alpine \
      sh -c 'pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" /b/ARQUIVO.dump'

Só restaure com o app parado ou combinando antes, porque os dados atuais serão substituídos.
Não inclui: usuários de login (auth) e fotos (Storage).
