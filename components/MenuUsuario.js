'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icone from './Icone';

// Botão com o nome da pessoa no topo. Abre: Meu perfil, Ajuda, Modo escuro e Sair (Raio-X U67).
// Sair pergunta antes (U68).
export default function MenuUsuario({ nome, familia, children }) {
  const [aberto, setAberto] = useState(false);
  const [escuro, setEscuro] = useState(false);
  const [sair, setSair] = useState(false);
  const raiz = useRef(null);

  useEffect(() => {
    if (!aberto) { setSair(false); return; }
    const el = document.documentElement;
    setEscuro((el.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro')) === 'escuro');
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('pointerdown', fora); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  function alternar() {
    const novo = escuro ? 'claro' : 'escuro';
    document.documentElement.dataset.theme = novo;
    document.cookie = `tema=${novo}; path=/; max-age=31536000; samesite=lax`;
    setEscuro(!escuro);
  }

  return (
    <div className="usuario" ref={raiz}>
      <button type="button" className="usuario-btn" aria-label={`Menu de ${nome}`} aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        {children}
        <span className="usuario-nome">{nome}{familia ? <small> · {familia}</small> : null}</span>
        <span className="usuario-seta" aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <div className="usuario-menu" role="menu">
          <div className="usuario-cab"><b>{nome}</b>{familia ? <small>{familia}</small> : null}</div>
          <Link role="menuitem" href="/perfil" prefetch={false} onClick={() => setAberto(false)}>Meu perfil</Link>
          <Link role="menuitem" href="/ajuda" prefetch={false} onClick={() => setAberto(false)}>Ajuda</Link>
          <button role="menuitem" type="button" onClick={alternar}>Modo escuro<span className={`chave ${escuro ? 'on' : ''}`} aria-hidden="true" /></button>
          {sair ? (
            <form action="/auth/sair" method="post" className="sair-conf" role="alertdialog" aria-label="Sair do beelo">
              <p>Sair do beelo neste aparelho?</p>
              <div className="acoes"><button className="btn perigo peq">Sim, sair</button><button type="button" className="btn sec peq" onClick={() => setSair(false)}>Cancelar</button></div>
            </form>
          ) : <button role="menuitem" type="button" className="sair" onClick={() => setSair(true)}><Icone nome="sair" tam={18} /> Sair</button>}
        </div>
      )}
    </div>
  );
}
