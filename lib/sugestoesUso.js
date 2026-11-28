'use client';
// @arquivo  sugestoesUso.js: guarda no aparelho as sugestões favoritas (estrelinha) e quantas vezes cada uma foi usada.
// @tipo     regra
// @usado-por components/TarefaForm.js
// @decisao   Fica no aparelho (localStorage), sem banco: é só preferência de quem cria tarefas. Se limpar os dados do navegador, recomeça.
// @regra     Ordem na lista de Sugestões: favoritas primeiro, depois as mais usadas; as nunca usadas ficam na ordem original (descem sozinhas).
const CH_FAV = 'beelo_sug_fav_v1';
const CH_USO = 'beelo_sug_uso_v1';
const MAX_ALTO = 3; // quantas favoritas aparecem na listinha do alto

function ler(chave, vazio) {
  try { const v = JSON.parse(localStorage.getItem(chave)); return v ?? vazio; } catch { return vazio; }
}
function gravar(chave, v) { try { localStorage.setItem(chave, JSON.stringify(v)); } catch {} }

export const lerFavoritas = () => { const v = ler(CH_FAV, []); return Array.isArray(v) ? v : []; };
export const lerUso = () => { const v = ler(CH_USO, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; };

// Liga/desliga a estrelinha. Devolve a nova lista.
export function alternarFavorita(nome) {
  const f = lerFavoritas();
  const novo = f.includes(nome) ? f.filter((x) => x !== nome) : [...f, nome];
  gravar(CH_FAV, novo);
  return novo;
}

// Conta mais um uso (chamado quando a pessoa escolhe a sugestão). Devolve o novo mapa.
export function contarUso(nome) {
  const u = lerUso();
  u[nome] = (u[nome] || 0) + 1;
  gravar(CH_USO, u);
  return u;
}

// Ordena: favoritas primeiro, depois mais usadas; empate mantém a ordem original.
export function ordenarSugestoes(lista, favoritas, uso) {
  return lista.map((x, i) => ({ x, i }))
    .sort((a, b) => (favoritas.includes(b.x.nome) - favoritas.includes(a.x.nome)) || ((uso[b.x.nome] || 0) - (uso[a.x.nome] || 0)) || (a.i - b.i))
    .map((o) => o.x);
}

// As favoritas do alto: até 3, as mais usadas primeiro.
export function favoritasDoAlto(todas, favoritas, uso) {
  return ordenarSugestoes(todas.filter((x) => favoritas.includes(x.nome)), favoritas, uso).slice(0, MAX_ALTO);
}
