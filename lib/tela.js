export async function telaResumo(supabase, membroId, de, ate) {
  const { data: reais } = await supabase.from('ra_tela_real').select('*').eq('membro_id', membroId).gte('data', de).lte('data', ate).order('data');
  return Promise.all((reais || []).map(async (r) => {
    const { data: p } = await supabase.rpc('ra_tela_previsto_dia', { p_membro: membroId, p_data: r.data });
    return { ...r, previsto: p?.[0] || null };
  }));
}
export function totalReal(r) { return r.min_total ?? ((r.min_celular || 0) + (r.min_computador || 0)); }

// Texto do previsto: só os aparelhos que têm tempo (o que ficou em 0h00 não aparece).
export function textoPrevisto(p, fmt) {
  if (!p) return '';
  if (p.formato === 'total') return `Total ${fmt(p.min_total)}`;
  const partes = [];
  if (p.min_celular != null) partes.push(`Celular ${fmt(p.min_celular)}`);
  if (p.min_computador != null) partes.push(`Computador ${fmt(p.min_computador)}`);
  return partes.join(' · ') || `Total ${fmt(p.min_total)}`;
}

// Últimos 7 dias (até `ate`): previsto em vigor em cada dia e o realizado lançado.
export async function telaSemana(supabase, membroId, ate, addDias) {
  const de = addDias(ate, -6);
  const { data: reais } = await supabase.from('ra_tela_real').select('data, min_celular, min_computador, min_total').eq('membro_id', membroId).gte('data', de).lte('data', ate);
  const porData = Object.fromEntries((reais || []).map((r) => [r.data, r]));
  const dias = [];
  for (let i = 0; i < 7; i++) dias.push(addDias(de, i));
  return Promise.all(dias.map(async (d) => {
    const { data: p } = await supabase.rpc('ra_tela_previsto_dia', { p_membro: membroId, p_data: d });
    const pv = p?.[0] || null, r = porData[d] || null;
    return {
      data: d,
      prev: pv ? { cel: pv.min_celular, pc: pv.min_computador, total: pv.min_total } : null,
      real: r ? { cel: r.min_celular, pc: r.min_computador, total: totalReal(r) } : null,
    };
  }));
}
