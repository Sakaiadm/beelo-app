// Ideias de conduta (seção 66): cartões curtos para Pai e Mãe e para os filhos.
// t = título, d = texto, f = frase para "Experimente dizer" (opcional).
// 28 para responsáveis + 12 para os filhos = 40. Com a regra dos 14 dias, cobre meses sem repetir.

export const TEMAS = [
  { id: 'comecar', nome: 'Para começar', icone: 'tBroto', cor: '#1a6fe0', cor2: '#5b9bff', ideias: [
    { id: 'combinem-juntos', t: 'Combinem juntos', d: 'Sentem juntos para montar as primeiras tarefas. Deixe o filho escolher algumas e sugerir o horário. Quem ajuda a criar o combinado cuida melhor dele.', f: 'Quais tarefas você acha que já consegue cuidar sozinho?' },
    { id: 'comece-pequeno', t: 'Comece pequeno', d: 'Duas ou três tarefas na primeira semana bastam. É melhor conquistar pouco do que se frustrar com muito. Aumente aos poucos, quando a rotina estiver leve.' },
    { id: 'conte-para-que-serve', t: 'Conte para que serve', d: 'Explique que o app ajuda a família a se organizar e a crescer junto. Não é para vigiar, é para cada um saber a sua parte.', f: 'É para a gente se ajudar, não para eu ficar cobrando.' },
    { id: 'de-o-exemplo', t: 'Dê o exemplo', d: 'Coloque também as suas tarefas no app e mostre quando concluir. Filhos aprendem mais com o que veem do que com o que ouvem.' },
    { id: 'horario-que-ja-existe', t: 'Use um horário que já existe', d: 'Encaixe a tarefa num momento que já acontece, como depois do banho ou do jantar. Fica mais fácil lembrar.' },
    { id: 'como-fica-pronto', t: 'Combinem como fica pronto', d: '“Quarto arrumado” é diferente para cada um. Digam juntos como fica a tarefa pronta.', f: 'Para você, como fica o quarto arrumado?' },
  ] },
  { id: 'dia', nome: 'No dia a dia', icone: 'sol', cor: '#1f9d55', cor2: '#4cc27e', ideias: [
    { id: 'quando-esquece', t: 'Quando esquece ou atrasa', d: 'Esquecer faz parte de aprender. Lembre uma vez, com leveza, e deixe que ele conclua ou peça para adiar pelo app.', f: 'Vi que ficou para depois. Prefere fazer agora ou adiar?' },
    { id: 'quando-resiste', t: 'Quando resiste', d: 'Antes de insistir, escute. Pergunte o que está difícil: a tarefa, o horário ou o jeito. Ajustem juntos. Muitas vezes a resistência é um pedido para participar.', f: 'O que deixaria essa tarefa mais fácil para você?' },
    { id: 'elogie-o-esforco', t: 'Elogie o esforço', d: 'Seja específico e sincero, sem exagero. Elogiar o que ele fez vale mais do que um “muito bem” solto.', f: 'Vi que você arrumou o quarto sem ninguém pedir. Ficou ótimo.' },
    { id: 'comemorem', t: 'Comemorem as conquistas', d: 'No fim da semana, olhem juntos a Evolução. Celebre os dias que deram certo, não a perfeição.' },
    { id: 'pedidos-com-carinho', t: 'Responda os pedidos com carinho', d: 'Quando ele pede para adiar ou justifica um atraso, responda com atenção, mesmo quando for um não. Assim ele vê que o combinado é uma conversa.' },
    { id: 'lembre-sem-repetir', t: 'Lembre sem repetir', d: 'Um lembrete basta. Repetir várias vezes ensina a esperar o próximo aviso. Deixe o app lembrar.' },
    { id: 'pergunte-antes', t: 'Pergunte antes de corrigir', d: 'Se a tarefa não ficou como esperado, pergunte como ele fez antes de apontar o que faltou.', f: 'Me conta como você fez?' },
    { id: 'refazer-com-carinho', t: 'Refazer com carinho', d: 'Ao pedir para refazer, diga primeiro o que ficou bom e depois o que falta.', f: 'A cama ficou ótima, só falta guardar a roupa.' },
    { id: 'dias-dificeis', t: 'Dias difíceis acontecem', d: 'Cansaço, prova, briga com um amigo. Num dia difícil, menos é mais. Combinem adiar sem culpa.' },
    { id: 'revejam-o-combinado', t: 'Revejam o combinado', d: 'Uma vez por mês, olhem juntos as tarefas. Tirem o que não faz mais sentido e coloquem desafios novos.' },
    { id: 'ensine-o-jeito', t: 'Ensine o jeito, não faça por ele', d: 'Ajudar é mostrar como se faz, não fazer no lugar. Na próxima vez ele já consegue sozinho.' },
  ] },
  { id: 'adolescentes', nome: 'Adolescentes', icone: 'tBussola', cor: '#7a3fb0', cor2: '#a56de0', ideias: [
    { id: 'mais-autonomia', t: 'Mais autonomia, menos controle', d: 'Deixe que ele crie as próprias tarefas e escolha os horários. Combinem o resultado, não cada passo.' },
    { id: 'negocie', t: 'Negocie em vez de impor', d: 'Troque “você tem que” por “como a gente resolve?”. Aceite propostas razoáveis, mesmo que diferentes da sua ideia.', f: 'Qual horário funciona melhor para você?' },
    { id: 'confianca-primeiro', t: 'Confiança primeiro', d: 'Peça foto só nas tarefas em que ela faz diferença. A confiança cresce quando ele sente que não está sendo vigiado.' },
    { id: 'escute-os-planos', t: 'Escute os planos dele', d: 'Pergunte sobre sonhos e metas. Ajude a transformar cada uma em tarefas pequenas no app.' },
    { id: 'tela-juntos', t: 'Combinem o tempo de tela juntos', d: 'Definam o limite conversando, não decretando. Ele cumpre melhor o que ajudou a decidir.' },
  ] },
  { id: 'evitar', nome: 'O que evitar', icone: 'cSaude', cor: '#d9480f', cor2: '#f08a4b', ideias: [
    { id: 'tarefa-castigo', t: 'Tarefa como castigo', d: 'Dar tarefa a mais como punição faz a rotina virar peso. As tarefas são parte do crescer, não uma pena.' },
    { id: 'comparar-irmaos', t: 'Comparar irmãos', d: 'Cada um tem o seu ritmo. Compare a pessoa com ela mesma, na Evolução.' },
    { id: 'cobrar-em-publico', t: 'Cobrar na frente dos outros', d: 'Converse a sós. Na frente dos outros, a pessoa se defende em vez de ouvir.' },
    { id: 'comentar-cada-tarefa', t: 'Comentar cada tarefa', d: 'Não precisa falar de tudo. Deixe o app lembrar e acompanhe de longe.' },
    { id: 'premio-por-tudo', t: 'Prêmio por tudo', d: 'Recompensa a cada tarefa ensina a fazer só pelo prêmio. Comemore com palavras e com tempo juntos.' },
    { id: 'mudar-sem-avisar', t: 'Mudar o combinado sem avisar', d: 'Se precisar mudar uma tarefa, conte antes. Mudança de surpresa parece imposição.' },
  ] },
];

export const FILHOS = { id: 'filhos', nome: 'Para você', icone: 'tBroto', cor: '#1a6fe0', cor2: '#5b9bff', ideias: [
  { id: 'combinar-nao-e-mandar', t: 'Combinar é diferente de mandar', d: 'Você também pode dar ideias, escolher tarefas e sugerir horários. Fale com seus responsáveis.' },
  { id: 'pequenas-tarefas', t: 'Pequenas tarefas, grandes pessoas', d: 'Cada tarefa feita é uma conquista. Aos poucos você fica mais forte, capaz e responsável.' },
  { id: 'esqueceu-acontece', t: 'Esqueceu? Acontece', d: 'Você pode concluir depois ou pedir para adiar. O importante é seguir em frente.' },
  { id: 'achou-dificil', t: 'Achou difícil? Converse', d: 'Se uma tarefa está pesada ou o horário não dá, peça para ajustar. Pedir também é ter responsabilidade.' },
  { id: 'planeje-sonhos', t: 'Planeje os seus sonhos', d: 'Tem um objetivo? Crie uma tarefa para ele. Planejar é o primeiro passo para conquistar.' },
  { id: 'voce-contra-voce', t: 'Você contra você', d: 'Olhe a sua Evolução. Compare você com você mesmo, não com os outros.' },
  { id: 'menos-tela', t: 'Um pouco menos de tela', d: 'Que tal trocar um tempinho de tela por uma brincadeira, um livro ou um passeio?' },
  { id: 'comece-pela-mais-rapida', t: 'Comece pela mais rápida', d: 'Está com muita coisa? Faça primeiro a tarefa mais fácil. A primeira conquista dá energia para as outras.' },
  { id: 'bom-horario', t: 'Escolha um bom horário', d: 'Sugira um horário em que você costuma estar em casa e com energia. Assim fica mais fácil cumprir.' },
  { id: 'peca-ajuda', t: 'Peça ajuda sem vergonha', d: 'Não sabe como fazer? Pergunte. Todo mundo aprendeu um dia.' },
  { id: 'sem-ninguem-pedir', t: 'Faça sem ninguém pedir', d: 'Fazer algo antes de alguém pedir é uma grande conquista. Repare como a família fica feliz.' },
  { id: 'recomece-amanha', t: 'Dia ruim? Recomece amanhã', d: 'Um dia sem tarefas não apaga as suas conquistas. Amanhã é um novo começo.' },
] };

const PAIS_TODAS = TEMAS.flatMap((tm) => tm.ideias.map((i) => ({ ...i, tema: tm })));
const FILHOS_TODAS = FILHOS.ideias.map((i) => ({ ...i, tema: FILHOS }));

export function todas(paraPais) { return paraPais ? PAIS_TODAS : FILHOS_TODAS; }
export function achar(id) { return PAIS_TODAS.find((i) => i.id === id) || FILHOS_TODAS.find((i) => i.id === id) || null; }

// Ideia da semana: troca toda segunda-feira, em sequência (28 semanas para os pais, 12 para os filhos).
export function numeroSemana(hojeISO) {
  const d = new Date(hojeISO + 'T12:00:00Z');
  return Math.floor((d.getTime() / 86400000 + 3) / 7); // semanas começando na segunda
}
export function ideiaDaSemana(paraPais, hojeISO) {
  const l = todas(paraPais);
  // Intercala os temas para não repetir o mesmo tema semanas seguidas.
  const ordem = paraPais ? intercalar(TEMAS.map((t) => t.ideias.map((i) => i.id))) : l.map((i) => i.id);
  return achar(ordem[numeroSemana(hojeISO) % ordem.length]);
}
function intercalar(listas) {
  const out = []; const max = Math.max(...listas.map((l) => l.length));
  for (let k = 0; k < max; k++) listas.forEach((l) => { if (l[k]) out.push(l[k]); });
  return out;
}
