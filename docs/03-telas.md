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
| `/desafios/novo` | `app/(app)/desafios/novo/page.js` | criar um desafio: uma pessoa por vez (abas, sem "Para quem"; Família toda por último; quem está criando já vem escolhido); cartão leve "Pensado para…" com o desafio na 1ª linha e a meta na 2ª; tema do mês em faixa estreita amarela com lâmpada acesa; aviso "+N desafios" (contagem real, sem botão); "Escolha pelo assunto" em cartões com quantidade (sem busca). | — |
| `/desafios` | `app/(app)/desafios/page.js` | tela Desafios em abas (opção A, 25/11): Pai/Mãe veem Desafios \| Mural \| Vitrine com "+ Desafio" ao lado do título e sem setinha; Ajustes e "Como funciona" ficam discretos no pé; sem desafio mostra 3 sugestões de um toque. O filho vê Meus desafios \| Mural \| Cofrinho (com setinha) e a criança pode sugerir um desafio aos pais. | ra_desafio_sugestoes |
| `/desafios/premios` | `app/(app)/desafios/premios/page.js` | vitrine de prêmios (banco de prêmios, preços e lista de desejos). | ra_premios |
| `/hoje` | `app/(app)/hoje/page.js` | tela Hoje: as tarefas do dia da pessoa, com concluir, foto, adiar e justificar. | ra_tela_real, ra_tela_previsto_dia |
| `/ideias` | `app/(app)/ideias/page.js` | ideias de conduta: abas Responsáveis e Acompanhados (o parâmetro interno segue `p=filhos`); cartão da Ideia da semana leve e aberto; aviso "+N ideias" com a contagem real (sem botão). | — |
| `/notificacoes/abrir` | `app/(app)/notificacoes/abrir/route.js` | rota que marca um aviso como lido e abre o link dele. | ra_notificacoes |
| `/notificacoes` | `app/(app)/notificacoes/page.js` | lista de avisos (sino) e pedidos para responder. | ra_adiamentos, ra_notificacoes, ra_ocorrencias, ra_tela_proposta |
| `/painel` | `app/(app)/painel/page.js` | Painel da família (Pai, Mãe e quem acompanha): atrasos, pedidos, resumo do dia. | ra_adiamentos, ra_tarefas, ra_tela_proposta |
| `/perfil/dados` | `app/(app)/perfil/dados/route.js` | rota que entrega ao usuário uma cópia dos próprios dados (LGPD). | ra_membros, ra_emails_grupo, ra_eu |
| `/perfil` | `app/(app)/perfil/page.js` | Meu perfil: foto, cor, jeito de ver, avisos no celular, tempo de tela próprio. | — |
| `/relatorios` | `app/(app)/relatorios/page.js` | relatórios por período, pessoa, categoria e situação, com gráfico e impressão. | ra_adiamentos, ra_categorias |
| `/seguranca` | `app/(app)/seguranca/page.js` | Segurança e privacidade: só informação (abre pela Ajuda). | — |
| `/tarefas/[id]/editar` | `app/(app)/tarefas/[id]/editar/page.js` | editar uma tarefa. | ra_categorias, ra_tarefas |
| `/tarefas/[id]` | `app/(app)/tarefas/[id]/page.js` | rota antiga de detalhes; redireciona para Editar ou Agenda. | ra_tarefas |
| `/desafios` (ciclo, SQL 0031) | `app/(app)/desafios/page.js`, `components/DesafioCartao.js`, `components/FimCicloAcoes.js` | cada desafio tem fim combinado: cartão com "Semana 2 de 4" e barrinha; cada pessoa mostra "1 de 2 desafios" (ideal 1, máximo 2, família 1). No fim aparece "Ciclo completo! 3 de 4 semanas cumpridas" com Renovar (2, 4 ou 8 semanas), Subir um nível ou Trocar; sem resposta o desafio descansa e não renova sozinho. O Painel avisa quando falta 1 semana e quando um ciclo terminou |
| `/painel` (cartão de sugestão) | `components/SugestaoDesafio.js` | quem está sem desafio (Pai/Mãe, até 2 pessoas) vê um cartão com selo "Desafio sugerido", "Que tal um desafio para Fulano?", "Aceitar e criar" (cria o desafio da semana na hora) e "Escolher outro" (abre Novo desafio). O X fecha só aquela pessoa por 14 dias (SQL 0030). Some sozinho quando a pessoa ganha um desafio. | ra_desafio_dispensas |
| `/tarefas/nova` | `app/(app)/tarefas/nova/page.js` | criar tarefa (com sugestões prontas). | ra_categorias |
| `/tarefas` | `app/(app)/tarefas/page.js` | rota antiga /tarefas; leva para a Agenda em Dia. | — |
| `/tela` | `app/(app)/tela/page.js` | Tempo de tela: previsto, lançar o que aconteceu, pedidos e gráfico dos 7 dias. | ra_ocorrencias, ra_tarefas, ra_tela_previsto, ra_tela_proposta, ra_tela_real, ra_tela_previsto_dia |
| `/aceite` | `app/aceite/page.js` | passo antes de entrar: aceitar termos e privacidade (e autorização do responsável). | — |
| `/auth/callback` | `app/auth/callback/route.js` | rota que recebe o retorno do login (código do Supabase) e cria a sessão. | — |
| `/auth/confirm` | `app/auth/confirm/route.js` | rota que confirma o link de e-mail (convite, entrar sem senha). | — |
| `/auth/sair` | `app/auth/sair/route.js` | rota que encerra a sessão e volta para o login. | — |
| `/consentimento` | `app/consentimento/page.js` | página pública com o texto de consentimento (LGPD). | — |
| `/login` | `app/login/page.js` | tela de login: entrar com Google ou receber um link de entrada por e-mail (sem senha); o convite mostra quem convidou e o grupo. | — |
| `/` | `app/page.js` | raiz "/": decide se vai para Painel, Hoje ou Sem acesso. | — |
| `/privacidade` | `app/privacidade/page.js` | página pública da política de privacidade. | — |
| `/sem-acesso` | `app/sem-acesso/page.js` | tela para quem entrou mas ainda não tem cadastro numa família. | — |
| `/termos` | `app/termos/page.js` | página pública dos termos de uso. | — |

**Filtro do cartão Hoje no Painel (regra):** `components/FiltroHoje.js` põe abas por pessoa (Todos, cada pessoa, Eu) e a lista Categoria. A escolha vai no endereço (`/painel?hp=pessoa&hc=categoria`) e só filtra o cartão Hoje; os números do topo seguem contando tudo. Sem escolha, nada muda.

**Atrasos no Painel (regra):** tarefa que se repete expira à meia-noite (vira "não cumprida", `statusExibido` em `lib/util.js`); só segue atrasada se há justificativa esperando resposta. Tarefa de uma vez só segue atrasada até ser feita. A mesma tarefa em mais de um dia aparece numa linha só. O botão Lembrar vira o selo "Lembrado às 15h" (hora de `lembrado_em`) e volta após 2 horas.

## Peças de tela (`components/`) 🟦

74 componentes. Os que começam com `'use client'` rodam no aparelho (têm estado e toque); os outros são desenhados no servidor.
Cada um tem cabeçalho `@arquivo` com o que faz, o que usa e quem usa. Para achar quem usa um componente, busque por `@usado-por` ou pelo nome no VS Code.
Os mais importantes: `Tarefa.js` (cartão de tarefa), `TarefaForm.js`, `Form.js` (formulário padrão com fila offline), `Menu.js`, `Festa.js`/`Comemorar.js` (comemorações), `LampadaFlutuante.js` (dicas), `Conexao.js` (sem internet).

## Como uma tela funciona (receita)
1. `const { supabase, eu, familia, gestor } = await exigirMembro();`: confere o login e traz quem é a pessoa e a família (cache de 30 s).
2. Lê dados com `supabase.from('ra_...')` ou `lib/dados.js` (o banco filtra pela família por RLS).
3. Desenha com componentes; formulários usam `components/Form.js` e uma ação de `app/acoes.js`.
4. A ação grava por `rpc`, chama `esquecerSessoes()` e `revalidatePath()`; a tela refaz a leitura.

## Aviso de chegada ("Cheguei" / "Tudo certo")

- Pai e Mãe criam em Nova tarefa, escolhendo **O que é: Chegada** (`components/TarefaForm.js`): título livre ("Chegar na escola"), horário esperado opcional e duas chaves (lembrar a pessoa; avisar os pais se ainda não chegou).
- Na tela Hoje, o cartão da tarefa (`components/Tarefa.js`) mostra um botão grande: **Cheguei** para quem usa o modo criança (Divertido ou Calmo) e **Tudo certo** para adolescente e adultos. A mecânica é a mesma; muda só a escrita. Tocar comemora conforme o jeito de ver e avisa os responsáveis.
- Lembrete: o sino e o push (como os outros avisos) e, em Hoje, um cartão suave "Já chegou?" (`components/ChegadaLembrete.js`) com **Cheguei** e **Ainda não**.
- Chegada nunca aparece como "Atrasada" (`lib/util.js`, `statusExibido`). Cada responsável liga ou desliga o aviso em Meu perfil ("Quando alguém avisar que chegou").
- Fora do escopo por decisão: botão "Preciso de ajuda" e localização.
