import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import { desafiosLigados } from '@/lib/desafiosDados';
import { PREMIOS } from '@/lib/desafios';
import { Estrela, Hexagono } from '@/components/DesafioCartao';
import Voltar from '@/components/Voltar';
import Form from '@/components/Form';
import Icone from '@/components/Icone';
import { alternarPremio, adicionarPremio } from '@/app/acoes-desafios';
import EditarPremio from '@/components/EditarPremio';

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
  const Moeda = aba === 'teen' ? Hexagono : Estrela;
  const un = aba === 'teen' ? 'semanas' : 'estrelinhas';
  return (
    <main className="estreito">
      <Voltar href="/desafios" titulo="Vitrine de prêmios" sub="Combine com cada um o que vale a pena juntar." />
      <div className="seg">
        <Link prefetch={false} href="/desafios/premios" className={aba === 'crianca' ? 'on' : ''}>Criança (estrelinhas)</Link>
        <Link prefetch={false} href="/desafios/premios?a=teen" className={aba === 'teen' ? 'on' : ''}>Adolescente (semanas)</Link>
      </div>
      <div className="card" style={{ padding: '12px 18px' }}>
        {meus.length === 0 && <div className="vazio">Nenhum prêmio ainda. Acrescente abaixo.</div>}
        {meus.map((p) => (
          <div key={p.id} className={`vit${p.ativo ? '' : ' apagado'}`}>
            <span className="des-ic mel"><Moeda tam={22} /></span>
            <span className="corpo"><b>{p.nome}</b><small>{p.custo} {un} · {p.membro_id ? `desejo de ${nomeDe[p.membro_id] || 'alguém'}` : FAIXA[p.faixa]}{p.ativo ? '' : ' · fora da vitrine'}</small></span>
            <EditarPremio premio={p} un={un} />
            <Form acao={alternarPremio} simples><input type="hidden" name="id" value={p.id} /><input type="hidden" name="ativo" value={p.ativo ? '0' : '1'} /><button className="btn sec peq">{p.ativo ? 'Tirar' : 'Voltar'}</button></Form>
          </div>
        ))}
      </div>

      {banco.length > 0 && <>
        <div className="grupo-titulo">Acrescentar do banco</div>
        <div className="card" style={{ padding: '12px 18px' }}>
          {banco.map((p) => (
            <div key={p.id} className="vit">
              <span className="corpo"><b>{p.nome}</b><small>{p.custo} {un} · {FAIXA[p.faixa]}</small></span>
              <Form acao={adicionarPremio}><input type="hidden" name="catalogo" value={p.id} /><button className="btn peq icone" aria-label={`Acrescentar ${p.nome}`}><Icone nome="mais" tam={18} cor="#fff" /></button></Form>
            </div>
          ))}
        </div>
      </>}

      <div className="grupo-titulo">Prêmio próprio</div>
      <Form acao={adicionarPremio} className="card" limpar>
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
    </main>
  );
}
