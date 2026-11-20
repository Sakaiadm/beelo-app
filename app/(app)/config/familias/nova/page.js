import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import NovaFamiliaForm from '@/components/NovaFamiliaForm';

export const dynamic = 'force-dynamic';

export default async function NovaFamilia() {
  const { superAdmin } = await exigirGestor();
  if (!superAdmin) redirect('/config');
  return (
    <main className="estreito">
      <Voltar href="/config/familias" titulo="Novo grupo" />
      <NovaFamiliaForm />
      <p className="peq-cinza">O responsável entra como gestor do novo grupo e cadastra as outras pessoas. Avise o responsável para entrar no app com esse e-mail.</p>
    </main>
  );
}
