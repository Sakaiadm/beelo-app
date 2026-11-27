'use client';
// @arquivo  AvisoTela.js: aviso amarelo curto no começo da tela Tempo de tela, com X para dispensar.
// @tipo     componente
// @usa      ./Icone
// @usado-por app/(app)/tela/page.js
import { useEffect, useState } from 'react';
import Icone from './Icone';

// Explica que o tempo de tela lançado vira uma tarefa na rotina. Depois de dispensado não volta (guardado no aparelho).
// @cuidado começa escondido e só aparece depois de conferir o aparelho, para não piscar na tela.
const CHAVE = 'ra_aviso_tela_v1';
export default function AvisoTela() {
  const [ver, setVer] = useState(false);
  useEffect(() => { try { setVer(localStorage.getItem(CHAVE) == null); } catch { setVer(true); } }, []);
  if (!ver) return null;
  const fechar = () => { setVer(false); try { localStorage.setItem(CHAVE, '0'); } catch {} };
  return (
    <div className="aviso info dica" role="status">
      <span className="dica-ic"><Icone nome="ideia" tam={20} /></span>
      <span className="dica-tx">O tempo de tela lançado vira uma <b>tarefa na rotina</b>, e o que passar do previsto aparece nos relatórios.</span>
      <button type="button" className="dica-x" aria-label="Dispensar o aviso" onClick={fechar}><Icone nome="x" tam={18} /></button>
    </div>
  );
}
