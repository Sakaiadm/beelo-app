# Regras e ações 🟨

Onde ficam as decisões do app. Regra de ouro: **tela lê, ação grava, banco decide**.

## Como uma gravação acontece
`formulário (components/Form.js)` → **ação** em `app/acoes.js` (ou `acoes-desafios.js`) → `supabase.rpc('ra_...')` → função do banco com RLS → `revalidar()` (limpa o cache de `lib/sessao.js` e manda as telas buscarem de novo) → tela atualizada.
Sem internet, ações simples ficam na fila do aparelho (`lib/fila.js`) e são reenviadas depois.

## `app/acoes.js`: índice por seção
Busque por `SEÇÃO:` no arquivo para ver o índice. Seções: Tarefas do dia · Cadastro de tarefas · Pessoas e convites · Termos e privacidade · Grupos/famílias · Categorias · Tempo de tela · Avisos dentro do app · Meu perfil · Criar grupo e administração.
Padrões do arquivo: `rpc(nome, args)` (chama, traduz erro, revalida); `uuid()`, `data()`, `hora()`, `caminhoFoto()` validam o que chega do formulário (**nunca confie no formulário**); `txt()` limpa texto.

## Regras importantes (e onde estão)

| Regra | Arquivo |
|---|---|
| Quem pode o quê: Pai e Mãe têm tudo; os demais por **chaves** (criar tarefa para si, ver painel, conferir, ver relatórios). O mesmo está no banco (`ra_pode`): mudou aqui, mude lá. | `lib/papeis.js` → `acesso()` |
| Quem está logado e de qual família; cache de 30 s por login | `lib/sessao.js` → `sessao()`, `exigirMembro()`, `exigirGestor()` |
| Status exibido de uma tarefa: pendente, cumprida, cumprida com atraso, adiada, atrasada, justificada, não cumprida (depois de 1 dia sem justificativa) | `lib/util.js` → `statusExibido()` |
| Datas sempre no fuso de São Paulo (`hojeISO()`, `addDias()`); nunca `new Date()` puro para "hoje" | `lib/util.js` |
| Ocorrências (tarefa do dia) são geradas sob demanda e guardadas por 60 s | `lib/dados.js` |
| Foto vale se for do dia (até 7h do dia seguinte); a data vem do EXIF | `components/Foto.js`, `lib/exif.js`, banco 0003 |
| Não se conclui tarefa de data futura | banco 0008 (`ra_concluir2`) |
| E-mail das pessoas só para Pai e Mãe | `lib/membros.js`, banco 0020 (`ra_emails_grupo`) |
| Jeito de ver (Divertido até 9 anos, Calmo 10–12, adultos 13+); guarda só o ano aproximado | `lib/jeito.js`, banco 0022 |
| Desafios e prêmios: catálogo fixo no código (ids gravados no banco) e cálculo do cofrinho | `lib/desafios.js`, `lib/desafiosDados.js`, banco 0016/0017 |
| Aceite de termos por versão (`VERSAO_TERMOS`); menores precisam de autorização do responsável | `lib/aceite.js`, `lib/contato.js`, banco 0019 |
| Endereço público seguro (evita link para site falso depois do login) | `lib/origem.js` |
| Dicas: no máximo 1 por dia, 14 dias sem repetir, pausa se ignoradas; tudo no aparelho | `lib/dicasMotor.js` |

## Os arquivos de `lib/`
Cada um tem cabeçalho `@arquivo` explicando o que faz e quem usa. Por tipo: **regra** (papeis, util, dados, desafios, jeito, relatorio, sugestoes…), **aviso** (despachante, convite, aquecer), **offline** (fila), **infra** (supabase/client, supabase/server).

## Desafios: ciclos e limite (26/11, SQL 0031)
@decisao 26/11 Thomas (opção 1). Regras:
- **Ciclo de 4 semanas** por padrão (2 ou 8 também valem, escolhidos ao Renovar). A semana ainda recomeça toda segunda; o que acaba é o desafio.
- **Limite:** ideal 1 desafio por pessoa, máximo 2; a família tem 1. Conferido no app (`MAX_POR_PESSOA`) **e no banco** (gatilho `ra_desafios_limite`). Desafio que descansa não conta.
- **Fim:** o banco para de gerar períodos no fim do ciclo (`ra_desafios_atualizar`), guarda o balanço (`ciclo_feitas`), marca `descansando_em` e avisa Pai e Mãe uma vez. Pai/Mãe escolhem Renovar, Subir um nível (meta um passo acima, só se foi bem) ou Trocar. **Nunca renova sozinho.**
- **Troca:** encerrar no meio do ciclo vale 1 vez por semana por pessoa (desfazer um desafio criado há menos de 1 dia não conta; terminar o ciclo também não).
- Desafios que já existiam ganham um ciclo novo de 4 semanas a partir da semana em que o SQL 0031 rodar.
- Tom: positivo, sem culpa ("Sem pressa", "Menos é mais"). Textos na Ajuda, nos manuais e no balãozinho "Como funciona".

## Categorias padrão e sugestões de Chegada (26/11, SQL 0032)

- Categorias padrão: Casa, Estudo, **Esporte e lazer** (Esporte + Lazer juntas), **Pet** (cor teal, ícone patinha `cPet`), Social, Saúde, Cuidado pessoal, Espiritual, Financeiro, Trabalho, Outros. "Música/Cursos" virou "Cursos".
- As sugestões de tarefa ficam em `lib/sugestoes.js`; Pet tem 12 tarefas e "Passear com o cachorro"/"Dar comida aos animais" saíram de Casa.
- Os desafios (`lib/desafios.js`) usam o nome "Esporte e lazer"; o nome tem de bater com a categoria da família.
- Tarefa tipo **Chegada**: botão "Sugestões" abre `CHEGADAS` (`lib/sugestoes.js`), na ordem escolhida pelo Thomas: escola, casa, curso, treino, casa do amigo, casa da mãe, casa do pai, igreja, shopping, trabalho, faculdade. Um toque preenche o título; dá para digitar outro destino.

## Tempo de tela: horários e quem lança (27/11, sem SQL novo)

- **"Lançar sempre às" e "Pode lançar até"** são `hora_inicio` e `hora_fim` da tarefa "Lançar tempo de tela" (`ra_tarefas`). Quem grava é `gravarHorariosTela` em `app/acoes.js`, chamada por `salvarPrevisto`; ela também ajusta as ocorrências ainda pendentes. Vazio em "Pode lançar até" = sem limite.
- **Engrenagem**: só liga/desliga pessoas e as regras "Pode adiar" e "Exige justificativa" (`salvarLancamentoTela`, só para outras pessoas).
- **Responsáveis e adultos** lançam o previsto; **criança e adolescente** só lançam o dia de ontem, com o previsto fixo definido pelos responsáveis (lido por `ra_tela_previsto_dia`).
- **Criança** vê estrelas (`components/TelaEstrelas.js`); os demais veem o gráfico de sempre (`TelaGrafico`).
- Foto/galeria: `components/Foto.js` com `redondo`, igual na tela e no cartão da tarefa em Hoje.
