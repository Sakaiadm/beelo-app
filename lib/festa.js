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

function tom(f, t0, dur, vol) {
  const t = ac.currentTime + t0, o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}

// "Plim" suave (o som aprovado para todos).
export function tocarSom() {
  if (!ac || !somLigado()) return;
  try { tom(880, 0, 0.18, 0.12); tom(1320, 0.07, 0.22, 0.08); } catch {}
}

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

// Avisa a tela (componente Festa) que uma tarefa foi concluída.
export function comemorar({ ultima = false } = {}) {
  tocarSom();
  window.dispatchEvent(new CustomEvent('ra-festa', { detail: { ultima } }));
}
