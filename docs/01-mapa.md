# Mapa do código

Cores usadas nos documentos: 🟦 telas · 🟨 regras e ações · 🟩 banco · 🟪 avisos, e-mail, offline · ⬜ infraestrutura.

## Como as peças se ligam

```
⬜ Celular / navegador (PWA)  ── public/sw.js (offline, push) · lib/fila.js
        │  HTTPS
⬜ Caddy (HTTPS) → Docker (porta 3010) na VPS ── Dockerfile · deploy/instalar.sh
        │
🟨 middleware.js   exige login (cookie do Supabase); rotas públicas listadas lá
        │
🟦 app/ (telas)  ──────►  🟨 app/acoes.js · app/acoes-desafios.js  (tudo que GRAVA)
   usa components/ 🟦        lib/*.js 🟨 (cálculos, papéis, desafios, dicas)
        │                         │
        └──────────► 🟩 Supabase: tabelas ra_*, funções rpc ra_*, RLS, buckets privados
                                  ▲
🟪 lib/despachante.js (a cada 60 s) pega avisos novos e envia o push · 🟪 lib/convite.js (e-mail)
```

Regra de ouro: a tela **lê** direto do Supabase com o login da pessoa (o banco só devolve dados da própria família, por RLS);
tudo que **grava** passa por uma ação em `app/acoes*.js`, que chama uma função `rpc` do banco.

## Onde fica cada assunto

| Assunto | Arquivos principais |
|---|---|
| 🟨 Login e entrada | `middleware.js`, `app/login`, `app/auth/*`, `lib/sessao.js` (guarda por 30 s o que o topo de toda tela precisa), `lib/supabase/` |
| 🟨 Quem pode o quê | `lib/papeis.js` (Pai, Mãe, Adulto que ajuda, Filho(a) e chaves de permissão), `lib/membros.js` |
| 🟦 Tarefas do dia | `app/(app)/hoje`, `components/Tarefa.js`, `TarefaForm.js`, `lib/dados.js` (gera as ocorrências), `lib/util.js` (datas no fuso de São Paulo) |
| 🟦 Agenda, painel, relatórios | `app/(app)/agenda`, `painel`, `relatorios`, `lib/relatorio.js` |
| 🟦 Tempo de tela | `app/(app)/tela`, `lib/tela.js`, `lib/aparelhos.js`, migrações 0011, 0015, 0018 |
| 🟦 Desafios, prêmios, cofrinho | `app/(app)/desafios/*`, `lib/desafios.js` (catálogo fixo), `lib/desafiosDados.js`, `app/acoes-desafios.js`, `components/DesafiosTopo.js` (título e abas), `DesafiosVazio.js`, `SugerirDesafio.js`, migrações 0016, 0017, 0028 |
| 🟦 Comemorações e sons | `lib/festa.js`, `lib/festaAnim.js`, `components/Comemorar.js`, `Festa.js`, `SomConcluir.js` |
| 🟦 Dicas e ideias | `lib/dicas.js`, `lib/dicasMotor.js` (roda no aparelho), `lib/ideias.js`, `components/LampadaFlutuante.js` | Abrir a lâmpada (topo ou flutuante) marca TODAS as ideias novas como vistas (`marcarTodasVistas`); o número só some assim.
| 🟦 Aviso de chegada | `components/Tarefa.js`, `TarefaForm.js`, `ChegadaLembrete.js`, `app/acoes.js` (`cheguei`), `lib/util.js`, migração 0027 |
| 🟦 Reportar problema ou sugestão | `components/Reportar.js` (folha + print da tela com html-to-image, 1600px/JPEG 80%, ou imagem da galeria), item no `components/MenuUsuario.js`, `enviarRelato`/`mudarRelato` em `app/acoes.js`, `app/(app)/config/relatos`, migração 0033. O print é tirado ANTES de abrir a folha; é aproximado (imagens de fora e vídeos podem sair em branco). |
| 🟦 Cadastros | `app/(app)/config/*` (pessoas, categorias, famílias, ajustes), `components/PessoaForm.js` |
| 🟪 Avisos no celular | `lib/despachante.js`, `instrumentation.js`, `public/sw.js`, `components/AvisosCelular.js`, migração 0005 |
| 🟪 E-mail de convite | `lib/convite.js`, `lib/email.js`, `deploy/config-email.sh` |
| 🟪 Offline | `public/sw.js`, `public/offline.html`, `lib/fila.js`, `components/Conexao.js`, `lib/rede.js` |
| 🟨 Termos e LGPD | `lib/aceite.js`, `lib/contato.js`, `app/termos`, `privacidade`, `consentimento`, `aceite`, migrações 0019, 0020 |
| 🟦 Manuais e Ajuda por perfil | `app/(app)/ajuda/page.js`, `public/manual*.html`, `public/manual-pdf/`, `docs/09-manuais.md` |
| ⬜ Aparência e marca | `app/globals.css`, `components/Icone.js`, `public/marca`, `public/manifest.json` |
| ⬜ Publicação | `Dockerfile`, `docker-compose.yml`, `deploy/instalar.sh`, `backup-banco.sh`, `config-backup.sh` |
| ⬜ Testes | `testes/`, `supabase/testes/` |

## Telas (rotas)

Públicas: `/login`, `/auth/*`, `/termos`, `/privacidade`, `/consentimento`, `/manual*`.
Com login (`app/(app)/`): `/hoje`, `/agenda`, `/painel`, `/tarefas`, `/tela`, `/relatorios`, `/desafios` (+ cofrinho, mural, prêmios, ajustes, novo), `/ideias`, `/notificacoes`, `/config` (pessoas, categorias, famílias, ajustes), `/perfil`, `/seguranca`, `/ajuda`, `/admin`.
`/aceite`, `/sem-acesso` ficam fora do grupo: são os passos antes de entrar.

## Glossário

- **Família / grupo**: conjunto de pessoas que compartilham tarefas (`ra_familias`). Uma pessoa pode estar em mais de uma.
- **Membro / pessoa**: cada pessoa de uma família (`ra_membros`). `papel` = `gestor` (Pai ou Mãe) ou `filho`; `funcao` = Pai, Mãe, Adulto que ajuda, Filho(a); parentesco é só um rótulo.
- **Tarefa**: o modelo (`ra_tarefas`), com repetição. **Ocorrência**: a tarefa de um dia específico (`ra_ocorrencias`); é nela que se conclui, justifica, adia e confere.
- **Previsto / real** (tempo de tela): o combinado (`ra_tela_previsto`) e o que aconteceu (`ra_tela_real`); pedidos de mudança em `ra_tela_proposta`.
- **Desafio, prêmio, cofrinho**: `ra_desafios`, `ra_premios`, `ra_cofrinho` (estrelinhas ou semanas, conforme o modo criança).
  Privacidade (migração 0026): desejos e pedidos de prêmio em aberto são só da própria pessoa e dos responsáveis; o catálogo do grupo é de todos; prêmio entregue de outra pessoa só aparece no Mural quando a opção é "A família toda vê".
- **Modo criança / jeito de ver**: quem usa o modo criança escolhe a aparência (Divertido, Calmo, Como os adultos). Só muda o visual.
- **RLS**: regra do banco que só deixa cada pessoa ver e mexer nos dados da própria família.
- **rpc**: função do banco chamada pelo app (`supabase.rpc('ra_concluir', ...)`).
