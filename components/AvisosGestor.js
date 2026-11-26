'use client';
// @arquivo  AvisosGestor.js: escolha dos avisos que Pai e Mãe querem receber.
// @tipo     componente
// @usa      app/acoes
// @usado-por app/(app)/perfil/page.js
import { useState } from 'react';
import { salvarAvisos } from '@/app/acoes';

const ITENS = [
  ['concluir', 'Quando alguém concluir uma tarefa'],
  ['sem_foto', 'Também quando concluir sem foto', 'Desligado: só avisa quando a tarefa for concluída com foto'],
  ['justificativa', 'Quando justificar uma tarefa não feita'],
  ['adiamento', 'Quando pedir para adiar'],
  ['tela', 'Quando propor tempo de tela'],
  ['tarefa_filho', 'Quando criar uma tarefa para si'],
  ['chegada', 'Quando alguém avisar que chegou', 'Inclui o "ainda sem confirmação", se você ligou na tarefa'],
];

export default function AvisosGestor({ inicial }) {
  const [v, setV] = useState({
    concluir: inicial.concluida !== 'nenhuma', sem_foto: inicial.concluida !== 'com_foto',
    justificativa: inicial.justificativa !== false, adiamento: inicial.adiamento !== false,
    tela: inicial.tela !== false, tarefa_filho: inicial.tarefa_filho !== false, chegada: inicial.chegada !== false,
  });
  // "Avisar tudo" só fica ligado quando todos os avisos estão ligados.
  const todos = Object.keys(v);
  const tudo = todos.every((k) => v[k]);
  const [msg, setMsg] = useState('');
  // Cada chave vale ao tocar, com um "Salvo" discreto (Raio-X U64).
  const salvar = (novo) => {
    setV(novo);
    const fd = new FormData();
    Object.entries(novo).forEach(([k, on]) => on && fd.set(k, '1'));
    setMsg('Salvando…');
    salvarAvisos(null, fd).then((r) => setMsg(r?.erro || 'Salvo.')).catch(() => setMsg('Sem internet. Tente de novo.'));
  };
  const marcarTudo = () => salvar(Object.fromEntries(todos.map((k) => [k, !tudo])));
  const troca = (k) => salvar({ ...v, [k]: !v[k] });
  return (
    <div>
      <div className="lin-chave destaque">
        <span><b>Avisar tudo</b><small>Liga ou desliga todos de uma vez</small></span>
        <button type="button" role="switch" aria-checked={tudo} aria-label="Avisar tudo" className={`chave ${tudo ? 'on' : ''}`} onClick={marcarTudo} />
      </div>
      {/* U65: a lista dos tipos fica fechada em "Escolher quais avisos". */}
      <details className="av-tipos">
        <summary>Escolher quais avisos</summary>
      {ITENS.map(([k, t, ajuda]) => (
        <div className="lin-chave" key={k} style={k === 'sem_foto' && !v.concluir ? { opacity: 0.5 } : undefined}>
          <span>{t}{ajuda && <small>{ajuda}</small>}</span>
          <button type="button" role="switch" aria-checked={v[k]} aria-label={t} disabled={k === 'sem_foto' && !v.concluir} className={`chave ${v[k] ? 'on' : ''}`} onClick={() => troca(k)} />
        </div>
      ))}
      </details>
      {msg && <p className="salvo-msg" role="status">{msg}</p>}
      <p className="rodape-av">Cada responsável escolhe os próprios avisos. Os avisos aparecem no sino do app.</p>
    </div>
  );
}
