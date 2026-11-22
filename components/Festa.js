'use client';
import { useEffect, useRef, useState } from 'react';
import { sortearMensagem, MENSAGEM_FINAL, tocarSom, proximaAnimacao } from '@/lib/festa';

const CORES = ['#f5b82e', '#1a6fe0', '#ff6b6b', '#51cf66', '#cc5de8', '#ff922b'];
const parado = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Estrelinhas que saem da bolinha (posições sorteadas a cada comemoração).
function pecas() {
  return Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3, d = 80 + Math.random() * 90;
    return { '--x': `${Math.cos(a) * d}px`, '--y': `${Math.sin(a) * d * 0.9}px`, '--c': CORES[i % 6] };
  });
}

// Ao concluir: "plim" para todos; no modo criança, estrelinhas com o som Escadinha
// e a mensagem alegre sorteada.
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
        setAnim({ tipo: a.tipo, x: x ?? window.innerWidth / 2, y: y ?? window.innerHeight / 2, pecas: pecas(), id: Date.now() });
        clearTimeout(tempoAnim.current);
        tempoAnim.current = setTimeout(() => setAnim(null), 1300);
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
          <div className="origem" style={{ left: anim.x, top: anim.y }}>{anim.pecas.map((s, i) => <i key={i} style={s} />)}</div>
        </div>
      )}
      {msg && (
        <div className="festa-msg" role="status" key={msg.id} onClick={() => setMsg(null)}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#f5b82e" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>
          <div><b>{msg.titulo}</b><small>{msg.sub}</small></div>
        </div>
      )}
    </>
  );
}
