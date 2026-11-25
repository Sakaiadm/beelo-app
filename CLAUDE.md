# beelo: regras do repositório

Antes de mexer, leia `docs/00-LEIA-PRIMEIRO.md` e `docs/01-mapa.md`.

## Padrão de código (obrigatório em todo arquivo novo ou alterado)

Siga `docs/08-padrao-de-codigo.md`:
- Todo arquivo começa com o cabeçalho `@arquivo / @tipo / @usa / @usado-por / @cuidado`.
- Arquivos grandes têm seções `// ═══ SEÇÃO: Nome ═══`.
- Use as marcas `@banco`, `@rpc`, `@regra`, `@cuidado`, `@decisao` para facilitar a busca.
- Comentários em português simples, explicando o porquê.

## Regras do projeto

- Marca: escrever sempre "beelo" minúsculo; nenhuma referência visível a "Rotina Ativa".
- Não alterar layout, cores, fontes ou tom sem aprovação do Thomas (prévia primeiro).
- Banco: só por migração nova e numerada em `supabase/migrations/`; nunca editar as antigas.
- Nunca colocar segredos no código, nos documentos ou nos commits.
- Antes de abrir PR: `npm run build`. PRs só de documentação: `bash docs/conferir-so-comentarios.sh`.
- Mudou comportamento? Atualize o documento em `docs/` no mesmo PR.
