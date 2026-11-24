'use client';
import { useEffect } from 'react';

// Tocar em qualquer ponto da linha liga ou desliga a chave dela (Raio-X U77). Vale para o app todo.
export default function ChaveLinha() {
  useEffect(() => {
    const toque = (e) => {
      const linha = e.target.closest?.('.lin-chave');
      if (!linha || e.target.closest('button, a, input, select, textarea, label')) return;
      const chave = linha.querySelector('button.chave, [role=switch]');
      if (chave && !chave.disabled) chave.click();
    };
    document.addEventListener('click', toque);
    return () => document.removeEventListener('click', toque);
  }, []);
  return null;
}
