import { hojeISO, addDias } from './util';
import { perfil, faixaDe, premioServe, proximoNivel, desafioDe } from './desafios';

// Desafios ligados nesta família? (SQL 0016; sem a coluna, fica desligado.)
export const desafiosLigados = (familia) => familia?.desafios_beta === true;

// Atualiza (fecha semanas, renova, dá estrelinhas) e carrega tudo o que as telas de desafios precisam.
// O banco só devolve o que cada pessoa pode ver (RLS): gestor vê tudo; os demais, o próprio e o da família
// (e o dos irmãos, se o mural estiver aberto para todos).
export async function carregarDesafios(supabase, { eu, membros, atualizar = true }) {
  const hoje = hojeISO();
  if (atualizar) await supabase.rpc('ra_desafios_atualizar');
  const [{ data: desafios }, { data: periodos }, { data: cofre }, { data: pedidos }, { data: premios }] = await Promise.all([
    supabase.from('ra_desafios').select('*').eq('ativo', true).order('criado_em'),
    supabase.from('ra_desafio_periodos').select('*').gte('fim', addDias(hoje, -70)).order('inicio', { ascending: false }),
    supabase.from('ra_cofrinho').select('membro_id, moeda, valor'),
    supabase.from('ra_premio_pedidos').select('*').order('criado_em', { ascending: false }).limit(200),
    supabase.from('ra_premios').select('*').eq('ativo', true).order('custo'),
  ]);
  const desejos = await lerDesejos(supabase);
  const saldo = {};
  (cofre || []).forEach((c) => { const s = (saldo[c.membro_id] ||= { estrelas: 0, semanas: 0 }); s[c.moeda] += c.valor; });
  const porDesafio = {};
  (periodos || []).forEach((p) => { (porDesafio[p.desafio_id] ||= []).push(p); });
  const lista = (desafios || []).map((d) => {
    const pers = porDesafio[d.id] || [];
    const atual = pers.find((p) => p.inicio <= hoje && p.fim >= hoje) || null;
    // Próximo nível: 3 períodos seguidos cumpridos (os mais recentes já fechados).
    const fechados = pers.filter((p) => p.fim < hoje);
    const seguidos = fechados.slice(0, 3).filter((p) => p.status === 'cumprido').length;
    const prox = seguidos === 3 ? proximoNivel(d) : null;
    return { ...d, atual, prox, seguidos };
  });
  const nomes = Object.fromEntries((membros || []).map((m) => [m.id, m]));
  return { hoje, desafios: lista, periodos: periodos || [], saldo, pedidos: pedidos || [], premios: premios || [], desejos, nomes };
}

// Comemorações ainda não vistas pela própria pessoa (cumpridos nos últimos 10 dias).
export function paraComemorar(periodos, eu, desafios) {
  const tit = Object.fromEntries(desafios.map((d) => [d.id, d]));
  const limite = addDias(hojeISO(), -10);
  return periodos.filter((p) => p.membro_id === eu.id && p.status === 'cumprido' && !p.visto && p.fim >= limite && tit[p.desafio_id])
    .map((p) => ({ id: p.id, titulo: tit[p.desafio_id].titulo, d: tit[p.desafio_id], p }));
}

// Prêmios da vitrine de uma pessoa e o prêmio que ela está juntando (escolhido ou sugerido pelo app).
export function vitrineDe(m, premios, saldo) {
  const faixa = faixaDe(m);
  // Prêmios da família para a faixa da pessoa, mais os desejos aprovados dela (desejo de um é só dele).
  const lista = premios.filter((p) => (p.membro_id ? p.membro_id === m.id : premioServe({ faixa: p.faixa }, faixa)));
  const moeda = faixa === 'teen' ? 'semanas' : 'estrelas';
  const tem = saldo?.[m.id]?.[moeda] || 0;
  const meta = lista.find((p) => p.id === m.cofrinho_meta) || lista.find((p) => p.custo > tem) || null;
  return { faixa, moeda, tem, lista, meta, sugerida: !!meta && meta.id !== m.cofrinho_meta };
}

// Quem pode ter desafio: pessoas ativas (filhos e adultos).
export function pessoasDesafio(membros) {
  return (membros || []).filter((m) => m.ativo).map((m) => ({ ...m, perfil: perfil(m) }));
}

// Medalhas do mural (discretas, só quando a pessoa conquista).
export function medalhas(periodos, membroId) {
  const meus = periodos.filter((p) => p.membro_id === membroId && p.status === 'cumprido');
  const n = meus.length;
  const out = [];
  [[1, 'Primeiro desafio'], [5, '5 desafios'], [10, '10 desafios'], [25, '25 desafios'], [50, '50 desafios']].forEach(([k, t]) => { if (n >= k) out.push(t); });
  // Semanas seguidas com pelo menos um desafio cumprido.
  const semanas = [...new Set(meus.map((p) => p.inicio))].sort();
  let run = 0, best = 0, ant = null;
  semanas.forEach((s) => { run = ant && addDias(ant, 7) === s ? run + 1 : 1; best = Math.max(best, run); ant = s; });
  if (best >= 4) out.push('4 semanas seguidas');
  return out;
}

export const catalogoDe = (d) => desafioDe(d.catalogo) || null;

// Desejos sugeridos (SQL 0017). Sem o SQL, a lista fica vazia e o resto continua funcionando.
export async function lerDesejos(supabase, membroId) {
  let q = supabase.from('ra_premios').select('*').not('desejo', 'is', null).order('criado_em');
  if (membroId) q = q.eq('membro_id', membroId);
  const { data, error } = await q;
  return error ? [] : data || [];
}
// O que a pessoa vê em "Meus desejos": os que esperam os pais e as respostas "agora não" dos últimos 14 dias.
export function desejosVisiveis(desejos, membroId) {
  const limite = Date.now() - 14 * 86400e3;
  return desejos.filter((x) => x.membro_id === membroId && (x.desejo === 'esperando' || (x.desejo === 'agora_nao' && new Date(x.respondido_em).getTime() > limite)));
}
