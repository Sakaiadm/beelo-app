'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icone from './Icone';
import { dicaDeHoje, fechar, marcarVista } from '@/lib/dicasMotor';

// Ideia do dia flutuante (L1 + balões B1 e B2): bolinha amarela com lâmpada no canto direito,
// acima do menu de baixo. Ao tocar, o cartão compacto (B1, com pontinha) se abre saindo de dentro
// da lâmpada (B2) e volta para ela ao fechar. O X do cartão (ou tocar na lâmpada de novo) fecha;
// o xizinho da bolinha esconde a ideia de hoje.
// Usa o mesmo motor das dicas (lib/dicasMotor.js): tudo fica no aparelho, sem banco.

// Mola de verdade convertida em curva CSS linear() (mesma técnica da prévia).
function mola(k, c) {
  let x = 0, v = 0; const dt = 1 / 240, s = [0];
  for (let t = 0; t < 3; t += dt) { const a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; s.push(x); if (Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.02) break; }
  const N = 48, p = []; for (let i = 0; i <= N; i++) p.push(+s[Math.round((i / N) * (s.length - 1))].toFixed(4));
  p[0] = 0; p[N] = 1;
  const sup = typeof CSS !== 'undefined' && CSS.supports?.('animation-timing-function', 'linear(0, 0.5, 1)');
  return { e: sup ? `linear(${p.join(',')})` : 'cubic-bezier(.34,1.5,.64,1)', d: Math.round(s.length * dt * 1000) };
}
let MOLAS = null;
const molas = () => (MOLAS ||= { pop: mola(420, 17), suave: mola(260, 30) });
const calmo = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function an(el, frames, o = {}) {
  if (!el?.animate) return Promise.resolve();
  let d = o.m ? o.m.d : o.d ?? 300, e = o.m ? o.m.e : o.e || 'cubic-bezier(.22,1,.36,1)', delay = o.delay || 0;
  if (calmo()) { d = Math.min(d, 160); e = 'ease-out'; delay = 0; }
  return el.animate(frames, { duration: d, easing: e, delay, fill: 'both' }).finished.catch(() => {});
}
// Centro da lâmpada, que fica logo abaixo do cartão: o cartão nasce de dentro dela.
const CENTRO = 'calc(100% - 33px) calc(100% + 41px)';

export default function LampadaFlutuante({ membro, cands, hoje }) {
  const [dica, setDica] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [lida, setLida] = useState(false);
  const bola = useRef(null), bal = useRef(null), ocupado = useRef(false);

  useEffect(() => { setDica(dicaDeHoje(membro, cands, hoje)); }, [membro, hoje]); // eslint-disable-line react-hooks/exhaustive-deps

  // A bolinha chega com um pulinho.
  useEffect(() => {
    if (!dica || !bola.current) return;
    if (calmo()) an(bola.current, [{ opacity: 0 }, { opacity: 1 }], { d: 160 });
    else an(bola.current, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { m: molas().pop, delay: 350 });
  }, [dica]);

  // Abre: a lâmpada cresce e vira o cartão.
  useEffect(() => {
    const b = bal.current;
    if (!aberto || !b) return;
    const r = b.getBoundingClientRect(), raio = Math.ceil(Math.hypot(r.width, r.height));
    if (calmo()) an(b, [{ opacity: 0 }, { opacity: 1 }], { d: 160 });
    else {
      an(b, [{ clipPath: `circle(29px at ${CENTRO})` }, { clipPath: `circle(${raio + 60}px at ${CENTRO})` }], { m: molas().suave });
      [...b.querySelectorAll('.lamp-anima')].forEach((x, i) => an(x, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { d: 320, delay: 110 + i * 40 }));
      an(bola.current?.querySelector('svg'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { d: 600, delay: 60, e: 'ease-in-out' });
    }
    b.querySelector('.lamp-fechar')?.focus({ preventScroll: true });
    const esc = (ev) => { if (ev.key === 'Escape') recolher(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!dica) return null;

  const abrir = () => {
    if (ocupado.current) return;
    if (aberto) { recolher(); return; }
    if (!lida) { marcarVista(membro, dica.i, hoje); setLida(true); }
    setAberto(true);
  };
  async function recolher() {
    const b = bal.current;
    if (!b || ocupado.current) return;
    ocupado.current = true;
    if (calmo()) await an(b, [{ opacity: 1 }, { opacity: 0 }], { d: 140 });
    else {
      const r = b.getBoundingClientRect(), raio = Math.ceil(Math.hypot(r.width, r.height));
      b.querySelectorAll('.lamp-anima').forEach((x) => an(x, [{ opacity: 1 }, { opacity: 0 }], { d: 120 }));
      await an(b, [{ clipPath: `circle(${raio + 60}px at ${CENTRO})` }, { clipPath: `circle(29px at ${CENTRO})` }], { d: 300, e: 'cubic-bezier(.5,0,.75,0)' });
    }
    setAberto(false);
    ocupado.current = false;
    requestAnimationFrame(() => { bola.current?.focus({ preventScroll: true }); if (!calmo()) an(bola.current, [{ transform: 'scale(.85)' }, { transform: 'scale(1)' }], { m: molas().pop }); });
  }
  const esconder = async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    if (!lida) fechar(membro, hoje);
    await an(bola.current?.parentElement, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.3)', opacity: 0 }], { d: 200, e: 'cubic-bezier(.55,0,.75,.2)' });
    setDica(null);
  };

  return (
    <>
      <div className="lamp-espaco" aria-hidden="true" />
      {aberto && (
        <div className="lamp-balao" ref={bal} role="dialog" aria-label="Ideia do dia">
          <span className="lamp-ponta" aria-hidden="true" />
          <div className="lamp-eb lamp-anima"><i><Icone nome="ideia" tam={14} larg={2.2} /></i>Ideia do dia</div>
          <b className="lamp-t lamp-anima">{dica.t}</b>
          {dica.x && <p className="lamp-anima">{dica.x}</p>}
          <div className="lamp-ac lamp-anima"><Link prefetch={false} className="btn peq" href={`/ideias?i=${dica.i}`}>Ver ideia</Link></div>
          <button type="button" className="lamp-fechar lamp-anima" onClick={recolher} aria-label="Fechar"><Icone nome="x" tam={16} larg={2.4} /></button>
        </div>
      )}
      <div className="lamp-fixa">
        <button type="button" ref={bola} className="lamp-bola" onClick={abrir} aria-expanded={aberto} aria-label={aberto ? 'Fechar a ideia do dia' : lida ? 'Abrir a ideia do dia' : 'Abrir a ideia do dia, 1 nova'}>
          <Icone nome="ideia" tam={30} cor="#13203a" larg={2.2} />
          {!lida && <span className="lamp-num" aria-hidden="true">1</span>}
        </button>
        {!aberto && <button type="button" className="lamp-x" onClick={esconder} aria-label="Esconder a ideia do dia"><Icone nome="x" tam={13} larg={2.8} /></button>}
      </div>
    </>
  );
}
