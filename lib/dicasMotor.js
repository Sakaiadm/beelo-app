// @arquivo  dicasMotor.js: motor das dicas e da "ideia do dia" (estado guardado no aparelho).
// @tipo     regra
// @usa      localStorage (chave ra-dicas:<membro>); evento 'ra-dicas' para avisar as lâmpadas
// @usado-por components/LampadaFlutuante.js, components/LampadaBtn.js, components/IdeiasCliente.js
// @cuidado  o número da lâmpada do topo e a lâmpada flutuante leem o MESMO estado ('pend'): quem abre uma ideia
//           tem de tirar de 'pend' (marcarVista / marcarTodasVistas), senão o número não some.

// Motor das dicas (seção 66.6). Roda no aparelho e guarda tudo no próprio aparelho (localStorage):
// 1 dica por dia no máximo; a mesma só volta depois de 14 dias; ritmo cai com o tempo
// (semanas 1-2: até 1 por dia; 3-4: até 3 por semana; depois: até 2 por semana);
// 3 dicas fechadas seguidas sem abrir = pausa de 7 dias (e depois 1 por semana por 2 semanas);
// depois de uma dica de atraso, a próxima é positiva ou neutra; dica não lida some em 3 dias.

const chave = (m) => `ra-dicas:${m}`;
const dias = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);
const mais = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

export function ler(m) {
  let e = null;
  try { e = JSON.parse(localStorage.getItem(chave(m)) || 'null'); } catch { e = null; }
  return { hist: {}, mostradas: [], pend: [], vistas: [], fechadas: 0, ...(e || {}) };
}
export function gravar(m, e) {
  try { localStorage.setItem(chave(m), JSON.stringify(e)); } catch { /* aparelho sem espaço ou modo privado */ }
  try { window.dispatchEvent(new Event('ra-dicas')); } catch { /* fora do navegador */ }
}

// Dicas ainda não lidas (para o número na lâmpada): no máximo 3, das últimas 3 noites.
export function pendentes(e, hoje) {
  return (e.pend || []).filter((p) => dias(p.d, hoje) <= 3).slice(-3);
}

function cabeNoRitmo(e, hoje) {
  const semana = (e.mostradas || []).filter((d) => dias(d, hoje) < 7).length;
  if (e.devagarAte && e.devagarAte >= hoje) return semana < 1;
  const idade = dias(e.inicio, hoje);
  if (idade < 14) return true; // o limite de 1 por dia já vale sempre
  if (idade < 28) return semana < 3;
  return semana < 2;
}

// Decide a dica de hoje. Devolve a dica (ou null) e já grava o estado.
export function dicaDeHoje(m, cands, hoje) {
  const e = ler(m);
  if (!e.inicio) e.inicio = hoje;
  e.pend = (e.pend || []).filter((p) => dias(p.d, hoje) <= 3);
  if (e.off) { gravar(m, e); return null; }
  if (e.dia === hoje) {
    gravar(m, e);
    if (e.hojeFechada) return null;
    return cands.find((c) => c.k === e.hojeK) || e.hojeDica || null;
  }
  if (e.pausa && e.pausa > hoje) { gravar(m, e); return null; }
  if (!cabeNoRitmo(e, hoje)) { gravar(m, e); return null; }
  const escolhida = cands.find((c) => {
    if (c.inicio && dias(e.inicio, hoje) >= 7) return false;
    const ult = e.hist[c.k];
    if (ult && dias(ult, hoje) < 14) return false;
    if (e.ultTipo === 'atraso' && c.tipo === 'atraso') return false;
    return true;
  });
  if (!escolhida) { gravar(m, e); return null; }
  e.dia = hoje; e.hojeK = escolhida.k; e.hojeDica = escolhida; e.hojeFechada = false;
  e.hist[escolhida.k] = hoje;
  e.mostradas = [...(e.mostradas || []).filter((d) => dias(d, hoje) < 28), hoje];
  e.ultTipo = escolhida.tipo;
  e.pend = [...e.pend.filter((p) => p.k !== escolhida.k), { k: escolhida.k, t: escolhida.t, i: escolhida.i, d: hoje }].slice(-3);
  // Limpa o histórico velho para não crescer sem fim.
  Object.keys(e.hist).forEach((k) => { if (dias(e.hist[k], hoje) > 60) delete e.hist[k]; });
  gravar(m, e);
  return escolhida;
}

export function fechar(m, hoje) {
  const e = ler(m);
  e.hojeFechada = true;
  e.pend = (e.pend || []).filter((p) => p.k !== e.hojeK);
  e.fechadas = (e.fechadas || 0) + 1;
  if (e.fechadas >= 3) { e.pausa = mais(hoje, 7); e.devagarAte = mais(hoje, 21); e.fechadas = 0; }
  gravar(m, e);
}

// A pessoa abriu uma ideia (pela faixa ou pela lâmpada): conta como lida e vai para "Já vistas".
export function marcarVista(m, ideia, hoje) {
  const e = ler(m);
  if (e.pend?.some((p) => p.i === ideia) && e.dia === hoje) e.hojeFechada = true;
  e.pend = (e.pend || []).filter((p) => p.i !== ideia);
  e.fechadas = 0;
  e.vistas = [{ i: ideia, d: hoje }, ...(e.vistas || []).filter((v) => v.i !== ideia)].slice(0, 30);
  gravar(m, e);
}

// @decisao 25/11 A pessoa abriu a lâmpada (do topo ou a flutuante): TODAS as ideias novas contam como vistas.
// Antes só a ideia aberta saía de 'pend'; sobrando outra das últimas 3 noites, o número "1" ficava para sempre.
export function marcarTodasVistas(m, hoje) {
  const e = ler(m);
  const pend = e.pend || [];
  if (!pend.length) return;
  if (pend.some((p) => p.k === e.hojeK) && e.dia === hoje) e.hojeFechada = true;
  e.vistas = [...pend.map((p) => ({ i: p.i, d: hoje })).reverse(), ...(e.vistas || []).filter((v) => !pend.some((p) => p.i === v.i))].slice(0, 30);
  e.pend = [];
  e.fechadas = 0;
  gravar(m, e);
}

export function ligar(m, on) { const e = ler(m); e.off = !on; gravar(m, e); }
