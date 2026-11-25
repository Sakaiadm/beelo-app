// @arquivo  avatar.js: links temporários das imagens de perfil (bucket privado rotina-avatares).
// @tipo     regra
// @usa      ./links
// @usado-por app/(app)/config/familias/[id]/page.js, app/(app)/config/familias/page.js, app/(app)/config/pessoas/[id]/page.js, app/(app)/config/pessoas/page.js, app/(app)/desafios/mural/page.js, app/(app)/desafios/page.js e mais 2
import { linksAssinados } from './links';

// Links temporários das imagens de perfil (bucket privado rotina-avatares).
export async function urlsAvatares(supabase, caminhos) {
  return linksAssinados(supabase, 'rotina-avatares', (caminhos || []).filter((c) => c && !c.startsWith('preset:')), 3600);
}
