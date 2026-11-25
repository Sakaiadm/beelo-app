// @arquivo  page.js: cadastrar uma pessoa nova na família (com convite por e-mail).
// @tipo     tela
// @usa      lib/sessao, components/Voltar, components/PessoaForm, lib/cores
// @usado-por Next.js (rota /config/pessoas/nova)
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import PessoaForm from '@/components/PessoaForm';
import { corLivre } from '@/lib/cores';

export const dynamic = 'force-dynamic';

export default async function NovaPessoa() {
  const { membros, familia, eu } = await exigirGestor();
  return (
    <main className="estreito">
      <Voltar href="/config/pessoas" titulo="Adicionar pessoa" />
      <PessoaForm familia={familia.id} corInicial={corLivre(membros)} usadas={membros.map((m) => m.cor)} euId={eu.id} guia={familia.guia_mel === true}
        existentes={membros.map((x) => ({ id: x.id, nome: x.nome, email: x.email, user_id: x.user_id, convidado_em: x.convidado_em }))} />
    </main>
  );
}
