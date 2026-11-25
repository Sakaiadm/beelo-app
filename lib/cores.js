// @arquivo  cores.js: cores sugeridas para as pessoas e a primeira livre.
// @tipo     regra
// @usado-por app/(app)/config/pessoas/nova/page.js, components/CorFolha.js
// Cores sugeridas para as pessoas. A primeira que ainda não está em uso vira a cor inicial.
export const CORES_PESSOA = ['#1a6fe0', '#7b61d1', '#e08a1a', '#2c9a5b', '#d94f7a', '#14a3b8', '#8a5a2b', '#6b7280', '#c2410c', '#7c3aed', '#0f766e', '#be123c'];
export function corLivre(membros) {
  const usadas = new Set((membros || []).map((m) => String(m.cor || '').toLowerCase()));
  const livre = CORES_PESSOA.find((c) => !usadas.has(c));
  if (livre) return livre;
  // Todas em uso: gera uma cor nova, espaçada pelo número de pessoas.
  const n = (membros || []).length;
  return hsl((n * 47) % 360);
}
function hsl(h) {
  const s = 0.6, l = 0.45, a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return '#' + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
