'use client';
// @arquivo  LampadaBtn.js: lâmpada do topo, com o número de ideias novas.
// @tipo     componente
// @usa      lib/dicasMotor.js (pendentes), evento 'ra-dicas'
// @usado-por app/(app)/layout.js
// @cuidado  o número só some quando 'pend' esvazia: ver marcarTodasVistas em lib/dicasMotor.js.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from './Icone';
import { ler, pendentes } from '@/lib/dicasMotor';

// Lâmpada do topo: abre as Ideias. O número mostra as dicas ainda não lidas (no máximo 3).
export default function LampadaBtn({ membro, hoje }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ver = () => setN(pendentes(ler(membro), hoje).length);
    ver();
    window.addEventListener('ra-dicas', ver);
    window.addEventListener('storage', ver);
    return () => { window.removeEventListener('ra-dicas', ver); window.removeEventListener('storage', ver); };
  }, [membro, hoje]);
  return (
    <Link prefetch={false} className="icone-btn ideias" href="/ideias" aria-label={n ? `Ideias, ${n} nova${n > 1 ? 's' : ''}` : 'Ideias'} title="Ideias">
      <Icone nome="ideia" cor="#fff" />{n > 0 && <span className="selo">{n}</span>}
    </Link>
  );
}
