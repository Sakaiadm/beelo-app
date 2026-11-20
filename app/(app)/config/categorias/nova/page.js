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
