'use client';
import { useState } from 'react';
import { lembrarTarefa } from '@/app/acoes';

// "Lembrar" numa tarefa atrasada do Painel: manda um aviso no celular da pessoa (Raio-X U35).
export default function LembrarBotao({ oc, nome }) {
  const [msg, setMsg] = useState('');
  const [env, setEnv] = useState(false);
  const enviar = async () => {
    setEnv(true); setMsg('');
    const fd = new FormData(); fd.set('oc', oc);
    try { const r = await lembrarTarefa(null, fd); setMsg(r?.erro || r?.msg || 'Lembrete enviado.'); } catch { setMsg('Sem internet. Tente de novo.'); }
    setEnv(false);
  };
  return (
    <div className="lembrar">
      <button type="button" className="btn sec peq" disabled={env} onClick={enviar} aria-label={`Lembrar ${nome} no celular`}>Lembrar</button>
      {msg && <small role="status">{msg}</small>}
    </div>
  );
}
