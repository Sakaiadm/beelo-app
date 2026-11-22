'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ler, marcarVista, ligar } from '@/lib/dicasMotor';
import { achar } from '@/lib/ideias';

// Marca a ideia aberta como lida (some do número da lâmpada e entra em "Já vistas").
export function MarcarVista({ membro, ideia, hoje }) {
  useEffect(() => { marcarVista(membro, ideia, hoje); }, [membro, ideia, hoje]);
  return null;
}

// "Já vistas": as ideias que a pessoa abriu neste aparelho.
export function JaVistas({ membro, paraPais }) {
  const [l, setL] = useState([]);
  const [off, setOff] = useState(false);
  useEffect(() => {
    const e = ler(membro);
    setOff(!!e.off);
    setL((e.vistas || []).map((v) => achar(v.i)).filter((i) => i && (paraPais || i.tema.id === 'filhos')).slice(0, 8));
  }, [membro, paraPais]);
  return (
    <>
      {l.length > 0 && <>
        <div className="grupo-titulo">Já vistas</div>
        <div className="cat-lista" style={{ marginBottom: 16 }}>
          {l.map((i) => <Link prefetch={false} key={i.id} className="cat-linha" href={`/ideias?i=${i.id}`}><span className="cat-bolinha" /><span className="cat-nome">{i.t}</span><span className="cat-lapis">›</span></Link>)}
        </div>
      </>}
      {off
        ? <p className="sub ideias-off"><button type="button" onClick={() => { ligar(membro, true); setOff(false); }}>Mostrar as dicas na hora certa de novo</button></p>
        : <p className="sub ideias-off"><button type="button" onClick={() => { ligar(membro, false); setOff(true); }}>Não mostrar mais dicas</button></p>}
    </>
  );
}
