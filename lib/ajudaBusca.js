// @arquivo  lib/ajudaBusca.js: busca da Ajuda: acha respostas prontas com sinônimos, sem acento e com erro de digitação. Sem tela, sem banco.
// @tipo     regra
// @usa      nada (funções puras, rodam no aparelho)
// @usado-por components/AjudaBusca.js, testes/ajuda-busca.mjs
// @cuidado  Cada item da Ajuda é [titulo, texto, capitulo?]. Os sinônimos ficam escondidos: a pessoa digita "remarcar" e acha "Como adiar uma tarefa".
//           Mudou ou criou uma função? Acrescente os jeitos de falar dela em SINONIMOS.

// ═══ SEÇÃO: Texto sem acento ═══════════════════════════════════════════════
// @regra Cada letra com acento vira uma letra só, então o tamanho do texto não muda (importa para destacar no manual).
export const norm = (s) => String(s || '').toLowerCase().replace(/[^\u0000-\u007f]/g, (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '')).replace(/ç/g, 'c');
const palavras = (s) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

// ═══ SEÇÃO: Sinônimos (grupos de jeitos de falar a mesma coisa) ═══════════
export const SINONIMOS = [
  ['adiar', 'adiamento', 'remarcar', 'postergar', 'depois', 'amanha', 'outro dia', 'mais tempo', 'prazo', 'empurrar'],
  ['justificar', 'justificativa', 'motivo', 'desculpa', 'explicar', 'atraso', 'atrasada', 'atrasou'],
  ['premio', 'premios', 'presente', 'recompensa', 'ganhar', 'trocar', 'troca', 'vitrine'],
  ['desejo', 'desejos', 'presente', 'pedir', 'sugerir', 'querer', 'quero', 'lista de desejos'],
  ['cofrinho', 'estrelinha', 'estrelinhas', 'estrela', 'estrelas', 'semana conquistada', 'semanas conquistadas', 'saldo', 'pontos'],
  ['desafio', 'desafios', 'missao', 'meta', 'jogo', 'coringa'],
  ['senha', 'login', 'entrar', 'acesso', 'link', 'conta', 'google'],
  ['convite', 'convidar', 'email', 'e-mail', 'cadastrar', 'adicionar', 'pessoa', 'pessoas'],
  ['foto', 'imagem', 'camera', 'galeria', 'fotografia'],
  ['tempo de tela', 'tela', 'celular', 'computador'],
  ['aviso', 'avisos', 'notificacao', 'notificacoes', 'sino', 'sininho', 'lembrete'],
  ['privacidade', 'privado', 'irmao', 'irmaos', 'segredo', 'esconder', 'lgpd'],
  ['papel', 'parentesco', 'pai', 'mae', 'filho', 'filha', 'supervisor', 'adulto'],
  ['escuro', 'noite', 'tema'],
  ['internet', 'sinal', 'offline', 'wifi', 'conexao'],
  ['mel', 'abelha', 'abelhinha', 'guia', 'dica', 'dicas'],
  ['ideia', 'ideias', 'lampada'],
  ['manual', 'ajuda', 'duvida', 'whatsapp', 'suporte'],
  ['relatorio', 'relatorios', 'pdf', 'evolucao', 'grafico', 'cumprimento'],
  ['agenda', 'calendario'],
  ['modo crianca', 'jeito', 'divertido', 'calmo', 'aparencia'],
  ['categoria', 'categorias'],
  ['grupo', 'grupos', 'familia'],
  ['mural', 'medalha', 'conquistas', 'conquista'],
  ['concluir', 'terminar', 'feito', 'fiz', 'marcar', 'check', 'bolinha', 'circulo'],
];
const PARADAS = new Set('de da do das dos a o as os um uma e em no na nos nas para por com que como eu meu minha seu sua quero saber posso fazer onde qual quais se ao ou mais muito pra pro e eh sou estou dar dou tem ter ficar fica vai'.split(' '));

// ═══ SEÇÃO: Parecido (erro de digitação) ══════════════════════════════════
function distancia(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let ant = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const at = [i];
    for (let j = 1; j <= b.length; j++) at[j] = Math.min(ant[j] + 1, at[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    ant = at;
  }
  return ant[b.length];
}
// 1 = igual, 0.85 = começo da palavra, 0.7 = quase igual (1 ou 2 letras trocadas), 0 = nada.
function parecida(q, w) {
  if (q === w) return 1;
  const q2 = q.replace(/s$/, ''), w2 = w.replace(/s$/, '');
  if (q2 === w2) return 1;
  if (q.length >= 3 && w.startsWith(q)) return 0.85;
  if (q.length >= 4) {
    const max = q.length >= 7 ? 2 : 1;
    if (distancia(q2, w2, max) <= max) return 0.7;
  }
  return 0;
}

// ═══ SEÇÃO: Buscar ═════════════════════════════════════════════════════════
const gruposDe = (t) => SINONIMOS.filter((g) => g.includes(t) || g.some((x) => !x.includes(' ') && parecida(t, x) >= 0.85 && t.length >= 4));

// Quanto um termo (palavra ou frase) aparece num texto já separado em palavras.
function acha(termo, norma, pal) {
  if (termo.includes(' ')) return norma.includes(termo) ? 1 : 0;
  let m = 0;
  for (const w of pal) { const p = parecida(termo, w); if (p > m) m = p; if (m === 1) break; }
  return m;
}

// itens: [titulo, texto, capitulo?, extra?]. Devolve até `max` itens, do mais para o menos parecido.
export function buscar(itens, consulta, max = 5) {
  let toks = palavras(consulta).filter((t) => !PARADAS.has(t));
  // "tarefa" está em quase toda resposta: só conta quando é a única palavra da busca.
  if (toks.length > 1) toks = toks.filter((t) => !/^tarefas?$/.test(t));
  if (!toks.length) return [];
  const prep = itens.map((it) => ({ it, tit: norm(it[0]), pt: palavras(it[0]), tx: norm(it[1]), px: palavras(it[1]) }));
  const exigidos = Math.max(1, Math.ceil(toks.length * 0.5));
  // Palavra que aparece em quase todas as respostas (ex.: "tarefa") vale menos que uma rara (ex.: "remarcar").
  const peso = Object.fromEntries(toks.map((t) => {
    const df = prep.filter((p) => acha(t, p.tit, p.pt) >= 0.85 || acha(t, p.tx, p.px) >= 0.85).length;
    return [t, 0.1 + 0.9 * (1 - df / prep.length) ** 2];
  }));
  return prep.map((p) => {
    let total = 0, cobertos = 0;
    for (const t of toks) {
      let melhor = 0;
      const variantes = [[t, 1], ...gruposDe(t).flatMap((g) => g.filter((x) => x !== t).map((x) => [x, 0.6]))];
      for (const [v, pv] of variantes) {
        const nt = acha(v, p.tit, p.pt), nx = acha(v, p.tx, p.px);
        melhor = Math.max(melhor, pv * Math.max(nt * 2.5, nx));
      }
      if (melhor > 0) { cobertos++; total += melhor * peso[t]; }
    }
    return { it: p.it, total, cobertos };
  }).filter((r) => r.cobertos >= exigidos && r.total >= 0.9).sort((a, b) => b.total - a.total || b.cobertos - a.cobertos).slice(0, max).map((r) => r.it);
}
