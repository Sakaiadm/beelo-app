// @arquivo  page.js: vitrine de prêmios (banco de prêmios, preços e lista de desejos).
// @tipo     tela
// @usa      banco ra_premios, lib/sessao, lib/desafiosDados, lib/desafios, components/Voltar, components/Form, components/Icone, app/acoes-desafios, components/PremioLinha, components/BancoPremios
// @usado-por Next.js (rota /desafios/premios)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import { desafiosLigados } from '@/lib/desafiosDados';
import { PREMIOS } from '@/lib/desafios';
import Voltar from '@/components/Voltar';
import Form from '@/components/Form';
import Icone from '@/components/Icone';
import { adicionarPremio } from '@/app/acoes-desafios';
import PremioLinha from '@/components/PremioLinha';
import BancoPremios from '@/components/BancoPremios';

export const dynamic = 'force-dynamic';

const FAIXA = { ate8: 'até 8 anos', mais8: '9 anos ou mais', todos: 'qualquer idade', teen: 'adolescente' };

// Vitrine de prêmios: o app já começa com uma seleção; os pais tiram, voltam ou acrescentam (do banco ou um prêmio próprio).
export default async function Premios({ searchParams }) {
  const sp = await searchParams;
  const { supabase, familia, membros } = await exigirGestor();
  if (!desafiosLigados(familia)) redirect('/desafios');
  const aba = sp?.a === 'teen' ? 'teen' : 'crianca';
  const { data: todos } = await supabase.from('ra_premios').select('*').order('custo');
  const naAba = (f) => (aba === 'teen' ? f === 'teen' : f !== 'teen');
  // Desejos ainda sem resposta (ou com "agora não") ficam fora da vitrine.
  const meus = (todos || []).filter((p) => naAba(p.faixa) && (!p.desejo || p.desejo === 'aprovado'));
  const nomeDe = Object.fromEntries((membros || []).map((m) => [m.id, m.nome]));
  const usados = new Set((todos || []).filter((p) => p.ativo).map((p) => p.catalogo));
  const banco = PREMIOS.filter((p) => naAba(p.faixa) && !usados.has(p.id));
  const un = aba === 'teen' ? 'semanas' : 'estrelinhas';
  return (
    <main className="estreito">
      <Voltar href="/desafios" titulo="Vitrine de prêmios" sub="Combine com cada um o que vale a pena juntar." />
      <div className="seg">
        <Link prefetch={false} href="/desafios/premios" className={aba === 'crianca' ? 'on' : ''}>Criança (estrelinhas)</Link>
        <Link prefetch={false} href="/desafios/premios?a=teen" className={aba === 'teen' ? 'on' : ''}>Adolescente (semanas)</Link>
      </div>
      <details className="card mais-op criar-premio">
        <summary>+ Criar meu prêmio</summary>
        <Form acao={adicionarPremio} limpar>
          <label htmlFor="pr-nome" style={{ marginTop: 0 }}>Nome</label>
          <input id="pr-nome" name="nome" maxLength={80} placeholder={aba === 'teen' ? 'Ex.: escolher a pizza da sexta' : 'Ex.: passeio no shopping'} />
          <div className="dupla" style={{ marginTop: 4 }}>
            <div><label htmlFor="pr-custo">{aba === 'teen' ? 'Semanas' : 'Estrelinhas'}</label><input id="pr-custo" name="custo" type="number" min="1" max="1000" inputMode="numeric" defaultValue={aba === 'teen' ? 2 : 30} /></div>
            {aba === 'teen' ? <input type="hidden" name="faixa" value="teen" /> : (
              <div><label htmlFor="pr-faixa">Para</label><select id="pr-faixa" name="faixa" defaultValue="todos"><option value="todos">Qualquer idade</option><option value="ate8">Até 8 anos</option><option value="mais8">9 anos ou mais</option></select></div>
            )}
          </div>
          <button className="btn bloco" style={{ marginTop: 14 }}>Acrescentar</button>
        </Form>
      </details>
      <div className="card" style={{ padding: '4px 18px' }}>
        {meus.length === 0 && <div className="vazio">Nenhum prêmio ainda. Acrescente abaixo.</div>}
        {meus.map((p) => (
          <PremioLinha key={p.id} premio={{ id: p.id, nome: p.nome, custo: p.custo, ativo: p.ativo }} un={un} teen={aba === 'teen'}
            sub={`${p.custo} ${un} · ${p.membro_id ? `desejo de ${nomeDe[p.membro_id] || 'alguém'}` : FAIXA[p.faixa]}${p.ativo ? '' : ' · fora da vitrine'}`} />
        ))}
      </div>

      {banco.length > 0 && <>
        <div className="grupo-titulo">Acrescentar do banco</div>
        <BancoPremios itens={banco.map((p) => ({ id: p.id, nome: p.nome, custo: p.custo, faixa: p.faixa }))} un={un} teen={aba === 'teen'} />
      </>}

    </main>
  );
}
