'use client';
import Icone from './Icone';

export default function Tema() {
  function alternar() {
    const el = document.documentElement;
    const atual = el.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');
    const novo = atual === 'escuro' ? 'claro' : 'escuro';
    el.dataset.theme = novo;
    document.cookie = `tema=${novo}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <button className="tema-btn" onClick={alternar} aria-label="Alternar modo claro e escuro" title="Modo claro/escuro">
      <span><Icone nome="sol" tam={15} cor="#1a6fe0" /></span>
    </button>
  );
}
