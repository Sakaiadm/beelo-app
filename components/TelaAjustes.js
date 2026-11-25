'use client';
import { useState } from 'react';
import Icone from './Icone';

// Título da tela com a engrenagem ao lado: os ajustes que se definem uma vez ficam atrás dela (Raio-X U80).
export default function TelaAjustes({ titulo, aberto, children }) {
  const [on, setOn] = useState(!!aberto);
  return (
    <>
      <div className="cab tela-cab">
        <h1 className="titulo">{titulo}</h1>
        <button type="button" className={`eng${on ? ' on' : ''}`} aria-expanded={on} aria-label="Ajustes do tempo de tela" onClick={() => setOn((v) => !v)}>
          <Icone nome="config" tam={22} />
        </button>
      </div>
      {on && <div className="tela-ajustes">{children}</div>}
    </>
  );
}
