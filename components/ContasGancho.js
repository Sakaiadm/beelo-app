'use client';
// @arquivo  ContasGancho.js: fica em toda tela com login; guarda a conta nova (quando o administrador está adicionando), renova a guardada e mostra a faixa "Agora você está como ...".
// @tipo     componente
// @usa      lib/contas
// @usado-por app/(app)/layout.js
// @cuidado  não faz nada para quem nunca guardou contas neste aparelho (famílias comuns não veem nada).
import { useEffect, useState } from 'react';
import { estaAdicionando, marcarAdicionando, guardarAtual, renovarAtual, lerAviso } from '@/lib/contas';

export default function ContasGancho({ eu }) {
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    (async () => {
      if (estaAdicionando()) {
        marcarAdicionando(false);
        const ok = await guardarAtual(eu);
        setAviso(ok ? `${eu.nome} foi guardada. Toque 2 vezes no ícone para alternar.` : 'Já há 3 contas guardadas. Remova uma em Cadastros.');
      } else {
        await renovarAtual(eu.id);
        const n = lerAviso();
        if (n) setAviso(`Agora você está como ${n.split(' ')[0]} · toque 2 vezes no ícone para trocar`);
      }
    })();
  }, [eu.id]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(null), 3500); return () => clearTimeout(t); }, [aviso]);
  if (!aviso) return null;
  return <div className="aviso ok" role="status" style={{ margin: '10px 16px 0', padding: '8px 14px' }}>{aviso}</div>;
}
