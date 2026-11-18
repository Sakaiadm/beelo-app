import { CORES_CAT } from './util';

export async function ocorrencias(supabase, { de, ate, membros, incluirCanceladas = false }) {
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: de, p_ate: ate });
  let q = supabase.from('ra_ocorrencias')
    .select('*, tarefa:ra_tarefas(id, titulo, descricao, exige_foto, criada_por, tipo, categoria:ra_categorias(id, nome, cor))')
    .gte('data', de).lte('data', ate)
    .order('data').order('hora_inicio', { ascending: true, nullsFirst: true });
  if (membros?.length) q = q.in('membro_id', membros);
  if (!incluirCanceladas) q = q.neq('status', 'cancelada');
  const { data } = await q;
  return data || [];
}

export async function urlsFotos(supabase, caminhos) {
  const lista = [...new Set(caminhos.filter(Boolean))];
  if (!lista.length) return {};
  const { data } = await supabase.storage.from('rotina-fotos').createSignedUrls(lista, 600);
  const mapa = {};
  (data || []).forEach((d) => { if (d.signedUrl) mapa[d.path] = d.signedUrl; });
  return mapa;
}

export function corCategoria(cat) { return CORES_CAT[cat?.cor] || CORES_CAT.cinza; }
