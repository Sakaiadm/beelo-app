// @arquivo  lib/guia.js: regras e textos do Guia da Mel (dicas curtas por tela e por público). Sem tela, sem banco.
// @tipo     regra
// @usa      lib/jeito.js (jeito de ver), localStorage do aparelho (o que cada pessoa já viu)
// @usado-por components/GuiaMel.js, components/FavoMel.js, components/GuiaAjuda.js, app/(app)/layout.js
// @cuidado  Beta: só funciona com ra_familias.guia_mel ligado (SQL 0024). Desligado, nada aparece.
//           O estado de "já vi" fica no aparelho (como as Dicas na hora certa), nunca no banco.
import { jeitoDe, temJeito } from './jeito';

// ═══ SEÇÃO: Quem é quem (três públicos) ═══════════════════════════════════
// @decisao 25/11 Thomas: gestor (guia completo), adolescente 13+ (por módulo, sem personagem), criança (palavras simples).
export function publicoDe(eu, gestor) {
  if (gestor) return 'gestor';
  if (temJeito(eu)) return 'crianca';        // Filho(a) no modo criança (Divertido ou Calmo)
  if (eu?.papel === 'filho') return 'adolescente'; // Filho(a) "como os adultos"
  return null;                                 // Adulto que ajuda: sem guia
}
export const jeitoGuia = (eu) => (temJeito(eu) ? jeitoDe(eu) : 'adultos');

// ═══ SEÇÃO: Estado guardado no aparelho ═══════════════════════════════════
const chave = (m) => `beelo_guia_${m}`;
const VAZIO = { vistas: {}, puladas: {}, off: false, grupo: false, ideia: false, favoX: false, favoFim: false, dia: '', novasHoje: 0, seguidas: 0, ultPulo: 0 };

export function lerGuia(m) {
  try { return { ...VAZIO, ...(JSON.parse(localStorage.getItem(chave(m)) || 'null') || {}) }; } catch { return { ...VAZIO }; }
}
export function gravarGuia(m, e) {
  try { localStorage.setItem(chave(m), JSON.stringify(e)); } catch { /* sem espaço ou modo privado: segue sem guardar */ }
  try { window.dispatchEvent(new Event('beelo-guia')); } catch { /* fora do navegador */ }
}
export function recomecarGuia(m) {
  const e = lerGuia(m);
  gravarGuia(m, { ...VAZIO, off: e.off });
}

// ═══ SEÇÃO: Textos das dicas ═══════════════════════════════════════════════
// Cada dica: k (id), p (público), rota (onde aparece), quando (condição), entrada (parte da entrada, em ordem),
// livre (não conta no limite de 1 dica nova por dia), t/x (título e texto; criança tem x por jeito), acao, destaque.
// fatos (do servidor, só para o gestor): { pessoas, tarefas, familiaId }. est = estado do aparelho.
const ehPainel = (p) => p === '/painel';
const entradaFeita = (f, est) => (f.pessoas || est.puladas['g-pessoa']) && (est.grupo || est.puladas['g-grupo']) && (f.tarefas || est.puladas['g-tarefa']);

export const DICAS = [
  // --- Gestor: entrada, nesta ordem: primeira pessoa › primeiro grupo › primeira tarefa ---
  { k: 'g-pessoa', p: 'gestor', entrada: true, livre: true, rota: ehPainel, quando: (f) => !f.pessoas,
    t: 'Comece por você ou por quem faz as tarefas', x: 'Cadastre a primeira pessoa. Pode ser você mesmo; depois entram as outras.',
    acao: (f) => ({ txt: 'Cadastrar pessoa', href: '/config/pessoas/nova' }) },
  { k: 'g-grupo', p: 'gestor', entrada: true, livre: true, rota: ehPainel, quando: (f, est) => (f.pessoas || est.puladas['g-pessoa']) && !est.grupo,
    t: 'Agora o seu grupo', x: 'Dê um nome e uma foto à família ou ao grupo e veja quem faz parte.',
    acao: (f) => ({ txt: 'Abrir meu grupo', href: `/config/familias/${f.familiaId}` }) },
  { k: 'g-tarefa', p: 'gestor', entrada: true, livre: true, rota: ehPainel, quando: (f, est) => (f.pessoas || est.puladas['g-pessoa']) && (est.grupo || est.puladas['g-grupo']) && !f.tarefas,
    t: 'Hora da primeira tarefa', x: 'Crie uma tarefa para alguém. Na tela da tarefa, a Mel mostra as Sugestões.',
    acao: () => ({ txt: 'Criar tarefa', href: '/tarefas/nova?volta=/painel' }) },
  { k: 'g-pessoa-pg', p: 'gestor', livre: true, topo: true, rota: (p) => p === '/config/pessoas/nova',
    t: 'Quem faz as tarefas?', x: 'Informe o nome e quem é. Pode ser você mesmo. Ao cadastrar uma criança, mostro como o beelo vai ficar para ela.' },
  { k: 'g-grupo-pg', p: 'gestor', livre: true, marca: 'grupo', rota: (p) => /^\/config\/familias\/[^/]+$/.test(p),
    t: 'Este é o seu grupo', x: 'Troque o nome ou a foto quando quiser. As pessoas do grupo aparecem aqui embaixo.' },
  { k: 'g-tarefa-pg', p: 'gestor', livre: true, rota: (p) => p === '/tarefas/nova', destaque: '.sugestao-btn',
    t: 'Sem ideia? Use Sugestões', x: 'Toque em Sugestões e escolha uma tarefa pronta, como “Escovar os dentes”.', clicar: '.sugestao-btn', clicarTxt: 'Mostrar sugestões' },
  // --- Gestor: dicas curtas depois da entrada ---
  { k: 'g-avisos', p: 'gestor', rota: ehPainel, quando: (f, est) => entradaFeita(f, est) && !est.avisosOn,
    t: 'Quer ser lembrado?', x: 'Ative os avisos e o beelo lembra das tarefas no celular.', acao: () => ({ txt: 'Ativar avisos', href: '/perfil' }) },
  { k: 'g-ideias', p: 'gestor', rota: ehPainel, quando: (f, est) => entradaFeita(f, est) && (est.vistas['g-avisos'] || est.avisosOn), destaque: '.icone-btn.ideias',
    t: 'Uma ideia por dia', x: 'Toque na lâmpada para ver uma ideia que ajuda a rotina da família.' },
  { k: 'g-painel', p: 'gestor', rota: ehPainel, quando: (f, est) => entradaFeita(f, est) && est.vistas['g-ideias'],
    t: 'Seu painel', x: 'Aqui aparece o que precisa da sua atenção. Toque numa tarefa para abrir o dia da pessoa.' },
  { k: 'g-tela', p: 'gestor', rota: (p) => p === '/tela',
    t: 'Tempo de tela, como usar', x: 'Em “Quem lança tempo de tela”, ligue só para quem for usar e defina o previsto. A pessoa lança o tempo de ontem e você vê a diferença. É um combinado para conversar, sem cobrança.' },
  { k: 'g-desafios', p: 'gestor', rota: (p) => p === '/desafios',
    t: 'Desafios são jogos em família', x: 'Escolha um desafio para cada pessoa e o app sugere meta e prêmio. Dá para começar com um só.' },
  // --- Adolescente (13+): sem personagem, só o que precisa aprender ---
  { k: 'a-adiar', p: 'adolescente', rota: (p) => p === '/hoje',
    t: 'Não deu tempo?', x: 'Abra a tarefa e toque em Adiar para pedir mais tempo, ou em Justificar para contar o motivo. Sem problema, só combinar.' },
  { k: 'a-desafio', p: 'adolescente', rota: (p) => p === '/desafios',
    t: 'Você escolhe seu desafio', x: 'Toque em um desafio para ver as regras, o prazo e o que ganha. Dá para escolher o seu no banco de sugestões.' },
  { k: 'a-premio', p: 'adolescente', rota: (p) => p === '/desafios/premios',
    t: 'Prêmios', x: 'Veja o que dá para trocar pelas suas conquistas. Dá para sugerir um prêmio: quem acompanha aprova.' },
  { k: 'a-desejo', p: 'adolescente', rota: (p) => p === '/desafios/cofrinho',
    t: 'Sua lista de desejos', x: 'Adicione o que quer ganhar. Os responsáveis aprovam e definem o preço em semanas de desafio.' },
  // --- Criança: palavras bem simples, uma dica por vez (Divertido: Mel grande; Calmo: Mel pequena) ---
  { k: 'c-hoje', p: 'crianca', rota: (p) => p === '/hoje',
    t: 'Tarefas do dia', x: { divertido: 'Toque no círculo quando fizer. Fez tudo? A Mel faz uma festa e você ganha um selo!', calmo: 'Toque no círculo quando fizer. Ao terminar o dia, você ganha um selo.' } },
  { k: 'c-missoes', p: 'crianca', rota: (p) => p === '/desafios',
    t: 'Missões do joguinho', x: { divertido: 'Faça as tarefas da missão e ganhe estrelinhas. No fim tem prêmio!', calmo: 'Faça as tarefas do desafio para juntar estrelinhas.' } },
  { k: 'c-premios', p: 'crianca', rota: (p) => p === '/desafios/premios',
    t: 'O que você pode ganhar', x: { divertido: 'Junte estrelinhas e troque por um prêmio. Escolha o que você mais quer!', calmo: 'Junte estrelinhas e troque por um prêmio.' } },
  { k: 'c-desejos', p: 'crianca', rota: (p) => p === '/desafios/cofrinho',
    t: 'Seus desejos', x: { divertido: 'Coloque aqui o que você quer ganhar. Os pais olham e dizem quanto custa!', calmo: 'Coloque aqui o que você quer ganhar. Os pais respondem.' } },
];

// ═══ SEÇÃO: Escolher a dica de agora ═══════════════════════════════════════
const hojeLocal = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

// @regra 25/11: uma dica por vez; no máximo 1 dica nova por dia (a entrada e as dicas "da própria tela" não contam);
// depois de 2 puladas seguidas, 24 h sem dica nova; nunca no meio de digitar (quem chama confere).
export function escolher({ publico, pathname, fatos, est }) {
  if (!publico || est.off) return null;
  const hoje = hojeLocal();
  const novasHoje = est.dia === hoje ? est.novasHoje : 0;
  const quieto = est.seguidas >= 2 && Date.now() - (est.ultPulo || 0) < 86400000;
  return DICAS.find((d) => {
    if (d.p !== publico || est.vistas[d.k] || est.puladas[d.k]) return false;
    if (!d.rota(pathname)) return false;
    if (d.quando && !d.quando(fatos, est)) return false;
    if (!d.livre && (novasHoje >= 1 || quieto)) return false;
    return true;
  }) || null;
}
export const textoDe = (d, jeito) => (typeof d.x === 'string' ? d.x : d.x[jeito === 'calmo' ? 'calmo' : 'divertido']);

// Marca a dica como vista (ou pulada). Pular conta para o "quieto" depois de 2 seguidas.
export function registrar(m, d, pulou) {
  const e = lerGuia(m);
  const hoje = hojeLocal();
  if (e.dia !== hoje) { e.dia = hoje; e.novasHoje = 0; }
  (pulou ? e.puladas : e.vistas)[d.k] = hoje;
  e.vistas[d.k] = e.vistas[d.k] || hoje;
  if (!d.livre) e.novasHoje += 1;
  if (pulou) { e.seguidas = (e.seguidas || 0) + 1; e.ultPulo = Date.now(); } else e.seguidas = 0;
  if (d.marca) e[d.marca] = true;
  gravarGuia(m, e);
}
