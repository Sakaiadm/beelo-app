'use client';
// @arquivo  components/GuiaAjuda.js: cartão "Guia da Mel" na Ajuda (o livro do topo): ativar/desativar dicas, recomeçar, rever os primeiros passos.
// @tipo     componente
// @usa      lib/guia.js (estado no aparelho)
// @usado-por app/(app)/ajuda/page.js (só com o Guia da Mel ligado no grupo)
// @decisao 25/11 Thomas: "Dicas da Mel" só aqui, sem interruptor no perfil. Vale para este aparelho.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from './Icone';
import { lerGuia, gravarGuia, recomecarGuia } from '@/lib/guia';

export default function GuiaAjuda({ membro, gestor }) {
  const [on, setOn] = useState(true);
  const [msg, setMsg] = useState('');
  useEffect(() => { setOn(!lerGuia(membro).off); }, [membro]);
  const mudar = () => { const e = lerGuia(membro); e.off = on; gravarGuia(membro, e); setOn(!on); };
  const recomecar = () => { recomecarGuia(membro); setOn(true); setMsg('Pronto. As dicas vão aparecer de novo, uma por vez.'); };
  const rever = () => { const e = lerGuia(membro); e.favoX = false; e.favoFim = false; gravarGuia(membro, e); };
  return (
    <div className="card guia-ajuda">
      <h2>Guia da Mel <span className="selo-beta">beta</span></h2>
      <p className="sub" style={{ margin: '0 0 6px', fontSize: 'var(--f-apoio)' }}>A Mel dá dicas curtas, uma por vez, e some quando você pega o jeito.</p>
      {gestor && <Link prefetch={false} href="/painel" onClick={rever} className="linha-ir"><Icone nome="check" tam={20} /><span>Meus primeiros passos<small>Ver o cartão de começo de novo</small></span><Icone nome="dir" tam={20} /></Link>}
      <button type="button" className="linha-ir guia-linha" onClick={recomecar}><Icone nome="ideia" tam={20} /><span>Recomeçar o guia<small>Rever as dicas desde o começo</small></span></button>
      <div className="lin-chave">
        <span>Dicas da Mel<small>Ative ou desative. Vale para este aparelho.</small></span>
        <button type="button" role="switch" aria-checked={on} aria-label="Dicas da Mel" className={`chave ${on ? 'on' : ''}`} onClick={mudar} />
      </div>
      {msg && <p className="aviso ok" role="status" style={{ margin: '8px 0 0' }}>{msg}</p>}
    </div>
  );
}
