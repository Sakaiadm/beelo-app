'use client';
import { useEffect, useRef, useState } from 'react';
import { sortearMensagem, MENSAGEM_FINAL } from '@/lib/festa';

// Mensagem alegre do modo criança, que sobe de baixo por alguns segundos depois de concluir.
export default function Festa({ crianca, nome }) {
  const [msg, setMsg] = useState(null);
  const tempo = useRef(null);
  useEffect(() => {
    if (!crianca) return undefined;
    const ouvir = (e) => {
      const ultima = !!e.detail?.ultima;
      setMsg({ titulo: ultima ? MENSAGEM_FINAL : sortearMensagem(nome), sub: ultima ? 'Todas as tarefas de hoje feitas.' : 'Mais uma estrela no seu dia.', id: Date.now() });
      clearTimeout(tempo.current);
      tempo.current = setTimeout(() => setMsg(null), 3400);
    };
    window.addEventListener('ra-festa', ouvir);
    return () => { window.removeEventListener('ra-festa', ouvir); clearTimeout(tempo.current); };
  }, [crianca, nome]);
  if (!msg) return null;
  return (
    <div className="festa-msg" role="status" key={msg.id} onClick={() => setMsg(null)}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="#ffd43b" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>
      <div><b>{msg.titulo}</b><small>{msg.sub}</small></div>
    </div>
  );
}
