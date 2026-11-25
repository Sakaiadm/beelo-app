// @arquivo  page.js: editar uma categoria de tarefa.
// @tipo     tela
// @usa      banco ra_categorias, lib/sessao, components/Voltar, components/CategoriaForm
// @usado-por Next.js (rota /config/categorias/[id])
import { notFound } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import CategoriaForm from '@/components/CategoriaForm';

export const dynamic = 'force-dynamic';

export default async function EditarCategoria({ params }) {
  const { id } = await params;
  const { supabase } = await exigirGestor();
  const { data: c } = await supabase.from('ra_categorias').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();
  return (
    <main className="estreito">
      <Voltar href="/config/categorias" titulo="Editar categoria" />
      <CategoriaForm c={c} />
    </main>
  );
}
