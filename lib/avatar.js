import { linksAssinados } from './links';

// Links temporários das imagens de perfil (bucket privado rotina-avatares).
export async function urlsAvatares(supabase, caminhos) {
  return linksAssinados(supabase, 'rotina-avatares', (caminhos || []).filter((c) => c && !c.startsWith('preset:')), 3600);
}
