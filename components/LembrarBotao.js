'use client';
// @arquivo  LembrarBotao.js: botão "Lembrar" numa tarefa atrasada (manda aviso no celular).
// @tipo     componente
// @usa      app/acoes, components/Icone
// @usado-por app/(app)/painel/page.js
// @cuidado  a regra das 2 horas vale também no banco (ra_lembrar_tarefa); aqui só mostramos o estado.
import { useState } from 'react';
import { lembrarTarefa } from '@/app/acoes';
import Icone from '@/components/Icone';

const DUAS_HORAS = 2 * 60 * 60 * 1000;
// Hora de São Paulo, no jeito do app: "15h" ou "15h30".
function horaCurta(d) {
  const [h, m] = new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

// "Lembrar" numa tarefa atrasada do Painel: manda um aviso no celular da pessoa (Raio-X U35).
// @decisao depois de enviar, o botão vira o selo "Lembrado às 15h". Ele vem do banco (lembradoEm),
// então continua marcado ao sair e voltar. Passadas 2 horas, o botão Lembrar volta.
export default function LembrarBotao({ oc, nome, lembradoEm = null }) {
  const [msg, setMsg] = useState('');
  const [env, setEnv] = useState(false);
  const [quando, setQuando] = useState(lembradoEm);
  const enviar = async () => {
    setEnv(true); setMsg('');
    const fd = new FormData(); fd.set('oc', oc);
    try {
      const r = await lembrarTarefa(null, fd);
      if (r?.ok) setQuando(new Date().toISOString()); else setMsg(r?.erro || 'Não consegui enviar. Tente de novo.');
    } catch { setMsg('Sem internet. Tente de novo.'); }
    setEnv(false);
  };
  const recente = quando && Date.now() - new Date(quando).getTime() < DUAS_HORAS;
  return (
    <div className="lembrar">
      {recente
        ? <span className="tg vd" role="status"><Icone nome="check" tam={14} />&nbsp;Lembrado às {horaCurta(quando)}</span>
        : <button type="button" className="btn sec peq" disabled={env} onClick={enviar} aria-label={`Lembrar ${nome} no celular`}>Lembrar</button>}
      {msg && <small role="status">{msg}</small>}
    </div>
  );
}
