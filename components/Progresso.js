'use client';
// @arquivo  Progresso.js: faixa azul no alto da tela ao tocar num link, até a próxima chegar.
// @tipo     componente
// @usado-por app/(app)/layout.js
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Faixa azul no alto da tela assim que a pessoa toca num link do app, até a próxima tela chegar.
// Antes, o toque não mostrava nada enquanto o servidor buscava os dados e parecia que o app tinha travado.
export default function Progresso() {
  const caminho = usePathname();
  const busca = useSearchParams();
  const [ativo, setAtivo] = useState(false);

  useEffect(() => { setAtivo(false); }, [caminho, busca]);

  useEffect(() => {
    const clique = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith('/auth')) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setAtivo(true);
    };
    document.addEventListener('click', clique, true);
    return () => document.removeEventListener('click', clique, true);
  }, []);

  // Segurança: nunca deixa a faixa presa (ex.: link que não troca de tela).
  useEffect(() => {
    if (!ativo) return;
    const t = setTimeout(() => setAtivo(false), 15000);
    return () => clearTimeout(t);
  }, [ativo]);

  return <div className={`progresso${ativo ? ' on' : ''}`} role="progressbar" aria-hidden={!ativo} aria-label="Carregando" />;
}
