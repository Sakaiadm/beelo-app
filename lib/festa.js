// Comemoração ao concluir uma tarefa: animação discreta + som curtinho (todos) e,
// no modo criança, uma mensagem alegre sorteada. O som é gerado pelo navegador (sem arquivo).
let ac = null;

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

function tom(f, t0, dur, vol, tipo = 'sine') {
  const t = ac.currentTime + t0, o = ac.createOscillator(), g = ac.createGain();
  o.type = tipo; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}

const SONS = {
  // "Plim" suave: adolescentes e adultos.
  plim: () => { tom(880, 0, 0.18, 0.12); tom(1320, 0.07, 0.22, 0.08); },
  // Modo criança: "Escadinha" (vai com as estrelinhas).
  escadinha: () => { [523, 659, 784, 1047].forEach((f, i) => tom(f, i * 0.08, 0.3, 0.14, 'triangle')); tom(1568, 0.34, 0.5, 0.07); tom(2093, 0.4, 0.45, 0.05); },
};
export function tocarSom(nome = 'plim') {
  if (!ac || !somLigado()) return;
  try { (SONS[nome] || SONS.plim)(); } catch {}
}

// Modo criança: estrelinhas saindo da bolinha, com o som "Escadinha".
export function proximaAnimacao() { return { tipo: 'estrelas', som: 'escadinha' }; }

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

// Avisa a tela (componente Festa) que uma tarefa foi concluída. O Festa toca o som
// (o "plim" ou, no modo criança, o da animação) e mostra a comemoração.
export function comemorar({ ultima = false, x = null, y = null } = {}) {
  window.dispatchEvent(new CustomEvent('ra-festa', { detail: { ultima, x, y } }));
}
