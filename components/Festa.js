'use client';
import { useEffect, useRef, useState } from 'react';
import { sortearMensagem, MENSAGEM_FINAL, tocarSom, proximaAnimacao } from '@/lib/festa';

const CORES = ['#ffd43b', '#1a6fe0', '#ff6b6b', '#51cf66', '#cc5de8', '#ff922b'];
const parado = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Monta as peças de cada animação uma vez por comemoração (posições sorteadas).
function pecas(tipo) {
  if (tipo === 'estrelas') {
    return Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3, d = 80 + Math.random() * 90;
      return { '--x': `${Math.cos(a) * d}px`, '--y': `${Math.sin(a) * d * 0.9}px`, '--c': CORES[i % 6] };
    });
  }
  return Array.from({ length: 40 }, (_, i) => ({
    left: `${Math.random() * 100}%`, '--x': `${Math.random() * 80 - 40}px`, '--r': `${Math.random() * 720 - 360}deg`,
    '--d': `${1.3 + Math.random() * 1}s`, '--c': CORES[i % 6], animationDelay: `${Math.random() * 0.35}s`,
  }));
}

// Ao concluir: "plim" para todos; no modo criança, estrelinhas (som Escadinha) ou confete
// (som Varinha mágica), alternando, mais a mensagem alegre sorteada.
export default function Festa({ crianca, nome }) {
  const [msg, setMsg] = useState(null);
  const [anim, setAnim] = useState(null);
  const tempo = useRef(null), tempoAnim = useRef(null);
  useEffect(() => {
    const ouvir = (e) => {
      const { ultima, x, y } = e.detail || {};
      if (!crianca) { tocarSom('plim'); return; }
      const a = proximaAnimacao();
      tocarSom(a.som);
      if (!parado()) {
        setAnim({ tipo: a.tipo, x: x ?? window.innerWidth / 2, y: y ?? window.innerHeight / 2, pecas: pecas(a.tipo), id: Date.now() });
        clearTimeout(tempoAnim.current);
        tempoAnim.current = setTimeout(() => setAnim(null), 2600);
      }
      setMsg({ titulo: ultima ? MENSAGEM_FINAL : sortearMensagem(nome), sub: ultima ? 'Todas as tarefas de hoje feitas.' : 'Mais uma estrela no seu dia.', id: Date.now() });
      clearTimeout(tempo.current);
      tempo.current = setTimeout(() => setMsg(null), 3400);
    };
    window.addEventListener('ra-festa', ouvir);
    return () => { window.removeEventListener('ra-festa', ouvir); clearTimeout(tempo.current); clearTimeout(tempoAnim.current); };
  }, [crianca, nome]);
  return (
    <>
      {anim && (
        <div className={`festa-anim ${anim.tipo}`} key={anim.id} aria-hidden="true">
          {anim.tipo === 'estrelas'
            ? <div className="origem" style={{ left: anim.x, top: anim.y }}>{anim.pecas.map((s, i) => <i key={i} style={s} />)}</div>
            : anim.pecas.map((s, i) => <i key={i} style={s} />)}
        </div>
      )}
      {msg && (
        <div className="festa-msg" role="status" key={msg.id} onClick={() => setMsg(null)}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ffd43b" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>
          <div><b>{msg.titulo}</b><small>{msg.sub}</small></div>
        </div>
      )}
    </>
  );
}
