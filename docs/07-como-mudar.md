# Para mudar X, mexa em Y

Antes de qualquer mudança: leia `docs/08-padrao-de-codigo.md` (cabeçalhos e marcas) e, no fim, rode `npm run build`.
Mudou algo visível? Combine com o Thomas (prévia primeiro). Mantenha layout, cores, fontes e tom.

| Quero… | Mexa em | Cuidado |
|---|---|---|
| Trocar um **texto** de tela | busque o texto no VS Code (Ctrl+Shift+F) e edite o arquivo achado | escreva "beelo" minúsculo; tom positivo, sem culpa nem cobrança |
| Mudar **cores** do app | `app/globals.css` (variáveis no topo; modo claro e escuro) | ajuste do claro não pode mexer no escuro; o app abre sempre no claro |
| Mudar um **ícone** | `components/Icone.js` (um SVG por nome) | |
| Criar uma **tela nova** | pasta nova em `app/(app)/<nome>/page.js` com o cabeçalho `@arquivo`; começa com `exigirMembro()` ou `exigirGestor()` | adicione no `components/Menu.js` se precisar de atalho; rota pública vai em `PUBLICAS` de `middleware.js` |
| Criar um **botão ou formulário que grava** | componente com `components/Form.js` + ação em `app/acoes.js` (na seção certa) + função `rpc` no banco | valide tudo na ação (`uuid()`, `data()`, `txt()`); termine com `revalidar()`; para funcionar offline, registre em `lib/fila.js` |
| Criar uma **tabela ou coluna** | migração nova `supabase/migrations/00NN_nome.sql` (próximo número), segura para rodar de novo | habilite RLS e crie as políticas por família; nunca edite migração antiga; diga no cabeçalho se roda antes ou depois do app novo |
| Mudar **quem pode o quê** | `lib/papeis.js` (`acesso()`, chaves) **e** a função `ra_pode` no banco (migração nova) | os dois precisam concordar |
| Criar um **aviso novo** (sino e celular) | gatilho/função no banco que chama `ra_notificar` (migração nova); texto vem do banco | o despachante envia sozinho; veja `docs/05-avisos-offline.md` |
| Adicionar um **desafio** ou **prêmio** ao catálogo | `lib/desafios.js` (`DESAFIOS`, `PREMIOS`) | ids novos, nunca renomeie um existente (ficam gravados no banco) |
| Adicionar uma **sugestão de tarefa** | `lib/sugestoes.js` | |
| Adicionar uma **dica** ou **ideia** | `lib/ideias.js` (ideias), `lib/dicas.js` (regras das dicas) | respeite o ritmo de `lib/dicasMotor.js` |
| Mudar **termos e privacidade** | `components/Legal.js`, `app/termos`, `app/privacidade`, `lib/contato.js` (`VERSAO_TERMOS`) | subir a versão faz todos aceitarem de novo; texto jurídico precisa de advogado |
| Mudar o **e-mail do convite** | `lib/convite.js` | o texto é HTML montado em código; teste com `testes/smtp-falso.mjs` |
| Mudar o **offline** | `public/sw.js`, `lib/fila.js` | troque a versão do cache no `sw.js` |
| Mudar **segurança do navegador** (CSP) | `next.config.mjs` | serviço novo precisa ser liberado ali |
| Trocar **logo ou ícone do app** | `public/icone*.png`, `public/icone.svg`, `public/marca/`, `public/manifest.json` | siga a marca: hexágono com check, azul `#1a6fe0`, mel `#F5B82E` só destaque |
| **Publicar** | `docs/06-deploy.md` | rodar migração SQL na ordem certa; um comando na VPS |
| Escrever um **teste** | `testes/` (Supabase falso) e `supabase/testes/` (banco) | teste só o que mudou |

## Receita: nova função do começo ao fim (exemplo "marcar favorito")
1. **Banco**: `supabase/migrations/00NN_favorito.sql` (NN = próximo número livre; em 26/11/2026 o próximo é 0031) com `alter table ... add column if not exists favorito boolean ...` e `create or replace function public.ra_favoritar(...)` (`security definer`, conferindo a família).
2. **Ação**: em `app/acoes.js`, seção certa: `export async function favoritar(_, fd) { return rpc('ra_favoritar', { p_id: uuid(fd.get('id')) }); }`.
3. **Tela**: o componente chama a ação por `components/Form.js`.
4. **Cabeçalhos e docs**: atualize `@usa` nos arquivos tocados, `docs/02-banco.md` (tabela/função/migração) e este guia se criou um tipo novo de coisa.
5. **Conferir**: `npm run build`; rode a migração no Supabase **antes** de publicar o app novo.
