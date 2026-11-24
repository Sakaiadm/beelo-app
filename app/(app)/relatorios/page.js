import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { lerFiltros, dadosRelatorio } from '@/lib/relatorio';
import { telaResumo, totalReal } from '@/lib/tela';
import AbasPessoa from '@/components/AbasPessoa';
import { dataComAno, dataCurta, fmtMin, STATUS_TXT, CORES_VIVAS, inicioSemana, DIAS, hhmm, addDias } from '@/lib/util';
import Imprimir from '@/components/Imprimir';
import FiltroPeriodo from '@/components/FiltroPeriodo';

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

  const qs = new URLSearchParams(Object.entries({ per: f.per, de: f.de, ate: f.ate, m: f.m, cat: f.cat, st: f.st, origem: f.origem, hor: f.hor }).filter(([, v]) => v)).toString();

  return (
    <main>
      <div className="cab">
        <div><h1 className="titulo">{gestor ? 'Relatórios' : 'Minha evolução'}</h1></div>
        <div className="acoes nao-imprimir"><Imprimir /></div>
      </div>

      <form className="card filtros nao-imprimir" method="get">
        <FiltroPeriodo per={f.per} de={f.de} ate={f.ate} />
        {gestor && <div><label htmlFor="m">Pessoa</label><select id="m" name="m" defaultValue={f.m}><option value="">Todas</option>{filhos.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>}
        <div><label htmlFor="cat">Categoria</label><select id="cat" name="cat" defaultValue={f.cat}><option value="">Todas</option>{(categorias || []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
        <div><label htmlFor="st">Status</label><select id="st" name="st" defaultValue={f.st}><option value="">Todos</option>
          {['cumprida', 'cumprida_atraso', 'atrasada', 'nao_cumprida', 'justificada', 'adiada', 'pendente'].map((k) => <option key={k} value={k}>{STATUS_TXT[k]}</option>)}</select></div>
        <div><label htmlFor="origem">Criada por</label><select id="origem" name="origem" defaultValue={f.origem}><option value="">Todas</option><option value="pais">Responsáveis</option><option value="filho">A própria pessoa</option></select></div>
        <div><label htmlFor="hor">Horário</label><select id="hor" name="hor" defaultValue={f.hor}><option value="">Com e sem</option><option value="com">Com horário</option><option value="sem">Sem horário</option></select></div>
        <div><button className="btn" style={{ width: '100%' }}>Filtrar</button></div>
      </form>
      <p className="leg-rel">Mostrando de <b>{dataComAno(f.de)}</b> a <b>{dataComAno(f.ate)}</b> · {f.m ? nome[f.m] : gestor ? 'todas as pessoas' : eu.nome}</p>

      <div className="kpis">
        <div className="kpi destaque"><small>Cumprimento</small><strong>{pct(feitas.length, validas.length)}<span style={{ fontSize: 'var(--f-texto)' }}>%</span></strong>
          <em>{feitas.length} de {validas.length} tarefas · {gestor && !f.m ? ids.map((id) => { const l = linhas.find((x) => x.id === id); return `${nome[id]} ${pct(l.feitas, l.total)}%`; }).join(' · ') : ''}</em></div>
        <div className="kpi"><small>No prazo x com atraso</small><strong>{noPrazo.length} <span style={{ fontSize: 'var(--f-texto)', color: 'var(--cinza)' }}>· {feitas.length - noPrazo.length}</span></strong><em>{atrasos.length} {atrasos.length === 1 ? 'atraso' : 'atrasos'} no período</em></div>
        <div className="kpi"><small>No horário planejado</small><strong>{disciplina}<span style={{ fontSize: 'var(--f-texto)' }}>%</span></strong><em>Disciplina com a agenda ({comHora.length} com horário)</em></div>
        <div className="kpi"><small>Adiamentos</small><strong>{(adis || []).length}</strong><em>{(adis || []).filter((a) => a.status === 'aprovado').length === 1 ? '1 aprovado' : `${(adis || []).filter((a) => a.status === 'aprovado').length} aprovados`}</em></div>
      </div>

      <div className="duas">
        <div className="card grande"><h2>Cumprimento por categoria</h2>
          {porCat.length === 0 && <div className="vazio">Sem dados no período.</div>}
          <div className="barras-h">{porCat.map(({ c, p, total }) => (
            <div className="l" key={c.id}><span>{c.nome}</span><div className="barra"><div style={{ width: `${p}%`, background: CORES_VIVAS[c.cor] || CORES_VIVAS.azul }} /></div><span title={`${total} tarefas`}>{p}%</span></div>))}
          </div>
        </div>
        <div className="card lado"><h2>Atrasos por dia da semana</h2>
          <div className="barras-h">{porDiaSem.map((x) => (
            <div className="l" key={x.d}><span style={{ textTransform: 'capitalize' }}>{x.d}</span><div className="barra"><div style={{ width: `${(x.n / maxDS) * 100}%`, background: 'var(--g-erro)' }} /></div><span>{x.n}</span></div>))}
          </div>
        </div>
      </div>

      <div className="card"><h2>Cumprimento por semana</h2>
        {porSemana.length === 0 ? <div className="vazio">Sem dados no período.</div> : (
          <div className="rolavel"><table><thead><tr><th>Semana de</th>{ids.map((id) => <th key={id}>{nome[id]}</th>)}</tr></thead>
            <tbody>{porSemana.map(({ w, por }) => (
              <tr key={w}><td>{dataCurta(w)}</td>{por.map((x) => (
                <td key={x.id}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="barra" style={{ flex: 1, minWidth: 60 }}><div style={{ width: `${x.p}%` }} /></div><strong style={{ width: 40, textAlign: 'right' }}>{x.n ? `${x.p}%` : '—'}</strong></div></td>))}</tr>))}
            </tbody></table></div>)}
      </div>

      <div className="card"><h2>{gestor ? 'Por pessoa' : 'Resumo'}</h2>
        <div className="rolavel"><table>
          <thead><tr><th>Pessoa</th><th className="num">Cumpridas</th><th className="num">Com atraso</th><th className="num">Justificativas</th><th className="num">Adiamentos (aprovados)</th><th className="num">Criadas por ele(a)</th><th className="num">Sequência</th><th className="num">Tela prev. x real</th></tr></thead>
          <tbody>{linhas.map((l) => {
            const t = telas[l.id] || [];
            const prev = t.reduce((a, r) => a + (r.previsto?.min_total || 0), 0), real = t.reduce((a, r) => a + totalReal(r), 0);
            const n = t.filter((r) => r.previsto).length || 1;
            return (
              <tr key={l.id}><td style={{ fontWeight: 700 }}>{nome[l.id]}</td><td className="num">{l.feitas} de {l.total}</td><td className="num">{l.atraso}</td><td className="num">{l.just}</td>
                <td className="num">{l.adi} ({l.adiOk})</td><td className="num">{l.proprias}</td><td className="num">{l.seq} {l.seq === 1 ? 'dia' : 'dias'}</td>
                <td className="num">{t.length ? <span className="pilula" style={{ background: real > prev ? '#fbe3e5' : '#dff3e6', color: real > prev ? '#8f1c26' : '#1f6b3a' }}>{fmtMin(prev / n)} → {fmtMin(real / t.length)} /dia</span> : '—'}</td></tr>);
          })}</tbody>
        </table></div>
      </div>

      {evolucao.length > 0 && (
        // Um cartão só, com aba por pessoa (Raio-X S18).
        <div className="card"><h2>Tempo de tela: evolução</h2>
          <AbasPessoa itens={evolucao.map((e) => ({ id: e.id, rotulo: e.id === eu.id ? 'Eu' : nome[e.id] }))} paineis={evolucao.map((e) => (
            <div key={e.id}>
              <div className="kpis">
                <div className="kpi destaque"><small>Dentro do previsto</small><strong>{e.dentro} de {e.comPrev}</strong><em>dias com previsto no período</em></div>
                <div className="kpi"><small>Média por dia</small><strong>{fmtMin(e.m)}</strong><em>{e.prevMedio != null ? `previsto ${fmtMin(e.prevMedio)}` : 'sem previsto'}</em></div>
                {e.tend != null && <div className="kpi"><small>Tendência</small><strong style={{ color: e.tend <= 0 ? 'var(--ok)' : 'var(--erro)' }}>{e.tend <= 0 ? '↓' : '↑'} {Math.abs(e.tend)}%</strong><em>{e.tend < 0 ? 'está reduzindo' : e.tend > 0 ? 'aumentou' : 'igual'} em relação ao período anterior</em></div>}
                {e.totTarefas > 0 && <div className="kpi"><small>Lançou no horário</small><strong>{e.noHorario} de {e.totTarefas}</strong><em>{e.totTarefas - e.noHorario > 0 ? `${e.totTarefas - e.noHorario} com atraso ou sem lançar` : 'todos no horário'}</em></div>}
              </div>
              {e.semanas.length > 0 && (<>
                <div className="grupo-titulo">Média por dia, por semana</div>
                <div className="barras-h">{e.semanas.map((x) => (
                  <div className="l" key={x.w}><span>{dataCurta(x.w)} a {dataCurta(addDias(x.w, 6))}</span>
                    <div className="barra"><div style={{ width: `${Math.round(((x.real || 0) / maxSem) * 100)}%`, background: x.prev != null && x.real > x.prev ? 'var(--listras), var(--g-erro)' : 'var(--g-prev)' }} /></div>
                    <span>{fmtMin(x.real)}</span></div>))}</div>
              </>)}
            </div>
          ))} />
        </div>
      )}

      {Object.keys(telas).length > 0 && (
        <div className="card"><h2>Tempo de tela: previsto x realizado</h2>
          <div className="rolavel"><table><thead><tr><th>Dia</th>{gestor && <th>Pessoa</th>}<th className="num">Previsto</th><th className="num">Realizado</th><th className="num">Celular</th><th className="num">Computador</th><th className="num">Diferença</th></tr></thead>
            <tbody>{Object.entries(telas).flatMap(([id, rs]) => rs.map((r) => {
              const real = totalReal(r), prev = r.previsto?.min_total, dif = prev != null ? real - prev : null;
              return (<tr key={r.id}><td>{dataCurta(r.data)}</td>{gestor && <td>{nome[id]}</td>}<td className="num">{prev != null ? fmtMin(prev) : '—'}</td><td className="num">{fmtMin(real)}</td>
                <td className="num">{r.min_celular != null ? fmtMin(r.min_celular) : '—'}</td><td className="num">{r.min_computador != null ? fmtMin(r.min_computador) : '—'}</td>
                <td className="num" style={{ fontWeight: 700, color: dif == null ? undefined : dif > 0 ? 'var(--erro)' : 'var(--ok)' }}>{dif == null ? '—' : (dif > 0 ? '+' : '') + fmtMin(dif)}</td></tr>);
            }))}</tbody></table></div>
        </div>
      )}

      <div className="card"><h2>Tarefas no período ({lista.length})</h2>
        <div className="rolavel"><table><thead><tr><th>Dia</th>{gestor && <th>Pessoa</th>}<th>Tarefa</th><th>Categoria</th><th>Horário</th><th>Status</th><th>Justificativa</th></tr></thead>
          <tbody>{lista.slice().reverse().slice(0, 300).map(({ o, st }) => (
            <tr key={o.id}><td>{dataCurta(o.data)}</td>{gestor && <td>{nome[o.membro_id]}</td>}<td>{o.tarefa?.titulo}</td><td>{o.tarefa?.categoria?.nome || '—'}</td>
              <td>{o.hora_inicio ? hhmm(o.hora_inicio) : 'Sem horário'}</td><td>{STATUS_TXT[st]}</td><td style={{ fontSize: 'var(--f-apoio)' }}>{o.justificativa || ''}</td></tr>))}
          </tbody></table></div>
        {lista.length > 300 && <p className="sub" style={{ fontSize: 'var(--f-apoio)' }}>Mostrando as 300 mais recentes.</p>}
      </div>
    </main>
  );
}
