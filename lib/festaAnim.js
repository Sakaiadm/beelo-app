// Animações de comemoração aprovadas pelo Thomas em 25/11/2026 (prévia final com a abelha Mel e o selo Favo com faixa).
// Tudo acontece numa camada própria por cima da tela (.fz-palco), sem mexer no que o React desenha.
// Molas físicas viram curvas CSS linear(); partículas (favinhos, gotas, brilhos, fitas) num canvas.
// "Reduzir movimento" do aparelho: sem voos nem partículas, só o estado final com um esmaecer curto.
import { tocarSom, prepararSom } from './festa';

/* ---------- Motor ---------- */
export const calmo = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let SUP = null;
const sup = () => (SUP ??= typeof CSS !== 'undefined' && !!CSS.supports?.('animation-timing-function', 'linear(0, 0.5, 1)'));
function mola(k, c) {
  let x = 0, v = 0; const dt = 1 / 240, s = [0];
  for (let t = 0; t < 3; t += dt) { const a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; s.push(x); if (Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.02) break; }
  const N = 56, p = []; for (let i = 0; i <= N; i++) p.push(+s[Math.round((i / N) * (s.length - 1))].toFixed(4)); p[0] = 0; p[N] = 1;
  return { e: sup() ? `linear(${p.join(',')})` : 'cubic-bezier(.34,1.5,.64,1)', d: Math.round(s.length * dt * 1000) };
}
let MM = null;
const M = () => (MM ||= { pop: mola(420, 17), suave: mola(260, 30), boing: mola(320, 11) });
const EO = 'cubic-bezier(.22,1,.36,1)', EI = 'cubic-bezier(.55,0,.75,.2)', EIO = 'cubic-bezier(.65,0,.35,1)';
function an(el, frames, o = {}) {
  if (!el?.animate) return Promise.resolve();
  let d = o.m ? o.m.d : o.d ?? 300, e = o.m ? o.m.e : o.e || EO, delay = o.delay || 0;
  if (calmo()) { d = Math.min(d, 180); e = 'ease-out'; delay = Math.min(delay, 80); }
  return el.animate(frames, { duration: d, easing: e, delay, fill: 'both', iterations: o.it || 1 }).finished.catch(() => {});
}
const espera = (ms) => new Promise((r) => setTimeout(r, calmo() ? Math.min(ms, 120) : ms));
const centro = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; };
function voar(el, pts, o = {}) {
  const [p0, p1, p2, p3] = pts, N = 30, fr = [];
  const ease = (t) => (o.ease === 'out' ? 1 - Math.pow(1 - t, 3) : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const B = (t, k) => { const u = 1 - t; return u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]; };
  let px = p0[0];
  for (let i = 0; i <= N; i++) {
    const t = ease(i / N), x = B(t, 0), y = B(t, 1) + (o.bob ? Math.sin((i / N) * Math.PI * o.bob) * 5 : 0);
    const inc = o.inclina ? Math.max(-22, Math.min(22, (x - px) * 1.6)) : 0; px = x;
    const s = o.escala ? o.escala[0] + (o.escala[1] - o.escala[0]) * t : 1;
    fr.push({ transform: `translate(${x}px, ${y}px) rotate(${inc + (o.giro ? o.giro * t : 0)}deg) scale(${s})`, opacity: o.some && i > N - 4 ? (N - i) / 4 : 1 });
  }
  return an(el, fr, { d: o.d || 800, e: 'linear', delay: o.delay || 0 });
}
function contar(el, de, ate, d = 700, fmt = (v) => v) {
  return new Promise((res) => {
    if (calmo()) { el.textContent = fmt(ate); return res(); }
    const t0 = performance.now();
    const f = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(de + (ate - de) * e)); k < 1 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  });
}

/* ---------- Partículas ---------- */
class Fx {
  constructor(cv) { this.cv = cv; this.c = cv.getContext('2d'); this.p = []; this.on = false; }
  medir() { const d = Math.min(2, devicePixelRatio || 1); this.w = innerWidth; this.h = innerHeight; this.cv.width = this.w * d; this.cv.height = this.h * d; this.c.setTransform(d, 0, 0, d, 0, 0); }
  add(list) { if (calmo()) return; this.p.push(...list); if (!this.on) { this.on = true; this.t = performance.now(); requestAnimationFrame((t) => this.passo(t)); } }
  passo(t) {
    const dt = Math.min(0.034, (t - this.t) / 1000); this.t = t; const c = this.c; c.clearRect(0, 0, this.w, this.h);
    this.p = this.p.filter((p) => {
      if (p.atraso > 0) { p.atraso -= dt; return true; }
      p.age += dt; if (p.age > p.vida) return false;
      const dr = Math.pow(p.drag, dt * 60); p.vx *= dr; p.vy = p.vy * dr + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      desenha(c, p); return true;
    });
    if (this.p.length) requestAnimationFrame((tt) => this.passo(tt)); else { this.on = false; c.clearRect(0, 0, this.w, this.h); }
  }
}
function hexPath(c, r) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }
function desenha(c, p) {
  const k = p.age / p.vida, al = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35; c.save(); c.translate(p.x, p.y); c.globalAlpha = Math.max(0, al) * (p.a ?? 1);
  if (p.t === 'hex') {
    c.rotate(p.rot); c.scale(Math.cos(p.age * p.vf + p.f0), 1); hexPath(c, p.s); c.fillStyle = p.cor; c.fill();
    hexPath(c, p.s * 0.45); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
  } else if (p.t === 'gota') {
    c.rotate(Math.atan2(p.vy, p.vx) - Math.PI / 2); const s = p.s;
    c.beginPath(); c.moveTo(0, -s * 1.5); c.bezierCurveTo(s * 0.9, -s * 0.3, s, s * 0.9, 0, s); c.bezierCurveTo(-s, s * 0.9, -s * 0.9, -s * 0.3, 0, -s * 1.5); c.fillStyle = p.cor; c.fill();
    c.beginPath(); c.arc(-s * 0.3, s * 0.1, s * 0.25, 0, 7); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
  } else if (p.t === 'brilho') {
    const s = p.s * Math.sin(Math.PI * Math.min(1, k * 1.1)); c.rotate(p.rot);
    c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(0, 0, s, 0); c.quadraticCurveTo(0, 0, 0, s); c.quadraticCurveTo(0, 0, -s, 0); c.quadraticCurveTo(0, 0, 0, -s); c.fillStyle = p.cor; c.fill();
  } else if (p.t === 'anel') {
    const e = 1 - Math.pow(1 - k, 3), r = p.r0 + (p.r1 - p.r0) * e; c.globalAlpha = (1 - k) * (p.a ?? 1);
    if (p.hex) hexPath(c, r); else { c.beginPath(); c.arc(0, 0, r, 0, 7); }
    c.lineWidth = (p.lw || 2.5) * (1 - k) + 0.4; c.strokeStyle = p.cor; c.stroke();
  } else if (p.t === 'fita') {
    c.rotate(p.rot); const w = Math.sin(p.age * p.vf + p.f0); c.beginPath(); c.moveTo(-p.s, 0); c.bezierCurveTo(-p.s / 3, -p.s * 0.9 * w, p.s / 3, p.s * 0.9 * w, p.s, 0);
    c.lineWidth = 3.2; c.lineCap = 'round'; c.strokeStyle = p.cor; c.stroke();
  } else { c.beginPath(); c.arc(0, 0, p.s, 0, 7); c.fillStyle = p.cor; c.fill(); }
  c.restore();
}
const R = (a, b) => a + Math.random() * (b - a);
const pega = (a) => a[Math.floor(Math.random() * a.length)];
const CORES = ['#F5B82E', '#ffd35c', '#1a6fe0', '#5b9bff', '#ffffff', '#ff9aa2'];
function explode(x, y, o = {}) {
  const l = [], n = o.n ?? 24, tipos = o.tipos || ['hex', 'brilho', 'polen', 'gota'];
  for (let i = 0; i < n; i++) {
    const t = tipos[i % tipos.length], ang = (o.ang ?? -Math.PI / 2) + R(-1, 1) * (o.abre ?? Math.PI), v = R(o.v0 ?? 120, o.v1 ?? 320);
    l.push({ t, x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, g: t === 'brilho' ? 0 : o.g ?? 520, drag: t === 'brilho' ? 0.9 : o.drag ?? 0.955, rot: R(0, 6), vr: R(-8, 8), vf: R(6, 14), f0: R(0, 6),
      s: t === 'hex' ? R(4, 7.5) : t === 'brilho' ? R(5, 9) : t === 'gota' ? R(3, 4.5) : t === 'fita' ? R(7, 11) : R(1.6, 3),
      cor: t === 'gota' ? pega(['#F5B82E', '#f2a817', '#ffcf4a']) : t === 'brilho' ? pega(['#ffffff', '#fff3c8', '#F5B82E']) : pega(CORES),
      vida: R(o.vida0 ?? 0.8, o.vida1 ?? 1.4), age: 0, atraso: (o.atraso || 0) + (o.escalona ? i * o.escalona : 0) });
  }
  if (o.anel) l.push({ t: 'anel', x, y, vx: 0, vy: 0, g: 0, drag: 1, rot: 0, vr: 0, r0: o.anel[0], r1: o.anel[1], cor: o.anelCor || '#F5B82E', vida: 0.55, age: 0, lw: o.anelLw, hex: o.anelHex, a: o.anelA, atraso: o.atraso || 0 });
  fx?.add(l);
}
const canhao = (x, y, ang, o = {}) => explode(x, y, { n: 26, ang, abre: 0.35, v0: 380, v1: 620, g: 620, drag: 0.965, tipos: ['hex', 'fita', 'brilho', 'polen', 'hex', 'gota'], vida0: 1.4, vida1: 2.2, escalona: 0.012, ...o });

/* ---------- Camada da festa ---------- */
let palco = null, fx = null;
function getPalco() {
  if (!palco || !palco.isConnected) {
    palco = document.createElement('div'); palco.className = 'fz-palco';
    palco.innerHTML = '<canvas class="fz-fx" aria-hidden="true"></canvas>';
    document.body.appendChild(palco); fx = new Fx(palco.querySelector('canvas'));
  }
  fx.medir(); return palco;
}
function camada(cls, html) {
  const P = getPalco(), el = document.createElement('div'); el.className = cls; el.innerHTML = html;
  P.insertBefore(el, P.querySelector('canvas')); return el;
}

/* ---------- Desenhos: hexágono, logo, abelha Mel, selo Favo com faixa ---------- */
let uid = 0;
export const HEXP = (cx, cy, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 2; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2); } return d + 'Z'; };
const ESTRELA = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
const estrelaSVG = (t) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ESTRELA}" fill="#F5B82E" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const logoDesenha = (t = 20, cor = '#F5B82E') => `<svg width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true" style="overflow:visible;flex:none"><path class="fz-sh" d="${HEXP(12, 12, 10.5)}" fill="none" stroke="${cor}" stroke-width="2.2" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><path class="fz-sc" d="m8 12.3 2.8 2.8 5-5.6" fill="none" stroke="${cor}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`;

function asasVeias(u, lado, d1, d2, v) {
  return `<g class="asa ${lado}"><path d="${d1}" fill="url(#${u}w)" stroke="#a9cbf5" stroke-width="1.6"/><path d="${d2}" fill="url(#${u}w)" stroke="#a9cbf5" stroke-width="1.4" opacity=".9"/><path d="${v}" fill="none" stroke="#b7d3f6" stroke-width="1.1" stroke-linecap="round"/></g>`;
}
const espelha = (d) => d.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g, (m, x, y) => `${(140 - +x).toFixed(1)} ${y}`);
// Mel (AB1): a mascote do beelo.
export function abelhaMel(t = 90, extra = '', attrs = '') {
  const u = 'fzb' + ++uid;
  const aE1 = 'M60 52 C42 12 2 8 3 32 C4 52 34 60 58 58 Z', aE2 = 'M58 62 C40 62 24 72 30 82 C36 90 52 76 60 66 Z', vE = 'M56 54 C44 42 28 34 18 34 M54 56 C40 52 26 50 16 44 M56 64 C46 68 38 74 34 80';
  return `<svg class="fz-bee ${extra}" ${attrs} width="${t}" height="${t}" viewBox="0 0 140 140" aria-hidden="true"><defs>
  <radialGradient id="${u}c" cx="40%" cy="30%" r="78%"><stop offset="0" stop-color="#fff2c2"/><stop offset=".33" stop-color="#ffd24f"/><stop offset=".66" stop-color="#F5B82E"/><stop offset="1" stop-color="#d4850a"/></radialGradient>
  <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".55" stop-color="#dcebff" stop-opacity=".75"/><stop offset="1" stop-color="#eadfff" stop-opacity=".7"/></linearGradient>
  <radialGradient id="${u}e" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#2f5da8"/><stop offset=".6" stop-color="#13203a"/><stop offset="1" stop-color="#0a1222"/></radialGradient>
  <radialGradient id="${u}s" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#8a4b00" stop-opacity=".38"/><stop offset="1" stop-color="#8a4b00" stop-opacity="0"/></radialGradient>
  <clipPath id="${u}k"><ellipse cx="70" cy="82" rx="39" ry="36"/></clipPath>
  <filter id="${u}f" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.6"/></filter></defs>
  <g class="flut"><g class="corpo-todo">
  <ellipse cx="70" cy="131" rx="28" ry="4" fill="#13203a" opacity=".1"/>
  ${asasVeias(u, 'e', aE1, aE2, vE)}${asasVeias(u, 'd', espelha(aE1), espelha(aE2), espelha(vE))}
  <path d="M60 112v9M70 114v9M80 112v9" stroke="#13203a" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M61 48 C57 34 52 27 45 24" stroke="#13203a" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M79 48 C83 34 88 27 95 24" stroke="#13203a" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M44 15 C49 21 49 26 44 27 C39 26 39 21 44 15Z" fill="#F5B82E" stroke="#c9810a" stroke-width="1.2"/><path d="M96 15 C101 21 101 26 96 27 C91 26 91 21 96 15Z" fill="#F5B82E" stroke="#c9810a" stroke-width="1.2"/>
  <g class="braco e"><path d="M34 88 C26 89 22 93 20 99" stroke="#c9810a" stroke-width="5.5" fill="none" stroke-linecap="round"/><circle cx="19.5" cy="100" r="4" fill="#d99212"/></g>
  <g class="braco d"><path d="M106 88 C114 89 118 93 120 99" stroke="#c9810a" stroke-width="5.5" fill="none" stroke-linecap="round"/><circle cx="120.5" cy="100" r="4" fill="#d99212"/></g>
  <ellipse cx="70" cy="82" rx="41" ry="38" fill="#e09d17" filter="url(#${u}f)"/>
  <ellipse cx="70" cy="82" rx="39" ry="36" fill="url(#${u}c)"/>
  <g clip-path="url(#${u}k)"><path d="M26 96 Q70 112 114 96 V106 Q70 122 26 106Z" fill="#13203a"/><path d="M30 113 Q70 127 110 113 V130 H30Z" fill="#13203a"/><ellipse cx="70" cy="100" rx="40" ry="26" fill="url(#${u}s)"/></g>
  <path d="M62 47 q-2 -9 5 -10 q-3 4 1 9 q1 -8 8 -6 q-4 3 -2 7" fill="#e3a01c"/>
  <path d="M40 70 Q46 54 62 48" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".55"/>
  <g class="olho"><ellipse cx="56" cy="78" rx="7.2" ry="8.8" fill="url(#${u}e)"/><circle cx="58.8" cy="74.4" r="2.8" fill="#fff"/><circle cx="54" cy="82" r="1.3" fill="#fff" opacity=".85"/><path d="M48.5 72 l-3 -2.5" stroke="#13203a" stroke-width="1.8" stroke-linecap="round"/></g>
  <g class="olho"><ellipse cx="84" cy="78" rx="7.2" ry="8.8" fill="url(#${u}e)"/><circle cx="86.8" cy="74.4" r="2.8" fill="#fff"/><circle cx="82" cy="82" r="1.3" fill="#fff" opacity=".85"/><path d="M91.5 72 l3 -2.5" stroke="#13203a" stroke-width="1.8" stroke-linecap="round"/></g>
  <ellipse cx="44" cy="90" rx="6.5" ry="3.8" fill="#ff8f9b" opacity=".6"/><ellipse cx="96" cy="90" rx="6.5" ry="3.8" fill="#ff8f9b" opacity=".6"/>
  <path class="boca" d="M63 89 Q70 96.5 77 89 Q70 92 63 89Z" data-feliz="M61.5 88 Q70 101 78.5 88 Q70 91 61.5 88Z" fill="#13203a" stroke="#13203a" stroke-width="1.6" stroke-linejoin="round"/>
  </g></g></svg>`;
}
async function beePousa(svg) { await an(svg?.querySelector('.corpo-todo'), [{ transform: 'scale(1.1,.86)' }, { transform: 'scale(1,1)' }], { m: M().boing }); }
async function beeComemora(svg, vezes = 2) {
  if (!svg) return; const b = svg.querySelector('.boca');
  if (b?.dataset.feliz) { const n = b.getAttribute('d'); b.setAttribute('d', b.dataset.feliz); setTimeout(() => b.setAttribute('d', n), vezes * 540 + 400); }
  if (calmo()) return;
  const corpo = svg.querySelector('.corpo-todo'), be = svg.querySelector('.braco.e'), bd = svg.querySelector('.braco.d');
  for (let i = 0; i < vezes; i++) {
    an(be, [{ transform: 'rotate(0)' }, { transform: 'rotate(70deg)' }, { transform: 'rotate(0)' }], { d: 440, e: EIO });
    an(bd, [{ transform: 'rotate(0)' }, { transform: 'rotate(-70deg)' }, { transform: 'rotate(0)' }], { d: 440, e: EIO });
    await an(corpo, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(3px) scale(1.08,.9)', offset: 0.18 }, { transform: 'translateY(-18px) scale(.95,1.07) rotate(-4deg)', offset: 0.55 }, { transform: 'translateY(0) scale(1.06,.94)', offset: 0.85 }, { transform: 'translateY(0) scale(1,1)' }], { d: 540, e: 'ease-in-out' });
  }
}

// Selo SL1 "Favo com faixa": hexágono de mel com borda azul, desenho do desafio no meio,
// nome na faixa azul e a Mel espiando no canto. icone = conteúdo de um <svg viewBox="0 0 24 24"> (traço).
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function seloFavo({ nome = 'Desafio cumprido', icone = '', bee = true, largura = 160 } = {}) {
  const u = 'fzs' + ++uid, nm = nome.length > 24 ? nome.slice(0, 23).trim() + '…' : nome;
  const fs = nm.length <= 17 ? 12.5 : nm.length <= 21 ? 10.8 : 9.6;
  const ic = icone ? `<svg x="62" y="64" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#13203a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${icone}</svg>`
    : `<path d="${ESTRELA}" transform="translate(62 64) scale(1.5)" fill="#fff" stroke="#13203a" stroke-width="1.4" stroke-linejoin="round"/>`;
  return `<svg class="fz-selo" width="${largura}" height="${Math.round(largura * 186 / 160)}" viewBox="0 0 160 186" role="img" aria-label="Selo ${esc(nome)}" style="overflow:visible"><defs><linearGradient id="${u}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe089"/><stop offset=".55" stop-color="#F5B82E"/><stop offset="1" stop-color="#e3a01c"/></linearGradient><clipPath id="${u}k"><path d="${HEXP(80, 84, 53)}"/></clipPath></defs>
    <path d="${HEXP(80, 88, 66)}" fill="#13203a" opacity=".12"/><path d="${HEXP(80, 84, 66)}" fill="#1a6fe0"/><path d="${HEXP(80, 84, 59)}" fill="#fff"/><path d="${HEXP(80, 84, 54)}" fill="url(#${u}g)"/>
    <g clip-path="url(#${u}k)" fill="none" stroke="#fff" stroke-width="1.4" opacity=".28">${[[50, 50], [80, 34], [110, 50], [50, 118], [110, 118], [80, 134]].map(([x, y]) => `<path d="${HEXP(x, y, 16)}"/>`).join('')}</g>
    <path d="M44 62 Q56 40 80 34" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>
    <circle cx="80" cy="82" r="27" fill="#fff" opacity=".55"/>${ic}
    <path d="M8 138 h14 l-6 9 6 9 h-14z" fill="#0b3d87"/><path d="M152 138 h-14 l6 9 -6 9 h14z" fill="#0b3d87"/>
    <rect x="18" y="132" width="124" height="28" rx="6" fill="#1a6fe0"/><rect x="18" y="132" width="124" height="28" rx="6" fill="none" stroke="#fff" stroke-width="2"/>
    <text x="80" y="${146 + fs * 0.36}" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="${fs}" fill="#fff">${esc(nm)}</text>
    ${bee ? abelhaMel(62, '', 'x="98" y="-6"') : ''}</svg>`;
}

/* ---------- 1. Marcar tarefa (criança, P4): a Mel chega, pega a estrela e leva até o quadro do dia ---------- */
let voando = false;
export async function marcarCrianca({ x, y }) {
  if (calmo() || voando || x == null) return;
  voando = true;
  try {
    const P = getPalco(), W = innerWidth;
    const st = document.createElement('div'); st.className = 'fz-solto'; st.style.cssText = 'width:24px;height:24px;margin:-12px 0 0 -12px'; st.innerHTML = estrelaSVG(24); P.appendChild(st);
    an(st, [{ transform: `translate(${x}px,${y}px) scale(0) rotate(-90deg)` }, { transform: `translate(${x}px,${y - 34}px) scale(1.15) rotate(0)` }], { m: M().boing });
    const s = document.createElement('div'); s.className = 'fz-solto'; s.style.cssText = 'width:58px;height:58px;margin:-29px 0 0 -29px'; s.innerHTML = abelhaMel(58); P.appendChild(s);
    tocarSom('zumbido');
    await voar(s, [[W + 40, y - 140], [W - 20, y - 160], [x + 70, y - 90], [x + 4, y - 58]], { d: 720, inclina: true, bob: 2 });
    beePousa(s.querySelector('.fz-bee')); st.remove();
    s.insertAdjacentHTML('beforeend', `<div class="fz-leva">${estrelaSVG(22)}</div>`);
    await espera(160);
    // O quadro do dia pode ter sido redesenhado pela tela: procura a estrela de destino agora.
    const est = [...document.querySelectorAll('.faixa-dia .estrelas svg')];
    const alvo = est.find((e) => !e.classList.contains('on')) || est[est.length - 1];
    const fora = !alvo || alvo.getBoundingClientRect().bottom < 0;
    const pa = fora ? { x: W - 30, y: 20 } : centro(alvo);
    await voar(s, [[x + 4, y - 58], [x + 10, y - 150], [pa.x + 40, pa.y - 90], [pa.x, pa.y - 38]], { d: 760, inclina: true, bob: 2 });
    s.querySelector('.fz-leva')?.remove();
    if (!fora) {
      tocarSom('ding');
      an(alvo, [{ transform: 'scale(.3) rotate(-50deg)' }, { transform: 'scale(1) rotate(0)' }], { m: M().boing });
      explode(pa.x, pa.y, { n: 10, tipos: ['brilho', 'polen'], v0: 40, v1: 110, g: 0, vida0: 0.4, vida1: 0.8, anel: [8, 26], anelCor: '#fff', anelLw: 2 });
      await beeComemora(s.querySelector('.fz-bee'), 1);
    }
    await voar(s, [[pa.x, pa.y - 38], [pa.x + 20, pa.y - 90], [W - 10, -40], [W + 60, -80]], { d: 640, inclina: true });
    s.remove();
  } finally { voando = false; }
}

/* ---------- 2. Dia completo (criança, P6): o pote de mel enche e a Mel sai de dentro ---------- */
function fechaCom(ov, bt) {
  return new Promise((res) => {
    const sai = async () => { document.removeEventListener('keydown', k); await an(ov, [{ opacity: 1 }, { opacity: 0, transform: 'scale(1.04)' }], { d: 240, e: EI }); ov.remove(); res(); };
    const k = (e) => { if (e.key === 'Escape') sai(); };
    bt.addEventListener('click', sai, { once: true }); document.addEventListener('keydown', k);
  });
}
function mostraBotao(bt, delay = 0) { bt.style.visibility = 'visible'; an(bt, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { m: M().pop, delay }).then(() => bt.focus({ preventScroll: true })); }

export async function diaCompletoCrianca(dia) {
  const id = 'fzp' + ++uid;
  const ov = camada('fz-ov', `<div class="fz-fundo"></div><div class="fz-raios"></div><div class="fz-cx" role="dialog" aria-modal="true" aria-labelledby="${id}t">
    <div class="fz-pote"><div class="fz-bee-in">${abelhaMel(84)}</div>
    <svg width="170" height="190" viewBox="0 0 170 190" aria-hidden="true"><defs><clipPath id="${id}"><path d="M40 62 h90 c10 0 16 8 16 18 v70 c0 18 -14 30 -32 30 h-58 c-18 0 -32 -12 -32 -30 v-70 c0 -10 6 -18 16 -18z"/></clipPath>
      <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd457"/><stop offset="1" stop-color="#e39612"/></linearGradient></defs>
      <rect class="fz-fio" x="80" y="-60" width="10" height="200" rx="5" fill="#F5B82E" style="transform-origin:85px -60px;transform:scaleY(0)"/>
      <g clip-path="url(#${id})"><rect x="0" y="0" width="170" height="190" fill="rgba(255,255,255,.16)"/>
        <g class="fz-mel" style="transform:translateY(130px)"><path class="fz-onda" d="M-40 56 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V200 H-40Z" fill="url(#${id}m)"/><path class="fz-onda" d="M-40 56 q12 -8 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="#fff0b8" stroke-width="2.5"/></g>
        ${[0, 1, 2, 3, 4].map((i) => `<circle class="fz-bb" cx="${55 + i * 15}" cy="170" r="${2 + (i % 3)}" fill="#fff6dc" opacity="0"/>`).join('')}</g>
      <path d="M40 62 h90 c10 0 16 8 16 18 v70 c0 18 -14 30 -32 30 h-58 c-18 0 -32 -12 -32 -30 v-70 c0 -10 6 -18 16 -18z" fill="none" stroke="#fff" stroke-width="4"/>
      <path d="M36 92 c-2 14 -2 34 2 48" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55" fill="none"/>
      <g class="fz-rotulo" opacity="0"><path d="${HEXP(85, 128, 20)}" fill="#1a6fe0" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="m77 128.5 6 6 10.5 -11.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g class="fz-tampa"><rect x="34" y="44" width="102" height="20" rx="8" fill="#1a6fe0" stroke="#fff" stroke-width="3"/><rect x="62" y="36" width="46" height="10" rx="5" fill="#0f4fae" stroke="#fff" stroke-width="2.5"/></g>
    </svg></div>
    <h2 class="fz-tit" id="${id}t">Dia completo!</h2><p class="fz-sub">O pote de mel do dia está cheio.</p><button type="button" class="fz-btn mel">Continuar</button></div>`);
  const q = (s) => ov.querySelector(s), tampa = q('.fz-tampa'), bt = q('.fz-btn'), pote = q('.fz-pote svg');
  const fecha = fechaCom(ov, bt);
  an(q('.fz-fundo'), [{ clipPath: 'circle(0% at 50% 62%)' }, { clipPath: 'circle(120% at 50% 62%)' }], { d: 560 });
  an(q('.fz-raios'), [{ opacity: 0 }, { opacity: 1 }], { d: 700, delay: 300 });
  if (!calmo()) q('.fz-raios').animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 24000, iterations: Infinity });
  an(q('.fz-pote'), [{ transform: 'translateY(40px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { m: M().boing, delay: 120 });
  tampa.style.transform = 'translateY(-70px) rotate(-14deg)'; tampa.style.opacity = '0';
  if (calmo()) {
    q('.fz-mel').style.transform = 'translateY(8px)'; tampa.style.transform = 'none'; tampa.style.opacity = '1'; q('.fz-rotulo').setAttribute('opacity', '1');
    q('.fz-bee-in').style.cssText += ';opacity:1;transform:translateY(-46px)'; tocarSom('caixinha');
  } else {
    await espera(500);
    await an(q('.fz-fio'), [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { d: 260, e: EI });
    an(q('.fz-mel'), [{ transform: 'translateY(130px)' }, { transform: 'translateY(8px)' }], { d: 1000, e: EIO });
    ov.querySelectorAll('.fz-onda').forEach((o) => an(o, [{ transform: 'translateX(0)' }, { transform: 'translateX(-24px)' }], { d: 500, e: 'linear', it: 4 }));
    ov.querySelectorAll('.fz-bb').forEach((b, i) => an(b, [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 0.9, transform: 'translateY(-40px)', offset: 0.5 }, { opacity: 0, transform: 'translateY(-90px)' }], { d: 900, delay: 300 + i * 120 }));
    await espera(900);
    q('.fz-fio').style.transformOrigin = '85px 140px';
    await an(q('.fz-fio'), [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { d: 200, e: EI });
    tampa.style.opacity = '1';
    await an(tampa, [{ transform: 'translateY(-70px) rotate(-14deg)', opacity: 0 }, { transform: 'translateY(0) rotate(0)', opacity: 1 }], { m: M().boing });
    an(pote, [{ transform: 'scale(1.06,.92)' }, { transform: 'scale(1)' }], { m: M().boing });
    const rot = q('.fz-rotulo'); rot.style.transformBox = 'fill-box'; rot.style.transformOrigin = 'center';
    an(rot, [{ opacity: 0, transform: 'scale(.3) rotate(-30deg)' }, { opacity: 1, transform: 'scale(1) rotate(0)' }], { m: M().boing });
    tocarSom('caixinha');
    await an(pote, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }], { d: 420, e: 'ease-in-out', delay: 150 });
    an(tampa, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-86px) rotate(-200deg)', offset: 0.45 }, { transform: 'translateY(0) rotate(-360deg)' }], { d: 1000, e: 'cubic-bezier(.3,.7,.4,1)' });
    const bi = q('.fz-bee-in'); setTimeout(() => tocarSom('zumbido'), 150);
    an(bi, [{ opacity: 0, transform: 'translateY(50px) scale(.4)' }, { opacity: 1, transform: 'translateY(-46px) scale(1)' }], { m: M().boing, delay: 120 }).then(() => beeComemora(bi.querySelector('.fz-bee'), 2));
    const pp = centro(q('.fz-pote')); setTimeout(() => explode(pp.x, pp.y - 60, { n: 26, abre: 1.3, v0: 220, v1: 420, g: 560, tipos: ['hex', 'fita', 'brilho', 'gota', 'polen'], vida0: 1.1, vida1: 1.8, anel: [30, 90], anelHex: true, anelCor: '#ffe089', anelLw: 3 }), 220);
  }
  an(q('.fz-tit'), [{ opacity: 0, transform: 'translateY(14px) scale(.8)' }, { opacity: 1, transform: 'none' }], { m: M().boing, delay: 350 });
  an(q('.fz-sub'), [{ opacity: 0 }, { opacity: 1 }], { d: 300, delay: 500 });
  mostraBotao(bt, 650);
  await fecha;
  if (dia?.seq >= 2) await sequenciaCrianca(dia);
}

/* ---------- 3. Sequência de dias (criança, P8): favos da semana ---------- */
const DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
function favoDia(i, cheio, hoje) {
  const k = `fzq${uid}_${i}`;
  return `<div class="fz-d ${hoje ? 'hj' : ''}"><svg width="34" height="38" viewBox="0 0 34 38" style="overflow:visible;transform-box:fill-box;transform-origin:50% 60%" aria-hidden="true">
  <defs><clipPath id="${k}"><path d="${HEXP(17, 19, 15)}"/></clipPath></defs>
  <path class="fz-borda" d="${HEXP(17, 19, 15.5)}" fill="${cheio ? '#fff6dc' : '#fff'}" stroke="${cheio || hoje ? '#F5B82E' : '#cfd8e6'}" stroke-width="2" ${hoje && !cheio ? 'stroke-dasharray="4 3"' : ''} stroke-linejoin="round"/>
  <g clip-path="url(#${k})"><g class="fz-mel" style="transform:translateY(${cheio ? 0 : 34}px)"><path d="M-10 9 q6 -4 12 0 t12 0 t12 0 t12 0 V50 H-10z" fill="#F5B82E"/></g></g>
  ${cheio || hoje ? `<path class="fz-ck" d="m11.5 19.5 4 4 7-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ${cheio ? '' : 'stroke-dasharray="16" stroke-dashoffset="16"'}/>` : ''}
  </svg><span>${DIAS[i]}</span></div>`;
}
export async function sequenciaCrianca({ seq, semana = [], hj = 0 }) {
  uid++;
  const id = 'fzs' + uid;
  const ov = camada('fz-ov', `<div class="fz-fundo escuro"></div><div class="fz-folha" role="dialog" aria-modal="true" aria-labelledby="${id}"><div class="fz-pega"></div>
    <div class="fz-num"><span class="v">${seq - 1}</span><span class="n" style="transform:rotateX(90deg)">${seq}</span></div>
    <h3 id="${id}">dias seguidos!</h3><p>Cada dia completo enche um favo da semana.</p>
    <div class="fz-favos">${[0, 1, 2, 3, 4, 5, 6].map((i) => favoDia(i, i < hj && !!semana[i], i === hj)).join('')}<div class="fz-slot">${abelhaMel(46)}</div></div>
    <button type="button" class="fz-btn azul">Até amanhã!</button></div>`);
  const folha = ov.querySelector('.fz-folha'), bt = ov.querySelector('.fz-btn');
  const fecha = new Promise((res) => bt.addEventListener('click', async () => { an(ov.querySelector('.fz-fundo'), [{ opacity: 1 }, { opacity: 0 }], { d: 220 }); await an(folha, [{ transform: 'none' }, { transform: 'translateY(105%)' }], { d: 260, e: EI }); ov.remove(); res(); }, { once: true }));
  an(ov.querySelector('.fz-fundo'), [{ opacity: 0 }, { opacity: 1 }], { d: 280 });
  await an(folha, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { m: M().suave });
  const fds = [...ov.querySelectorAll('.fz-favos .fz-d')], hoje = fds[hj], slot = ov.querySelector('.fz-slot'), bee = slot.querySelector('.fz-bee');
  const px = (i) => fds[i].offsetLeft + fds[i].offsetWidth / 2;
  if (!calmo()) {
    tocarSom('zumbido');
    voar(slot, [[-40, -40], [px(0), -70], [px(Math.max(0, hj - 2)), -6], [px(hj), -14]], { d: 1150, inclina: true, bob: 4 });
    fds.slice(0, hj).forEach((f, i) => { if (semana[i]) an(f.querySelector('svg'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-7px)', offset: 0.4 }, { transform: 'translateY(0)' }], { d: 380, delay: 220 + i * 190, e: 'ease-in-out' }); });
    await espera(1150);
  } else slot.style.transform = `translate(${px(hj)}px,-14px)`;
  tocarSom('varinha');
  const svgH = hoje.querySelector('svg');
  beePousa(bee);
  an(hoje.querySelector('.fz-mel'), [{ transform: 'translateY(34px)' }, { transform: 'translateY(0)' }], { d: 620, e: EIO });
  hoje.querySelector('.fz-borda').removeAttribute('stroke-dasharray');
  await espera(420);
  an(svgH, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: 0.35 }, { transform: 'scale(1)' }], { d: 560, e: 'cubic-bezier(.3,1.4,.5,1)' });
  an(hoje.querySelector('.fz-ck'), [{ strokeDashoffset: 16 }, { strokeDashoffset: 0 }], { d: 300, delay: 120 });
  const ph = centro(svgH); explode(ph.x, ph.y, { n: 16, abre: Math.PI, v0: 90, v1: 220, g: 420, tipos: ['brilho', 'gota', 'hex', 'polen'], anel: [16, 44], anelHex: true, vida0: 0.6, vida1: 1.1 });
  const v = ov.querySelector('.fz-num .v'), n = ov.querySelector('.fz-num .n');
  an(v, [{ transform: 'rotateX(0)', opacity: 1 }, { transform: 'rotateX(-90deg)', opacity: 0 }], { d: 220, e: EI });
  await espera(200);
  await an(n, [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { m: M().boing });
  beeComemora(bee, 2); bee.classList.add('pousada');
  bt.focus({ preventScroll: true });
  await fecha;
}

/* ---------- Adulto: dia completo (C2a) e sequência (P10) ---------- */
async function avisoAdulto(html, ms = 2600) {
  const m = camada('fz-aviso', html); m.setAttribute('role', 'status');
  await an(m, [{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { m: M().suave });
  return { m, sai: async () => { await espera(ms); await an(m, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }], { d: 200, e: EI }); m.remove(); } };
}
export async function diaCompletoAdulto(dia) {
  getPalco();
  // um brilho atravessa o quadro azul do dia, uma vez
  const fx0 = document.querySelector('.faixa-dia');
  if (fx0 && !calmo()) {
    const r = fx0.getBoundingClientRect(), br = camada('fz-varre', '');
    br.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    an(br, [{ backgroundPosition: '130% 0' }, { backgroundPosition: '-30% 0' }], { d: 900, e: EIO }).then(() => br.remove());
    explode(r.right - 24, r.top + 18, { n: 3, tipos: ['brilho'], v0: 10, v1: 30, g: 0, vida0: 0.7, vida1: 1, escalona: 0.15, atraso: 0.3 });
  }
  tocarSom('cristal');
  // o símbolo do beelo se desenha no aviso
  const a = await avisoAdulto(`${logoDesenha(20)}<span>Tudo feito hoje. Bom descanso.</span>`);
  an(a.m.querySelector('.fz-sh'), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { d: 520, e: EIO });
  an(a.m.querySelector('.fz-sc'), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { d: 280, delay: 420 });
  await a.sai();
  if (dia?.seq >= 2) await sequenciaAdulto(dia);
}
export async function sequenciaAdulto({ seq, semana = [], hj = 0 }) {
  const ck = '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const m = camada('fz-cartao-seq', `<div class="fz-seq-t"><b>Sequência</b><small><span class="fz-seq-n">${seq - 1}</span> dias seguidos</small></div>
    <div class="fz-seq"><div class="fz-lf"></div><div class="fz-lc"></div>${DIAS.map((d, i) => { const on = i < hj && semana[i]; return `<div class="fz-sd"><span class="fz-p ${on ? 'on' : ''} ${i === hj ? 'hj' : ''}">${on ? ck : ''}</span>${d}</div>`; }).join('')}</div>`);
  m.setAttribute('role', 'status');
  const ps = m.querySelectorAll('.fz-p'), lc = m.querySelector('.fz-lc');
  const meio = (i) => ps[i].parentElement.offsetLeft + ps[i].parentElement.offsetWidth / 2 - 16;
  lc.style.width = Math.max(0, hj > 0 ? meio(hj - 1) : 0) + 'px';
  await an(m, [{ transform: 'translateY(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { m: M().suave });
  await espera(250);
  await an(lc, [{ width: lc.style.width }, { width: meio(hj) + 'px' }], { d: 420, e: EIO }); lc.style.width = meio(hj) + 'px';
  tocarSom('cristal');
  const h = ps[hj]; h.classList.add('on'); h.innerHTML = ck;
  an(h, [{ transform: 'scale(.5)' }, { transform: 'scale(1)' }], { m: M().pop });
  const p = centro(h); explode(p.x, p.y, { n: 0, anel: [10, 24], anelCor: '#1a6fe0', anelLw: 1.6, anelA: 0.5 });
  await espera(120);
  const nEl = m.querySelector('.fz-seq-n'); an(nEl, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-8px)', opacity: 0 }], { d: 160 }).then(() => { nEl.textContent = seq; an(nEl, [{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { m: M().pop }); });
  await espera(3000);
  await an(m, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }], { d: 200, e: EI }); m.remove();
}

/* ---------- 4. Desafio cumprido ---------- */
// Criança sem prêmio (P11): o selo desce como um carimbo. Começa com um toque, para o som poder tocar.
export async function seloCrianca({ nome, icone, titulo, sub }) {
  const id = 'fzc' + ++uid;
  const ov = camada('fz-ov', `<div class="fz-fundo"></div><div class="fz-cx" role="dialog" aria-modal="true" aria-labelledby="${id}">
    <div class="fz-selo-alvo" style="visibility:hidden">${seloFavo({ nome, icone })}</div>
    <h2 class="fz-tit" id="${id}">Você ganhou um selo!</h2><p class="fz-sub">${esc(titulo)}</p>
    <button type="button" class="fz-btn mel fz-ver">Ver meu selo</button><button type="button" class="fz-btn mel fz-guardar" style="visibility:hidden;position:absolute">Guardar na coleção</button></div>`);
  const q = (s) => ov.querySelector(s), alvo = q('.fz-selo-alvo'), s = alvo.querySelector('svg'), ver = q('.fz-ver'), gd = q('.fz-guardar');
  an(q('.fz-fundo'), [{ opacity: 0 }, { opacity: 1 }], { d: 300 });
  an(q('.fz-tit'), [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { m: M().boing, delay: 150 });
  mostraBotao(ver, 300);
  await new Promise((r) => ver.addEventListener('click', r, { once: true }));
  prepararSom(); ver.remove(); gd.style.position = '';
  alvo.style.visibility = 'visible'; tocarSom('fanfarra');
  await an(s, [{ transform: 'scale(1.7) rotate(-14deg)', opacity: 0 }, { transform: 'scale(.9) rotate(2deg)', opacity: 1 }], { d: 300, e: 'cubic-bezier(.55,0,.8,.3)' });
  an(s, [{ transform: 'scale(.9) rotate(2deg)' }, { transform: 'scale(1) rotate(0)' }], { m: M().boing });
  const p = centro(s); explode(p.x, p.y, { n: 18, abre: Math.PI, v0: 120, v1: 260, g: 300, tipos: ['brilho', 'hex', 'polen'], anel: [50, 110], anelHex: true, anelCor: '#F5B82E', anelLw: 4, vida0: 0.6, vida1: 1 });
  an(q('.fz-cx'), [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(0)' }], { d: 160, e: 'ease-out' });
  setTimeout(() => beeComemora(s.querySelector('.fz-bee'), 1), 250);
  q('.fz-tit').textContent = 'Selo conquistado!'; q('.fz-sub').textContent = sub;
  an(q('.fz-sub'), [{ opacity: 0 }, { opacity: 1 }], { d: 300, delay: 300 });
  mostraBotao(gd, 600);
  await fechaCom(ov, gd);
}
// Criança com prêmio (P15): presente surpresa. O presente treme, a tampa voa e o selo sobe.
export async function presenteCrianca({ nome, icone, titulo, sub, premio, n = 0 }) {
  const id = 'fzg' + ++uid;
  const ov = camada('fz-ov', `<div class="fz-fundo"></div><div class="fz-cx" role="dialog" aria-modal="true" aria-labelledby="${id}">
    <div class="fz-pres"><div class="fz-facho" style="opacity:0"></div><div class="fz-med" style="opacity:0">${seloFavo({ nome, icone, largura: 120 })}</div>
      <svg width="170" height="200" viewBox="0 0 170 200" aria-hidden="true"><g class="fz-caixa">
        <rect x="30" y="112" width="110" height="80" rx="10" fill="#F5B82E" stroke="#fff" stroke-width="3"/><rect x="30" y="112" width="110" height="18" fill="#d99212" opacity=".35"/><rect x="76" y="112" width="18" height="80" fill="#1a6fe0"/>
        <g class="fz-tampa2"><rect x="24" y="94" width="122" height="24" rx="8" fill="#ffc93c" stroke="#fff" stroke-width="3"/><rect x="76" y="94" width="18" height="24" fill="#1a6fe0"/>
          <path d="M85 94 C70 70 50 76 58 88 C62 94 76 94 85 94Z M85 94 C100 70 120 76 112 88 C108 94 94 94 85 94Z" fill="#1a6fe0" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><circle cx="85" cy="93" r="6" fill="#0f4fae" stroke="#fff" stroke-width="2"/></g>
      </g></svg></div>
    <h2 class="fz-tit" id="${id}">Tem um presente para você!</h2><p class="fz-sub">${esc(titulo)}</p>
    ${n ? `<div class="fz-cofre" style="opacity:0"><span class="fz-moeda"></span><div><small>No cofrinho</small><b><span class="fz-cof-n">+0</span> estrelinhas</b></div></div>` : premio ? `<p class="fz-premio" style="opacity:0">${esc(premio)}</p>` : ''}
    <button type="button" class="fz-btn mel fz-abrir">Abrir o presente</button><button type="button" class="fz-btn mel fz-guardar" style="visibility:hidden;position:absolute">Guardar</button></div>`);
  const q = (s) => ov.querySelector(s), caixa = q('.fz-caixa'), tampa = q('.fz-tampa2'), abrir = q('.fz-abrir'), gd = q('.fz-guardar');
  an(q('.fz-fundo'), [{ opacity: 0 }, { opacity: 1 }], { d: 300 });
  await an(caixa, [{ transform: 'translateY(-260px)' }, { transform: 'translateY(0)' }], { d: 520, e: 'cubic-bezier(.5,0,.75,0)' });
  an(caixa, [{ transform: 'scale(1.15,.82)' }, { transform: 'scale(1)' }], { m: M().boing });
  mostraBotao(abrir, 200);
  await new Promise((r) => { abrir.addEventListener('click', r, { once: true }); caixa.closest('svg').addEventListener('click', r, { once: true }); });
  prepararSom(); abrir.remove(); gd.style.position = '';
  if (!calmo()) for (const a of [5, 8, 12]) { await an(caixa, [{ transform: 'rotate(0)' }, { transform: `rotate(${-a}deg)` }, { transform: `rotate(${a}deg)` }, { transform: 'rotate(0)' }], { d: 260, e: 'ease-in-out' }); await espera(110); }
  await an(caixa, [{ transform: 'scale(1)' }, { transform: 'scale(1.08,.88)' }], { d: 120 });
  tocarSom('varinha');
  an(caixa, [{ transform: 'scale(1.08,.88)' }, { transform: 'scale(1)' }], { m: M().boing });
  an(tampa, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(70px,-150px) rotate(40deg)', opacity: 0 }], { d: 700, e: 'cubic-bezier(.2,.7,.4,1)' });
  an(q('.fz-facho'), [{ opacity: 0, transform: 'scaleY(.2)' }, { opacity: 1, transform: 'scaleY(1)' }], { d: 500 });
  const ms = q('.fz-med'), med = ms.querySelector('svg'); med.style.transformOrigin = '50% 40%';
  an(ms, [{ opacity: 0, transform: 'translateY(110px) scale(.3)' }, { opacity: 1, transform: 'translateY(-8px) scale(.85)' }], { m: M().boing, delay: 120 });
  an(med, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(360deg)' }], { d: 900, delay: 120 });
  const pp = centro(q('.fz-pres')); setTimeout(() => explode(pp.x, pp.y - 10, { n: 30, abre: 1.2, v0: 260, v1: 460, g: 560, tipos: ['hex', 'brilho', 'fita', 'polen', 'gota'], vida0: 1.1, vida1: 1.8, anel: [30, 100], anelCor: '#fff3c8', anelLw: 3 }), 200);
  await espera(700); tocarSom('fanfarra');
  setTimeout(() => beeComemora(med.querySelector('.fz-bee'), 2), 300);
  q('.fz-tit').textContent = 'Desafio conquistado!'; q('.fz-sub').textContent = sub;
  an(q('.fz-tit'), [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'none' }], { m: M().boing });
  an(q('.fz-sub'), [{ opacity: 0 }, { opacity: 1 }], { d: 300, delay: 150 });
  if (q('.fz-premio')) an(q('.fz-premio'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { m: M().pop, delay: 300 });
  if (n) {
    const cof = q('.fz-cofre'), tot = q('.fz-cof-n');
    await an(cof, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { m: M().pop, delay: 300 });
    const alvo = centro(cof.querySelector('.fz-moeda')), de = centro(med), k = Math.min(6, n);
    for (let i = 0; i < k; i++) {
      const m = document.createElement('div'); m.className = 'fz-moeda fz-solto'; getPalco().appendChild(m); const j = i;
      (async () => {
        if (!calmo()) await voar(m, [[de.x + R(-20, 20), de.y], [de.x + R(-60, 60), de.y - 60], [alvo.x - 30, alvo.y - 70], [alvo.x, alvo.y]], { d: 560, giro: R(-200, 200), escala: [0.8, 0.6], ease: 'out' });
        m.remove(); tocarSom('moedinha', j); tot.textContent = '+' + Math.round((n * (j + 1)) / k);
        an(tot, [{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { m: M().pop });
      })();
      await espera(100);
    }
    await espera(650);
  }
  mostraBotao(gd);
  await fechaCom(ov, gd);
}
// Adulto (C4a): discreto. O anel fecha, vira check, aparece "Conquistado" e, se tiver prêmio, uma moeda desliza.
export async function conquistaAdulto({ titulo, sub, premio }) {
  const id = 'fza' + ++uid;
  const ov = camada('fz-ov', `<div class="fz-fundo claro"></div><div class="fz-card" role="dialog" aria-modal="true" aria-labelledby="${id}">
    <div class="fz-des"><div class="fz-ic">
      <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23" fill="none" stroke="#e8eef7" stroke-width="3.5"/><circle class="fz-arco" cx="26" cy="26" r="23" fill="none" stroke="#1a6fe0" stroke-width="3.5" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="20" transform="rotate(-90 26 26)"/></svg>
      <svg class="fz-ic-b" width="52" height="52" viewBox="0 0 52 52" style="opacity:0" aria-hidden="true"><circle cx="26" cy="26" r="18" fill="#1f7a45"/><path class="fz-ckb" d="m18.5 26.5 5 5 10-11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
    </div><div class="fz-tx"><b id="${id}">${esc(titulo)}</b><small>Desafio cumprido</small><span class="fz-chip" style="opacity:0">Conquistado</span>${premio ? `<small class="fz-pts" style="opacity:0">${esc(premio)}</small>` : ''}</div></div>
    <p>${esc(sub)}</p><div class="balao-bts"><button type="button" class="btn fz-ok">Ok</button></div></div>`);
  const q = (s) => ov.querySelector(s), card = q('.fz-card');
  an(q('.fz-fundo'), [{ opacity: 0 }, { opacity: 1 }], { d: 240 });
  await an(card, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { m: M().suave });
  const arco = q('.fz-arco');
  await an(arco, [{ strokeDashoffset: 20 }, { strokeDashoffset: 0 }], { d: 600, e: EIO }); arco.setAttribute('stroke-dashoffset', '0');
  tocarSom('cristal');
  an(arco, [{ stroke: '#1a6fe0' }, { stroke: '#1f7a45' }], { d: 300 });
  const b = q('.fz-ic-b'); b.style.transformOrigin = 'center';
  an(b, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }], { m: M().pop, delay: 120 });
  an(q('.fz-ckb'), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { d: 300, delay: 260 });
  an(q('.fz-chip'), [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { m: M().suave, delay: 300 });
  if (q('.fz-pts')) an(q('.fz-pts'), [{ opacity: 0 }, { opacity: 1 }], { d: 300, delay: 450 });
  const br = document.createElement('div'); br.className = 'fz-varre dentro'; card.appendChild(br);
  an(br, [{ backgroundPosition: '130% 0' }, { backgroundPosition: '-30% 0' }], { d: 1000, delay: 250, e: EIO }).then(() => br.remove());
  q('.fz-ok').focus({ preventScroll: true });
  await fechaCom(ov, q('.fz-ok'));
}

export { contar };
