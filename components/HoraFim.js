'use client';
import { useState } from 'react';
import Icone from './Icone';

// Campo "Fim (opcional)" com um X para apagar: o seletor de hora do iPhone não deixa esvaziar o campo.
export default function HoraFim({ id, name, value, defaultValue = '', onChange }) {
  const [interno, setInterno] = useState(defaultValue);
  const v = value !== undefined ? value : interno;
  const mudar = (novo) => { if (value === undefined) setInterno(novo); onChange?.(novo); };
  return (
    <div className="campo-x">
      <input id={id} type="time" name={name} value={v} onChange={(e) => mudar(e.target.value)} />
      {v && <button type="button" className="limpar-x" aria-label="Apagar o horário de fim" title="Apagar" onClick={() => mudar('')}><Icone nome="x" tam={14} /></button>}
    </div>
  );
}
