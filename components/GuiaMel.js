'use client';
// @arquivo  components/GuiaMel.js: o balão do Guia da Mel (uma dica curta por vez, nunca bloqueia nada).
// @tipo     componente
// @usa      lib/guia.js (dicas e regras), lib/festaAnim.js (desenho da abelha Mel)
// @usado-por app/(app)/layout.js (só quando o grupo está com o Guia da Mel ligado)
// @cuidado  Não aparece enquanto a pessoa digita nem em cima de outra janela. Respeita "reduzir movimento".
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Icone from './Icone';
import { abelhaMel } from '@/lib/festaAnim';
import { escolher, lerGuia, gravarGuia, registrar, textoDe } from '@/lib/guia';

// ═══ SEÇÃO: Balão ═══════════════════════════════════════════════════════════
// publico: gestor | adolescente | crianca.  jeito: divertido | calmo | adultos.
// @decisao 25/11 Thomas: gestor e Divertido veem a Mel; Calmo vê a Mel pequena; 13+ só vê o ponto amarelo.
export default function GuiaMel({ membro, publico, jeito, familiaId, pessoas, tarefas }) {
  const caminho = usePathname();
  const [dica, setDica] = useState(null);
  const melRef = useRef(null);

  // Procura a dica da tela atual (espera um instante para a tela assentar e não chega em cima de quem digita).
  useEffect(() => {
    setDica(null);
    let vivo = true;
    const procurar = () => {
      if (!vivo) return;
      const ativo = document.activeElement;
      if (ativo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ativo.tagName)) return;
      if (document.querySelector('.folha, .lamp-balao, [role="dialog"]:not(.guia-balao)')) return;
      const est = lerGuia(membro);
      if (caminho === '/ideias' && !est.ideia) { est.ideia = true; gravarGuia(membro, est); }
      let avisosOn = false;
      try { avisosOn = 'Notification' in window && Notification.permission === 'granted'; } catch { /* sem suporte */ }
      const d = escolher({ publico, pathname: caminho, fatos: { pessoas, tarefas, familiaId }, est: { ...est, avisosOn } });
      if (!d) return;
      if (d.marca && !est[d.marca]) { est[d.marca] = true; gravarGuia(membro, est); }
      setDica(d);
    };
    const t = setTimeout(procurar, 900);
    return () => { vivo = false; clearTimeout(t); };
  }, [caminho, membro, publico, pessoas, tarefas, familiaId]);

  // Destaca o botão que a Mel está apontando (ex.: Sugestões) e tira o destaque ao fechar.
  useEffect(() => {
    if (!dica?.destaque) return undefined;
    const els = [...document.querySelectorAll(dica.destaque)];
    els.forEach((el) => el.classList.add('guia-destaque'));
    return () => els.forEach((el) => el.classList.remove('guia-destaque'));
  }, [dica]);

  if (!dica) return null;
  const fechar = (pulou) => { registrar(membro, dica, pulou); setDica(null); };
  const acao = dica.acao ? dica.acao({ pessoas, tarefas, familiaId }) : null;
  const comMel = publico === 'gestor' || (publico === 'crianca' && jeito !== 'adultos');
  const tam = publico === 'crianca' ? (jeito === 'calmo' ? 34 : 76) : 52;
  const grande = comMel && tam > 60;
  const pontinho = publico === 'adolescente';
  return (
    <div className={`guia-balao ${grande ? 'grande' : ''} ${comMel ? 'com-mel' : ''} ${comMel && tam < 40 ? 'peq' : ''} ${dica.topo ? 'no-topo' : ''}`} role="status" aria-live="polite" data-guia={dica.k}>
      <div className="guia-eb">{pontinho && <i className="guia-ponto" aria-hidden="true" />}<b>{dica.t}</b></div>
      <p>{textoDe(dica, jeito)}</p>
      <div className="guia-pe">
        <button type="button" className="link-btn guia-pular" onClick={() => fechar(true)}>Pular</button>
        {acao && <Link prefetch={false} className="btn peq" href={acao.href} onClick={() => fechar(false)}>{acao.txt}</Link>}
        {!acao && dica.clicar && <button type="button" className="btn peq" onClick={() => { document.querySelector(dica.clicar)?.click(); fechar(false); }}>{dica.clicarTxt}</button>}
        {!acao && !dica.clicar && <button type="button" className="btn peq" onClick={() => fechar(false)}>Entendi</button>}
      </div>
      <button type="button" className="guia-x" aria-label="Fechar a dica" onClick={() => fechar(true)}><Icone nome="x" tam={16} larg={2.4} /></button>
      {comMel && <span ref={melRef} className="guia-mel" style={{ width: tam, height: tam }} dangerouslySetInnerHTML={{ __html: abelhaMel(tam) }} />}
    </div>
  );
}
