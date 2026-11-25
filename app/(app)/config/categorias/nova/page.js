// @arquivo  page.js: criar categoria de tarefa.
// @tipo     tela
// @usa      lib/sessao, components/Voltar, components/CategoriaForm
// @usado-por Next.js (rota /config/categorias/nova)
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import CategoriaForm from '@/components/CategoriaForm';

export const dynamic = 'force-dynamic';

export default async function NovaCategoria() {
  await exigirGestor();
  return (
    <main className="estreito">
      <Voltar href="/config/categorias" titulo="Nova categoria" />
      <CategoriaForm />
    </main>
  );
}
