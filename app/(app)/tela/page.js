import Link from 'next/link';
import { exigirMembro } from '@/lib/sessao';
import { telaResumo, totalReal } from '@/lib/tela';
import { hojeISO, addDias, dataCurta, dataLonga, fmtMin, DIAS_CURTO } from '@/lib/util';
import { PrevistoForm, RealForm, PropostaForm } from '@/components/TelaForms';
import Form from '@/components/Form';
import { encerrarPrevisto, responderTela } from '@/app/acoes';

export const dynamic = 'force-dynamic';

function Historico({ linhas }) {
  if (!linhas.length) return <div className="vazio">Nenhum lançamento nos últimos 14 dias.</div>;
  return (
    <div className="rolavel"><table>
      <thead><tr><th>Dia</th><th className="num">Previsto</th><th className="num">Realizado</th><th className="num">Diferença</th><th>Detalhe</th></tr></thead>
      <tbody>{linhas.map((r) => {
        const real = totalReal(r), prev = r.previsto?.min_total;
        const dif = prev != null ? real - prev : null;
        return (
          <tr key={r.id}>
            <td>{dataCurta(r.data)}</td><td className="num">{prev != null ? fmtMin(prev) : '—'}</td><td className="num">{fmtMin(real)}</td>
            <td className="num" style={{ fontWeight: 700, color: dif == null ? undefined : dif > 0 ? 'var(--erro)' : 'var(--ok)' }}>{dif == null ? '—' : (dif > 0 ? '+' : '') + fmtMin(dif)}</td>
            <td style={{ fontSize: 13, color: 'var(--cinza)' }}>{r.min_total != null && r.min_celular == null ? 'total' : `cel ${fmtMin(r.min_celular)} · pc ${fmtMin(r.min_computador)}`}{r.foto_celular || r.foto_computador ? ' · com foto' : ''}{r.obs ? ` · ${r.obs}` : ''}</td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

export default async function Tela({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor } = await exigirMembro();
  const hoje = hojeISO(), ontem = addDias(hoje, -1);

  if (!gestor) {
    if (!eu.tela_ativo) return <main className="estreito"><div className="card">O tempo de tela não está ativado para você.</div></main>;
    const dia = sp.d === hoje ? hoje : ontem;
    const { data: p } = await supabase.rpc('ra_tela_previsto_dia', { p_membro: eu.id, p_data: dia });
    const { data: pHoje } = await supabase.rpc('ra_tela_previsto_dia', { p_membro: eu.id, p_data: hoje });
    const { data: atual } = await supabase.from('ra_tela_real').select('*').eq('membro_id', eu.id).eq('data', dia).maybeSingle();
    const { data: props } = await supabase.from('ra_tela_proposta').select('*').eq('membro_id', eu.id).order('criado_em', { ascending: false }).limit(5);
    const hist = await telaResumo(supabase, eu.id, addDias(hoje, -14), hoje);
    return (
      <main className="estreito">
        <div className="cab"><div><h1 className="titulo">Tempo de tela</h1><p className="sub">Realizado de {dataLonga(dia)}</p></div>
          <div className="abas"><Link prefetch={false} href="/tela" className={dia === ontem ? 'ativo' : ''}>Ontem</Link><Link prefetch={false} href={`/tela?d=${hoje}`} className={dia === hoje ? 'ativo' : ''}>Hoje</Link></div></div>
        <div className="card">
          <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--cinza)' }}>Copie o total do relatório de uso do aparelho (Bem-estar digital no Android, Tempo de Uso no iPhone). A foto é opcional.</p>
          <RealForm eu={eu.id} membroId={eu.id} familia={eu.familia_id} data={dia} previsto={p?.[0]} atual={atual} />
        </div>
        <div className="card">
          <h2>Previsto de hoje</h2>
          <p style={{ margin: 0 }}>{pHoje?.[0] ? (pHoje[0].formato === 'total' ? `Total ${fmtMin(pHoje[0].min_total)}` : `Celular ${fmtMin(pHoje[0].min_celular)} · Computador ${fmtMin(pHoje[0].min_computador)}`) : 'Seus responsáveis ainda não definiram.'}</p>
          <details style={{ marginTop: 12 }}><summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--azul)' }}>Precisa de outro previsto?</summary>
            <PropostaForm hoje={hoje} formato={pHoje?.[0]?.formato === 'total' ? 'total' : 'aparelho'} /></details>
          {(props || []).length > 0 && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--cinza)' }}>
            {props.map((x) => <div key={x.id}>{dataCurta(x.data)}: {x.status === 'pendente' ? 'aguardando validação' : x.status}</div>)}</div>}
        </div>
        <div className="card"><h2>Últimos 14 dias</h2><Historico linhas={hist.reverse()} /></div>
      </main>
    );
  }

  const filhos = membros.filter((m) => m.ativo && m.tela_ativo);
  const alvo = filhos.find((f) => f.id === sp.m) || filhos[0];
  if (!alvo) return <main className="estreito"><div className="card">O tempo de tela está desligado para todas as pessoas. Ligue em <Link prefetch={false} href="/config">Cadastros</Link>.</div></main>;
  const { data: regras } = await supabase.from('ra_tela_previsto').select('*').eq('membro_id', alvo.id).or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`).order('criado_em', { ascending: false });
  const { data: propostas } = await supabase.from('ra_tela_proposta').select('*').eq('membro_id', alvo.id).eq('status', 'pendente');
  const hist = await telaResumo(supabase, alvo.id, addDias(hoje, -14), hoje);
  return (
    <main>
      <div className="cab"><div><h1 className="titulo">Tempo de tela</h1><p className="sub">Defina o previsto e acompanhe o realizado.</p></div>
        <div className="abas">{filhos.map((f) => <Link prefetch={false} key={f.id} href={`/tela?m=${f.id}`} className={f.id === alvo.id ? 'ativo' : ''}>{f.nome}</Link>)}</div></div>
      <div className="duas">
        <div className="lado">
          <div className="card"><h2>Tempo de tela de {alvo.nome}</h2><p className="sub" style={{ marginTop: 0, marginBottom: 12 }}>Defina quanto tempo {alvo.nome} pode usar por dia.</p><PrevistoForm membro={alvo.id} hoje={hoje} /></div>
        </div>
        <div className="grande">
          {(propostas || []).length > 0 && <div className="card"><h2>Propostas para validar</h2>
            {propostas.map((p) => (
              <div key={p.id} className="tarefa" style={{ background: 'var(--aviso-fundo)', borderColor: 'var(--aviso-borda)' }}>
                <div className="tt">{dataCurta(p.data)}: {p.min_total != null ? `total ${fmtMin(p.min_total)}` : `celular ${fmtMin(p.min_celular)} · computador ${fmtMin(p.min_computador)}`}</div>
                <div className="meta">“{p.motivo}”</div>
                <div className="acoes" style={{ marginTop: 8 }}>
                  <Form acao={responderTela} fila="responderTela" rotulo="Resposta sobre tempo de tela"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aprovar" value="1" /><button className="btn peq">Validar</button></Form>
                  <Form acao={responderTela} fila="responderTela" rotulo="Resposta sobre tempo de tela"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aprovar" value="0" /><button className="btn perigo peq">Recusar</button></Form>
                </div>
              </div>))}
          </div>}
          <div className="card"><h2>Previstos em vigor</h2>
            {(regras || []).length === 0 && <div className="vazio">Nenhum previsto definido.</div>}
            {(regras || []).map((r) => (
              <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--borda)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{r.formato === 'total' ? `Total ${fmtMin(r.min_total)}` : `Celular ${fmtMin(r.min_celular)} · Computador ${fmtMin(r.min_computador)}`}</div>
                  <div style={{ fontSize: 13, color: 'var(--cinza)' }}>
                    {r.vigencia_inicio === r.vigencia_fim ? `Só em ${dataCurta(r.vigencia_inicio)}` : r.dias_semana.length === 7 ? 'Semana inteira' : r.dias_semana.map((d) => DIAS_CURTO[d]).join(' ')}
                    {r.fixado ? ' · fixo' : r.vigencia_fim && r.vigencia_inicio !== r.vigencia_fim ? ` · até ${dataCurta(r.vigencia_fim)}` : ''}{r.origem === 'proposta' ? ' · proposta aprovada' : ''}
                  </div>
                </div>
                <Form acao={encerrarPrevisto} simples><input type="hidden" name="id" value={r.id} /><button className="btn sec peq">Encerrar</button></Form>
              </div>
            ))}
            <p style={{ fontSize: 13, color: 'var(--cinza)', marginBottom: 0 }}>Quando há mais de um previsto para o mesmo dia, vale o de dia específico; depois, o mais recente.</p>
          </div>
          <div className="card"><h2>Últimos 14 dias</h2><Historico linhas={hist.reverse()} /></div>
        </div>
      </div>
    </main>
  );
}
