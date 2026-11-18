// Previsto x realizado de tempo de tela para um membro e intervalo.
export async function telaResumo(supabase, membroId, de, ate) {
  const { data: reais } = await supabase.from('ra_tela_real').select('*').eq('membro_id', membroId).gte('data', de).lte('data', ate).order('data');
  const out = [];
  for (const r of reais || []) {
    const { data: p } = await supabase.rpc('ra_tela_previsto_dia', { p_membro: membroId, p_data: r.data });
    const prev = p?.[0] || null;
    out.push({ ...r, previsto: prev });
  }
  return out;
}
export function totalReal(r) { return r.min_total ?? ((r.min_celular || 0) + (r.min_computador || 0)); }
