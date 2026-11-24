'use client';
import { useState } from 'react';

// Motivos prontos para adiar e justificar (Raio-X U5 e U6). "Outro" abre o campo para escrever.
export const MOTIVOS = ['Tenho prova', 'Não estou bem', 'Tenho compromisso'];

export default function Motivos({ id, name, rotulo, botao }) {
  const [esc, setEsc] = useState(null);
  const [texto, setTexto] = useState('');
  const valor = esc === 'Outro' ? texto : esc || '';
  return (
    <div className="motivos">
      <label htmlFor={esc === 'Outro' ? id : undefined}>{rotulo}</label>
      <div className="chips" role="radiogroup" aria-label={rotulo}>
        {[...MOTIVOS, 'Outro'].map((m) => (
          <button key={m} type="button" role="radio" aria-checked={esc === m} className={esc === m ? 'on' : ''} onClick={() => setEsc(m)}>{m}</button>
        ))}
      </div>
      {esc === 'Outro' && <textarea id={id} value={texto} onChange={(e) => setTexto(e.target.value)} required minLength={3} maxLength={500} autoFocus style={{ marginTop: 10 }} />}
      <input type="hidden" name={name} value={valor} />
      <button className="btn" style={{ marginTop: 12 }} disabled={valor.trim().length < 3}>{botao}</button>
    </div>
  );
}

