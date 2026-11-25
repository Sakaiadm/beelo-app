'use client';
// @arquivo  HorarioCampo.js: horário num campo só ("Sem horário" ou início e fim no relógio do app).
// @tipo     componente
// @usa      ./Icone, ./RelogioHora
// @usado-por components/Tarefa.js, components/TarefaForm.js
import { useState } from 'react';
import Icone from './Icone';
import RelogioHora from './RelogioHora';

const mais1h = (h) => { const [a, b] = (h || '08:00').split(':').map(Number); return `${String(Math.min(a + 1, 23)).padStart(2, '0')}:${String(b).padStart(2, '0')}`; };

// Horário num campo só (Raio-X U26 e V7): começa em "Sem horário"; ao tocar, abre o relógio do app
// para o início e, se quiser, para o fim. Envia com_horario, hora_inicio e hora_fim.
export default function HorarioCampo({ id = 'horario', inicio: ini0 = '', fim: fim0 = '', nomes = { com: 'com_horario', inicio: 'hora_inicio', fim: 'hora_fim' }, aoMudar }) {
  const [inicio, setInicio] = useState(ini0 || '');
  const [fim, setFim] = useState(fim0 || '');
  const [aberto, setAberto] = useState(false);
  const [n, setN] = useState(0); // recria os relógios ao abrir
  const mudar = (i, f) => { setInicio(i); setFim(f); aoMudar?.(i, f); };
  const txt = inicio ? `${inicio}${fim ? '–' + fim : ''}` : 'Sem horário';
  return (
    <>
      {nomes.com && <input type="hidden" name={nomes.com} value={inicio ? '1' : '0'} />}
      <input type="hidden" name={nomes.inicio} value={inicio} />
      {nomes.fim && <input type="hidden" name={nomes.fim} value={inicio ? fim : ''} />}
      <button type="button" id={id} className="campo-botao" onClick={() => { if (!inicio) mudar('08:00', ''); setN((x) => x + 1); setAberto(true); }} aria-label={`Horário: ${txt}`}>
        <span style={{ fontWeight: inicio ? 700 : 400 }}>{txt}</span><span className="relogio-ic" aria-hidden="true"><Icone nome="relogio" tam={20} /></span>
      </button>
      {aberto && (
        <div className="folha" role="dialog" aria-modal="true" aria-label="Horário">
          <div className="folha-in">
            <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setAberto(false)}><Icone nome="esq" tam={26} /></button><h2>Horário</h2></div>
            <div className="card" style={{ margin: 0 }}>
              <label style={{ marginTop: 0 }}>Começa às</label>
              <RelogioHora key={`i${n}`} rotulo="Começa às" defaultValue={inicio || '08:00'} aoMudar={(v) => mudar(v, fim && fim <= v ? '' : fim)} />
              {nomes.fim && <label>Termina às (opcional)</label>}
              {!nomes.fim ? null : fim ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}><RelogioHora key={`f${n}`} rotulo="Termina às" defaultValue={fim} aoMudar={(v) => mudar(inicio, v)} /></div>
                  <button type="button" className="btn texto" onClick={() => mudar(inicio, '')}>Tirar</button>
                </div>
              ) : <button type="button" className="btn sec" onClick={() => { setN((x) => x + 1); mudar(inicio, mais1h(inicio)); }}><Icone nome="mais" tam={18} />Hora de terminar</button>}
              {fim && fim <= inicio && <p className="erro-campo">O fim deve ser depois do início.</p>}
            </div>
            <button type="button" className="btn bloco" onClick={() => setAberto(false)}>Pronto</button>
            <button type="button" className="btn texto" onClick={() => { mudar('', ''); setAberto(false); }}>Sem horário</button>
          </div>
        </div>
      )}
    </>
  );
}
