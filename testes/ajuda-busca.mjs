// @arquivo  ajuda-busca.mjs: testa a busca da Ajuda (sinônimos, acento, erro de digitação) com as perguntas reais.
// @tipo     teste
// @usa      lib/ajudaBusca.js, perguntas lidas de app/(app)/ajuda/page.js
// @usado-por rodar com: node testes/ajuda-busca.mjs
import { readFileSync } from 'node:fs';
import { buscar } from '../lib/ajudaBusca.js';
const src = readFileSync(new URL('../app/(app)/ajuda/page.js', import.meta.url), 'utf8');
const pega = (nome) => eval(src.slice(src.indexOf(`const ${nome} = [`) + `const ${nome} = `.length, src.indexOf('];', src.indexOf(`const ${nome} = [`)) + 1));
const PAIS = pega('PAIS'), ADO = pega('ADOLESCENTE'), CRI = pega('CRIANCA');
const casos = [
  [PAIS, 'remarcar tarefa', 'Pedidos de adiamento e justificativas'],
  [PAIS, 'criar tarefa', 'Criar uma tarefa'],
  [PAIS, 'como dar um presente pro meu filho', 'Vitrine de prêmios e cofrinho'],
  [PAIS, 'esqueci a senha', null],
  [PAIS, 'convite nao chegou', 'O convite não chegou'],
  [PAIS, 'premio', 'Vitrine de prêmios e cofrinho'],
  [PAIS, 'desafios', 'Desafios (beta)'],
  [PAIS, 'desafo', 'Desafios (beta)'],
  [PAIS, 'tempo de tela', 'Tempo de tela'],
  [PAIS, 'irmao ve o desejo', 'Mural, ajustes e privacidade'],
  [PAIS, 'abelhinha', 'Guia da Mel (beta)'],
  [ADO, 'adiar', 'Como adiar uma tarefa'],
  [ADO, 'quero um presente', 'Como sugerir um desejo'],
  [ADO, 'meus irmaos veem', 'Quem vê meus desejos e pedidos'],
  [CRI, 'cofrinho', 'O meu cofrinho'],
  [CRI, 'estrelinhas', 'O meu cofrinho'],
  [CRI, 'marquei errado', 'Marquei sem querer'],
];
let ok = 0;
for (const [lista, q, esperado] of casos) {
  const r = buscar(lista, q).map((x) => x[0]);
  const bom = esperado ? r.slice(0, 3).includes(esperado) : true;
  console.log(bom ? 'ok  ' : 'ERRO', JSON.stringify(q), '→', r.slice(0, 3).join(' | ') || '(nada)');
  if (bom) ok++;
}
console.log(`${ok}/${casos.length}`);
process.exit(ok === casos.length ? 0 : 1);
