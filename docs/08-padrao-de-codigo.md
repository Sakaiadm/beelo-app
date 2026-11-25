# Padrão de código e comentários do beelo

Vale para **todo** o código do beelo e para todo código novo. Objetivo: quem abrir o projeto
acha qualquer coisa com uma busca (Ctrl+Shift+F no VS Code) e entende o arquivo em 10 segundos.

## 1. Cabeçalho de arquivo (obrigatório em todo arquivo de `app/`, `components/`, `lib/`, `deploy/`)

Logo na primeira linha do arquivo (antes dos `import`; em arquivos com `'use client'` ou `'use server'`, logo depois dessa linha):

```js
// @arquivo  Nome-do-arquivo: o que ele é, em uma linha.
// @tipo     tela | componente | acao | regra | banco | aviso | offline | infra | teste
// @usa      o que ele precisa (tabelas ra_*, funções rpc, outros arquivos)
// @usado-por quem chama este arquivo
// @cuidado  o que não pode quebrar (opcional, mas escreva sempre que houver armadilha)
```

`@tipo` casa com as cores dos documentos: tela = azul, componente = azul claro, acao/regra = amarelo,
banco = verde, aviso/offline = roxo, infra = cinza, teste = cinza.

## 2. Seções dentro de arquivos grandes (mais de ~100 linhas)

```js
// ═══ SEÇÃO: Tarefas ═══════════════════════════════════
```

Sempre começa com `// ═══ SEÇÃO:` para dar para buscar por `SEÇÃO:` e ver o índice do arquivo.

## 3. Marcas que dá para buscar

| Marca | Quando usar |
|---|---|
| `@banco ra_tarefas` | linha que lê ou grava aquela tabela |
| `@rpc ra_concluir` | linha que chama aquela função do banco |
| `@cuidado` | armadilha, regra escondida, ordem que importa |
| `@regra` | regra de negócio (ex.: "só Pai e Mãe conferem") |
| `@decisao 25/11` | decisão do Thomas que explica o código (data junto) |
| `TODO(thomas)` | pendência combinada |

## 4. Como escrever

- Português simples, sem inglês desnecessário. Explique o **porquê**, não repita o que o código já diz.
- Nomes em português, como já é no projeto (`hojeISO`, `salvarTarefa`). Tabelas e funções do banco com prefixo `ra_`.
- Escreva "beelo" sempre minúsculo. Nunca "Rotina Ativa" em texto visível ao usuário.
- Segredos (senhas, chaves) **nunca** vão no código nem nos documentos. Só o nome da variável.
- SQL novo: arquivo numerado em `supabase/migrations/` (próximo número livre), com cabeçalho `-- @migracao 00NN: o que faz`, `-- @cria` / `-- @altera` listando tabelas e funções, e que seja seguro rodar de novo (`if not exists`).
- Mudou o comportamento? Atualize o documento correspondente em `docs/` no mesmo PR.

## 5. Regra de ouro das partes de documentação

Um PR que só documenta mexe **só** em comentários e em `docs/`. O código sem os comentários tem de ficar idêntico.
Conferência: `bash docs/conferir-so-comentarios.sh`.
