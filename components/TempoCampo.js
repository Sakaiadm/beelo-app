'use client';
import { useState } from 'react';
import { fmtMin, parseMin } from '@/lib/util';

// Campo de tempo com botões prontos e − / + de 30 em 30 minutos (Raio-X S7, S24, S25).
// Padrão: 3 sugestões a partir de 3h, na mesma linha do campo (pedido do Thomas 24/11) (pedido do Thomas: hoje quase ninguém usa menos; se usar, é só diminuir).
// - valor: minutos iniciais (ou null = vazio).  prontos: [{ rotulo, min }].  base: soma "+X" a partir deste valor.
// - grande: botões maiores (modo criança).  aoMudar(min): avisa a tela (ex.: total do dia).
export const PRONTOS_PADRAO = [180, 240, 300].map((m) => ({ rotulo: fmtMin(m).replace('h00', 'h'), min: m }));

export default function TempoCampo({ id, name, rotulo, valor = null, prontos = PRONTOS_PADRAO, base = null, grande, required, aoMudar }) {
  const [txt, setTxt] = useState(valor == null ? '' : fmtMin(valor));
  const min = parseMin(txt);
  const mudar = (m) => { const v = Math.max(0, Math.min(1440, m)); setTxt(fmtMin(v)); aoMudar?.(v); };
  const passo = (d) => mudar((Number.isNaN(min) || min == null ? (base ?? 0) : min) + d);
  const chips = prontos?.length > 0 && (
    <div className="chips">
      {prontos.map((p) => {
        const alvo = base != null ? base + p.min : p.min;
        return <button key={p.rotulo} type="button" className={min === alvo ? 'on' : ''} onClick={() => mudar(alvo)}>{p.rotulo}</button>;
      })}
    </div>
  );
  return (
    <div className={`tempo-campo${grande ? ' grande' : ''}`}>
      {rotulo && <label htmlFor={id}>{rotulo}</label>}
      <div className="tempo-linha">
        <button type="button" className="btn sec peq icone" onClick={() => passo(-30)} aria-label={`Menos 30 minutos${rotulo ? ' em ' + rotulo : ''}`}>−</button>
        <input id={id} name={name} value={txt} required={required} inputMode="text" autoComplete="off" placeholder="0h00"
          onFocus={(e) => e.target.select()} onChange={(e) => { setTxt(e.target.value); const m = parseMin(e.target.value); if (!Number.isNaN(m)) aoMudar?.(m || 0); }} />
        <button type="button" className="btn sec peq icone" onClick={() => passo(30)} aria-label={`Mais 30 minutos${rotulo ? ' em ' + rotulo : ''}`}>+</button>
        {!grande && chips}
      </div>
      {grande && chips}
    </div>
  );
}
