'use client';
import { useState } from 'react';
import Icone from './Icone';

// Escolha de horário num relógio de 24 horas (padrão Brasil, sem AM/PM).
// Primeiro a hora (fora: 12 a 11; dentro: 00 e 13 a 23), depois os minutos de 5 em 5.
const pad = (n) => String(n).padStart(2, '0');
const W = 280, C = W / 2, R_FORA = 112, R_DENTRO = 76;
const pos = (i, r) => { const a = ((i * 30 - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
const HORAS = [
  ...Array.from({ length: 12 }, (_, i) => ({ i, r: R_FORA, v: i === 0 ? 12 : i })),
  ...Array.from({ length: 12 }, (_, i) => ({ i, r: R_DENTRO, v: i === 0 ? 0 : i + 12, dentro: true })),
];
const MINUTOS = Array.from({ length: 12 }, (_, i) => ({ i, r: R_FORA, v: i * 5 }));

export default function RelogioHora({ id, name, rotulo, defaultValue = '08:00' }) {
  const [valor, setValor] = useState(defaultValue);
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState('hora');
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const abrir = () => {
    const [hh, mm] = (valor || '08:00').split(':').map(Number);
    setH(hh); setM(mm); setModo('hora'); setAberto(true);
  };
  const itens = modo === 'hora' ? HORAS : MINUTOS;
  const sel = modo === 'hora' ? h : m;
  const marcado = itens.find((x) => x.v === sel) || (modo === 'min' ? { i: Math.round(m / 5) % 12, r: R_FORA, v: m } : null);
  const escolher = (v) => { if (modo === 'hora') { setH(v); setModo('min'); } else setM(v); };
  const pronto = () => { setValor(`${pad(h)}:${pad(m)}`); setAberto(false); };
  return (
    <>
      <input type="hidden" name={name} value={valor} />
      <button id={id} type="button" className="campo-botao" onClick={abrir} aria-label={`${rotulo}: ${valor}`}>
        <span style={{ fontWeight: 600 }}>{valor}</span><span className="relogio-ic" aria-hidden="true"><Icone nome="relogio" tam={20} /></span>
      </button>
      {aberto && (
        <div className="relogio-fundo" role="dialog" aria-modal="true" aria-label={rotulo} onClick={(e) => { if (e.target === e.currentTarget) setAberto(false); }}>
          <div className="relogio">
            <h2>{rotulo}</h2>
            <div className="relogio-vis">
              <button type="button" className={modo === 'hora' ? 'on' : ''} onClick={() => setModo('hora')} aria-label="Hora">{pad(h)}</button>:
              <button type="button" className={modo === 'min' ? 'on' : ''} onClick={() => setModo('min')} aria-label="Minutos">{pad(m)}</button>
            </div>
            <p className="sub" style={{ margin: 0 }}>{modo === 'hora' ? 'Toque na hora' : 'Toque nos minutos'}</p>
            <div className="relogio-face" style={{ width: W, height: W }}>
              <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} aria-hidden="true">
                <circle cx={C} cy={C} r={C - 2} className="relogio-disco" />
                {marcado && (() => { const [x, y] = pos(marcado.i, marcado.r); return (<>
                  <line x1={C} y1={C} x2={x} y2={y} stroke="#1a6fe0" strokeWidth="3" />
                  <circle cx={C} cy={C} r="5" fill="#1a6fe0" /><circle cx={x} cy={y} r="21" fill="#1a6fe0" />
                </>); })()}
              </svg>
              {itens.map((x) => {
                const [px, py] = pos(x.i, x.r);
                return (
                  <button key={`${modo}-${x.v}`} type="button" className={`relogio-n ${x.dentro ? 'dentro' : ''} ${x.v === sel ? 'on' : ''}`}
                    style={{ left: px, top: py }} aria-pressed={x.v === sel} onClick={() => escolher(x.v)}>{pad(x.v)}</button>
                );
              })}
            </div>
            <div className="relogio-acoes">
              <button type="button" className="btn sec" onClick={() => setAberto(false)}>Cancelar</button>
              <button type="button" className="btn" onClick={pronto}>Pronto</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
