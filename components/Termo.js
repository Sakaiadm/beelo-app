'use client';
// @arquivo  Termo.js: palavra sublinhada que abre um balãozinho de explicação (ex.: "dia bom", "dia coringa").
// @tipo     componente (cliente)
// @usa      ./Icone (nada além do balão .balao que o app já usa)
// @usado-por components/DesafioCartao.js, components/NovoDesafio.js
// @decisao  28/11 Thomas: a pessoa precisa saber o que é "dia bom" e "dia coringa" sem poluir a tela: só abre se tocar no nome.
// @cuidado  fica dentro de cartões que às vezes são links: o toque não deve navegar (preventDefault + stopPropagation).
import { useState } from 'react';
import Icone from './Icone';

export default function Termo({ texto, titulo, children }) {
  const [aberto, setAberto] = useState(false);
  const abrir = (e) => { e.preventDefault(); e.stopPropagation(); setAberto(true); };
  const fechar = (e) => { e?.preventDefault?.(); e?.stopPropagation?.(); setAberto(false); };
  return (
    <>
      <button type="button" className="termo" onClick={abrir} aria-haspopup="dialog">{texto}</button>
      {aberto && (
        <div className="balao-fundo" onClick={(e) => { if (e.target === e.currentTarget) fechar(e); }}>
          <div className="balao" role="dialog" aria-modal="true" aria-label={titulo}>
            <div className="balao-ic" style={{ background: 'var(--mel-fundo)', color: 'var(--mel)' }}><Icone nome="lampada" tam={26} /></div>
            <h2>{titulo}</h2>
            <p>{children}</p>
            <div className="balao-bts"><button type="button" className="btn" onClick={fechar}>Entendi</button></div>
          </div>
        </div>
      )}
    </>
  );
}
