'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from './Icone';
import { dicaDeHoje, fechar, marcarVista } from '@/lib/dicasMotor';

// Faixa curta com a dica do dia (seção 66, opção B). Aparece só ao abrir Painel ou Hoje,
// no máximo uma por dia, com X para fechar e "Ver ideia ›".
export default function DicaFaixa({ membro, cands, hoje }) {
  const [dica, setDica] = useState(null);
  useEffect(() => { setDica(dicaDeHoje(membro, cands, hoje)); }, [membro, hoje]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!dica) return null;
  return (
    <div className="aviso info dica" role="status">
      <span className="dica-ic"><Icone nome="ideia" tam={20} /></span>
      <span className="dica-tx"><b>{dica.t}</b><small>{dica.x}</small><Link prefetch={false} className="btn peq dica-bt" href={`/ideias?i=${dica.i}`} onClick={() => marcarVista(membro, dica.i, hoje)}>Ver ideia</Link></span>
      <button type="button" className="dica-x" aria-label="Fechar a dica" onClick={() => { fechar(membro, hoje); setDica(null); }}><Icone nome="x" tam={18} /></button>
    </div>
  );
}
