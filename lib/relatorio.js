import { hojeISO, addDias, inicioMes, inicioSemana, statusExibido } from './util';
import { ocorrencias } from './dados';

export function lerFiltros(sp) {
  const hoje = hojeISO();
  const per = ['hoje', 'semana', 'mes', '30d', 'livre'].includes(sp.per) ? sp.per : 'mes';
  let de = inicioMes(hoje), ate = hoje;
  if (per === 'hoje') de = hoje;
  if (per === 'semana') de = inicioSemana(hoje);
  if (per === '30d') de = addDias(hoje, -29);
  if (per === 'livre') {
    const ok = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
    de = ok(sp.de) ? sp.de : de; ate = ok(sp.ate) ? sp.ate : ate;
    if (ate < de) [de, ate] = [ate, de];
    if ((new Date(ate) - new Date(de)) / 86400000 > 62) de = addDias(ate, -62);
  }
  return {
    per, de, ate, m: sp.m || '', cat: sp.cat || '', st: sp.st || '', origem: sp.origem || '', hor: sp.hor || '',
  };
}

export async function dadosRelatorio(supabase, f, { gestor, eu, membros }) {
  const filhos = membros.filter((m) => m.papel === 'filho');
  const ids = gestor ? (f.m ? [f.m] : filhos.map((x) => x.id)) : [eu.id];
  const hoje = hojeISO();
  let lista = (await ocorrencias(supabase, { de: f.de, ate: f.ate > hoje ? hoje : f.ate, membros: ids })).map((o) => ({ o, st: statusExibido(o, hoje) }));
  if (f.cat) lista = lista.filter((x) => x.o.tarefa?.categoria?.id === f.cat);
  if (f.origem === 'pais') lista = lista.filter((x) => x.o.tarefa?.criada_por !== x.o.membro_id);
  if (f.origem === 'filho') lista = lista.filter((x) => x.o.tarefa?.criada_por === x.o.membro_id);
  if (f.hor === 'com') lista = lista.filter((x) => x.o.hora_inicio);
  if (f.hor === 'sem') lista = lista.filter((x) => !x.o.hora_inicio);
  if (f.st) lista = lista.filter((x) => (f.st === 'cumprida' ? x.st.startsWith('cumprida') : x.st === f.st));
  return { lista, ids };
}
