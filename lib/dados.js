import { CORES_CAT } from './util';

// A geração das ocorrências é idempotente, então não precisa repetir a cada toque: guarda por 60 s quais períodos já foram gerados.
const geradas = new Map();
async function gerar(supabase, de, ate, chave) {
  const agora = Date.now();
  if (chave && geradas.get(chave) > agora) return;
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: de, p_ate: ate });
  if (chave) { geradas.set(chave, agora + 60000); if (geradas.size > 500) geradas.clear(); }
}

export async function ocorrencias(supabase, { de, ate, membros, tarefaId, incluirCanceladas = false }) {
  await gerar(supabase, de, ate, tarefaId ? `t:${tarefaId}:${de}:${ate}` : membros?.length ? `m:${[...membros].sort().join(',')}:${de}:${ate}` : null);
  let q = supabase.from('ra_ocorrencias')
    .select('*, tarefa:ra_tarefas(id, titulo, descricao, exige_foto, permite_adiar, exige_justificativa, criada_por, tipo, categoria:ra_categorias(id, nome, cor))')
    .gte('data', de).lte('data', ate)
    .order('data').order('hora_inicio', { ascending: true, nullsFirst: true });
  if (membros?.length) q = q.in('membro_id', membros);
  if (tarefaId) q = q.eq('tarefa_id', tarefaId);
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
