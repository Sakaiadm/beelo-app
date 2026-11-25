'use client';
// @arquivo  AutomacoesGestor.js: resumo do dia por aviso e conferir sozinho depois de 2 dias (Pai e Mãe, em Meu perfil).
// @tipo     componente
// @usa      app/acoes
// @usado-por app/(app)/perfil/page.js
import { useState } from 'react';
import { salvarResumo, salvarConferirAuto } from '@/app/acoes';

const HORAS = ['18:00', '19:00', '20:00', '21:00', '22:00'];

// Em Meu perfil (Pai e Mãe): resumo do dia por aviso (U52) e conferir sozinho depois de 2 dias (U53). Cada um vale ao tocar.
export default function AutomacoesGestor({ resumo, conferirAuto }) {
  const [hora, setHora] = useState(resumo || '');
  const [auto, setAuto] = useState(!!conferirAuto);
  const [msg, setMsg] = useState('');
  const depois = (p) => p.then((r) => setMsg(r?.erro || 'Salvo.')).catch(() => setMsg('Sem internet. Tente de novo.'));
  const mudarHora = (h) => { setHora(h); setMsg('Salvando…'); const fd = new FormData(); fd.set('hora', h); depois(salvarResumo(null, fd)); };
  const trocarAuto = () => { const novo = !auto; setAuto(novo); setMsg('Salvando…'); const fd = new FormData(); fd.set('ligar', novo ? '1' : '0'); depois(salvarConferirAuto(null, fd)); };
  return (
    <div className="av-auto">
      <div className="lin-chave">
        <span><b>Resumo do dia</b><small>Um aviso com o andamento de cada pessoa e os pedidos esperando</small></span>
        <select aria-label="Hora do resumo do dia" value={hora} onChange={(e) => mudarHora(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Desativado</option>
          {HORAS.map((h) => <option key={h} value={h}>{h.slice(0, 2)}h</option>)}
        </select>
      </div>
      <div className="lin-chave">
        <span><b>Conferir sozinho depois de 2 dias</b><small>Só tarefas sem foto. As com foto continuam esperando você.</small></span>
        <button type="button" role="switch" aria-checked={auto} aria-label="Conferir sozinho depois de 2 dias" className={`chave ${auto ? 'on' : ''}`} onClick={trocarAuto} />
      </div>
      {msg && <p className="salvo-msg" role="status">{msg}</p>}
    </div>
  );
}
