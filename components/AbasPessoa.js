'use client';
import { useState } from 'react';

// Um cartão só, com uma aba por pessoa (Raio-X S18). itens: [{ id, rotulo }]; paineis: um por item, na mesma ordem.
export default function AbasPessoa({ itens, paineis }) {
  const [qual, setQual] = useState(0);
  return (
    <>
      {itens.length > 1 && (
        <div className="seg pessoas" role="tablist" aria-label="Pessoa">
          {itens.map((x, i) => <button key={x.id} type="button" role="tab" aria-selected={qual === i} className={qual === i ? 'on' : ''} onClick={() => setQual(i)}>{x.rotulo}</button>)}
        </div>
      )}
      {paineis[qual] || paineis[0]}
    </>
  );
}
