'use client';
import { useState } from 'react';
import { fmtMin } from '@/lib/util';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CHAVE = { Total: 'total', Celular: 'cel', Computador: 'pc' };

// Últimos 7 dias: por dia, duas barras encostadas. Azul = previsto; realizado verde (dentro) ou vermelho (passou).
export default function TelaGrafico({ dias }) {
  const doisAparelhos = dias.some((d) => d.prev?.cel != null && d.prev?.pc != null);
  const [qual, setQual] = useState('Total');
  const k = doisAparelhos ? CHAVE[qual] : 'total';
  const val = (o) => (o ? o[k] ?? null : null);
  const max = Math.max(60, ...dias.map((d) => Math.max(val(d.prev) || 0, val(d.real) || 0)));
  let dentro = 0, lancados = 0;
  const linhas = dias.map((d) => {
    const p = val(d.prev), r = d.real ? val(d.real) ?? 0 : null;
    const dif = p != null && r != null ? r - p : null;
    if (r != null) { lancados++; if (p == null || r <= p) dentro++; }
    return { ...d, p, r, dif };
  });
  return (
    <div className="card">
      <h2>Últimos 7 dias</h2>
      {doisAparelhos && (
        <div className="seg" role="radiogroup" aria-label="Aparelho">
          {Object.keys(CHAVE).map((q) => <button key={q} type="button" role="radio" aria-checked={qual === q} className={qual === q ? 'on' : ''} onClick={() => setQual(q)}>{q}</button>)}
        </div>
      )}
      <div className="g7" role="img" aria-label="Previsto e realizado dos últimos 7 dias">
        {linhas.map((d) => (
          <div className="col" key={d.data} title={`Previsto ${fmtMin(d.p)} · Realizado ${fmtMin(d.r)}`}>
            {d.p != null ? <div className="b p" style={{ height: `${(d.p / max) * 100}%` }} /> : <div className="sem">—</div>}
            {d.r != null ? <div className={`b ${d.p != null && d.r > d.p ? 'passou' : 'ok'}`} style={{ height: `${(d.r / max) * 100}%` }} /> : <div className="sem">—</div>}
          </div>
        ))}
      </div>
      <div className="g7d">{linhas.map((d) => <div key={d.data}>{DIAS[new Date(d.data + 'T12:00:00Z').getUTCDay()]}<b>{d.data.slice(8, 10)}</b></div>)}</div>
      <div className="g7v">{linhas.map((d) => (
        <div key={d.data} className={d.dif > 0 ? 'mais' : d.dif < 0 ? 'menos' : ''}>{d.dif == null ? '—' : d.dif === 0 ? 'igual' : (d.dif > 0 ? '+' : '') + fmtMin(d.dif)}</div>
      ))}</div>
      <div className="legenda"><span><i style={{ background: '#1a6fe0' }} />Previsto</span><span><i style={{ background: 'var(--ok)' }} />Dentro</span><span><i style={{ background: 'var(--erro)' }} />Passou</span></div>
      {lancados > 0 && <p style={{ margin: '12px 0 0', fontSize: 14 }}>Dentro do previsto em <b>{dentro} de {lancados}</b> {lancados === 1 ? 'dia lançado' : 'dias lançados'}.</p>}
    </div>
  );
}
