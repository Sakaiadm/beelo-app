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
