// Comemorações: sons feitos pelo navegador (sem arquivo) e o aviso para a tela comemorar.
// Os dois sons de sempre continuam iguais: "Plim" (adulto) e "Escadinha" (criança), tocando direto.
// Os novos (aprovados pelo Thomas em 25/11) passam por um compressor e um pouco de eco de sala.
let ac = null, mestre = null, rev = null, ruido = null;

export function somLigado() {
  try { return localStorage.getItem('ra_som') !== '0'; } catch { return true; }
}
export function ligarSom(on) {
  try { localStorage.setItem('ra_som', on ? '1' : '0'); } catch {}
}

// Precisa ser chamado dentro do toque (regra dos navegadores, principalmente no iPhone).
export function prepararSom() {
  if (!somLigado()) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch { ac = null; }
}

function mesa() {
  if (mestre) return;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ac.destination);
  mestre = ac.createGain(); mestre.gain.value = 0.95; mestre.connect(comp);
  rev = ac.createConvolver();
  const n = Math.floor(ac.sampleRate * 1.6), b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  rev.buffer = b; const rg = ac.createGain(); rg.gain.value = 0.28; rev.connect(rg); rg.connect(comp);
  ruido = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const r = ruido.getChannelData(0); for (let i = 0; i < r.length; i++) r[i] = Math.random() * 2 - 1;
}

// Os de sempre: tocam exatamente como antes.
function tom(f, t0, dur, vol, tipo = 'sine') {
  const t = ac.currentTime + t0, o = ac.createOscillator(), g = ac.createGain();
  o.type = tipo; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
// Os novos.
function nota(f, t0, d, o = {}) {
  const { tipo = 'sine', vol = 0.1, f2, at = 0.008, wet = 0.45, det = 0, lp } = o;
  const t = ac.currentTime + t0, osc = ac.createOscillator(), g = ac.createGain();
  osc.type = tipo; osc.frequency.setValueAtTime(f, t); if (det) osc.detune.value = det;
  if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + d * (o.glide || 0.6));
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  let s = osc; if (lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; fl.Q.value = 0.7; osc.connect(fl); s = fl; }
  s.connect(g); g.connect(mestre); if (wet) { const w = ac.createGain(); w.gain.value = wet; g.connect(w); w.connect(rev); }
  osc.start(t); osc.stop(t + d + 0.05);
}
function sino(f, t0, vol = 0.07, d = 1.1) { nota(f, t0, d, { vol }); nota(f * 2.756, t0, d * 0.45, { vol: vol * 0.32 }); nota(f * 5.404, t0, d * 0.22, { vol: vol * 0.14 }); nota(f * 1.003, t0, d, { vol: vol * 0.5, det: 7 }); }
function chiado(t0, d, o = {}) {
  const t = ac.currentTime + t0, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = ruido; fl.type = o.tipo || 'highpass'; fl.frequency.setValueAtTime(o.freq || 6000, t); fl.Q.value = o.q || 0.8;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.vol || 0.03, t + (o.at || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(mestre); if (o.wet) { const w = ac.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(rev); }
  s.start(t); s.stop(t + d + 0.05);
}
function zumbido(t0, d, vol = 0.035) {
  const t = ac.currentTime + t0, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), bp = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(175, t); o.frequency.linearRampToValueAtTime(240, t + d * 0.8);
  lfo.frequency.value = 26; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
  bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.6;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.06); g.gain.setValueAtTime(vol, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(bp); bp.connect(g); g.connect(mestre); o.start(t); lfo.start(t); o.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
}
function moedinha(t0, k = 0) { const f = 1976 * Math.pow(1.06, k % 5); nota(f, t0, 0.08, { tipo: 'square', vol: 0.018, lp: 6000, wet: 0.2 }); nota(f * 1.335, t0 + 0.045, 0.32, { tipo: 'square', vol: 0.02, lp: 7000, wet: 0.35 }); }

const SONS = {
  // Marcar tarefa (ficam como sempre foram).
  plim: () => { tom(880, 0, 0.18, 0.12); tom(1320, 0.07, 0.22, 0.08); },
  // Jeito Calmo: duas notas baixinhas e redondas.
  suave: () => { tom(660, 0, 0.35, 0.07); tom(880, 0.12, 0.45, 0.05); },
  escadinha: () => { [523, 659, 784, 1047].forEach((f, i) => tom(f, i * 0.08, 0.3, 0.14, 'triangle')); tom(1568, 0.34, 0.5, 0.07); tom(2093, 0.4, 0.45, 0.05); },
  // Abelha aparece voando: "Zumbido feliz".
  zumbido: () => { zumbido(0, 0.55); sino(1760, 0.5, 0.06); chiado(0.5, 0.3, { freq: 7000, vol: 0.012, wet: 0.4 }); },
  ding: () => sino(1760, 0, 0.06),
  // Dia completo (criança): "Caixinha de música".
  caixinha: () => { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => sino(f, i * 0.1 + (i % 2 ? 0.02 : 0), 0.055)); sino(2093, 0.62, 0.05, 1.6); sino(1568, 0.62, 0.04, 1.6); },
  // Sequência (criança) e presente abrindo: "Varinha de brilho".
  varinha: () => { [1319, 1568, 1760, 2093, 2349, 2637, 3136, 3520].forEach((f, i) => nota(f, i * 0.045, 0.5, { vol: 0.035, wet: 0.7 })); chiado(0, 0.9, { freq: 8000, vol: 0.02, wet: 0.6, at: 0.3 }); },
  // Selo conquistado (criança): "Fanfarra de mel".
  fanfarra: () => { [[392, 0, 0.14], [523, 0.14, 0.14], [659, 0.28, 0.14], [784, 0.44, 0.7]].forEach(([f, t, d]) => { nota(f, t, d + 0.1, { tipo: 'sawtooth', vol: 0.05, lp: 2200, at: 0.02 }); nota(f * 1.005, t, d + 0.1, { tipo: 'sawtooth', vol: 0.035, lp: 1800, at: 0.02 }); }); chiado(0.44, 0.5, { freq: 5000, vol: 0.02, wet: 0.5 }); sino(1568, 0.5, 0.04, 1.2); },
  // Adulto (dia completo, sequência e conquista): "Cristal".
  cristal: () => { sino(1319, 0, 0.05, 1.2); sino(1976, 0.09, 0.035, 1.2); },
  // Moedas no cofrinho: "Moedinhas" (uma por moeda).
  moedinha: (k = 0) => moedinha(0, k),
};
export function tocarSom(nome = 'plim', arg) {
  if (!ac || !somLigado()) return;
  try { if (ac.state === 'suspended') ac.resume(); mesa(); (SONS[nome] || SONS.plim)(arg); } catch {}
}

// Modo criança: a abelha leva a estrela, com o som "Escadinha".
export function proximaAnimacao() { return { tipo: 'abelha', som: 'escadinha' }; }

export const MENSAGENS = [
  'Boa, {n}! Mais uma estrela!', 'Mandou bem, {n}!', 'Isso aí! Tarefa feita!', 'Você é fera, {n}!',
  'Arrasou! Continue assim!', 'Uhuu! Mais uma para a conta!', 'Que capricho, {n}!', 'Show de bola!',
];
export const MENSAGEM_FINAL = 'Dia completo! 5 estrelas, parabéns!';
let ultimaMsg = -1;
export function sortearMensagem(nome, sorteio = Math.random) {
  let i;
  do { i = Math.floor(sorteio() * MENSAGENS.length); } while (i === ultimaMsg && MENSAGENS.length > 1);
  ultimaMsg = i;
  return MENSAGENS[i].replaceAll('{n}', nome);
}

// Avisa a tela (componente Festa) que uma tarefa foi concluída. O Festa toca o som e mostra a comemoração.
// dia: { seq: dias seguidos contando hoje, semana: [7 x feito?] de segunda a domingo, hj: índice de hoje }.
export function comemorar({ ultima = false, x = null, y = null, dia = null } = {}) {
  window.dispatchEvent(new CustomEvent('ra-festa', { detail: { ultima, x, y, dia } }));
}
