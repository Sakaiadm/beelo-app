import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import PessoaForm from '@/components/PessoaForm';
import { corLivre } from '@/lib/cores';
import { hojeISO } from '@/lib/util';

export const dynamic = 'force-dynamic';

export default async function NovaPessoa() {
  const { membros, familia, eu } = await exigirGestor();
  return (
    <main className="estreito">
      <Voltar href="/config/pessoas" titulo="Adicionar pessoa" />
      <PessoaForm familia={familia.id} corInicial={corLivre(membros)} usadas={membros.map((m) => m.cor)} euId={eu.id} hoje={hojeISO()}
        existentes={membros.map((x) => ({ id: x.id, nome: x.nome, email: x.email, user_id: x.user_id, convidado_em: x.convidado_em }))} />
    </main>
  );
}
