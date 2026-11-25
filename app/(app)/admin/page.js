// @arquivo  page.js: rota antiga /admin; só leva para Cadastros > Famílias e grupos.
// @tipo     tela
// @usado-por Next.js (rota /admin)
import { redirect } from 'next/navigation';

// A administração de famílias agora fica em Cadastros > Famílias e grupos.
export default function Admin() {
  redirect('/config/familias');
}
