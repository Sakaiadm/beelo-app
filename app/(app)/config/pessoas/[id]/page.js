import { notFound } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import PessoaForm from '@/components/PessoaForm';
import { urlsAvatares } from '@/lib/avatar';

export const dynamic = 'force-dynamic';

export default async function Pessoa({ params }) {
  const { id } = await params;
  const { supabase, membros, familia, eu } = await exigirGestor();
  const m = membros.find((x) => x.id === id);
  if (!m) notFound();
  const urls = await urlsAvatares(supabase, [m.avatar]);
  return (
    <main className="estreito">
      <Voltar href="/config/pessoas" titulo={m.nome} />
      <PessoaForm m={m} familia={familia.id} url={urls[m.avatar]} usadas={membros.filter((x) => x.id !== m.id).map((x) => x.cor)} euId={eu.id} />
    </main>
  );
}
