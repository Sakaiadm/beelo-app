// Links temporários das imagens de perfil (bucket privado rotina-avatares).
export async function urlsAvatares(supabase, caminhos) {
  const lista = [...new Set((caminhos || []).filter((c) => c && !c.startsWith('preset:')))];
  if (!lista.length) return {};
  const { data } = await supabase.storage.from('rotina-avatares').createSignedUrls(lista, 3600);
  const mapa = {};
  (data || []).forEach((d) => { if (d.signedUrl) mapa[d.path] = d.signedUrl; });
  return mapa;
}
