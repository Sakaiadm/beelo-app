// @arquivo  cofrinho-mel.js: animações do cartão do saldo do Cofrinho: Mel na pilha (criança, cena A) e Anel da meta (adolescente e adulto, cena T3).
// @tipo     script estático (carregado só na tela do Cofrinho por components/CofrinhoMel.js)
// @usa      nada (SVG + Web Animations do navegador)
// @usado-por components/CofrinhoMel.js
// @cuidado  "Reduzir movimento" do aparelho: mostra a arte final parada. A Mel é a mesma de lib/festaAnim.js (AB1).
// @decisao  Thomas 27/11: criança = Mel na pilha (A); adolescente e adulto = Anel da meta (T3). Aprovado e aplicado em 28/11.
// @decisao  A Mel é a mesma da comemoração (lib/festaAnim.js, AB1). Aqui as antenas e os olhos
//           ganharam grupos próprios para piscar e mexer as antenas sem mexer no resto.
// Ideia: ao abrir o Cofrinho, a arte "chega" (moedas caem e o saldo conta até o número).
// Depois fica parada e, de tempos em tempos (3 a 7 s), faz UM gesto pequeno, escolhido ao acaso.
(function () {
  // ═══ SEÇÃO: Motor (molas, animação, esperas) ═══
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mola(k, c) {
    let x = 0, v = 0; const dt = 1 / 240, s = [0];
    for (let t = 0; t < 3; t += dt) { const a = -k * (x - 1) - c * v; v += a * dt; x += v * dt; s.push(x); if (Math.abs(x - 1) < 0.0015 && Math.abs(v) < 0.02) break; }
    const N = 56, p = []; for (let i = 0; i <= N; i++) p.push(+s[Math.round((i / N) * (s.length - 1))].toFixed(4)); p[0] = 0; p[N] = 1;
    const ok = CSS.supports?.('animation-timing-function', 'linear(0, 0.5, 1)');
    return { e: ok ? `linear(${p.join(',')})` : 'cubic-bezier(.34,1.5,.64,1)', d: Math.round(s.length * dt * 1000) };
  }
  const M = { pop: mola(420, 17), suave: mola(260, 30), boing: mola(320, 11), mole: mola(200, 8) };
  const EO = 'cubic-bezier(.22,1,.36,1)', EI = 'cubic-bezier(.55,0,.75,.2)', EIO = 'cubic-bezier(.65,0,.35,1)';
  function an(el, frames, o = {}) {
    if (!el?.animate) return Promise.resolve();
    const a = el.animate(frames, { duration: o.m ? o.m.d : o.d ?? 300, easing: o.m ? o.m.e : o.e || EO, delay: o.delay || 0, fill: o.fill || 'both', iterations: o.it || 1, composite: o.comp || 'replace' });
    return a.finished.catch(() => {});
  }
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const NS = 'http://www.w3.org/2000/svg';
  const ESTRELA = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
  const HEXP = (cx, cy, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 2; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2); } return d + 'Z'; };
  let uid = 0;

  // ═══ SEÇÃO: Desenho da Mel (igual à da comemoração, com antenas e olhos em grupos) ═══
  const espelha = (d) => d.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g, (m, x, y) => `${(140 - +x).toFixed(1)} ${y}`);
  function asa(u, lado, d1, d2, v) {
    return `<g class="asa ${lado}"><path d="${d1}" fill="url(#${u}w)" stroke="#a9cbf5" stroke-width="1.6"/><path d="${d2}" fill="url(#${u}w)" stroke="#a9cbf5" stroke-width="1.4" opacity=".9"/><path d="${v}" fill="none" stroke="#b7d3f6" stroke-width="1.1" stroke-linecap="round"/></g>`;
  }
  function mel(u) {
    const aE1 = 'M60 52 C42 12 2 8 3 32 C4 52 34 60 58 58 Z', aE2 = 'M58 62 C40 62 24 72 30 82 C36 90 52 76 60 66 Z', vE = 'M56 54 C44 42 28 34 18 34 M54 56 C40 52 26 50 16 44 M56 64 C46 68 38 74 34 80';
    const olho = (cx, sx, lado) => `<g class="olho"><ellipse cx="${cx}" cy="78" rx="7.2" ry="8.8" fill="url(#${u}e)"/><circle cx="${cx + 2.8}" cy="74.4" r="2.8" fill="#fff"/><circle cx="${cx - 2}" cy="82" r="1.3" fill="#fff" opacity=".85"/><path d="M${sx} 72 l${lado * 3} -2.5" stroke="#13203a" stroke-width="1.8" stroke-linecap="round"/></g>`;
    return `<defs>
  <radialGradient id="${u}c" cx="40%" cy="30%" r="78%"><stop offset="0" stop-color="#fff2c2"/><stop offset=".33" stop-color="#ffd24f"/><stop offset=".66" stop-color="#F5B82E"/><stop offset="1" stop-color="#d4850a"/></radialGradient>
  <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".97"/><stop offset=".55" stop-color="#dcebff" stop-opacity=".85"/><stop offset="1" stop-color="#eadfff" stop-opacity=".8"/></linearGradient>
  <radialGradient id="${u}e" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#2f5da8"/><stop offset=".6" stop-color="#13203a"/><stop offset="1" stop-color="#0a1222"/></radialGradient>
  <radialGradient id="${u}s" cx="50%" cy="100%" r="70%"><stop offset="0" stop-color="#8a4b00" stop-opacity=".38"/><stop offset="1" stop-color="#8a4b00" stop-opacity="0"/></radialGradient>
  <clipPath id="${u}k"><ellipse cx="70" cy="82" rx="39" ry="36"/></clipPath>
  <filter id="${u}f" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3.6"/></filter></defs>
  <g class="corpo-todo">
  ${asa(u, 'e', aE1, aE2, vE)}${asa(u, 'd', espelha(aE1), espelha(aE2), espelha(vE))}
  <path d="M60 112v9M70 114v9M80 112v9" stroke="#13203a" stroke-width="4.5" stroke-linecap="round"/>
  <g class="ant e"><path d="M61 48 C57 34 52 27 45 24" stroke="#13203a" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M44 15 C49 21 49 26 44 27 C39 26 39 21 44 15Z" fill="#F5B82E" stroke="#c9810a" stroke-width="1.2"/></g>
  <g class="ant d"><path d="M79 48 C83 34 88 27 95 24" stroke="#13203a" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M96 15 C101 21 101 26 96 27 C91 26 91 21 96 15Z" fill="#F5B82E" stroke="#c9810a" stroke-width="1.2"/></g>
  <g class="braco e"><path d="M34 88 C26 89 22 93 20 99" stroke="#c9810a" stroke-width="5.5" fill="none" stroke-linecap="round"/><circle cx="19.5" cy="100" r="4" fill="#d99212"/></g>
  <g class="braco d"><path d="M106 88 C114 89 118 93 120 99" stroke="#c9810a" stroke-width="5.5" fill="none" stroke-linecap="round"/><circle cx="120.5" cy="100" r="4" fill="#d99212"/></g>
  <ellipse cx="70" cy="82" rx="41" ry="38" fill="#e09d17" filter="url(#${u}f)"/>
  <ellipse cx="70" cy="82" rx="39" ry="36" fill="url(#${u}c)"/>
  <g clip-path="url(#${u}k)"><path d="M26 96 Q70 112 114 96 V106 Q70 122 26 106Z" fill="#13203a"/><path d="M30 113 Q70 127 110 113 V130 H30Z" fill="#13203a"/><ellipse cx="70" cy="100" rx="40" ry="26" fill="url(#${u}s)"/></g>
  <path d="M62 47 q-2 -9 5 -10 q-3 4 1 9 q1 -8 8 -6 q-4 3 -2 7" fill="#e3a01c"/>
  <path d="M40 70 Q46 54 62 48" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".55"/>
  <g class="olhos">${olho(56, 48.5, -1)}${olho(84, 91.5, 1)}</g>
  <ellipse class="boch" cx="44" cy="90" rx="6.5" ry="3.8" fill="#ff8f9b" opacity=".6"/><ellipse class="boch" cx="96" cy="90" rx="6.5" ry="3.8" fill="#ff8f9b" opacity=".6"/>
  <path class="boca" d="M63 89 Q70 96.5 77 89 Q70 92 63 89Z" fill="#13203a" stroke="#13203a" stroke-width="1.6" stroke-linejoin="round"/>
  </g>`;
  }
  const BOCA = { normal: 'M63 89 Q70 96.5 77 89 Q70 92 63 89Z', feliz: 'M61.5 88 Q70 101 78.5 88 Q70 91 61.5 88Z', oh: 'M66 90 Q70 97 74 90 Q70 87 66 90Z' };
  // Mel dentro de um <g> posicionado na cena (x, y = canto; t = tamanho).
  const melEm = (x, y, t, cls = '') => { const u = 'cm' + ++uid; return `<g class="bee-pos ${cls}"><svg class="bee" x="${x}" y="${y}" width="${t}" height="${t}" viewBox="0 0 140 140" overflow="visible">${mel(u)}</svg></g>`; };

  // ═══ SEÇÃO: Moedas, brilhos e gestos da Mel ═══
  const DEFS = (u) => `<defs>
    <radialGradient id="${u}mo" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff2c2"/><stop offset=".42" stop-color="#ffd24f"/><stop offset="1" stop-color="#d4850a"/></radialGradient>
    <linearGradient id="${u}bo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b56c06"/><stop offset=".35" stop-color="#e8a317"/><stop offset=".7" stop-color="#d48a0c"/><stop offset="1" stop-color="#a65f04"/></linearGradient>
    <linearGradient id="${u}to" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#ffd24f"/><stop offset="1" stop-color="#eaa21a"/></linearGradient>
    <linearGradient id="${u}mel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd457"/><stop offset="1" stop-color="#e39612"/></linearGradient>
    <linearGradient id="${u}fv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".6" stop-color="#F5B82E"/><stop offset="1" stop-color="#dc9612"/></linearGradient>
    <linearGradient id="${u}br" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
  // Moeda de estrelinha vista de frente, centrada em (0,0).
  const moedaFrente = (u, r = 12) => `<g class="moeda-face"><circle r="${r}" cy="${r * 0.17}" fill="#c27a08"/><circle r="${r}" fill="url(#${u}mo)"/><circle r="${r * 0.74}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3"/><path d="${ESTRELA}" transform="scale(${r / 20}) translate(-12 -12)" fill="#e39612" stroke="#fff3c9" stroke-width="1.6"/></g>`;
  // Moeda deitada (para a pilha), topo em cy.
  const fatia = (u, cy, i) => `<g class="fatia" data-i="${i}"><path d="M45 ${cy} v7 a25 7.5 0 0 0 50 0 v-7z" fill="url(#${u}bo)"/>
    <path d="M45 ${cy + 3.5} a25 7.5 0 0 0 50 0" stroke="#9a5604" stroke-width=".9" fill="none" opacity=".45"/>
    <ellipse cx="70" cy="${cy}" rx="25" ry="7.5" fill="url(#${u}to)" stroke="#fff3c9" stroke-width=".9"/>
    <ellipse cx="70" cy="${cy}" rx="18" ry="5.2" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1"/>
    <path d="${ESTRELA}" transform="translate(70 ${cy}) scale(.55 .18) translate(-12 -12.2)" fill="#e39612"/></g>`;

  function brilhos(cena, x, y, o = {}) {
    if (calmo()) return;
    const fx = cena.querySelector('.fx'), n = o.n || 7;
    for (let i = 0; i < n; i++) {
      const p = document.createElementNS(NS, 'path'), hex = i % 3 === 0;
      const r = hex ? 3 + Math.random() * 2 : 2.6 + Math.random() * 2.6;
      p.setAttribute('d', hex ? HEXP(0, 0, r) : `M0 ${-r}Q0 0 ${r} 0Q0 0 0 ${r}Q0 0 ${-r} 0Q0 0 0 ${-r}Z`);
      p.setAttribute('fill', hex ? (i % 2 ? '#ffe089' : '#fff') : (o.cor || '#fff6d0'));
      fx.appendChild(p);
      const ang = (o.de ?? -170) + Math.random() * ((o.ate ?? -10) - (o.de ?? -170)), dist = (o.dist || 26) * (0.6 + Math.random() * 0.7);
      const dx = Math.cos(ang * Math.PI / 180) * dist, dy = Math.sin(ang * Math.PI / 180) * dist;
      an(p, [{ transform: `translate(${x}px,${y}px) scale(.2) rotate(0deg)`, opacity: 1 }, { transform: `translate(${x + dx * 0.8}px,${y + dy * 0.8}px) scale(1.1) rotate(60deg)`, opacity: 1, offset: 0.55 }, { transform: `translate(${x + dx}px,${y + dy + 6}px) scale(.3) rotate(120deg)`, opacity: 0 }], { d: 650 + Math.random() * 350, e: 'cubic-bezier(.2,.8,.3,1)', delay: i * 18 }).then(() => p.remove());
    }
  }
  // Brilho que atravessa uma forma (moeda, vidro, colmeia). alvo = <g class="brilho-faixa"> já recortado.
  const varrer = (cena, sel, de = -60, ate = 160, d = 900) => an(cena.querySelector(sel), [{ transform: `translateX(${de}px) skewX(-20deg)` }, { transform: `translateX(${ate}px) skewX(-20deg)` }], { d, e: EIO, fill: 'none' });

  function gestosMel(bee) {
    const q = (s) => bee.querySelector(s), qa = (s) => bee.querySelectorAll(s);
    const boca = (k) => q('.boca').setAttribute('d', BOCA[k]);
    let batendo = [];
    const g = {
      piscar: async (vezes = 1) => { for (let i = 0; i < vezes; i++) { qa('.olho').forEach((o) => an(o, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)', offset: 0.45 }, { transform: 'scaleY(1)' }], { d: 170, e: 'ease-in-out', fill: 'none' })); await espera(230); } },
      antenas: async () => {
        an(q('.ant.e'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-16deg)', offset: 0.2 }, { transform: 'rotate(10deg)', offset: 0.45 }, { transform: 'rotate(-6deg)', offset: 0.7 }, { transform: 'rotate(0)' }], { d: 820, e: 'ease-in-out', fill: 'none' });
        await an(q('.ant.d'), [{ transform: 'rotate(0)' }, { transform: 'rotate(14deg)', offset: 0.25 }, { transform: 'rotate(-10deg)', offset: 0.5 }, { transform: 'rotate(5deg)', offset: 0.75 }, { transform: 'rotate(0)' }], { d: 820, delay: 90, e: 'ease-in-out', fill: 'none' });
      },
      // Uma antena só, curiosa (como quem escuta algo).
      antenaCuriosa: async () => { await an(q('.ant.d'), [{ transform: 'rotate(0)' }, { transform: 'rotate(22deg)', offset: 0.3 }, { transform: 'rotate(22deg)', offset: 0.65 }, { transform: 'rotate(-6deg)', offset: 0.82 }, { transform: 'rotate(0)' }], { d: 1300, e: 'ease-in-out', fill: 'none' }); },
      acenar: async () => {
        boca('feliz');
        await an(q('.braco.d'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-112deg)', offset: 0.2 }, { transform: 'rotate(-82deg)', offset: 0.35 }, { transform: 'rotate(-112deg)', offset: 0.5 }, { transform: 'rotate(-82deg)', offset: 0.65 }, { transform: 'rotate(-108deg)', offset: 0.78 }, { transform: 'rotate(0)' }], { d: 1250, e: 'ease-in-out', fill: 'none' });
        boca('normal');
      },
      // Olha para o número do saldo (à esquerda), pisca e volta.
      olharSaldo: async () => {
        await an(q('.olhos'), [{ transform: 'translate(0,0)' }, { transform: 'translate(-3.5px,1px)' }], { d: 260, e: EO });
        await espera(500); await g.piscar(); await espera(250);
        await an(q('.olhos'), [{ transform: 'translate(-3.5px,1px)' }, { transform: 'translate(0,0)' }], { d: 300, e: EO });
      },
      bater: (on) => {
        batendo.forEach((a) => a.cancel()); batendo = [];
        if (!on) return;
        batendo.push(q('.asa.e').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-28deg)' }, { transform: 'rotate(0)' }], { duration: 90, iterations: Infinity }));
        batendo.push(q('.asa.d').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(28deg)' }, { transform: 'rotate(0)' }], { duration: 90, iterations: Infinity }));
      },
      pulinho: async () => {
        g.bater(true); boca('feliz');
        await an(q('.corpo-todo'), [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(2px) scale(1.08,.9)', offset: 0.15 }, { transform: 'translateY(-20px) scale(.96,1.05)', offset: 0.5 }, { transform: 'translateY(0) scale(1.07,.93)', offset: 0.85 }, { transform: 'translateY(0) scale(1,1)' }], { d: 640, e: 'ease-in-out', fill: 'none' });
        g.bater(false); boca('normal');
      },
      comemora: async (vezes = 2) => {
        boca('feliz');
        for (let i = 0; i < vezes; i++) {
          an(q('.braco.e'), [{ transform: 'rotate(0)' }, { transform: 'rotate(75deg)' }, { transform: 'rotate(0)' }], { d: 460, e: EIO, fill: 'none' });
          an(q('.braco.d'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-75deg)' }, { transform: 'rotate(0)' }], { d: 460, e: EIO, fill: 'none' });
          await an(q('.corpo-todo'), [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(2px) scale(1.08,.9)', offset: 0.18 }, { transform: 'translateY(-16px) scale(.95,1.06) rotate(-4deg)', offset: 0.55 }, { transform: 'translateY(0) scale(1.06,.94)', offset: 0.85 }, { transform: 'translateY(0) scale(1,1)' }], { d: 560, e: 'ease-in-out', fill: 'none' });
        }
        boca('normal');
      },
      pousa: () => an(q('.corpo-todo'), [{ transform: 'scale(1.12,.84)' }, { transform: 'scale(1,1)' }], { m: M.boing, fill: 'none' }),
      // Coça a cabeça com o braço esquerdo (gesto "hmm, quanto falta?").
      pensar: async () => {
        await an(q('.olhos'), [{ transform: 'translate(0,0)' }, { transform: 'translate(1.5px,-2.5px)' }], { d: 260 });
        boca('oh');
        await an(q('.braco.e'), [{ transform: 'rotate(0)' }, { transform: 'rotate(118deg)', offset: 0.25 }, { transform: 'rotate(108deg)', offset: 0.4 }, { transform: 'rotate(118deg)', offset: 0.55 }, { transform: 'rotate(108deg)', offset: 0.7 }, { transform: 'rotate(0)' }], { d: 1300, e: 'ease-in-out', fill: 'none' });
        boca('normal');
        await an(q('.olhos'), [{ transform: 'translate(1.5px,-2.5px)' }, { transform: 'translate(0,0)' }], { d: 260 });
      },
      // Asas tremem rapidinho (espreguiça).
      asinhas: async () => { g.bater(true); await espera(380); g.bater(false); await an(q('.corpo-todo'), [{ transform: 'scale(1,1)' }, { transform: 'scale(1.04,.97)' }, { transform: 'scale(1,1)' }], { d: 300, fill: 'none' }); },
      // @decisao Thomas 27/11: "um pouquinho mais expressiva, mexer as asinhas". Gestos novos abaixo.
      // As asinhas tremem de leve sem sair do lugar.
      vibrar: async (ms = 520) => {
        const a1 = q('.asa.e').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(0)' }], { duration: 120, iterations: Infinity });
        const a2 = q('.asa.d').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(16deg)' }, { transform: 'rotate(0)' }], { duration: 120, iterations: Infinity });
        await espera(ms); a1.cancel(); a2.cancel();
      },
      bochechas: () => qa('.boch').forEach((b) => an(b, [{ opacity: 0.6, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.25)', offset: 0.4 }, { opacity: 0.6, transform: 'scale(1)' }], { d: 900, fill: 'none' })),
      // Piscadinha (um olho só) com sorriso e bochechas coradas.
      piscadinha: async () => {
        boca('feliz'); g.bochechas(); g.vibrar(300);
        await an(qa('.olho')[1], [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)', offset: 0.25 }, { transform: 'scaleY(.08)', offset: 0.7 }, { transform: 'scaleY(1)' }], { d: 620, fill: 'none' });
        await espera(250); boca('normal');
      },
      // Sobe um pouquinho batendo as asas, paira e volta a sentar.
      flutuar: async () => {
        g.bater(true); boca('feliz');
        await an(q('.corpo-todo'), [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-16px) rotate(0)', offset: 0.22 }, { transform: 'translateY(-11px) rotate(-4deg)', offset: 0.45 }, { transform: 'translateY(-17px) rotate(4deg)', offset: 0.68 }, { transform: 'translateY(-12px) rotate(0)', offset: 0.85 }, { transform: 'translateY(0) rotate(0)' }], { d: 1700, e: 'ease-in-out', fill: 'none' });
        g.bater(false); g.pousa(); boca('normal');
      },
      // Inclina a cabeça, curiosa, com uma antena de pé.
      inclinar: async () => {
        an(q('.ant.d'), [{ transform: 'rotate(0)' }, { transform: 'rotate(20deg)', offset: 0.3 }, { transform: 'rotate(20deg)', offset: 0.7 }, { transform: 'rotate(0)' }], { d: 1400, e: 'ease-in-out', fill: 'none' });
        boca('oh');
        await an(q('.corpo-todo'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg)', offset: 0.25 }, { transform: 'rotate(-8deg)', offset: 0.5 }, { transform: 'rotate(-10deg)', offset: 0.7 }, { transform: 'rotate(0)' }], { d: 1400, e: EIO, fill: 'none' });
        boca('normal'); await g.piscar(1);
      },
      boca,
    };
    return g;
  }

  // Voo por uma curva (4 pontos), com inclinação pela direção, até o lugar final (0,0).
  function voo(el, pts, d = 1100) {
    const [p0, p1, p2, p3] = pts, N = 36, fr = []; let px = p0[0];
    const B = (t, k) => { const u = 1 - t; return u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]; };
    for (let i = 0; i <= N; i++) {
      const k = i / N, t = 1 - Math.pow(1 - k, 2.2), x = B(t, 0), y = B(t, 1) + Math.sin(k * Math.PI * 3) * 3 * (1 - k);
      const inc = Math.max(-18, Math.min(18, (x - px) * 2.2)); px = x;
      fr.push({ transform: `translate(${x}px,${y}px) rotate(${i === N ? 0 : inc}deg)`, opacity: Math.min(1, k * 5) });
    }
    return an(el, fr, { d, e: 'linear', fill: 'none' });
  }

  // ═══ SEÇÃO: Contador do saldo ═══
  function contar(el, de, ate, d = 380) {
    return new Promise((res) => {
      if (!el) return res();
      const t0 = performance.now();
      const f = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(de + (ate - de) * e); k < 1 ? requestAnimationFrame(f) : res(); };
      requestAnimationFrame(f);
    });
  }
  function pulsarNumero(el) { an(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { d: 320, e: 'ease-out', fill: 'none' }); }

  // ═══ SEÇÃO: Cena A, "Mel na pilha de estrelinhas" ═══
  // Quatro moedas caem e empilham; a Mel chega voando e senta no alto. Depois: pisca, antenas, acena…
  const CENAS = {};
  CENAS.A = {
    nome: 'Mel na pilha de estrelinhas', vb: '0 0 140 140',
    html(u) {
      const ys = [122, 112, 102, 92];
      return `${DEFS(u)}<ellipse class="sombra" cx="70" cy="131" rx="34" ry="5" fill="#0b2a5a" opacity=".28"/>
        <g class="pilha">${ys.map((y, i) => fatia(u, y, i)).join('')}</g>
        <clipPath id="${u}kt"><ellipse cx="70" cy="92" rx="25" ry="7.5"/></clipPath>
        <g clip-path="url(#${u}kt)"><rect class="faixa-brilho" x="40" y="80" width="14" height="24" fill="url(#${u}br)" opacity=".9" style="transform:translateX(-60px)"/></g>
        ${melEm(31, 23, 78)}<g class="fx"></g>`;
    },
    async chegada(c, ctx) {
      const fat = [...c.querySelectorAll('.fatia')], bee = c.querySelector('.bee-pos'), G = ctx.mel;
      fat.forEach((f) => (f.style.opacity = 0)); bee.style.opacity = 0;
      for (let i = 0; i < fat.length; i++) {
        const f = fat[i]; f.style.opacity = 1;
        await an(f, [{ transform: 'translateY(-70px)', opacity: 0 }, { transform: 'translateY(-50px)', opacity: 1, offset: 0.25 }, { transform: 'translateY(0)', opacity: 1 }], { d: 330, e: EI, fill: 'none' });
        an(f, [{ transform: 'scale(1.1,.7)' }, { transform: 'scale(1,1)' }], { m: M.boing, fill: 'none' });
        an(c.querySelector('.pilha'), [{ transform: 'translateY(0)' }, { transform: 'translateY(1.5px)' }, { transform: 'translateY(0)' }], { d: 200, fill: 'none' });
        brilhos(c, i % 2 ? 98 : 42, 124 - i * 10, { n: 4, dist: 16, de: i % 2 ? -60 : -170, ate: i % 2 ? 10 : -110 });
        ctx.moeda(i, fat.length);
        await espera(70);
      }
      bee.style.opacity = 1; G.bater(true);
      await voo(bee, [[150, -90], [120, -60], [-60, -40], [0, 0]], 1050);
      G.bater(false); G.pousa(); G.boca('feliz');
      brilhos(c, 70, 40, { n: 9, dist: 34 });
      await espera(260); await G.comemora(1); G.bochechas(); await G.vibrar(500); await G.piscar(1);
    },
    intervalo: [3000, 2800],
    ola: async (c, ctx) => { await espera(300); ctx.mel.vibrar(400); await ctx.mel.acenar(); },
    gestos: (c, G) => [
      [3, async () => { G.vibrar(420); await G.piscar(2); }], [3, async () => { G.vibrar(300); await G.antenas(); }], [2, () => G.acenar()], [2, () => G.olharSaldo()],
      [2, () => G.pulinho()], [2, () => G.flutuar()], [2, () => G.piscadinha()], [2, () => G.inclinar()],
      [1, () => G.pensar()], [1, () => G.antenaCuriosa()],
      [2, async () => { varrer(c, '.faixa-brilho', -10, 70, 800); await espera(300); brilhos(c, 92, 86, { n: 3, dist: 10 }); await G.piscar(1); }],
    ],
  };

  // ═══ SEÇÃO: Cena B, "Pote de mel cofrinho" ═══
  // A tampa abre, 3 moedas caem no pote, o mel sobe, a tampa fecha e a Mel pousa nela.
  CENAS.B = {
    nome: 'Pote de mel cofrinho', vb: '0 -4 140 150',
    html(u) {
      const corpo = 'M38 78 h64 c8 0 12 5 12 10 c8 6 12 16 12 28 c0 18 -14 28 -32 28 h-48 c-18 0 -32 -10 -32 -28 c0 -12 4 -22 12 -28 c0 -5 4 -10 12 -10z';
      return `${DEFS(u)}<clipPath id="${u}kp"><path d="${corpo}"/></clipPath>
        <clipPath id="${u}kq"><path d="${corpo}"/><rect x="-60" y="-80" width="260" height="160"/></clipPath>
        <ellipse class="sombra" cx="70" cy="145" rx="42" ry="4.5" fill="#0b2a5a" opacity=".28"/>
        <g class="tudo">
        <path d="${corpo}" fill="#fff" opacity=".2"/>
        <g clip-path="url(#${u}kp)">
          <g class="mel" style="transform:translateY(128px)"><path class="onda" d="M-40 0 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V90 H-40Z" fill="url(#${u}mel)"/><path class="onda" d="M-40 0 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="#fff0b8" stroke-width="2.2"/>
          ${[0, 1, 2].map((i) => `<circle class="bolha" cx="${52 + i * 18}" cy="34" r="${2 + (i % 2)}" fill="#fff6dc" opacity="0"/>`).join('')}</g>
          <rect class="faixa-brilho" x="40" y="70" width="18" height="80" fill="url(#${u}br)" opacity=".55" style="transform:translateX(-80px) skewX(-20deg)"/>
        </g>
        <g clip-path="url(#${u}kq)" class="moedas">${[0, 1, 2].map(() => `<g class="cai" style="opacity:0">${moedaFrente(u, 10)}</g>`).join('')}</g>
        <path d="${corpo}" fill="none" stroke="#fff" stroke-width="3.5"/>
        <path d="M27 96 c-2 10 -2 22 1 30" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".55" fill="none"/>
        <g class="rotulo"><path d="${HEXP(70, 116, 13)}" fill="#1a6fe0" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/><path d="m64.2 116.4 4.3 4.3 7.6-8.4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="tampa"><rect x="16" y="64" width="108" height="15" rx="7" fill="#1a6fe0" stroke="#fff" stroke-width="3"/><rect x="51" y="55" width="38" height="11" rx="5" fill="#0f4fae" stroke="#fff" stroke-width="2.5"/><rect x="59.5" y="59.2" width="21" height="2.8" rx="1.4" fill="#0b2a5a"/>
          <path d="M24 68 h30" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/></g>
        ${melEm(40, 3, 60)}
        </g><g class="fx"></g>`;
    },
    async chegada(c, ctx) {
      const q = (s) => c.querySelector(s), tampa = q('.tampa'), bee = q('.bee-pos'), G = ctx.mel, melG = q('.mel');
      const cai = [...c.querySelectorAll('.cai')]; bee.style.opacity = 0;
      an(q('.tudo'), [{ transform: 'translateY(30px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { m: M.boing, fill: 'none' });
      await espera(380);
      // a tampa abre como uma portinha (dobradiça à esquerda)
      await an(tampa, [{ transform: 'rotate(0)' }, { transform: 'translateY(-6px) rotate(-26deg)' }], { m: M.pop });
      const nivel = [128, 117, 106, 96];
      for (let i = 0; i < cai.length; i++) {
        const m = cai[i]; m.style.opacity = 1;
        const x0 = -40 + i * 8, xm = 70 + (i - 1) * 9;
        await an(m, [{ transform: `translate(${x0}px,10px) scale(.7)` }, { transform: `translate(${(x0 + xm) / 2}px,-14px) scale(1) rotate(180deg)`, offset: 0.45 }, { transform: `translate(${xm}px,70px) scale(.9) rotate(340deg)`, offset: 0.78 }, { transform: `translate(${xm}px,${nivel[i] + 6}px) scale(.85) rotate(360deg)` }], { d: 620, e: 'cubic-bezier(.4,.1,.6,1)' });
        an(m, [{ opacity: 1 }, { opacity: 0 }], { d: 220, fill: 'forwards' });
        an(melG, [{ transform: `translateY(${nivel[i]}px)` }, { transform: `translateY(${nivel[i + 1]}px)` }], { m: M.mole });
        c.querySelectorAll('.onda').forEach((o) => an(o, [{ transform: 'translateX(0)' }, { transform: 'translateX(-24px)' }], { d: 420, e: 'linear', fill: 'none' }));
        brilhos(c, xm, nivel[i + 1], { n: 4, dist: 14, cor: '#ffe089' });
        ctx.moeda(i, cai.length);
        await espera(90);
      }
      melG.style.transform = `translateY(${nivel[3]}px)`;
      await an(tampa, [{ transform: 'translateY(-6px) rotate(-26deg)' }, { transform: 'rotate(0)' }], { m: M.boing });
      an(q('.tudo'), [{ transform: 'scale(1.05,.94)' }, { transform: 'scale(1)' }], { m: M.boing, fill: 'none' });
      bee.style.opacity = 1; G.bater(true);
      await voo(bee, [[130, -40], [110, -80], [-40, -60], [0, 0]], 1000);
      G.bater(false); G.pousa(); brilhos(c, 70, 20, { n: 8, dist: 30 });
      await espera(200); await G.comemora(1); await G.piscar(1);
    },
    gestos: (c, G) => {
      const q = (s) => c.querySelector(s);
      return [
        [3, () => G.piscar(2)], [3, () => G.antenas()], [2, () => G.acenar()], [1, () => G.olharSaldo()], [1, () => G.pensar()],
        // o pote tilinta: balança, a tampa pula e as moedas brilham
        [2, async () => {
          an(q('.tampa'), [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)', offset: 0.2 }, { transform: 'translateY(0)', offset: 0.4 }, { transform: 'translateY(-3px)', offset: 0.6 }, { transform: 'translateY(0)' }], { d: 520, fill: 'none' });
          await an(q('.tudo'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-2.5deg)' }, { transform: 'rotate(0)' }], { d: 560, e: 'ease-in-out', fill: 'none' });
          brilhos(c, 70, 56, { n: 4, dist: 14 });
        }],
        // bolhinhas sobem no mel e a onda mexe
        [2, async () => {
          c.querySelectorAll('.onda').forEach((o) => an(o, [{ transform: 'translateX(0)' }, { transform: 'translateX(-48px)' }], { d: 1400, e: EIO, fill: 'none' }));
          c.querySelectorAll('.bolha').forEach((b, i) => an(b, [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 0.9, transform: 'translateY(-10px)', offset: 0.5 }, { opacity: 0, transform: 'translateY(-22px)' }], { d: 1000, delay: i * 180, fill: 'none' }));
          await G.antenaCuriosa();
        }],
        [2, async () => { await varrer(c, '.faixa-brilho', -80, 90, 1000); }],
        [1, () => G.pulinho()],
      ];
    },
  };

  // ═══ SEÇÃO: Cena C, "Colmeia cofrinho" ═══
  // A colmeia cai e balança; 3 moedas entram pela fenda do alto; a Mel sai pela portinha e acena.
  CENAS.C = {
    nome: 'Colmeia cofrinho', vb: '0 0 140 140',
    html(u) {
      const faixas = [[111, 104], [94, 98], [77, 88], [61, 74], [46, 56]];
      return `${DEFS(u)}<clipPath id="${u}kc">${faixas.map(([y, w]) => `<rect x="${70 - w / 2}" y="${y}" width="${w}" height="18" rx="9"/>`).join('')}</clipPath>
        <ellipse class="sombra" cx="70" cy="131" rx="50" ry="5" fill="#0b2a5a" opacity=".28"/>
        <g class="moedas">${[0, 1, 2].map(() => `<g class="cai" style="opacity:0">${moedaFrente(u, 9)}</g>`).join('')}</g>
        <g class="colmeia">
          ${faixas.map(([y, w]) => `<rect x="${70 - w / 2}" y="${y}" width="${w}" height="18" rx="9" fill="url(#${u}fv)" stroke="#c9810a" stroke-width="1.6"/><path d="M${70 - w / 2 + 8} ${y + 5} H${70 + w / 2 - 14}" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>`).join('')}
          <rect x="54" y="36" width="32" height="13" rx="6.5" fill="url(#${u}fv)" stroke="#c9810a" stroke-width="1.6"/>
          <rect x="57" y="30" width="26" height="8" rx="4" fill="#1a6fe0" stroke="#fff" stroke-width="2"/><rect x="62.5" y="32.8" width="15" height="2.4" rx="1.2" fill="#0b2a5a"/>
          <g clip-path="url(#${u}kc)"><rect class="faixa-brilho" x="20" y="30" width="20" height="110" fill="url(#${u}br)" opacity=".6" style="transform:translateX(-60px) skewX(-20deg)"/></g>
          <path d="${HEXP(70, 69, 8)}" fill="#1a6fe0" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="m66.4 69.3 2.7 2.7 4.7-5.2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M52 129 v-9 a18 16 0 0 1 36 0 v9z" fill="#5a3300" stroke="#c9810a" stroke-width="1.6"/><path d="M55.5 129 v-8.5 a14.5 13 0 0 1 29 0 v8.5z" fill="#2c1800"/>
        </g>
        ${melEm(43, 83, 54, 'na-porta')}
        <g class="fx"></g>`;
    },
    async chegada(c, ctx) {
      const q = (s) => c.querySelector(s), col = q('.colmeia'), bee = q('.bee-pos'), G = ctx.mel;
      const cai = [...c.querySelectorAll('.cai')]; bee.style.opacity = 0;
      await an(col, [{ transform: 'translateY(-90px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { d: 380, e: EI });
      an(col, [{ transform: 'scale(1.12,.84)' }, { transform: 'scale(1)' }], { m: M.boing, fill: 'none' });
      await espera(260);
      for (let i = 0; i < cai.length; i++) {
        const m = cai[i]; m.style.opacity = 1;
        // a moeda gira (fica fina e larga) enquanto cai na fenda
        await an(m, [{ transform: 'translate(70px,-14px) scaleX(1)', opacity: 0 }, { transform: 'translate(70px,-2px) scaleX(.15)', opacity: 1, offset: 0.35 }, { transform: 'translate(70px,10px) scaleX(1)', offset: 0.65 }, { transform: 'translate(70px,30px) scaleX(.2)' }], { d: 480, e: EI });
        m.style.opacity = 0;
        an(col, [{ transform: 'scale(1)' }, { transform: 'scale(1.05,.95)' }, { transform: 'scale(1)' }], { d: 260, fill: 'none' });
        brilhos(c, 70, 28, { n: 5, dist: 18 });
        ctx.moeda(i, cai.length);
        await espera(120);
      }
      await espera(150);
      await this.sair(c, G);
      await G.acenar(); await G.piscar(1);
    },
    // A Mel sai pela porta (cresce a partir da porta) ou volta para dentro.
    async sair(c, G) {
      const bee = c.querySelector('.bee-pos'); bee.style.opacity = 1; G.boca('feliz');
      await an(bee, [{ transform: 'translateY(18px) scale(.1)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { m: M.boing });
      G.boca('normal');
    },
    async entrar(c) { const b = c.querySelector('.bee-pos'); await an(b, [{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(18px) scale(.1)', opacity: 0 }], { d: 260, e: EI }); },
    gestos(c, G) {
      return [
        [3, () => G.piscar(2)], [3, () => G.antenas()], [2, () => G.acenar()], [1, () => G.antenaCuriosa()], [1, () => G.olharSaldo()],
        // esconde na colmeia e aparece de novo
        [2, async () => { await this.entrar(c); an(c.querySelector('.colmeia'), [{ transform: 'scale(1)' }, { transform: 'scale(1.03,.97)' }, { transform: 'scale(1)' }], { d: 300, fill: 'none' }); await espera(900); await this.sair(c, G); await G.piscar(1); }],
        // a colmeia "respira" e brilha
        [2, async () => { varrer(c, '.faixa-brilho', -60, 110, 1100); await an(c.querySelector('.colmeia'), [{ transform: 'scale(1)' }, { transform: 'scale(1.035,.97)' }, { transform: 'scale(.99,1.02)' }, { transform: 'scale(1)' }], { d: 900, e: 'ease-in-out', fill: 'none' }); }],
        [1, () => G.asinhas()],
      ];
    },
  };

  // ═══ SEÇÃO: Cenas calmas (adolescente e adulto) ═══
  // @decisao Thomas 27/11: adolescente ganha um cofre próprio, mais maduro, que serve também para adulto.
  // Mesma ideia da criança (chega, conta o saldo, parada, um gesto de vez em quando), mas com
  // movimentos suaves (sem "boing"), sem 3D de brinquedo e com a abelha só como toque discreto (T1).
  const HEXF = (cx, cy, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * r).toFixed(2) + ' ' + (cy + Math.sin(a) * r).toFixed(2); } return d + 'Z'; };
  // Ponto numa fração f (0 a 1) do contorno de um hexágono de ponta para cima, começando no topo, sentido horário.
  const hexPonto = (cx, cy, r, f) => {
    const v = (i) => { const a = (Math.PI / 3) * (i % 6) - Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const s = Math.min(5.9999, Math.max(0, f * 6)), i = Math.floor(s), t = s - i, [x0, y0] = v(i), [x1, y1] = v(i + 1);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  };
  const fichaHex = (u, r = 8) => `<path d="${HEXP(0, 0, r)}" fill="url(#${u}mel)" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="m${-r * 0.38} ${r * 0.02} ${r * 0.28} ${r * 0.28} ${r * 0.5} ${-r * 0.55}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  // Abelhinha plana e pequena, só para o toque discreto do favo (não é a Mel 3D).
  const abelhinha = () => `<g class="abelhinha" style="opacity:0"><g class="ab-asas"><ellipse cx="-3" cy="-6" rx="4" ry="3" fill="#fff" opacity=".9"/><ellipse cx="3" cy="-6" rx="4" ry="3" fill="#fff" opacity=".9"/></g><ellipse cx="0" cy="0" rx="6.5" ry="5" fill="#F5B82E"/><path d="M-1.5 -4.8v9.6M2.5 -4.4v8.8" stroke="#13203a" stroke-width="1.6"/><circle cx="-4.2" cy="-1" r="1" fill="#13203a"/></g>`;

  // ── T1 "Favo das semanas": cada semana conquistada enche um favo de mel ──
  const FAVO = [[70, 74], [55.3, 99.5], [40.6, 74], [55.3, 48.5], [84.7, 48.5], [99.4, 74], [84.7, 99.5]]; // ordem de encher
  CENAS.T1 = {
    nome: 'Favo das semanas', vb: '0 0 140 140', calmo: true, intervalo: [4200, 3200], cheios: 5,
    html(u) {
      const R = 16.4;
      return `${DEFS(u)}<clipPath id="${u}kf">${FAVO.map(([x, y]) => `<path d="${HEXP(x, y, R)}"/>`).join('')}</clipPath>
        <ellipse class="sombra" cx="70" cy="128" rx="40" ry="4" fill="#0b2a5a" opacity=".22"/>
        <g class="favo">${FAVO.map(([x, y], i) => `<g class="cel" data-i="${i}">
          <clipPath id="${u}c${i}"><path d="${HEXP(x, y, R - 1.6)}"/></clipPath>
          <path d="${HEXP(x, y, R)}" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linejoin="round" class="vazio"/>
          <g clip-path="url(#${u}c${i})"><rect class="nivel" x="${x - R}" y="${y - R}" width="${2 * R}" height="${2 * R}" fill="url(#${u}mel)" style="transform:translateY(${2 * R}px)"/></g>
          <path class="cheio" d="${HEXP(x, y, R)}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" opacity="0"/>
          <path class="luz" d="M${x - 8} ${y - 6} L${x - 3} ${y - 9}" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0"/></g>`).join('')}</g>
        <g clip-path="url(#${u}kf)"><rect class="faixa-brilho" x="20" y="20" width="22" height="110" fill="url(#${u}br)" opacity=".7" style="transform:translateX(-60px) skewX(-20deg)"/></g>
        <path class="gota" d="M55.3 116 c-2.6 4 -3.4 6 -3.4 7.4 a3.4 3.4 0 0 0 6.8 0 c0 -1.4 -.8 -3.4 -3.4 -7.4z" fill="#F5B82E" stroke="#fff" stroke-width="1" opacity="0"/>
        ${abelhinha()}<g class="fx"></g>`;
    },
    encher(c, i, d = 480) {
      const cel = c.querySelectorAll('.cel')[i], R = 16.4;
      an(cel.querySelector('.nivel'), [{ transform: `translateY(${2 * R}px)` }, { transform: 'translateY(0)' }], { d, e: EIO });
      an(cel.querySelector('.cheio'), [{ opacity: 0 }, { opacity: 1 }], { d: 300, delay: d - 200 });
      an(cel.querySelector('.luz'), [{ opacity: 0 }, { opacity: 0.7 }], { d: 300, delay: d - 100 });
      return an(cel, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)', offset: 0.6 }, { transform: 'scale(1)' }], { d: d + 200, e: 'ease-out', fill: 'none' });
    },
    async chegada(c, ctx) {
      const n = this.cheios;
      await an(c.querySelector('.favo'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { m: M.suave });
      for (let i = 0; i < n; i++) { this.encher(c, i); ctx.moeda(i, n); await espera(360); }
      await espera(350); await this.proximo(c);
    },
    // O próximo favo (a semana que vem) pisca o contorno de leve.
    proximo: (c) => an(c.querySelectorAll('.cel')[CENAS.T1.cheios]?.querySelector('.vazio'), [{ strokeOpacity: 0.5 }, { strokeOpacity: 1, offset: 0.4 }, { strokeOpacity: 0.5 }], { d: 1400, e: 'ease-in-out', fill: 'none' }),
    gestos(c) {
      const q = (s) => c.querySelector(s);
      return [
        [3, () => varrer(c, '.faixa-brilho', -60, 120, 1400)],
        [2, () => this.proximo(c)],
        // um favo cheio brilha por dentro
        [2, async () => { const i = Math.floor(Math.random() * this.cheios), cel = c.querySelectorAll('.cel')[i]; await an(cel.querySelector('.luz'), [{ opacity: 0.7 }, { opacity: 1, offset: 0.4 }, { opacity: 0.7 }], { d: 900, fill: 'none' }); const [x, y] = FAVO[i]; brilhos(c, x, y - 6, { n: 3, dist: 10, cor: '#fff6d0' }); }],
        // uma gota de mel escorre do favo de baixo
        [2, async () => { await an(q('.gota'), [{ opacity: 0, transform: 'translateY(-4px) scale(.4)' }, { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.35 }, { opacity: 1, transform: 'translateY(2px) scale(1,1.1)', offset: 0.6 }, { opacity: 0, transform: 'translateY(12px) scale(.8)' }], { d: 1600, e: 'ease-in', fill: 'none' }); }],
        // toque discreto: uma abelhinha passa voando por cima do favo e vai embora
        [1, async () => {
          const ab = q('.abelhinha'), asas = q('.ab-asas'), fl = asas.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.3)' }, { transform: 'scaleY(1)' }], { duration: 110, iterations: Infinity });
          const pts = []; for (let k = 0; k <= 30; k++) { const t = k / 30, x = 150 - 170 * t, y = 40 - Math.sin(t * Math.PI) * 22 + Math.sin(t * Math.PI * 4) * 3; pts.push({ transform: `translate(${x}px,${y}px) scaleX(1)`, opacity: t < 0.1 ? t * 10 : t > 0.9 ? (1 - t) * 10 : 1 }); }
          await an(ab, pts, { d: 2600, e: 'linear', fill: 'none' }); fl.cancel();
        }],
      ];
    },
    final(c) { c.querySelectorAll('.cel').forEach((cel, i) => { if (i < this.cheios) { cel.querySelector('.nivel').style.transform = 'none'; cel.querySelector('.cheio').setAttribute('opacity', 1); cel.querySelector('.luz').setAttribute('opacity', 0.7); } }); },
  };

  // ── T2 "Cofre hexagonal": um cofre de verdade, com segredo que gira a cada ficha ──
  CENAS.T2 = {
    nome: 'Cofre hexagonal', vb: '0 0 140 140', calmo: true, intervalo: [4200, 3200],
    html(u) {
      const marcas = Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6, r1 = 9.5, r2 = i % 3 ? 11 : 12; return `M${(70 + Math.cos(a) * r1).toFixed(2)} ${(78 + Math.sin(a) * r1).toFixed(2)}L${(70 + Math.cos(a) * r2).toFixed(2)} ${(78 + Math.sin(a) * r2).toFixed(2)}`; }).join('');
      return `${DEFS(u)}<linearGradient id="${u}cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d3e2f7"/></linearGradient>
        <clipPath id="${u}kc"><path d="${HEXF(70, 76, 48)}"/></clipPath>
        <ellipse class="sombra" cx="70" cy="126" rx="42" ry="4.5" fill="#0b2a5a" opacity=".25"/>
        <g class="fichas">${[0, 1, 2].map(() => `<g class="cai" style="opacity:0">${fichaHex(u, 8)}</g>`).join('')}</g>
        <g class="cofre">
          <path d="${HEXF(70, 80, 48)}" fill="#0b3d87" opacity=".35"/>
          <path d="${HEXF(70, 76, 48)}" fill="url(#${u}cf)" stroke="#fff" stroke-width="2"/>
          <rect x="55" y="31" width="30" height="6.5" rx="3.2" fill="#0b2a5a" stroke="#fff" stroke-width="1.5"/>
          <path d="${HEXF(70, 78, 33)}" fill="url(#${u}mel)"/>
          <g class="porta">
            <path d="${HEXF(70, 78, 35)}" fill="#1a6fe0" stroke="#0f4fae" stroke-width="2"/>
            <path d="${HEXF(70, 78, 30)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
            <rect x="33" y="64" width="5" height="9" rx="2" fill="#0f4fae"/><rect x="33" y="84" width="5" height="9" rx="2" fill="#0f4fae"/>
            <g class="disco"><circle cx="70" cy="78" r="13" fill="#fff" stroke="#0f4fae" stroke-width="2"/><path d="${marcas}" stroke="#0f4fae" stroke-width="1.3" stroke-linecap="round"/><rect x="68.6" y="67.5" width="2.8" height="9" rx="1.4" fill="#0f4fae"/><circle cx="70" cy="78" r="3" fill="#F5B82E" stroke="#0f4fae" stroke-width="1"/></g>
            <circle class="led" cx="92" cy="61" r="3" fill="#fff" fill-opacity=".35"/>
          </g>
          <g clip-path="url(#${u}kc)"><rect class="faixa-brilho" x="20" y="20" width="22" height="110" fill="url(#${u}br)" opacity=".55" style="transform:translateX(-60px) skewX(-20deg)"/></g>
        </g><g class="fx"></g>`;
    },
    giro: 0,
    girar(c, mais, d = 420) { const de = this.giro; this.giro += mais; return an(c.querySelector('.disco'), [{ transform: `rotate(${de}deg)` }, { transform: `rotate(${this.giro}deg)` }], { d, e: EIO }); },
    async chegada(c, ctx) {
      this.giro = 0;
      const q = (s) => c.querySelector(s), cai = [...c.querySelectorAll('.cai')], led = q('.led');
      await an(q('.cofre'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { m: M.suave });
      for (let i = 0; i < cai.length; i++) {
        const m = cai[i]; m.style.opacity = 1;
        await an(m, [{ transform: 'translate(70px,-14px)', opacity: 0 }, { transform: 'translate(70px,4px)', opacity: 1, offset: 0.4 }, { transform: 'translate(70px,40px)', opacity: 1 }], { d: 520, e: EI });
        m.style.opacity = 0;
        an(q('.cofre'), [{ transform: 'translateY(0)' }, { transform: 'translateY(1.5px)' }, { transform: 'translateY(0)' }], { d: 220, fill: 'none' });
        an(led, [{ fill: '#fff', fillOpacity: 0.35 }, { fill: '#F5B82E', fillOpacity: 1 }, { fill: '#fff', fillOpacity: 0.35 }], { d: 380, fill: 'none' });
        this.girar(c, 120); ctx.moeda(i, cai.length);
        await espera(180);
      }
      await espera(200);
      led.setAttribute('fill', '#F5B82E'); led.setAttribute('fill-opacity', '1');
      an(led, [{ transform: 'scale(.4)' }, { transform: 'scale(1)' }], { d: 300 });
      brilhos(c, 92, 61, { n: 4, dist: 12, cor: '#ffe089' });
    },
    gestos(c) {
      const q = (s) => c.querySelector(s);
      return [
        // o segredo confere: gira um pouco para lá e para cá
        [3, async () => { await this.girar(c, 40, 500); await espera(120); await this.girar(c, -70, 600); await this.girar(c, 30, 400); }],
        // a porta entreabre, aparece o mel lá dentro, e fecha
        [2, async () => { await an(q('.porta'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.74)' }], { d: 700, e: EIO, fill: 'forwards' }); brilhos(c, 92, 78, { n: 4, dist: 12, cor: '#ffe089' }); await espera(600); await an(q('.porta'), [{ transform: 'scaleX(.74)' }, { transform: 'scaleX(1)' }], { d: 600, e: EIO, fill: 'forwards' }); }],
        [3, () => varrer(c, '.faixa-brilho', -60, 120, 1300)],
        [2, () => an(q('.led'), [{ transform: 'scale(1)', fillOpacity: 1 }, { transform: 'scale(1.5)', fillOpacity: 0.5, offset: 0.5 }, { transform: 'scale(1)', fillOpacity: 1 }], { d: 1200, e: 'ease-in-out', fill: 'none' })],
      ];
    },
    final(c) { const l = c.querySelector('.led'); l.setAttribute('fill', '#F5B82E'); l.setAttribute('fill-opacity', '1'); },
  };

  // ── T3 "Anel da meta": o contorno do hexágono enche até a meta do desejo ──
  CENAS.T3 = {
    nome: 'Anel da meta', vb: '0 0 140 140', calmo: true, intervalo: [4200, 3200], tem: 5, meta: 8,
    html(u) {
      const R = 46, marcas = Array.from({ length: this.meta }, (_, k) => hexPonto(70, 70, R, k / this.meta));
      return `${DEFS(u)}<ellipse class="sombra" cx="70" cy="128" rx="34" ry="4" fill="#0b2a5a" opacity=".2"/>
        <path d="${HEXP(70, 70, R)}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="9" stroke-linejoin="round"/>
        ${marcas.map(([x, y]) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="1.8" fill="#fff" opacity=".55"/>`).join('')}
        <path class="prog" d="${HEXP(70, 70, R)}" pathLength="1" fill="none" stroke="#F5B82E" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="1"/>
        <path class="faisca" d="${HEXP(70, 70, R)}" pathLength="1" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="0.03 0.97" stroke-dashoffset="0.03" opacity="0"/>
        <g class="ponta" style="opacity:0"><circle r="7" fill="#F5B82E" stroke="#fff" stroke-width="2.5"/></g>
        <circle class="onda" r="7" fill="none" stroke="#fff" stroke-width="2" opacity="0"/>
        <g class="selo"><path d="${HEXP(70, 70, 24)}" fill="url(#${u}mel)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="m60.5 70.5 6.5 6.5 12-13" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="fichas"><g class="cai" style="opacity:0">${fichaHex(u, 7)}</g></g>
        <g class="fx"></g>`;
    },
    pos(f) { const [x, y] = hexPonto(70, 70, 46, f); return `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`; },
    // Ganhou 1 ou 50: o anel anda UMA vez, suave, da fração de antes até a de agora (sem passos).
    async chegada(c, ctx) {
      const q = (s) => c.querySelector(s), prog = q('.prog'), ponta = q('.ponta'), m = q('.cai');
      const f0 = Math.min(1, ctx.antes / this.meta), f1 = Math.min(1, ctx.total / this.meta);
      prog.setAttribute('stroke-dashoffset', 1 - f0); ponta.style.opacity = 1; ponta.style.transform = this.pos(f0);
      await an(q('.selo'), [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }], { m: M.suave });
      const [x0, y0] = hexPonto(70, 70, 46, f0); m.style.opacity = 1;
      await an(m, [{ transform: 'translate(-24px,40px) scale(.6)', opacity: 0 }, { transform: `translate(${(x0 - 24) / 2}px,${Math.min(y0, 40) - 26}px) scale(1)`, opacity: 1, offset: 0.55 }, { transform: `translate(${x0}px,${y0}px) scale(.5)`, opacity: 0.2 }], { d: 560, e: 'cubic-bezier(.4,.1,.6,1)' });
      m.style.opacity = 0; ctx.moeda();
      const d = Math.round(Math.max(700, Math.min(1800, 700 + (f1 - f0) * 1800)));
      an(prog, [{ strokeDashoffset: 1 - f0 }, { strokeDashoffset: 1 - f1 }], { d, e: EIO });
      const fr = []; for (let k = 0; k <= 24; k++) fr.push({ transform: this.pos(f0 + ((f1 - f0) * k) / 24) });
      await an(ponta, fr, { d, e: EIO });
      const [x, y] = hexPonto(70, 70, 46, f1);
      if (f1 >= 1) { // chegou na meta: o símbolo vira e solta brilhos
        an(ponta, [{ opacity: 1 }, { opacity: 0 }], { d: 300 });
        await an(q('.selo'), [{ transform: 'scale(1)' }, { transform: 'scale(1.15) scaleX(0)', offset: 0.45 }, { transform: 'scale(1)' }], { d: 900, e: EIO, fill: 'none' });
        brilhos(c, 70, 50, { n: 12, dist: 40, cor: '#ffe089', de: -180, ate: 0 });
      } else brilhos(c, x, y, { n: 4, dist: 12, cor: '#ffe089' });
    },
    ola: async (c) => { await espera(300); const p = CENAS.T3.tem / CENAS.T3.meta, t = CENAS.T3.pos(Math.min(1, p)); an(c.querySelector('.onda'), [{ transform: `${t} scale(1)`, opacity: 0.8 }, { transform: `${t} scale(2.4)`, opacity: 0 }], { d: 1100, e: 'ease-out', fill: 'none' }); },
    gestos(c) {
      const q = (s) => c.querySelector(s), p = Math.min(1, this.tem / this.meta);
      return [
        // uma faísca corre pelo caminho já feito até a ponta
        [3, async () => { const f = q('.faisca'); await an(f, [{ strokeDashoffset: 0.03, opacity: 0 }, { strokeDashoffset: 0.03 - p * 0.3, opacity: 1, offset: 0.3 }, { strokeDashoffset: 0.03 - p, opacity: 0 }], { d: 1400, e: 'ease-in-out', fill: 'none' }); }],
        // a ponta "respira" e solta uma ondinha
        [2, async () => { const o = q('.onda'), t = this.pos(p); an(o, [{ transform: `${t} scale(1)`, opacity: 0.8 }, { transform: `${t} scale(2.4)`, opacity: 0 }], { d: 1100, e: 'ease-out', fill: 'none' }); await an(q('.ponta circle'), [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { d: 700, fill: 'none' }); }],
        // o selo do meio vira (como uma moeda) e volta mostrando o check
        [2, () => an(q('.selo'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)', offset: 0.45 }, { transform: 'scaleX(1)' }], { d: 900, e: EIO, fill: 'none' })],
        [1, () => an(q('.selo'), [{ transform: 'scale(1)' }, { transform: 'scale(1.07)', offset: 0.4 }, { transform: 'scale(1)' }], { d: 1000, e: 'ease-in-out', fill: 'none' })],
      ];
    },
    final(c) { const q = (s) => c.querySelector(s), p = Math.min(1, this.tem / this.meta); q('.prog').setAttribute('stroke-dashoffset', 1 - p); q('.ponta').style.opacity = 1; q('.ponta').style.transform = this.pos(p); },
  };

  // "+10" (ou "+1 semana") que sobe do canto da arte e some.
  function maisN(cena, n, unidade = '') {
    if (!n || calmo()) return;
    const fx = cena.querySelector('.fx'), g = document.createElementNS(NS, 'g'), txt = '+' + n + (unidade ? ' ' + unidade : '');
    const w = 14 + txt.length * 7.4;
    g.innerHTML = `<rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="11" fill="#F5B82E" stroke="#fff" stroke-width="2"/><text x="0" y="5" text-anchor="middle" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-weight="800" font-size="13" fill="#13203a">${txt}</text>`;
    fx.appendChild(g);
    an(g, [{ transform: 'translate(26px,40px) scale(.5)', opacity: 0 }, { transform: 'translate(26px,22px) scale(1)', opacity: 1, offset: 0.25 }, { transform: 'translate(26px,14px) scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(26px,4px) scale(.9)', opacity: 0 }], { d: 1900, e: EO, fill: 'none' }).then(() => g.remove());
  }

  // ═══ SEÇÃO: Montagem e ciclo (chegada → parada → gesto de vez em quando) ═══
  const CSS_BASE = `.cm-arte{display:block;overflow:visible}
  .cm-arte .bee-pos,.cm-arte .tudo,.cm-arte .colmeia,.cm-arte .fatia,.cm-arte .pilha{transform-box:fill-box;transform-origin:50% 100%}
  .cm-arte .tampa{transform-box:view-box;transform-origin:18px 78px}
  .cm-arte .bee-pos.na-porta{transform-origin:50% 80%}
  .cm-arte .corpo-todo{transform-box:view-box;transform-origin:70px 121px}
  .cm-arte .asa,.cm-arte .braco,.cm-arte .ant{transform-box:view-box}
  .cm-arte .asa.e{transform-origin:60px 56px}.cm-arte .asa.d{transform-origin:80px 56px}
  .cm-arte .braco.e{transform-origin:34px 88px}.cm-arte .braco.d{transform-origin:106px 88px}
  .cm-arte .ant.e{transform-origin:61px 48px}.cm-arte .ant.d{transform-origin:79px 48px}
  .cm-arte .olho,.cm-arte .boch,.cm-arte .led,.cm-arte .cel,.cm-arte .disco,.cm-arte .selo,.cm-arte .cofre{transform-box:fill-box;transform-origin:50% 50%}
  .cm-arte .porta{transform-box:view-box;transform-origin:35px 78px}`;

  function montar(alvo, tipo, o = {}) {
    if (!document.getElementById('cm-css')) { const s = document.createElement('style'); s.id = 'cm-css'; s.textContent = CSS_BASE; document.head.appendChild(s); }
    const cena = CENAS[tipo], u = 'cs' + ++uid, t = o.tamanho || 120;
    const [, , vw, vh] = cena.vb.split(' ').map(Number);
    cena.tem = +(o.saldo ?? 0); if (o.meta) cena.meta = o.meta;
    alvo.innerHTML = `<svg class="cm-arte" width="${t}" height="${Math.round((t * vh) / vw)}" viewBox="${cena.vb}" aria-hidden="true">${cena.html(u)}</svg>`;
    const c = alvo.firstElementChild, G = c.querySelector('.bee') ? gestosMel(c.querySelector('.bee')) : null, numero = o.numero, total = +(o.saldo ?? numero?.textContent ?? 0);
    // @regra o saldo anda de uma vez, do que a pessoa viu na última visita (antes) até o de agora,
    //        em tempo proporcional ao ganho (0,7 a 1,6 s). Ganhou 10 ou 50, é sempre UMA contagem suave.
    //        As moedas que caem são só o símbolo da chegada (sempre poucas), nunca uma por unidade.
    const antes = Math.max(0, Math.min(total, +(o.antes ?? 0))), ganho = total - antes;
    let parar = false, timer = null, ultimo = -1, contou = false;
    const ctx = {
      mel: G, antes, total, ganho,
      moeda: () => {
        if (contou) { if (numero) pulsarNumero(numero); return; }
        contou = true; maisN(c, ganho, o.unidade);
        if (numero) { contar(numero, antes, total, Math.max(700, Math.min(1600, 600 + ganho * 18))); pulsarNumero(numero); }
      },
    };
    const lista = cena.gestos(c, G);
    // @regra gestos espaçados (3,5 a 7 s), nunca o mesmo duas vezes seguidas, e só com a tela visível.
    const agenda = () => {
      if (parar) return;
      timer = setTimeout(async () => {
        if (!document.hidden && !parar) {
          const pool = lista.map((g, i) => [g, i]).filter(([, i]) => i !== ultimo), soma = pool.reduce((s, [g]) => s + g[0], 0);
          let r = Math.random() * soma, pick = pool[0];
          for (const p of pool) { r -= p[0][0]; if (r <= 0) { pick = p; break; } }
          ultimo = pick[1]; await pick[0][1]();
        }
        agenda();
      }, o.intervalo ? o.intervalo() : (cena.intervalo ? cena.intervalo[0] + Math.random() * cena.intervalo[1] : 3500 + Math.random() * 3500));
    };
    const comecar = async () => {
      if (calmo()) { cena.final?.(c); if (numero) numero.textContent = total; return; } // arte final parada
      if (numero) numero.textContent = antes;
      if (ganho <= 0) { cena.final?.(c); await cena.ola?.(c, ctx); } // nada novo: só um "oi"
      else await cena.chegada(c, ctx);
      if (numero) numero.textContent = total;
      agenda();
    };
    comecar();
    return {
      parar() { parar = true; clearTimeout(timer); },
      repetir() { this.parar(); return montar(alvo, tipo, o); },
      gesto: async (i) => { const g = lista[i ?? Math.floor(Math.random() * lista.length)]; await g?.[1](); },
    };
  }
  window.CofrinhoMel = { montar, CENAS };
})();
