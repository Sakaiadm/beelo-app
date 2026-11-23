// Mostra só os aparelhos que têm tempo no previsto (o que está em 0h00 não conta).
export function aparelhosDo(previsto) {
  if (!previsto || previsto.formato === 'total') return { cel: true, pc: true };
  const cel = previsto.min_celular != null, pc = previsto.min_computador != null;
  return cel || pc ? { cel, pc } : { cel: true, pc: true };
}

