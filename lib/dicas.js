// Dicas na hora certa (seção 66): o servidor só calcula os FATOS e as dicas possíveis.
// Quem decide se mostra (1 por dia, 14 dias sem repetir, ritmo, pausa, equilíbrio) é o componente
// DicaFaixa, no aparelho, com o que já foi mostrado ali. Nada vai para o banco.
import { addDias } from './util';
import { ideiaDaSemana, numeroSemana } from './ideias';

// lista: [{ o, st }] com pelo menos os últimos 7 dias da pessoa.
export function fatos(lista, membroId, hoje) {
  const minhas = lista.filter((x) => x.o.membro_id === membroId && x.o.data >= addDias(hoje, -7) && x.o.data <= hoje);
  const atrasos = minhas.filter((x) => ['atrasada', 'nao_cumprida'].includes(x.st)).length;
  const refazer = minhas.filter((x) => x.o.conferido === 'refazer').length;
  // Dias seguidos em dia, contando para trás a partir de ontem (hoje entra se já estiver tudo feito).
  const porDia = {};
  minhas.forEach(({ o, st }) => {
    if (['adiada', 'adiamento_pedido', 'cancelada'].includes(st)) return;
    const d = (porDia[o.data] ||= { total: 0, ok: 0 }); d.total++;
    if (st.startsWith('cumprida') || st === 'justificada') d.ok++;
  });
  let seguidos = 0;
  const h = porDia[hoje];
  if (h && h.total && h.ok === h.total) seguidos++;
  for (let i = 1; i <= 7; i++) {
    const d = porDia[addDias(hoje, -i)];
    if (!d || !d.total) { if (i === 1 && seguidos === 0) continue; break; }
    if (d.ok < d.total) break;
    seguidos++;
  }
  return { atrasos, refazer, seguidos };
}

const juntar = (nomes) => nomes.length <= 1 ? nomes[0] || '' : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;

// Dicas possíveis, da mais importante para a menos. tipo: 'boa' (positiva), 'neutra' ou 'atraso'.
export function candidatosFilho(f, hoje) {
  const c = [];
  if (f.seguidos >= 5) c.push({ k: 'conquista5', tipo: 'boa', t: `${f.seguidos} dias seguidos em dia!`, x: 'Pequenas tarefas, grandes pessoas.', i: 'pequenas-tarefas' });
  else if (f.seguidos >= 3) c.push({ k: 'conquista3', tipo: 'boa', t: '3 dias seguidos em dia', x: 'Cada dia em dia é uma conquista sua.', i: 'voce-contra-voce' });
  if (f.atrasos >= 3) c.push({ k: 'semana-puxada', tipo: 'atraso', t: 'Semana puxada?', x: 'Escolha a tarefa mais rápida para começar. Uma de cada vez.', i: 'comece-pela-mais-rapida' });
  if (f.refazer >= 2) c.push({ k: 'refazer', tipo: 'atraso', t: 'Refazer faz parte', x: 'Da próxima vez já sai melhor. Se tiver dúvida, pergunte.', i: 'peca-ajuda' });
  if (f.atrasos >= 1) c.push({ k: 'primeiro-atraso', tipo: 'atraso', t: 'Esqueceu? Acontece', x: 'Você pode concluir agora ou pedir para adiar.', i: 'esqueceu-acontece' });
  c.push({ k: 'inicio', tipo: 'neutra', inicio: true, t: 'Combinar é diferente de mandar', x: 'Você também pode dar ideias e sugerir horários.', i: 'combinar-nao-e-mandar' });
  const s = ideiaDaSemana(false, hoje);
  c.push({ k: `semana-${numeroSemana(hoje)}`, tipo: 'neutra', semana: true, t: 'Ideia da semana', x: s.t + '.', i: s.id });
  return c;
}

// fs: [{ nome, fatos }] de cada filho ativo.
export function candidatosPais(fs, hoje) {
  const c = [];
  const em5 = fs.filter((x) => x.fatos.seguidos >= 5).map((x) => x.nome);
  const atr3 = fs.filter((x) => x.fatos.atrasos >= 3).map((x) => x.nome);
  const ref2 = fs.filter((x) => x.fatos.refazer >= 2).map((x) => x.nome);
  const atr1 = fs.filter((x) => x.fatos.atrasos >= 1).map((x) => x.nome);
  if (em5.length) c.push({ k: 'conquista5', tipo: 'boa', t: `${juntar(em5)} ${em5.length > 1 ? 'estão' : 'está'} 5 dias em dia!`, x: 'Que tal comemorar juntos?', i: 'comemorem' });
  if (atr3.length) c.push({ k: 'padrao-atrasos', tipo: 'atraso', t: `${juntar(atr3)} ${atr3.length > 1 ? 'tiveram' : 'teve'} vários atrasos nesta semana`, x: 'Talvez a tarefa ou o horário precise de ajuste. Conversem juntos.', i: 'quando-resiste' });
  if (ref2.length) c.push({ k: 'refazer', tipo: 'atraso', t: 'Antes de pedir para refazer de novo', x: 'Que tal mostrar primeiro o que ficou bom?', i: 'refazer-com-carinho' });
  if (atr1.length) c.push({ k: 'primeiro-atraso', tipo: 'atraso', t: `${juntar(atr1)} ${atr1.length > 1 ? 'têm tarefas atrasadas' : 'tem tarefa atrasada'}`, x: 'Que tal perguntar como foi o dia antes de falar dela?', i: 'quando-esquece' });
  c.push({ k: 'inicio', tipo: 'neutra', inicio: true, t: 'Comecem juntos', x: 'Monte as primeiras tarefas junto com quem vai fazer.', i: 'combinem-juntos' });
  const s = ideiaDaSemana(true, hoje);
  c.push({ k: `semana-${numeroSemana(hoje)}`, tipo: 'neutra', semana: true, t: 'Ideia da semana', x: s.t + '.', i: s.id });
  return c;
}
