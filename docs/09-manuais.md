# Manuais de uso e Ajuda (um por perfil)

O beelo tem **três manuais ilustrados** (páginas públicas, com PDF) e uma tela **Ajuda** dentro do app. Cada perfil tira dúvidas na sua visão e na sua linguagem.

| Perfil | Quem é | Manual (página) | PDF | Perguntas na Ajuda |
|---|---|---|---|---|
| Responsável | Pai, Mãe e Adulto que ajuda com acesso ao Painel | `/manual` | `public/manual-pdf/beelo-manual-responsaveis.pdf` | "Para responsáveis" + o que o adolescente e a criança veem |
| Adolescente | Filho(a) "como os adultos" e adulto que ajuda sem Painel | `/manual/pessoa` | `beelo-manual-pessoa.pdf` | "Como usar o app" |
| Criança | Filho(a) no modo criança (Divertido ou Calmo): frases curtas, lúdico | `/manual/crianca` | `beelo-manual-crianca.pdf` | "Perguntas e respostas" |

## Como o livro do topo escolhe o manual

O livro do topo (`app/(app)/layout.js`) abre `/ajuda` (`app/(app)/ajuda/page.js`). Lá o item **Manual do app** leva ao manual do perfil de quem está logado:
responsável ou quem tem Painel → `/manual`; criança (Divertido/Calmo, `visaoCrianca`) → `/manual/crianca`; os demais → `/manual/pessoa`.
Pai e Mãe também veem atalhos para os outros dois manuais, para saber o que cada um vê. A Ajuda tem busca, "as mais procuradas" e blocos por assunto.

## Busca (25/11/2026)

- **Ajuda** (responsável e adolescente): caixa "O que você quer saber?". A pessoa digita a dúvida e recebe até 5 respostas prontas (2 a 3 linhas) com o botão "Ver no manual", que abre o capítulo certo e já destaca o que foi digitado. A busca ignora acento, perdoa erro de digitação e entende sinônimos escondidos (adiar/remarcar/depois, prêmio/presente, senha, convite…). Regras em `lib/ajudaBusca.js` (lista `SINONIMOS`); teste: `node testes/ajuda-busca.mjs`.
- **Criança**: sem caixa de busca. Só "Perguntas mais procuradas", em botões grandes e frases curtas.
- **Dentro de cada manual**: botão pequeno "Buscar" no canto direito do topo. Abre a barra, destaca todas as ocorrências, vai à primeira e tem setas para o próximo e o anterior (Enter e Shift+Enter também). Vale para o modo claro e o escuro. O script faz parte do gerador (`BUSCA_JS` em `gerar.py`); a versão em PDF não tem o botão.
- Cada pergunta da Ajuda aponta o capítulo do manual (3º item da lista). Capítulo novo ou renomeado? Ajuste o id em `conteudo.py` e o 3º item das perguntas.

## Onde editar

- **Perguntas da Ajuda**: listas `PAIS`, `ADOLESCENTE`, `CRIANCA` e `ADMIN` em `app/(app)/ajuda/page.js`.
- **Manuais** (`public/manual*.html` e PDFs) são **gerados** fora do repositório, na pasta do projeto `rotina-viva/manual/beelo-v3/gerador/`:
  `conteudo.py` (textos), `gerar.py` (monta as páginas), `manual.css` (estilo), `render.cjs` (PDF), `cap.cjs` + `mock.mjs` (prints das telas com a Família Silva no Supabase falso).
  Regerar: `python3 gerar.py <saida>` e `node render.cjs <saida>`; depois copie os 3 HTML para `public/` e os 3 PDF para `public/manual-pdf/`.
- Logo dos manuais: só o **beelo** (hexágono com check + nome), sem "app" embaixo.

## Cobertura (25/11/2026)

Cobertos: entrada e instalação, pessoas, papel e parentesco, grupos, tarefas, Painel, agenda, relatórios, tempo de tela, modo criança e jeito de ver, Desafios, Cofrinho, Vitrine, desejos e prêmios, Mural e privacidade, "Como funciona", guia da Mel (beta), lâmpada de ideias, offline, Ajuda.
**Ainda não documentados como prontos**: novo layout de Desafios em abas (Opção A) e o aviso de chegada "Cheguei". Quando entrarem, atualize `conteudo.py` e a lista `PAIS`/`ADOLESCENTE`/`CRIANCA` no mesmo PR.
