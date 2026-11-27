// @arquivo  page.js: tela "Contas para alternar (teste)", só do administrador geral.
// @tipo     tela
// @usa      lib/sessao, lib/papeis, components/Voltar, components/ContasAlternar
// @usado-por Next.js (rota /config/contas)
// @cuidado  quem não é administrador geral volta para Cadastros (nem vê que existe).
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import { nomeFuncao } from '@/lib/papeis';
import Voltar from '@/components/Voltar';
import ContasAlternar from '@/components/ContasAlternar';

export const dynamic = 'force-dynamic';

export default async function Contas() {
  const { eu, superAdmin } = await exigirGestor();
  if (!superAdmin) redirect('/config');
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Contas para alternar" />
      <ContasAlternar eu={{ id: eu.id, nome: eu.nome, papel: eu.papel, cor: eu.cor, rotulo: nomeFuncao(eu) }} />
    </main>
  );
}
