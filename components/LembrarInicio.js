'use client';
import { useEffect } from 'react';

// Guarda no aparelho qual é a tela inicial desta pessoa (Painel ou Hoje),
// para o app abrir direto nela da próxima vez.
export default function LembrarInicio({ caminho }) {
  useEffect(() => {
    if (!document.cookie.split('; ').includes(`inicio=${caminho}`)) {
      document.cookie = `inicio=${caminho}; path=/; max-age=31536000; samesite=lax; secure`;
    }
  }, [caminho]);
  return null;
}
