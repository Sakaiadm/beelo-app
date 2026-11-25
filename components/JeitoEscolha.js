'use client';
import { useState } from 'react';
import Icone from './Icone';
import { JEITOS } from '@/lib/jeito';
import { salvarJeito } from '@/app/acoes';

const ESTRELA = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
const ICONE = {
  divertido: <span className="ic mel"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d={ESTRELA} fill="#f5b82e" stroke="#d99a12" strokeWidth="1.2" strokeLinejoin="round" /></svg></span>,
  calmo: <span className="ic"><Icone nome="lua" /></span>,
  adultos: <span className="ic"><Icone nome="lista" /></span>,
};

// Meu perfil (modo criança): "Como eu quero ver o beelo". Vale na hora, sem botão Salvar.
// Com a chave "Pode trocar sozinho(a)" desligada no cadastro, mostra o jeito escolhido pelos responsáveis.
export default function JeitoEscolha({ inicial, livre }) {
  const [sel, setSel] = useState(inicial);
  const [msg, setMsg] = useState(null);
  const escolher = (id) => {
    if (!livre || id === sel) return;
    const antes = sel;
    setSel(id); setMsg({ ok: true, txt: 'Salvando…' });
    const fd = new FormData(); fd.set('jeito', id);
    salvarJeito(null, fd)
      .then((r) => { if (r?.erro) { setSel(antes); setMsg({ txt: r.erro }); } else setMsg({ ok: true, txt: `Pronto! Agora está no jeito ${JEITOS.find((j) => j.id === id).nome}.` }); })
      .catch(() => { setSel(antes); setMsg({ txt: 'Sem internet. Tente de novo.' }); });
  };
  return (
    <>
      {msg && <div className={`aviso ${msg.ok ? 'ok' : 'erro'}`} role="status" style={{ margin: '0 0 12px' }}>{msg.txt}</div>}
      <div className="jeitos" role="radiogroup" aria-label="Como eu quero ver o beelo">
        {JEITOS.map((j) => (
          <button type="button" key={j.id} role="radio" aria-checked={sel === j.id} aria-disabled={!livre || undefined}
            className={`jeito ${sel === j.id ? 'on' : ''} ${livre ? '' : 'travado'}`} onClick={() => escolher(j.id)}>
            {ICONE[j.id]}
            <span className="corpo"><b>{j.nome}</b><small>{j.desc}</small></span>
            <span className="marca-r" aria-hidden="true" />
          </button>
        ))}
      </div>
      {!livre && <div className="trava-msg"><Icone nome="cadeado" tam={18} /><span>Os responsáveis escolheram este jeito por enquanto.</span></div>}
    </>
  );
}
