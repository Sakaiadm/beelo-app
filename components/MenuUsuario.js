'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icone from './Icone';

// Botão com o nome da pessoa no topo. Abre: Meu perfil, Ajuda, modo escuro e Sair.
export default function MenuUsuario({ nome, familia, children }) {
  const [aberto, setAberto] = useState(false);
  const [escuro, setEscuro] = useState(false);
  const raiz = useRef(null);

  useEffect(() => {
    if (!aberto) return;
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
      <button type="button" className="usuario-btn" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        {children}
        <span className="usuario-nome">{nome}{familia ? <small> · {familia}</small> : null}</span>
        <span className="usuario-seta" aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <div className="usuario-menu" role="menu">
          <Link role="menuitem" href="/perfil" prefetch={false} onClick={() => setAberto(false)}>Meu perfil</Link>
          <Link role="menuitem" href="/ajuda" prefetch={false} onClick={() => setAberto(false)}>Ajuda</Link>
          <button role="menuitem" type="button" onClick={alternar}>Modo escuro<span className={`chave ${escuro ? 'on' : ''}`} aria-hidden="true" /></button>
          <form action="/auth/sair" method="post"><button role="menuitem" className="sair"><Icone nome="sair" tam={18} /> Sair</button></form>
        </div>
      )}
    </div>
  );
}
