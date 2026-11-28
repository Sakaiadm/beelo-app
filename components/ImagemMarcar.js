'use client';
// @arquivo  ImagemMarcar.js: tela cheia para ampliar a imagem de um relato e desenhar nela com o lápis (vermelho).
// @tipo     componente
// @usa      ./Icone
// @usado-por components/RelatosPainel.js
// @decisao  27/11 Thomas: lápis para marcar na imagem; o prompt precisa entender ONDE foram as marcações. Traços próximos viram uma "marcação" numerada (o número é desenhado na imagem) e cada uma é descrita em palavras (topo/meio/base, esquerda/centro/direita) com porcentagens.
// @cuidado  a imagem vem do Supabase com crossOrigin; se o navegador não deixar exportar (canvas "sujo"), a descrição em palavras continua valendo e só o "Baixar imagem marcada" fica de fora.
import { useEffect, useRef, useState } from 'react';
import Icone from './Icone';

const COR = '#e5302a';
const pct = (v) => Math.round(v * 100);
const terco = (v, nomes) => nomes[v < 1 / 3 ? 0 : v < 2 / 3 ? 1 : 2];

// Junta traços que se tocam (ou estão a menos de 6% um do outro) numa mesma marcação.
export function agrupar(tracos) {
  const caixa = (t) => t.reduce((c, [x, y]) => ({ x0: Math.min(c.x0, x), y0: Math.min(c.y0, y), x1: Math.max(c.x1, x), y1: Math.max(c.y1, y) }), { x0: 1, y0: 1, x1: 0, y1: 0 });
  const perto = (a, b) => a.x0 - 0.06 <= b.x1 && b.x0 - 0.06 <= a.x1 && a.y0 - 0.06 <= b.y1 && b.y0 - 0.06 <= a.y1;
  let grupos = tracos.map((t) => caixa(t));
  for (let mudou = true; mudou;) {
    mudou = false;
    for (let i = 0; i < grupos.length && !mudou; i++) for (let j = i + 1; j < grupos.length && !mudou; j++) {
      if (perto(grupos[i], grupos[j])) {
        const a = grupos[i], b = grupos[j];
        grupos = grupos.filter((_, k) => k !== i && k !== j).concat({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });
        mudou = true;
      }
    }
  }
  // Ordem de leitura: de cima para baixo, da esquerda para a direita.
  return grupos.sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2 || a.x0 - b.x0);
}

// Texto de cada marcação para o prompt.
export function descrever(grupos) {
  return grupos.map((g, i) => {
    const cx = (g.x0 + g.x1) / 2, cy = (g.y0 + g.y1) / 2;
    const lugar = `${terco(cy, ['parte de cima', 'meio', 'parte de baixo'])}, ${terco(cx, ['lado esquerdo', 'centro', 'lado direito'])}`;
    return `Marcação ${i + 1}: ${lugar} da imagem (de ${pct(g.x0)}% a ${pct(g.x1)}% da largura e de ${pct(g.y0)}% a ${pct(g.y1)}% da altura, contando do canto de cima à esquerda)`;
  });
}

export default function ImagemMarcar({ src, tracosIniciais = [], aoPronto, fechar }) {
  const tela = useRef(null), base = useRef(null), desenhando = useRef(null);
  const [tracos, setTracos] = useState(tracosIniciais);
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro
  const [sair, setSair] = useState(false); // pergunta ao voltar com marcação ainda não salva

  function pintar(lista, comNumeros) {
    const c = tela.current, img = base.current;
    if (!c || !img) return;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, c.width, c.height);
    g.strokeStyle = COR; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(4, c.width / 140);
    for (const t of lista) {
      g.beginPath();
      t.forEach(([x, y], i) => (i ? g.lineTo(x * c.width, y * c.height) : g.moveTo(x * c.width, y * c.height)));
      if (t.length === 1) g.lineTo(t[0][0] * c.width + 0.1, t[0][1] * c.height);
      g.stroke();
    }
    if (comNumeros) {
      const r = Math.max(11, c.width / 34);
      agrupar(lista).forEach((gr, i) => {
        const x = Math.min(Math.max(gr.x0 * c.width, r), c.width - r), y = Math.min(Math.max(gr.y0 * c.height - r, r), c.height - r);
        g.fillStyle = COR; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.font = `800 ${r * 1.2}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), x, y + 1);
      });
    }
  }

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      base.current = img;
      const c = tela.current;
      const larg = Math.min(560, innerWidth - 28);
      c.width = Math.round(larg * 2); c.height = Math.round(larg * 2 * (img.naturalHeight / img.naturalWidth));
      c.style.width = '100%'; c.style.aspectRatio = `${c.width} / ${c.height}`;
      setEstado('ok');
    };
    img.onerror = () => setEstado('erro');
    img.src = src;
  }, [src]);
  useEffect(() => { if (estado === 'ok') pintar(tracos, false); }, [estado, tracos]);

  const ponto = (e) => { const r = tela.current.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  const comeca = (e) => { e.preventDefault(); tela.current.setPointerCapture?.(e.pointerId); desenhando.current = [ponto(e)]; setTracos((t) => [...t, desenhando.current]); };
  const move = (e) => { if (!desenhando.current) return; desenhando.current.push(ponto(e)); pintar([...tracos.slice(0, -1), desenhando.current], false); };
  const termina = () => { if (!desenhando.current) return; desenhando.current = null; setTracos((t) => [...t]); };

  function pronto() {
    const grupos = agrupar(tracos);
    let url = null;
    if (tracos.length) {
      try { pintar(tracos, true); url = tela.current.toDataURL('image/jpeg', 0.85); } catch { url = null; }
    }
    aoPronto({ tracos, descricao: descrever(grupos), url });
  }

  return (
    <div className="folha" style={{ zIndex: 70 }} role="dialog" aria-modal="true" aria-label="Marcar na imagem">
      <div className="folha-in">
        <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => (tracos.length && JSON.stringify(tracos) !== JSON.stringify(tracosIniciais) ? setSair(true) : fechar())}><Icone nome="esq" tam={26} /></button><h2>Marcar na imagem</h2></div>
        <p className="peq-cinza" style={{ margin: 0 }}>Desenhe com o dedo onde está o problema. Cada risco perto do outro vira uma marcação numerada.</p>
        {estado === 'erro' && <div className="aviso erro" role="alert">Não foi possível carregar a imagem. Feche e tente de novo.</div>}
        <canvas ref={tela} style={{ width: '100%', borderRadius: 12, border: '1px solid var(--borda)', touchAction: 'none', background: 'var(--cartao)', display: estado === 'ok' ? 'block' : 'none' }}
          onPointerDown={comeca} onPointerMove={move} onPointerUp={termina} onPointerCancel={termina} aria-label="Imagem do relato para desenhar" />
        {sair && (
          <div className="aviso info" role="alertdialog" aria-label="Sair sem salvar?">
            Você desenhou, mas ainda não salvou a marcação.
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" className="btn peq" style={{ flex: 1 }} onClick={pronto}>Salvar e voltar</button>
              <button type="button" className="btn sec peq" style={{ flex: 1 }} onClick={fechar}>Descartar</button>
            </div>
          </div>
        )}
        {/* Barra fixa embaixo: com a imagem alta (print de celular) os botões ficavam fora da tela e a pessoa não via Desfazer nem Salvar (Thomas 28/11). */}
        {estado === 'ok' && (
          <div style={{ position: 'sticky', bottom: 0, background: 'var(--fundo)', padding: '10px 0 calc(10px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--borda)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sec peq" style={{ flex: 1 }} disabled={!tracos.length} onClick={() => setTracos((t) => t.slice(0, -1))}><Icone nome="esq" tam={18} />Desfazer</button>
              <button type="button" className="btn sec peq" style={{ flex: 1 }} disabled={!tracos.length} onClick={() => setTracos([])}>Limpar tudo</button>
            </div>
            <button type="button" className="btn bloco" onClick={pronto}><Icone nome="check" tam={18} cor="#fff" />{tracos.length ? `Salvar ${agrupar(tracos).length} ${agrupar(tracos).length === 1 ? 'marcação' : 'marcações'}` : 'Voltar sem marcar'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
