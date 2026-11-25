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

## Onde editar

- **Perguntas da Ajuda**: listas `PAIS`, `ADOLESCENTE`, `CRIANCA` e `ADMIN` em `app/(app)/ajuda/page.js`.
- **Manuais** (`public/manual*.html` e PDFs) são **gerados** fora do repositório, na pasta do projeto `rotina-viva/manual/beelo-v3/gerador/`:
  `conteudo.py` (textos), `gerar.py` (monta as páginas), `manual.css` (estilo), `render.cjs` (PDF), `cap.cjs` + `mock.mjs` (prints das telas com a Família Silva no Supabase falso).
  Regerar: `python3 gerar.py <saida>` e `node render.cjs <saida>`; depois copie os 3 HTML para `public/` e os 3 PDF para `public/manual-pdf/`.
- Logo dos manuais: só o **beelo** (hexágono com check + nome), sem "app" embaixo.

## Cobertura (25/11/2026)

Cobertos: entrada e instalação, pessoas, papel e parentesco, grupos, tarefas, Painel, agenda, relatórios, tempo de tela, modo criança e jeito de ver, Desafios, Cofrinho, Vitrine, desejos e prêmios, Mural e privacidade, "Como funciona", guia da Mel (beta), lâmpada de ideias, offline, Ajuda.
**Ainda não documentados como prontos**: novo layout de Desafios em abas (Opção A, aplicado em 25/11: a Ajuda do app já cita "Desafios › Vitrine/Mural"; falta atualizar os manuais em PDF) e o aviso de chegada "Cheguei". Quando entrarem, atualize `conteudo.py` e a lista `PAIS`/`ADOLESCENTE`/`CRIANCA` no mesmo PR.
