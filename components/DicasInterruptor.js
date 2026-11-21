'use client';
import { useEffect, useState } from 'react';
import { ler, ligar } from '@/lib/dicasMotor';

// Meu perfil: liga/desliga as dicas na hora certa. A lâmpada e a tela Ideias continuam sempre lá.
export default function DicasInterruptor({ membro }) {
  const [on, setOn] = useState(true);
  useEffect(() => { setOn(!ler(membro).off); }, [membro]);
  const mudar = () => { const novo = !on; ligar(membro, novo); setOn(novo); };
  return (
    <div className="lin-chave" style={{ borderTop: 0 }}>
      <span>Dicas na hora certa<small>Uma faixa curta com uma ideia, de vez em quando. Vale para este aparelho.</small></span>
      <button type="button" role="switch" aria-checked={on} aria-label="Dicas na hora certa" className={`chave ${on ? 'on' : ''}`} onClick={mudar} />
    </div>
  );
}
