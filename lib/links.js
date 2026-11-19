// Links temporários das imagens (buckets privados), guardados enquanto ainda valem.
// Assim a mesma foto não é pedida de novo ao Supabase a cada tela, e o navegador reaproveita a imagem já baixada.
const guardados = new Map(); // `${bucket}|${caminho}` -> { url, ate }

export async function linksAssinados(supabase, bucket, caminhos, validadeSeg) {
  const agora = Date.now();
  const lista = [...new Set((caminhos || []).filter(Boolean))];
  const mapa = {}, faltam = [];
  for (const c of lista) {
    const g = guardados.get(`${bucket}|${c}`);
    if (g && g.ate > agora) mapa[c] = g.url; else faltam.push(c);
  }
  if (!faltam.length) return mapa;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(faltam, validadeSeg);
  if (guardados.size > 2000) guardados.clear();
  // Reaproveita até faltar 20% da validade, para o link nunca vencer na tela.
  const ate = agora + validadeSeg * 800;
  (data || []).forEach((d) => {
    if (!d.signedUrl) return;
    mapa[d.path] = d.signedUrl;
    guardados.set(`${bucket}|${d.path}`, { url: d.signedUrl, ate });
  });
  return mapa;
}
