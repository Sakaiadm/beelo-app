# Publicação (deploy) ⬜

O beelo roda numa **VPS do Thomas** (não é Vercel), em Docker, atrás de HTTPS. Banco e login ficam no Supabase.

## Peças
| Arquivo | Para quê |
|---|---|
| `Dockerfile` | build em 3 etapas (instala, compila, imagem final enxuta, usuário sem root), saída `standalone` do Next.js |
| `docker-compose.yml` | serviço do app, porta `127.0.0.1:3010`, passa as variáveis do `.env` |
| `deploy/instalar.sh` | instala/atualiza tudo (Docker, `.env`, chaves de push, HTTPS pelo Caddy ou nginx+certbot, redirecionamento do endereço antigo) |
| `deploy/config-email.sh` | guarda o SMTP dos convites no `.env` |
| `deploy/config-backup.sh` + `backup-banco.sh` | backup do banco (14 cópias) e como configurar; `restaurar-backup.md` explica como voltar |
| `next.config.mjs` | cabeçalhos de segurança (CSP) e `output: 'standalone'` |

## Publicar uma versão nova
1. Mescle o PR no GitHub (branch `main`).
2. Se o PR trouxe migração SQL **nova**, rode-a no Supabase (SQL Editor) na ordem que o cabeçalho dela disser (algumas vão **antes** do app novo, outras **depois**; veja `docs/02-banco.md`).
3. Na VPS, como root:
```bash
cd /opt/rotina-ativa && git pull && bash deploy/instalar.sh beeloapp.com rotina.sakaiadm.tech
```
(A pasta ainda se chama `rotina-ativa`, nome antigo do projeto. O segundo endereço é o antigo, que só redireciona.)
4. Se a build falhar baixando a fonte do Google, é rede: rode de novo.
5. No celular, feche e abra o beelo para pegar a versão nova.

## Variáveis do `.env` da VPS (só os nomes)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas), `APP_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_ASSUNTO`, `PUSH_SEGREDO`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_DE`, opcionais `PUSH_INTERVALO_S`, `CADASTRO_ABERTO`.
O `.env` fica só na VPS (permissão 600) e **nunca** vai para o GitHub.
⚠️ As `NEXT_PUBLIC_*` entram na **build**: mudou uma, precisa recompilar (rodar `instalar.sh` de novo).

## Testes antes de publicar
`npm run build` precisa passar. Roteiro com o Supabase falso: `node testes/mock-supabase.mjs` + app em `127.0.0.1:3100` + `testes/rotas.mjs`, `acoes.mjs`, `offline.mjs` (precisam do Playwright: `PW_ROOT=<pasta>`). Banco: `bash testes/banco-local.sh`.
