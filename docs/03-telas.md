# Telas (rotas) 🟦

Gerado a partir dos cabeçalhos `@arquivo` de cada tela. Rotas com `(app)` na pasta exigem login (grupo de rotas do Next.js; o `(app)` não aparece no endereço).

Toda tela com login passa por `app/(app)/layout.js` (topo, menu, avisos) e começa chamando `exigirMembro()` ou `exigirGestor()` de `lib/sessao.js`.

| Rota | Arquivo | O que faz | Banco que usa |
|---|---|---|---|
| `/admin` | `app/(app)/admin/page.js` | rota antiga /admin; só leva para Cadastros > Famílias e grupos. | — |
| `/agenda` | `app/(app)/agenda/page.js` | Agenda em três formatos (Dia, Semana, Mês), com abas por pessoa e lápis para editar. | — |
| `/ajuda` | `app/(app)/ajuda/page.js` | Ajuda com busca, mais procuradas e blocos por assunto. | — |
| `/config/ajustes` | `app/(app)/config/ajustes/page.js` | rota antiga; leva para Segurança e privacidade (/seguranca). | — |
| `/config/categorias/[id]` | `app/(app)/config/categorias/[id]/page.js` | editar uma categoria de tarefa. | ra_categorias |
| `/config/categorias/nova` | `app/(app)/config/categorias/nova/page.js` | criar categoria de tarefa. | — |
| `/config/categorias` | `app/(app)/config/categorias/page.js` | lista de categorias da família (Pai e Mãe). | ra_categorias |
| `/config/familias/[id]` | `app/(app)/config/familias/[id]/page.js` | editar um grupo/família: nome, avatar, cor, responsável, apagar. | ra_admin_cores, ra_admin_familias, ra_admin_membros, ra_guia_mel_estado |
| `/config/familias/nova` | `app/(app)/config/familias/nova/page.js` | criar um novo grupo/família. | — |
| `/config/familias` | `app/(app)/config/familias/page.js` | lista dos grupos da família, com cor; para super admin, a administração de todos. | ra_admin_cores, ra_admin_familias |
| `/config` | `app/(app)/config/page.js` | menu de Cadastros: pessoas, categorias, famílias e grupos. | ra_categorias, ra_admin_familias |
| `/config/pessoas/[id]` | `app/(app)/config/pessoas/[id]/page.js` | editar uma pessoa: papel, parentesco, permissões, avisos, convite, tempo de tela. | — |
| `/config/pessoas/nova` | `app/(app)/config/pessoas/nova/page.js` | cadastrar uma pessoa nova na família (com convite por e-mail). | — |
| `/config/pessoas` | `app/(app)/config/pessoas/page.js` | lista das pessoas da família, com status do convite. | — |
| `/desafios/ajustes` | `app/(app)/desafios/ajustes/page.js` | ajustes dos Desafios: quem vê o mural e prêmios até 8 anos. | — |
| `/desafios/cofrinho` | `app/(app)/desafios/cofrinho/page.js` | cofrinho de estrelinhas ou semanas e troca por prêmios (aba Cofrinho do filho). | ra_cofrinho |
| `/desafios/mural` | `app/(app)/desafios/mural/page.js` | mural de conquistas: desafios cumpridos, prêmios entregues e medalhas. | ra_desafio_periodos, ra_desafios, ra_premio_pedidos |
| `/desafios/novo` | `app/(app)/desafios/novo/page.js` | criar um desafio (do catálogo ou personalizado). | — |
| `/desafios` | `app/(app)/desafios/page.js` | tela Desafios em abas (opção A, 25/11): Pai/Mãe veem Desafios \| Mural \| Vitrine com "+ Desafio" ao lado do título e sem setinha; Ajustes e "Como funciona" ficam discretos no pé; sem desafio mostra 3 sugestões de um toque. O filho vê Meus desafios \| Mural \| Cofrinho (com setinha) e a criança pode sugerir um desafio aos pais. | ra_desafio_sugestoes |
| `/desafios/premios` | `app/(app)/desafios/premios/page.js` | vitrine de prêmios (banco de prêmios, preços e lista de desejos). | ra_premios |
| `/hoje` | `app/(app)/hoje/page.js` | tela Hoje: as tarefas do dia da pessoa, com concluir, foto, adiar e justificar. | ra_tela_real, ra_tela_previsto_dia |
| `/ideias` | `app/(app)/ideias/page.js` | ideias de conduta para Pai/Mãe e para os filhos (cartões curtos). | — |
| `/notificacoes/abrir` | `app/(app)/notificacoes/abrir/route.js` | rota que marca um aviso como lido e abre o link dele. | ra_notificacoes |
| `/notificacoes` | `app/(app)/notificacoes/page.js` | lista de avisos (sino) e pedidos para responder. | ra_adiamentos, ra_notificacoes, ra_ocorrencias, ra_tela_proposta |
| `/painel` | `app/(app)/painel/page.js` | Painel da família (Pai, Mãe e quem acompanha): atrasos, pedidos, resumo do dia. | ra_adiamentos, ra_tarefas, ra_tela_proposta |
| `/perfil/dados` | `app/(app)/perfil/dados/route.js` | rota que entrega ao usuário uma cópia dos próprios dados (LGPD). | ra_membros, ra_emails_grupo, ra_eu |
| `/perfil` | `app/(app)/perfil/page.js` | Meu perfil: foto, cor, jeito de ver, avisos no celular, tempo de tela próprio. | — |
| `/relatorios` | `app/(app)/relatorios/page.js` | relatórios por período, pessoa, categoria e situação, com gráfico e impressão. | ra_adiamentos, ra_categorias |
| `/seguranca` | `app/(app)/seguranca/page.js` | Segurança e privacidade: só informação (abre pela Ajuda). | — |
| `/tarefas/[id]/editar` | `app/(app)/tarefas/[id]/editar/page.js` | editar uma tarefa. | ra_categorias, ra_tarefas |
| `/tarefas/[id]` | `app/(app)/tarefas/[id]/page.js` | rota antiga de detalhes; redireciona para Editar ou Agenda. | ra_tarefas |
| `/tarefas/nova` | `app/(app)/tarefas/nova/page.js` | criar tarefa (com sugestões prontas). | ra_categorias |
| `/tarefas` | `app/(app)/tarefas/page.js` | rota antiga /tarefas; leva para a Agenda em Dia. | — |
| `/tela` | `app/(app)/tela/page.js` | Tempo de tela: previsto, lançar o que aconteceu, pedidos e gráfico dos 7 dias. | ra_ocorrencias, ra_tarefas, ra_tela_previsto, ra_tela_proposta, ra_tela_real, ra_tela_previsto_dia |
| `/aceite` | `app/aceite/page.js` | passo antes de entrar: aceitar termos e privacidade (e autorização do responsável). | — |
| `/auth/callback` | `app/auth/callback/route.js` | rota que recebe o retorno do login (código do Supabase) e cria a sessão. | — |
| `/auth/confirm` | `app/auth/confirm/route.js` | rota que confirma o link de e-mail (convite, entrar sem senha). | — |
| `/auth/sair` | `app/auth/sair/route.js` | rota que encerra a sessão e volta para o login. | — |
| `/consentimento` | `app/consentimento/page.js` | página pública com o texto de consentimento (LGPD). | — |
| `/login` | `app/login/page.js` | tela de login: entrar com Google ou com um link enviado ao e-mail (sem senha). | — |
| `/` | `app/page.js` | raiz "/": decide se vai para Painel, Hoje ou Sem acesso. | — |
| `/privacidade` | `app/privacidade/page.js` | página pública da política de privacidade. | — |
| `/sem-acesso` | `app/sem-acesso/page.js` | tela para quem entrou mas ainda não tem cadastro numa família. | — |
| `/termos` | `app/termos/page.js` | página pública dos termos de uso. | — |

## Peças de tela (`components/`) 🟦

74 componentes. Os que começam com `'use client'` rodam no aparelho (têm estado e toque); os outros são desenhados no servidor.
Cada um tem cabeçalho `@arquivo` com o que faz, o que usa e quem usa. Para achar quem usa um componente, busque por `@usado-por` ou pelo nome no VS Code.
Os mais importantes: `Tarefa.js` (cartão de tarefa), `TarefaForm.js`, `Form.js` (formulário padrão com fila offline), `Menu.js`, `Festa.js`/`Comemorar.js` (comemorações), `LampadaFlutuante.js` (dicas), `Conexao.js` (sem internet).

## Como uma tela funciona (receita)
1. `const { supabase, eu, familia, gestor } = await exigirMembro();`: confere o login e traz quem é a pessoa e a família (cache de 30 s).
2. Lê dados com `supabase.from('ra_...')` ou `lib/dados.js` (o banco filtra pela família por RLS).
3. Desenha com componentes; formulários usam `components/Form.js` e uma ação de `app/acoes.js`.
4. A ação grava por `rpc`, chama `esquecerSessoes()` e `revalidatePath()`; a tela refaz a leitura.
