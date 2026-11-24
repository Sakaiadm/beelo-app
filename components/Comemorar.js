'use client';
import { useState } from 'react';
import { desafioVisto } from '@/app/acoes-desafios';
import { prepararSom, tocarSom } from '@/lib/festa';

const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
const E = ({ t, style }) => <svg width={t} height={t} viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'var(--mel)', flex: 'none', ...style }}><path d={STAR} /></svg>;
const SOLTAS = [[10, 18, 22, -12], [82, 22, 18, 15], [18, 46, 14, 20], [78, 50, 24, -8], [46, 8, 16, 0], [6, 72, 16, 10], [88, 78, 14, -20]];

// Desafio cumprido: comemoração na hora em que a pessoa abre o app (uma vez só).
export default function Comemorar({ itens, nome }) {
  const [fila, setFila] = useState(itens || []);
  if (!fila.length) return null;
  const x = fila[0];
  const premio = x.d.recompensa === 'estrelas' ? `+${x.d.estrelas} estrelinhas no cofrinho` : x.d.recompensa === 'semanas' ? 'Mais uma semana conquistada' : null;
  const ok = () => { prepararSom(); tocarSom('escadinha'); desafioVisto(x.id); setFila(fila.slice(1)); };
  return (
    <div className="balao-fundo" role="dialog" aria-modal="true" aria-labelledby="comemora-tit">
      {SOLTAS.map(([l, t, s, r], i) => <span key={i} className="festa-est" style={{ left: `${l}%`, top: `${t}%`, transform: `rotate(${r}deg)` }}><E t={s} /></span>)}
      <div className="balao" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}><E t={30} /><E t={40} /><E t={30} /></div>
        <h2 id="comemora-tit" style={{ fontSize: 22 }}>Desafio cumprido!</h2>
        <p>{x.titulo}. Você foi constante{nome ? `, ${nome}` : ''}!</p>
        {premio && <div className="aviso ok" style={{ margin: 0, textAlign: 'center' }}>{premio}</div>}
        <p style={{ fontSize: 14, color: 'var(--cinza)' }}>{x.d.periodo === 'mes' ? 'No dia 1º começa um mês novo.' : 'Na segunda começa uma semana nova.'}</p>
        <div className="balao-bts"><button type="button" className="btn" onClick={ok} autoFocus>Eba!</button></div>
      </div>
    </div>
  );
}
