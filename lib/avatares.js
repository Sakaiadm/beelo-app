// Avatares prontos. Guardados no banco como "preset:m1" (moderno) ou "preset:d1" (divertido).
export const MODERNOS = [
  ['m1', '#1a6fe0', '#7c3aed', 'circulo'], ['m2', '#f97316', '#ec4899', 'triangulo'], ['m3', '#10b981', '#0ea5e9', 'ondas'],
  ['m4', '#111827', '#6366f1', 'aneis'], ['m5', '#f43f5e', '#f59e0b', 'metade'], ['m6', '#0ea5e9', '#14b8a6', 'quadrado'],
  ['m7', '#8b5cf6', '#ec4899', 'ondas'], ['m8', '#84cc16', '#16a34a', 'triangulo'],
];
export const DIVERTIDOS = [
  ['d1', '🦊', '#fde4cf'], ['d2', '🐼', '#e6ecf5'], ['d3', '🐯', '#fdecc8'], ['d4', '🐸', '#dcf3dc'],
  ['d5', '🐙', '#f9d9e6'], ['d6', '🦄', '#ece0fb'], ['d7', '🐧', '#d9ecf7'], ['d8', '🦁', '#fbe7b8'],
];
export const ehPreset = (v) => typeof v === 'string' && /^preset:[md]\d{1,2}$/.test(v);

export function formaPreset(id) {
  const m = MODERNOS.find((x) => x[0] === id), d = DIVERTIDOS.find((x) => x[0] === id);
  return m ? { tipo: 'm', a: m[1], b: m[2], forma: m[3] } : d ? { tipo: 'd', emoji: d[1], fundo: d[2] } : null;
}
