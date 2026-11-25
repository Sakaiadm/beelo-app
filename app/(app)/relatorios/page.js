import { exigirMembro } from '@/lib/sessao';
import { visaoCrianca } from '@/lib/jeito';
import { acesso } from '@/lib/papeis';
import { lerFiltros, dadosRelatorio } from '@/lib/relatorio';
import { telaResumo, totalReal } from '@/lib/tela';
import Link from 'next/link';
import { hojeISO, dataComAno, dataCurta, fmtMin, STATUS_TXT, CORES_VIVAS, inicioSemana, DIAS, hhmm, addDias } from '@/lib/util';
import Imprimir from '@/components/Imprimir';

export const dynamic = 'force-dynamic';
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export default async function Relatorios({ searchParams }) {
  const sp = await searchParams;
  const s0 = await exigirMembro();
  // "gestor" aqui quer dizer "vê o grupo todo": Pai e Mãe, e a supervisora com a chave Ver relatórios.
  const s = { ...s0, gestor: acesso(s0.eu).relatorios };
  const { supabase, gestor, eu, membros } = s;
  const f = lerFiltros(sp);
  const { lista, ids } = await dadosRelatorio(supabase, f, s);
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem');
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));
  const filhos = membros.filter((m) => m.ativo || m.papel === 'filho');

  const validas = lista.filter((x) => !['adiada', 'adiamento_pedido', 'pendente'].includes(x.st));
  const feitas = validas.filter((x) => x.st.startsWith('cumprida'));
  const noPrazo = feitas.filter((x) => x.st === 'cumprida');
  const atrasos = lista.filter((x) => ['atrasada', 'nao_cumprida', 'cumprida_atraso', 'justificada'].includes(x.st));
  const comHora = validas.filter((x) => x.o.hora_inicio);
  const disciplina = pct(comHora.filter((x) => x.st === 'cumprida').length, comHora.length);
  const { data: adis } = await supabase.from('ra_adiamentos').select('status, membro_id, criado_em').in('membro_id', ids)
    .gte('criado_em', f.de + 'T00:00:00-03:00').lte('criado_em', f.ate + 'T23:59:59-03:00');

  const porCat = (categorias || []).map((c) => {
    const l = validas.filter((x) => x.o.tarefa?.categoria?.id === c.id);
    return { c, total: l.length, p: pct(l.filter((x) => x.st.startsWith('cumprida')).length, l.length) };
  }).filter((x) => x.total);
  const semanas = [...new Set(validas.map((x) => inicioSemana(x.o.data)))].sort();
  const porSemana = semanas.map((w) => ({ w, por: ids.map((id) => { const l = validas.filter((x) => x.o.membro_id === id && inicioSemana(x.o.data) === w); return { id, p: pct(l.filter((x) => x.st.startsWith('cumprida')).length, l.length), n: l.length }; }) }));
  const porDiaSem = DIAS.map((d, i) => ({ d, n: atrasos.filter((x) => new Date(x.o.data + 'T12:00:00Z').getUTCDay() === i).length }));
  const maxDS = Math.max(1, ...porDiaSem.map((x) => x.n));

  const linhas = ids.map((id) => {
    const l = validas.filter((x) => x.o.membro_id === id);
    const fe = l.filter((x) => x.st.startsWith('cumprida'));
    const dias = [...new Set(lista.filter((x) => x.o.membro_id === id).map((x) => x.o.data))].sort().reverse();
    let seq = 0;
    for (const d of dias) { const ld = lista.filter((x) => x.o.membro_id === id && x.o.data === d && x.st !== 'adiada'); if (ld.length && ld.every((x) => x.st.startsWith('cumprida') || x.st === 'pendente')) seq++; else break; }
    return { id, total: l.length, feitas: fe.length, atraso: l.filter((x) => ['cumprida_atraso', 'atrasada', 'nao_cumprida', 'justificada'].includes(x.st)).length,
      just: l.filter((x) => x.o.justificativa).length, adi: (adis || []).filter((a) => a.membro_id === id).length,
      adiOk: (adis || []).filter((a) => a.membro_id === id && a.status === 'aprovado').length,
      proprias: l.filter((x) => x.o.tarefa?.criada_por === id).length, seq };
  });
  const telas = {};
  for (const id of ids) { const m = membros.find((x) => x.id === id); if (m?.tela_ativo) telas[id] = await telaResumo(supabase, id, f.de, f.ate); }
  // Tempo de tela: evolução (seção 64). Dentro do previsto, média, tendência contra o período anterior,
  // lançou no horário (tarefa "Lançar tempo de tela") e média por dia em cada semana.
  const diasPer = Math.round((new Date(f.ate) - new Date(f.de)) / 86400000) + 1;
  const media = (rs) => (rs.length ? Math.round(rs.reduce((a, r) => a + totalReal(r), 0) / rs.length) : null);
  const evolucao = await Promise.all(Object.entries(telas).filter(([, rs]) => rs.length).map(async ([id, rs]) => {
    const comPrev = rs.filter((r) => r.previsto?.min_total != null);
    const dentro = comPrev.filter((r) => totalReal(r) <= r.previsto.min_total).length;
    const antes = await telaResumo(supabase, id, addDias(f.de, -diasPer), addDias(f.de, -1));
    const m = media(rs), ma = media(antes);
    const tend = ma ? Math.round(((m - ma) / ma) * 100) : null;
    const tarefasTela = lista.filter((x) => x.o.membro_id === id && x.o.tarefa?.especial === 'tela' && !['pendente', 'adiada', 'cancelada'].includes(x.st));
    const semanas = [...new Set(rs.map((r) => inicioSemana(r.data)))].sort().map((w) => {
      const daSem = rs.filter((r) => inicioSemana(r.data) === w), pv = daSem.filter((r) => r.previsto?.min_total != null);
      return { w, real: media(daSem), prev: pv.length ? Math.round(pv.reduce((a, r) => a + r.previsto.min_total, 0) / pv.length) : null };
    });
    return { id, n: rs.length, comPrev: comPrev.length, dentro, m, prevMedio: comPrev.length ? Math.round(comPrev.reduce((a, r) => a + r.previsto.min_total, 0) / comPrev.length) : null,
      tend, noHorario: tarefasTela.filter((x) => x.st === 'cumprida').length, totTarefas: tarefasTela.length, semanas };
  }));
  const maxSem = Math.max(1, ...evolucao.flatMap((e) => e.semanas.flatMap((x) => [x.real || 0, x.prev || 0])));

  // U44 e U46: período e pessoa em pílulas, valendo na hora (links); o resto fica em "Mais filtros".
  const url = (mud) => {
    const v = { per: f.per, de: f.per === 'livre' ? f.de : '', ate: f.per === 'livre' ? f.ate : '', m: f.m, cat: f.cat, st: f.st, origem: f.origem, hor: f.hor, ...mud };
    if (v.per !== 'livre') { v.de = ''; v.ate = ''; }
    return '/relatorios?' + new URLSearchParams(Object.entries(v).filter(([, x]) => x)).toString();
  };
  const PERS = gestor ? [['semana', 'Semana'], ['mes', 'Mês'], ['livre', 'Outro']] : [['semana', 'Esta semana'], ['mes', 'Este mês']];
  const perAtual = ['hoje', '30d'].includes(f.per) ? 'livre' : f.per;
  const maisFiltros = !!(f.cat || f.st || f.origem || f.hor);
  const totalTela = (l) => { const t = telas[l.id] || []; return { t, prev: t.reduce((a, r) => a + (r.previsto?.min_total || 0), 0), real: t.reduce((a, r) => a + totalReal(r), 0), n: t.filter((r) => r.previsto).length || 1 }; };
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  const periodo = (
    <div className="nao-imprimir">
      <div className="seg per-seg" role="navigation" aria-label="Período">
        {PERS.map(([k, t]) => <Link prefetch={false} key={k} href={url({ per: k === 'livre' && f.per !== 'livre' ? 'livre' : k })} className={perAtual === k ? 'on' : ''} aria-current={perAtual === k ? 'page' : undefined}>{t}</Link>)}
      </div>
      {gestor && perAtual === 'livre' && (
        <form method="get" className="card filtros datas-livre">
          <input type="hidden" name="per" value="livre" />
          {['m', 'cat', 'st', 'origem', 'hor'].filter((k) => f[k]).map((k) => <input key={k} type="hidden" name={k} value={f[k]} />)}
          <div><label htmlFor="de">De</label><input id="de" type="date" name="de" defaultValue={f.de} /></div>
          <div><label htmlFor="ate">Até</label><input id="ate" type="date" name="ate" defaultValue={f.ate} /></div>
          <div><button className="btn" style={{ width: '100%' }}>Ver</button></div>
        </form>
      )}
    </div>
  );

  if (!gestor) return <Evolucao {...{ eu, f, lista, validas, feitas, noPrazo, linhas, porSemana, evolucao, maxSem, periodo }} />;

  return (
    <main>
      <div className="cab"><div><h1 className="titulo">Relatórios</h1></div></div>
      {periodo}
      <div className="nao-imprimir">
        <div className="seg pessoas" aria-label="Pessoa">
          <Link prefetch={false} href={url({ m: '' })} className={!f.m ? 'on' : ''}>Todas</Link>
          {filhos.filter((x) => x.ativo).map((x) => <Link prefetch={false} key={x.id} href={url({ m: x.id })} className={f.m === x.id ? 'on' : ''}>{x.id === eu.id ? 'Eu' : x.nome}</Link>)}
        </div>
        <details className="card mais-filtros" open={maisFiltros}>
          <summary>Mais filtros{maisFiltros ? ' (em uso)' : ''}</summary>
          <form className="filtros" method="get">
            {['per', 'm'].filter((k) => f[k]).map((k) => <input key={k} type="hidden" name={k} value={f[k]} />)}
            {f.per === 'livre' && <><input type="hidden" name="de" value={f.de} /><input type="hidden" name="ate" value={f.ate} /></>}
            <div><label htmlFor="cat">Categoria</label><select id="cat" name="cat" defaultValue={f.cat}><option value="">Todas</option>{(categorias || []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
            <div><label htmlFor="st">Situação</label><select id="st" name="st" defaultValue={f.st}><option value="">Todas</option>
              {['cumprida', 'cumprida_atraso', 'atrasada', 'nao_cumprida', 'justificada', 'adiada', 'pendente'].map((k) => <option key={k} value={k}>{STATUS_TXT[k]}</option>)}</select></div>
            <div><label htmlFor="origem">Quem criou</label><select id="origem" name="origem" defaultValue={f.origem}><option value="">Todos</option><option value="pais">Pais</option><option value="filho">A pessoa</option></select></div>
            <div><label htmlFor="hor">Horário</label><select id="hor" name="hor" defaultValue={f.hor}><option value="">Com e sem</option><option value="com">Com horário</option><option value="sem">Sem horário</option></select></div>
            <div className="mf-bt"><button className="btn" style={{ width: '100%' }}>Aplicar</button>{maisFiltros && <Link prefetch={false} className="link-btn" href={url({ cat: '', st: '', origem: '', hor: '' })}>Limpar</Link>}</div>
          </form>
        </details>
      </div>
      <p className="leg-rel">De <b>{dataComAno(f.de)}</b> a <b>{dataComAno(f.ate)}</b> · {f.m ? nome[f.m] : 'todas as pessoas'}</p>

      {/* U45 e U47: resumo numa tela, com palavras simples. */}
      <div className="kpis k4">
        <div className="kpi destaque"><small>Feitas</small><strong>{pct(feitas.length, validas.length)}<span style={{ fontSize: 'var(--f-texto)' }}>%</span></strong><em>{feitas.length} de {plural(validas.length, 'tarefa', 'tarefas')}</em></div>
        <div className="kpi"><small>No dia certo</small><strong>{noPrazo.length}</strong><em>{plural(feitas.length - noPrazo.length, 'feita depois do dia', 'feitas depois do dia')}</em></div>
        <div className="kpi"><small>Feitas na hora marcada</small><strong>{disciplina}<span style={{ fontSize: 'var(--f-texto)' }}>%</span></strong><em>de {plural(comHora.length, 'tarefa com horário', 'tarefas com horário')}</em></div>
        <div className="kpi"><small>Adiamentos</small><strong>{(adis || []).length}</strong><em>{plural((adis || []).filter((a) => a.status === 'aprovado').length, 'aprovado', 'aprovados')}</em></div>
      </div>

      <details className="card rel-sec" open>
        <summary><h2>Por categoria</h2></summary>
        {porCat.length === 0 && <div className="vazio">Sem dados no período.</div>}
        <div className="barras-h">{porCat.map(({ c, p, total }) => (
          <div className="l" key={c.id}><span>{c.nome}</span><div className="barra"><div style={{ width: `${p}%`, background: CORES_VIVAS[c.cor] || CORES_VIVAS.azul }} /></div><span title={`${total} tarefas`}>{p}%</span></div>))}
        </div>
      </details>

      <details className="card rel-sec">
        <summary><h2>Atrasos por dia da semana</h2><span>{plural(atrasos.length, 'atraso', 'atrasos')}</span></summary>
        <div className="barras-h">{porDiaSem.map((x) => (
          <div className="l" key={x.d}><span style={{ textTransform: 'capitalize' }}>{x.d}</span><div className="barra"><div style={{ width: `${(x.n / maxDS) * 100}%`, background: 'var(--g-erro)' }} /></div><span>{x.n}</span></div>))}
        </div>
      </details>

      <details className="card rel-sec">
        <summary><h2>Por semana</h2></summary>
        {porSemana.length === 0 ? <div className="vazio">Sem dados no período.</div> : (
          <div className="rolavel"><table><thead><tr><th>Semana de</th>{ids.map((id) => <th key={id}>{nome[id]}</th>)}</tr></thead>
            <tbody>{porSemana.map(({ w, por }) => (
              <tr key={w}><td>{dataCurta(w)}</td>{por.map((x) => (
                <td key={x.id}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="barra" style={{ flex: 1, minWidth: 60 }}><div style={{ width: `${x.p}%` }} /></div><strong style={{ width: 40, textAlign: 'right' }}>{x.n ? `${x.p}%` : '—'}</strong></div></td>))}</tr>))}
            </tbody></table></div>)}
      </details>

      <details className="card rel-sec">
        <summary><h2>Por pessoa</h2></summary>
        <div className="rolavel"><table>
          <thead><tr><th>Pessoa</th><th className="num">Feitas</th><th className="num">Depois do dia</th><th className="num">Justificativas</th><th className="num">Adiamentos (aprovados)</th><th className="num">Criadas pela pessoa</th><th className="num">Dias seguidos</th><th className="num">Tela prevista x real</th></tr></thead>
          <tbody>{linhas.map((l) => {
            const { t, prev, real, n } = totalTela(l);
            return (
              <tr key={l.id}><td style={{ fontWeight: 700 }}>{nome[l.id]}</td><td className="num">{l.feitas} de {l.total}</td><td className="num">{l.atraso}</td><td className="num">{l.just}</td>
                <td className="num">{l.adi} ({l.adiOk})</td><td className="num">{l.proprias}</td><td className="num">{l.seq} {l.seq === 1 ? 'dia' : 'dias'}</td>
                <td className="num">{t.length ? <span className={`tg ${real > prev ? 'vm' : 'vd'}`}>{fmtMin(prev / n)} → {fmtMin(real / t.length)} /dia</span> : '—'}</td></tr>);
          })}</tbody>
        </table></div>
      </details>

      {evolucao.length > 0 && (
        <details className="card rel-sec">
          <summary><h2>Tempo de tela</h2></summary>
          {evolucao.map((e) => <TelaEvolucao key={e.id} e={e} maxSem={maxSem} titulo={evolucao.length > 1 ? nome[e.id] : null} />)}
          <div className="grupo-titulo">Dia a dia: previsto x realizado</div>
          <div className="rolavel"><table><thead><tr><th>Dia</th><th>Pessoa</th><th className="num">Previsto</th><th className="num">Realizado</th><th className="num">Celular</th><th className="num">Computador</th><th className="num">Diferença</th></tr></thead>
            <tbody>{Object.entries(telas).flatMap(([id, rs]) => rs.map((r) => {
              const real = totalReal(r), prev = r.previsto?.min_total, dif = prev != null ? real - prev : null;
              return (<tr key={r.id}><td>{dataCurta(r.data)}</td><td>{nome[id]}</td><td className="num">{prev != null ? fmtMin(prev) : '—'}</td><td className="num">{fmtMin(real)}</td>
                <td className="num">{r.min_celular != null ? fmtMin(r.min_celular) : '—'}</td><td className="num">{r.min_computador != null ? fmtMin(r.min_computador) : '—'}</td>
                <td className="num" style={{ fontWeight: 700, color: dif == null ? undefined : dif > 0 ? 'var(--erro)' : 'var(--ok)' }}>{dif == null ? '—' : (dif > 0 ? '+' : '') + fmtMin(dif)}</td></tr>);
            }))}</tbody></table></div>
        </details>
      )}

      <details className="card rel-sec">
        <summary><h2>Todas as tarefas</h2><span>{lista.length}</span></summary>
        <div className="rolavel"><table><thead><tr><th>Dia</th><th>Pessoa</th><th>Tarefa</th><th>Categoria</th><th>Horário</th><th>Situação</th><th>Justificativa</th></tr></thead>
          <tbody>{lista.slice().reverse().slice(0, 300).map(({ o, st }) => (
            <tr key={o.id}><td>{dataCurta(o.data)}</td><td>{nome[o.membro_id]}</td><td>{o.tarefa?.titulo}</td><td>{o.tarefa?.categoria?.nome || '—'}</td>
              <td>{o.hora_inicio ? hhmm(o.hora_inicio) : 'Sem horário'}</td><td>{STATUS_TXT[st]}</td><td style={{ fontSize: 'var(--f-apoio)' }}>{o.justificativa || ''}</td></tr>))}
          </tbody></table></div>
        {lista.length > 300 && <p className="sub" style={{ fontSize: 'var(--f-apoio)' }}>Mostrando as 300 mais recentes.</p>}
      </details>

      {/* U48: exportar fica no fim, junto do que será impresso. */}
      <div className="rel-fim nao-imprimir"><Imprimir /></div>
    </main>
  );
}

// Tempo de tela de uma pessoa: números e a média por dia de cada semana.
function TelaEvolucao({ e, maxSem, titulo, crianca }) {
  return (
    <div className="tela-ev">
      {titulo && <h3>{titulo}</h3>}
      <div className="kpis k4">
        <div className="kpi"><small>Dentro do previsto</small><strong>{e.dentro} de {e.comPrev}</strong><em>dias com previsto</em></div>
        <div className="kpi"><small>Média por dia</small><strong>{fmtMin(e.m)}</strong><em>{e.prevMedio != null ? `previsto ${fmtMin(e.prevMedio)}` : 'sem previsto'}</em></div>
        {e.tend != null && !crianca && <div className="kpi"><small>Tendência</small><strong style={{ color: e.tend <= 0 ? 'var(--ok)' : 'var(--erro)' }}>{e.tend <= 0 ? '↓' : '↑'} {Math.abs(e.tend)}%</strong><em>{e.tend < 0 ? 'está diminuindo' : e.tend > 0 ? 'aumentou' : 'igual'} em relação ao período anterior</em></div>}
        {e.totTarefas > 0 && <div className="kpi"><small>Lançou no horário</small><strong>{e.noHorario} de {e.totTarefas}</strong><em>{e.totTarefas - e.noHorario > 0 ? `${e.totTarefas - e.noHorario} com atraso ou sem lançar` : 'todos no horário'}</em></div>}
      </div>
      {e.semanas.length > 0 && (<>
        <div className="grupo-titulo">Média por dia, em cada semana</div>
        <div className="barras-h">{e.semanas.map((x) => (
          <div className="l" key={x.w}><span>{dataCurta(x.w)} a {dataCurta(addDias(x.w, 6))}</span>
            <div className="barra"><div style={{ width: `${Math.round(((x.real || 0) / maxSem) * 100)}%`, background: x.prev != null && x.real > x.prev ? 'var(--listras), var(--g-erro)' : 'var(--g-prev)' }} /></div>
            <span>{fmtMin(x.real)}</span></div>))}</div>
      </>)}
    </div>
  );
}

const ESTRELA = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
function Estrelas({ n, tam = 18 }) {
  return <span className="estr" aria-label={`${n} de 5 estrelas`}>{[0, 1, 2, 3, 4].map((i) => <svg key={i} width={tam} height={tam} viewBox="0 0 24 24" className={i < n ? 'on' : ''} aria-hidden="true"><path d={ESTRELA} /></svg>)}</span>;
}

// U49 e U50: a evolução de quem faz as tarefas. Sem filtros nem tabelas: frases com número e um gráfico.
function Evolucao({ eu, f, lista, validas, feitas, noPrazo, linhas, porSemana, evolucao, maxSem, periodo }) {
  const crianca = visaoCrianca(eu);
  const seq = linhas[0]?.seq || 0;
  // Melhor dia da semana: o que teve mais tarefas feitas no período.
  const porDS = DIAS.map((d, i) => ({ d, n: feitas.filter((x) => new Date(x.o.data + 'T12:00:00Z').getUTCDay() === i).length }));
  const melhor = porDS.reduce((a, b) => (b.n > a.n ? b : a), { n: 0 });
  // Estrelas de cada dia desta semana (segunda a domingo), como no Hoje.
  const hoje = hojeISO();
  const ref = f.ate > hoje ? hoje : f.ate;
  const seg = addDias(ref, -((new Date(ref + 'T12:00:00Z').getUTCDay() + 6) % 7)); // segunda-feira
  const dias = Array.from({ length: 7 }, (_, i) => addDias(seg, i)).map((d) => {
    const l = lista.filter((x) => x.o.data === d && !['adiada', 'adiamento_pedido'].includes(x.st));
    const fe = l.filter((x) => x.st.startsWith('cumprida')).length;
    return { d, total: l.length, est: l.length ? Math.round((fe / l.length) * 5) : 0 };
  });
  return (
    <main className="estreito">
      <div className="cab"><div><h1 className="titulo">Minha evolução</h1></div></div>
      {periodo}
      <div className="card evo-frases">
        <p><b>{feitas.length}</b> {crianca ? `${feitas.length === 1 ? 'tarefa feita' : 'tarefas feitas'} de ${validas.length}` : `de ${validas.length} ${validas.length === 1 ? 'tarefa feita' : 'tarefas feitas'}`}</p>
        <p><b>{noPrazo.length}</b> no dia certo</p>
        {melhor.n > 0 && <p>Seu melhor dia: <b>{melhor.d}</b></p>}
        {seq > 1 && <p><b>{seq}</b> dias seguidos com tudo feito</p>}
      </div>
      {crianca ? (
        <div className="card">
          <h2>Estrelas da semana</h2>
          <div className="evo-dias">{dias.map((x) => (
            <div key={x.d} className="l"><span>{DIAS[new Date(x.d + 'T12:00:00Z').getUTCDay()]}</span>{x.d > hoje ? <em>ainda vai chegar</em> : x.total ? <Estrelas n={x.est} /> : <em>sem tarefas</em>}</div>))}
          </div>
        </div>
      ) : (
        <div className="card">
          <h2>Por semana</h2>
          {porSemana.length === 0 ? <div className="vazio">Ainda sem tarefas neste período.</div> : (
            <div className="barras-h">{porSemana.map(({ w, por }) => (
              <div className="l" key={w}><span>Semana de {dataCurta(w)}</span><div className="barra"><div style={{ width: `${por[0]?.p || 0}%` }} /></div><span>{por[0]?.n ? `${por[0].p}%` : '—'}</span></div>))}
            </div>
          )}
        </div>
      )}
      {evolucao.length > 0 && <div className="card"><h2>Tempo de tela</h2><TelaEvolucao e={evolucao[0]} maxSem={maxSem} crianca={crianca} /></div>}
    </main>
  );
}
