'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

let atualizou = false;

// Guarda no aparelho qual é a tela inicial desta pessoa (Painel ou Hoje) e quem está usando,
// para o app abrir direto nela da próxima vez, mostrando na hora a última versão guardada.
// Se a tela veio dessa cópia guardada, busca os dados novos logo em seguida, sem piscar.
export default function LembrarInicio({ caminho, quem, gerado }) {
  const router = useRouter();
  useEffect(() => {
    const ano = 'path=/; max-age=31536000; samesite=lax; secure';
    const tem = document.cookie.split('; ');
    if (!tem.includes(`inicio=${caminho}`)) document.cookie = `inicio=${caminho}; ${ano}`;
    if (!tem.includes(`ra_u=${quem}`)) document.cookie = `ra_u=${quem}; ${ano}`;
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, [caminho, quem]);
  useEffect(() => {
    if (!atualizou && Date.now() - gerado > 10000) {
      atualizou = true;
      router.refresh();
    }
  }, [gerado, router]);
  return null;
}
