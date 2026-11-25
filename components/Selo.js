'use client';
// @arquivo  Selo.js: número de avisos não lidos no ícone do app instalado.
// @tipo     componente
// @usado-por app/(app)/layout.js
import { useEffect } from 'react';

// Número de avisos não lidos no ícone do app (só aparece quando o app está instalado na tela inicial).
export default function Selo({ n }) {
  useEffect(() => {
    try {
      if (!('setAppBadge' in navigator)) return;
      if (n > 0) navigator.setAppBadge(n).catch(() => {}); else navigator.clearAppBadge().catch(() => {});
    } catch { /* aparelho sem suporte */ }
  }, [n]);
  return null;
}
