# beelo: leia primeiro

O **beelo** é um aplicativo (PWA, abre no navegador e instala no celular) para famílias organizarem a rotina:
tarefas, tempo de tela, desafios e prêmios, com papéis (Pai, Mãe, Adulto que ajuda, Filho(a)).
Endereço: beeloapp.com. Escreva sempre "beelo" em minúsculo. (O nome antigo era "Rotina Ativa": ainda aparece em nomes internos, como a pasta `/opt/rotina-ativa` na VPS e o serviço do Docker.)

## Em uma frase por camada

| Camada | O que é | Onde |
|---|---|---|
| Telas | Next.js 15 + React 19, páginas no servidor | `app/` |
| Peças de tela | botões, formulários, listas (a maioria roda no aparelho) | `components/` |
| Regras | cálculos e decisões, sem desenho | `lib/` e `app/acoes*.js` |
| Banco | Supabase (Postgres) com tabelas `ra_*` e segurança por família | `supabase/migrations/` |
| Avisos | push no celular, e-mail de convite | `lib/despachante.js`, `lib/convite.js` |
| Offline | service worker e fila no aparelho | `public/sw.js`, `lib/fila.js` |
| Publicação | Docker na VPS, HTTPS pelo Caddy | `deploy/`, `Dockerfile` |

## Roteiro de leitura (30 minutos)

1. `docs/01-mapa.md`: o mapa e onde fica cada assunto.
2. `docs/08-padrao-de-codigo.md`: como os arquivos são comentados e como buscar (`@arquivo`, `SEÇÃO:`, `@banco`).
3. `app/(app)/layout.js` (o topo de toda tela) e `lib/sessao.js` (quem está logado e de qual família).
4. `app/(app)/hoje/page.js` e `components/Tarefa.js`: o caminho de uma tarefa, da tela até o banco.
5. `app/acoes.js`: tudo que grava passa por aqui.

## Como rodar no seu computador

```bash
npm install
# crie um arquivo .env.local com:
#   NEXT_PUBLIC_SUPABASE_URL=...    (endereço do projeto Supabase)
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=... (chave pública; a segurança está nas regras RLS do banco)
npm run dev      # abre em http://localhost:3000
npm run build    # confere se compila (rode antes de qualquer PR)
```

A letra (Plus Jakarta Sans) fica em `app/fonts/` (licença OFL junto) e é carregada com `next/font/local`: a build **não** baixa nada do Google. Não volte para `next/font/google`.

Variáveis opcionais (só os nomes; valores ficam no `.env` da VPS, que nunca vai para o GitHub):
`APP_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_DE` (e-mail), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_ASSUNTO`, `PUSH_SEGREDO` (avisos no celular), `CADASTRO_ABERTO`.

## Testes

Pasta `testes/`: usam um Supabase falso (`mock-supabase.mjs`) para percorrer telas e ações (`rotas.mjs`, `acoes.mjs`, `offline.mjs`, `push.mjs`). O banco tem sua trilha própria em `supabase/testes/` (rodar com `bash testes/banco-local.sh`, precisa de PostgreSQL 16).

- `testes/acoes-novas.mjs`: botões e formulários de Desafios, Vitrine, desejos, tarefas e cadastros (rodar com o app em 127.0.0.1:3100 e `MOCK_DESAFIOS=1 MOCK_DESEJOS=1` no Supabase falso; `SO="texto"` roda só um caso).
- Criança no Supabase falso: `MOCK_CRIANCA=1` e `MOCK_JEITO=divertido|calmo`.
- `testes/acoes.mjs` está desatualizado em vários pontos (telas mudaram desde as PRs 62 a 64); prefira `acoes-novas.mjs`.
- As trilhas do banco (`trilha_banco`, `trilha_desafios`, `trilha_desejos`) passam: 112, 25 e 22 testes.

## Regras que não mudam

- Mudou comportamento? Mexa no banco por **migração numerada nova**, nunca editando as antigas.
- Nunca coloque segredo (senha, chave privada) no código ou nos documentos.
- Telas e textos em português simples, tom positivo, sem culpa ou cobrança.
