// @arquivo  page.js: mural de conquistas: desafios cumpridos, prêmios entregues e medalhas.
// @tipo     tela
// @usa      banco ra_desafio_periodos, banco ra_desafios, banco ra_premio_pedidos, lib/sessao, lib/avatar, lib/desafiosDados, lib/util, components/DesafioCartao, components/Avatar, components/Icone, components/Voltar
// @usado-por Next.js (rota /desafios/mural)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { urlsAvatares } from '@/lib/avatar';
import { desafiosLigados, medalhas } from '@/lib/desafiosDados';
import { dataCurta } from '@/lib/util';
import { Estrela, Hexagono } from '@/components/DesafioCartao';
import Avatar from '@/components/Avatar';
import Icone from '@/components/Icone';
import DesafiosTopo from '@/components/DesafiosTopo';
import { perfil } from '@/lib/desafios';

export const dynamic = 'force-dynamic';

// Mural de conquistas: desafios cumpridos, prêmios entregues e medalhas (discretas).
// Quem vê: a família toda (padrão) ou só os pais e a própria pessoa (Ajustes dos desafios).
export default async function Mural({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia } = await exigirMembro();
  if (!desafiosLigados(familia)) redirect('/hoje');
  const [{ data: pers }, { data: des }, { data: peds }] = await Promise.all([
    supabase.from('ra_desafio_periodos').select('id, desafio_id, membro_id, inicio, fim, cumprido_em').eq('status', 'cumprido').order('cumprido_em', { ascending: false }).limit(300),
    supabase.from('ra_desafios').select('id, titulo, icone, membro_id, periodo'),
    supabase.from('ra_premio_pedidos').select('id, membro_id, nome, entregue_em').eq('status', 'entregue').order('entregue_em', { ascending: false }).limit(100),
  ]);
  const tit = Object.fromEntries((des || []).map((d) => [d.id, d]));
  const visiveis = membros.filter((m) => m.ativo && (gestor || familia.mural_visivel !== 'pais' || m.id === eu.id));
  // @regra 28/11 (Thomas, tela 4): quem não é Responsável vê SÓ as próprias conquistas (sem abas), mesmo com "A família toda vê".
  const abas = gestor ? visiveis : visiveis.filter((m) => m.id === eu.id);
  const sel = abas.find((m) => m.id === sp?.m) || null;
  const urls = await urlsAvatares(supabase, visiveis.map((m) => m.avatar));
  const itens = [
    ...(pers || []).filter((p) => tit[p.desafio_id]).map((p) => ({ tipo: 'd', quando: p.cumprido_em, membro: p.membro_id, t: tit[p.desafio_id].titulo, icone: tit[p.desafio_id].icone, sub: tit[p.desafio_id].periodo === 'mes' ? `mês de ${dataCurta(p.inicio).slice(3)}` : `semana de ${dataCurta(p.inicio)}` })),
    ...(peds || []).map((p) => ({ tipo: 'p', quando: p.entregue_em, membro: p.membro_id, t: p.nome, sub: 'prêmio entregue' })),
  ].filter((x) => (sel ? x.membro === sel.id : gestor || x.membro === eu.id)).sort((a, b) => String(b.quando).localeCompare(String(a.quando))).slice(0, 60);
  const nome = Object.fromEntries(membros.map((m) => [m.id, m]));

  return (
    <main className="estreito">
      {/* @decisao 25/11 Thomas (opção A): Mural é uma aba da tela Desafios (mesmas abas no alto). */}
      <DesafiosTopo gestor={gestor} perfil={perfil(eu)} ativo={1} />
      <p className="sub" style={{ margin: '-4px 0 12px' }}>{familia.mural_visivel === 'pais' ? 'Visível só para os pais e para cada pessoa.' : 'A família toda vê e comemora junto.'}</p>
      {abas.length > 1 && (
        <div className="seg pessoas">
          <Link prefetch={false} href="/desafios/mural" className={!sel ? 'on' : ''}>Todos</Link>
          {abas.map((m) => <Link prefetch={false} key={m.id} href={`/desafios/mural?m=${m.id}`} className={sel?.id === m.id ? 'on' : ''}>{m.nome}</Link>)}
        </div>
      )}
      {(sel ? [sel] : abas).map((m) => {
        const md = medalhas(pers || [], m.id);
        if (!md.length) return null;
        return (
          <div key={m.id} className="des-top" style={{ marginBottom: 12 }}>
            <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={34} />
            <span><b>{m.nome}</b><span className="medalhas" style={{ marginTop: 4 }}>{md.map((t) => <span className="medalha" key={t}><Hexagono tam={16} />{t}</span>)}</span></span>
          </div>
        );
      })}
      <div className="card" style={{ padding: '12px 18px' }}>
        {itens.length === 0 && <div className="vazio">As conquistas aparecem aqui quando um desafio for cumprido.</div>}
        {itens.map((x, i) => (
          <div className="mural-item" key={i}>
            <span className="des-ic mel">{x.tipo === 'd' ? <Estrela tam={22} /> : <Icone nome="check" tam={22} />}</span>
            <span className="corpo"><b>{x.t}</b><small>{x.membro ? nome[x.membro]?.nome : 'Família'} · {x.sub}</small></span>
          </div>
        ))}
      </div>
    </main>
  );
}
