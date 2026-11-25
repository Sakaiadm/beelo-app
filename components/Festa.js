'use client';
import { useEffect, useRef, useState } from 'react';
import { sortearMensagem, tocarSom, proximaAnimacao } from '@/lib/festa';

// Ao concluir uma tarefa (aprovado pelo Thomas em 25/11):
// - adulto: "Plim" e o check de sempre; no fim do dia, o quadro azul brilha, o símbolo do beelo se desenha
//   ("Tudo feito hoje. Bom descanso.", som Cristal) e, com 2 ou mais dias seguidos, a linha da sequência anda até hoje.
// - criança: "Escadinha", a abelha Mel leva a estrela até o quadro do dia e a mensagem alegre;
//   no fim do dia, o pote de mel enche (Caixinha de música) e depois os favos da semana (Varinha de brilho).
// As animações ficam em lib/festaAnim.js e só são carregadas na primeira comemoração.
export default function Festa({ crianca, nome }) {
  const [msg, setMsg] = useState(null);
  const tempo = useRef(null);
  useEffect(() => {
    const ouvir = async (e) => {
      const { ultima, x, y, dia } = e.detail || {};
      tocarSom(crianca ? proximaAnimacao().som : 'plim');
      const A = await import('@/lib/festaAnim');
      if (!crianca) { if (ultima) A.diaCompletoAdulto(dia); return; }
      if (ultima) { A.diaCompletoCrianca(dia); return; }
      A.marcarCrianca({ x, y });
      setMsg({ titulo: sortearMensagem(nome), sub: 'Mais uma estrela no seu dia.', id: Date.now() });
      clearTimeout(tempo.current);
      tempo.current = setTimeout(() => setMsg(null), 3400);
    };
    window.addEventListener('ra-festa', ouvir);
    return () => { window.removeEventListener('ra-festa', ouvir); clearTimeout(tempo.current); };
  }, [crianca, nome]);
  return msg && (
    <div className="festa-msg" role="status" key={msg.id} onClick={() => setMsg(null)}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="#f5b82e" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>
      <div><b>{msg.titulo}</b><small>{msg.sub}</small></div>
    </div>
  );
}
