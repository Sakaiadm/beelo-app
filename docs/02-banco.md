# Banco de dados (Supabase / Postgres) 🟩

Projeto Supabase do beelo. Todas as tabelas e funções têm o prefixo `ra_` (herdado de "Rotina Ativa") para conviver com outros apps no mesmo projeto.
Tudo que muda o banco vive em `supabase/migrations/`, arquivos numerados, **seguros para rodar de novo** (`if not exists`, `create or replace`). Nunca edite uma migração antiga: crie a próxima.

## Segurança em uma frase
Toda tabela tem **RLS** (segurança por linha): cada pessoa só enxerga e mexe nos dados da **própria família**. O app usa a chave pública (anon) com o login da pessoa; por isso o banco, e não o código, é a barreira final. Funções `security definer` (as `ra_*` chamadas por `rpc`) fazem as gravações que exigem regra (ex.: só Pai e Mãe conferem). Fotos ficam em buckets privados (`rotina-fotos`, `rotina-avatares`), acessados por links temporários (`lib/links.js`).

## Tabelas

| Tabela | Para que serve | Quem usa no código |
|---|---|---|
| `ra_familias` | O grupo (família). Nome, cor, ajustes (desafios_beta, justificativa obrigatória…) | `lib/sessao.js`, `app/(app)/config/familias` |
| `ra_membros` | Cada pessoa: `papel` (gestor/filho), `funcao` (pai = Responsável, filho = Acompanhado(a), outro = Outro), parentesco, cor, avatar, permissões, modo criança, jeito de ver, ano aproximado de nascimento. O e-mail só sai pela função `ra_emails_grupo` (Pai/Mãe) | `lib/membros.js`, `lib/papeis.js`, `lib/sessao.js` |
| `ra_categorias` | Categorias de tarefa por família (Casa, Estudo…) | `app/(app)/config/categorias` |
| `ra_tarefas` | O **modelo** da tarefa: título, responsável, repetição, horário, regras (foto, adiar, justificar, prioritária) | `components/TarefaForm.js`, `salvarTarefa` |
| `ra_ocorrencias` | A tarefa **de um dia** (única por tarefa+data). Estados: pendente, cumprida, adiamento_pedido, adiada, cancelada; mais foto, conferência e justificativa | `lib/dados.js`, `components/Tarefa.js` |
| `ra_adiamentos` | Pedidos para mudar a data de uma ocorrência e a resposta de Pai/Mãe | `pedirAdiamento`, `responderAdiamento` |
| `ra_notificacoes` | Avisos dentro do app (sino). Também alimentam o push | `app/(app)/notificacoes`, `lib/despachante.js` |
| `ra_push_inscricoes` | Aparelhos que ligaram o aviso no celular | `components/AvisosCelular.js` |
| `ra_config` | Chaves internas (segredo do push, etc.). Nunca exposta ao navegador | `lib/despachante.js` (via rpc) |
| `ra_tela_previsto` | Tempo de tela **combinado** por pessoa (por aparelho ou total, por dia da semana, com vigência) | `app/(app)/tela`, `lib/tela.js` |
| `ra_tela_proposta` | Pedido de mudança no previsto, aguardando resposta | `proporTela`, `responderTela` |
| `ra_tela_real` | Tempo de tela que **aconteceu** em cada dia | `salvarTelaReal`, `salvarLancamentoTela` |
| `ra_historico` | Registro do que foi feito (quem, o quê, quando) | função `ra_log` |
| `ra_superadmins` | Quem administra o beelo inteiro (painel `/admin`) | `app/(app)/admin` |
| `ra_desafios` | Desafios ativos (da pessoa ou da família), tipo, meta, recompensa | `lib/desafios.js`, `app/acoes-desafios.js` |
| `ra_desafio_periodos` | Cada semana/mês de um desafio: progresso, status (andamento, cumprido, não cumprido) | `lib/desafiosDados.js` |
| `ra_premios` | Prêmios da família (nome, custo em estrelas ou semanas, faixa de idade) | `app/(app)/desafios/premios` |
| `ra_premio_pedidos` | Prêmio pedido → entregue / cancelado. Também a lista de desejos | `DesejoAprovar.js`, `SugerirDesejo.js` |
| `ra_desafio_dispensas` | Quem teve a sugestão de desafio fechada no X do Painel e quando ela pode voltar (14 dias). SQL 0030 | `components/SugestaoDesafio.js`, `app/(app)/painel/page.js` |
| `ra_desafio_sugestoes` | Sugestões de desafio feitas pela criança, esperando Pai/Mãe (esperando, criado, agora_nao). SQL 0028 | `components/SugerirDesafio.js`, `app/(app)/desafios/page.js` |
| `ra_desafio_sugestoes` | Desafios que a criança sugeriu, aguardando Pai/Mãe (aprovar cria o desafio) | `app/acoes-desafios.js`, `components/SugestaoDesafio.js` |
| `ra_desafio_dispensas` | Sugestões de desafio fechadas no Painel e a data em que podem voltar (14 dias) | `app/acoes-desafios.js` |
| `ra_cofrinho` | Livro-caixa de estrelinhas e semanas (+ entradas, − trocas; nunca vencem) | `app/(app)/desafios/cofrinho` |
| `ra_aceites` | Registro de aceite de termos, privacidade e autorização do responsável (LGPD) | `lib/aceite.js`, `aceitarTermos` |

## Funções que o app chama (`supabase.rpc`)

Agrupadas pelo assunto (arquivo que chama entre parênteses):

- **Quem sou eu:** `ra_eu`, `ra_meu_id`, `ra_minha_familia`, `ra_sou_gestor`, `ra_sou_super`, `ra_pode`, `ra_acompanha`, `ra_emails_grupo` (`lib/sessao.js`)
- **Família e pessoas:** `ra_criar_familia`, `ra_editar_familia`, `ra_cor_familia`, `ra_definir_responsavel`, `ra_vincular`, `ra_excluir_membro`, `ra_apagar_familia`, `ra_autorizar`, `ra_aceitar`, `ra_meu_avatar`, `ra_minha_cor`, `ra_meu_jeito` (`app/acoes.js`)
- **Tarefas do dia:** `ra_gerar_ocorrencias`, `ra_concluir` / `ra_concluir2`, `ra_desfazer`, `ra_justificar`, `ra_avaliar_justificativa`, `ra_conferir`, `ra_conferir_auto`, `ra_definir_horario`, `ra_pedir_adiamento`, `ra_adiar_livre`, `ra_responder_adiamento`
- **Tempo de tela:** `ra_tela_previsto_dia`, `ra_propor_tela`, `ra_responder_tela`, `ra_tela_ajustar_tarefa`
- **Avisos:** `ra_notificar`, `ra_notificar_gestores`, `ra_gerar_lembretes`, `ra_lembrar_tarefa`, `ra_lembrar_tela`, `ra_meu_resumo`, `ra_minhas_notif`, `ra_cheguei`, `ra_push_inscrever`, `ra_push_cancelar`, `ra_push_teste`, `ra_push_pendentes`, `ra_push_concluir`, `ra_push_segredo_ok`, `ra_push_definir_segredo` (as quatro últimas, o despachante da VPS)
- **Desafios e prêmios:** `ra_desafios_atualizar`, `ra_desafio_calc`, `ra_desafio_base`, `ra_desafio_encerrar`, `ra_desafio_premiar`, `ra_desafio_visto`, `ra_periodo_inicio`, `ra_periodo_fim`, `ra_premio_pedir`, `ra_premio_entregar`, `ra_cofrinho_meta`, `ra_desejo_sugerir`, `ra_desejo_responder`, `ra_desafio_sugerir`, `ra_desafio_sugestao_fechar`, `ra_desafio_sugestao_dispensar`, `ra_mural_todos`
- **Administração do beelo:** `ra_admin_familias`, `ra_admin_membros`, `ra_admin_criar_familia`, `ra_admin_ativar_familia`, `ra_admin_cores`
- **Gatilhos (automáticos, o app não chama):** `ra_tg_tarefa_nova`, `ra_tg_tela_real`, `ra_tg_tela_conclui`, `ra_tg_desafio_proprio`, `ra_seed_categorias`, `ra_log`

## Linha do tempo das migrações

(Atualizado em 26/11/2026, até a 0033. Migrações novas já trazem no cabeçalho `-- @migracao` e `-- @altera`/`-- @banco`.)

| Nº | O que trouxe |
|---|---|
| 0001 | Esquema base: famílias, pessoas, categorias, tarefas, ocorrências, adiamentos, avisos, tempo de tela, histórico, RLS |
| 0002 | Famílias com avatar, super admin, preferências de aviso, foto da tarefa |
| 0003 | Foto vale se for do dia, justificativa configurável |
| 0004 | Regras por tarefa (adiar, foto, justificativa) |
| 0005 | Avisos no celular (push) e fila para o despachante |
| 0006 | Funções das pessoas, responsável da família, excluir pessoas |
| 0007 | Registro do envio do convite por e-mail |
| 0008 | Não deixa concluir tarefa de data futura |
| 0009 | Tarefa prioritária e modo criança |
| 0010 | Avatares de criança |
| 0011 | Tempo de tela como tarefa com hora |
| 0012 | Supervisor acompanha (leitura) |
| 0013 | Sem aviso de tarefa criada para si |
| 0014 | Cor do grupo e da pessoa |
| 0015 | Aviso na hora de lançar o tempo de tela |
| 0016 | Desafios, prêmios e cofrinho (beta) |
| 0017 | Lista de desejos |
| 0018 | Raio-X do tempo de tela |
| 0019 | Varredura de segurança e LGPD, registro de aceites |
| 0020 | E-mails só para Pai e Mãe (rodar só depois do app novo no ar) |
| 0021 A e B | Automações: resumo do dia, conferir sozinho, convite parado, prêmio esperando. **Há duas 0021: rode A, depois B** |
| 0022 | Jeito de ver o beelo e ano aproximado de nascimento |
| 0023 | Separa papel de parentesco (Pai, Mãe, Adulto que ajuda, Filho(a)) |
| 0024 | Libera a coluna `parentesco` para Pai e Mãe (ra_membros tem permissão por coluna desde a 0020) |
| 0024 | Guia da Mel (beta): uma chave por grupo, só o administrador geral liga e desliga (`ra_familias.guia_mel`) |
| 0025 | A chave de ligar/desligar os desafios (beta) passa a ser só do administrador geral |
| 0026 | Desejos e pedidos de prêmio só da própria pessoa e dos responsáveis (regras RLS de `ra_premios` e `ra_premio_pedidos`) |
| 0027 | Aviso de chegada ("Cheguei" / "Tudo certo"): colunas novas em `ra_tarefas` e `ra_ocorrencias`, lembretes |
| 0028 | A criança sugere um desafio; Pai e Mãe aprovam ou dizem "agora não" (tabela `ra_desafio_sugestoes`) |
| 0029 | Trocar a foto de uma tarefa já concluída e apagar fotos que sobram (`ra_ocorrencias.foto_trocada_em`, política do Storage) |
| 0031 | Desafios em ciclos de 4 semanas (colunas `ciclo_*`, `descansando_em`), limite de 2 por pessoa e 1 da família no banco (gatilho `ra_desafios_limite`), `ra_desafio_renovar`, 1 troca por semana em `ra_desafio_encerrar` |
| 0033 | Relatos dos testadores: tabela `ra_relatos` (sem política; só pelas funções), `ra_relatar` (grava e avisa o administrador geral no sino), `ra_relatos_lista` e `ra_relato_status` (só `ra_sou_super`), política `ra_foto_sel_super` (administrador geral lê as imagens dos relatos em `rotina-fotos`). |
| 0032 | Categorias: Lazer entra em "Esporte e lazer" (tarefas e desafios movidos), nova categoria Pet, "Música/Cursos" vira "Cursos"; `ra_seed_categorias` atualizada. |
| 0030 | Pai e Mãe fecham (X) a sugestão de desafio do Painel; volta em 14 dias (tabela `ra_desafio_dispensas`) |
| 0028 | Criança sugere um desafio e Pai/Mãe respondem (tabela ra_desafio_sugestoes). Sem ela, o app funciona e só esconde a sugestão |
| 0030 | X no cartão de sugestão de desafio do Painel: some por 14 dias para aquela pessoa (tabela ra_desafio_dispensas). Sem ela, o app funciona e o cartão só não fecha |
| 0034 | Responsável, Acompanhado(a) e Outro: marca o parentesco Pai ou Mãe de quem já era Responsável |
| 0035 | Só Responsável vê o painel da família: tira a chave ver_painel de Acompanhado(a) e Outro |

⚠️ Ordem importa: algumas migrações dizem no cabeçalho "rode ANTES do app novo" (0021 A, 0022) ou "SÓ DEPOIS" (0020). Leia a primeira linha de cada arquivo antes de rodar.

## Como testar o banco
`bash testes/banco-local.sh` sobe um PostgreSQL local descartável (não toca no Supabase real) e roda as trilhas de `supabase/testes/` (`trilha_banco.sql`, `trilha_desafios.sql`, `trilha_desafios_ciclo.sql` (14 testes), `trilha_desejos.sql`).

## Aviso de chegada (migração 0027)

- **Tarefa de chegada:** `ra_tarefas.especial = 'chegada'` (mesma ideia do tempo de tela). Colunas novas: `chegada_lembrar` (lembrete suave só para a pessoa, padrão ligado) e `chegada_avisar_pais` (padrão desligado). Em `ra_ocorrencias`: `chegada_pais_em` (guarda que o "ainda sem confirmação" já foi avisado).
- **`ra_cheguei(p_oc)`:** só a própria pessoa, só no dia; marca como feita e já conferida, grava a hora (`concluida_em`) e avisa os responsáveis ("Alice chegou na escola, 7h28"). Tocar de novo não repete o aviso.
- **`ra_gerar_lembretes`** (roda a cada minuto pelo despachante): 15 min depois do horário, lembrete só para a pessoa; 30 min depois, se ligado na tarefa, "ainda sem confirmação" aos responsáveis; chegada de dia passado sem toque vira `cancelada` em silêncio (não aparece atrasada nem conta em desafios).
- **Avisos:** a chave `chegada` em `ra_membros.notif` (padrão ligada) vale para os dois avisos aos responsáveis. Sem localização de nenhum tipo.
- Teste do banco: `supabase/testes/trilha_chegada.sql`.

## Trocar a foto da tarefa (migração 0029)

- **`ra_trocar_foto(p_oc, p_foto, p_foto_em)`:** só a própria pessoa, só em tarefa já concluída com foto e **antes do responsável conferir**. A foto nova segue a regra de concluir (precisa ser de hoje). Grava `foto_trocada_em`, não mexe em `concluida_em` e devolve o caminho da foto antiga, que o app apaga do armazenamento. Avisa os responsáveis como o aviso de conclusão ("Alice trocou a foto: …").
- **Política `ra_foto_del`:** deixa apagar só foto da própria pessoa que não está em nenhuma tarefa. Também apaga a foto trocada antes de concluir (feito por `components/Foto.js`).

@cuidado Coluna nova em `ra_membros` precisa de `grant select/insert/update (coluna)` na mesma migração; sem isso o app dá "Você não tem permissão para fazer isso" ao salvar (foi o caso do `parentesco`, corrigido na 0024).
