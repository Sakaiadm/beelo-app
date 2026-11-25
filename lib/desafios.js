// @arquivo  desafios.js: catálogo fixo de desafios e prêmios (itens aprovados em 24/11) e o cálculo do perfil (estrelinhas ou semanas).
// @tipo     regra
// @usado-por app/(app)/desafios/ajustes/page.js, app/(app)/desafios/cofrinho/page.js, app/(app)/desafios/novo/page.js, app/(app)/desafios/page.js, app/(app)/desafios/premios/page.js, app/(app)/hoje/page.js e mais 8
// @cuidado  os ids (c1…, k1…, mes1…) são gravados no banco: nunca renomeie um id existente.
// Desafios e prêmios (versão beta). Banco fixo dentro do app, só com os itens que o Thomas marcou (24/11/2026).
// Cada desafio diz como o app mede sozinho (tipo + alvo) e, quando não há como medir pelas tarefas que já existem,
// qual tarefa o próprio desafio cria (a pessoa marca com 1 toque, como qualquer tarefa).
//
// tipo: dias (N dias bons) | seq (dias seguidos) | pct (% das tarefas) | pct_cada (cada pessoa com %) | melhor (mais que a
//       semana passada) | capricho (sem pedido de refazer) | tela_ok (tela dentro do previsto) | variedade (categorias
//       diferentes) | proprias (tarefas criadas pela própria pessoa)
// alvo: todas | categoria | tarefa | horario | manha | noite | combo (várias categorias no mesmo dia) | tela (tarefa "Lançar tempo de tela")
// para: c criança · a adolescente · j adulto · f família toda
// tarefa: { t: título, cat: categoria, h: horário, dias: dias fixos } — criada junto com o desafio quando precisa.
export const GRUPOS = [
  ['c', 'Constância'], ['k', 'Uma categoria'], ['f', 'Movimento'], ['e', 'Estudo'], ['l', 'Leitura'],
  ['m', 'Combinados'], ['a', 'Autonomia'], ['t', 'Tela'], ['j', 'Família'], ['p', 'Adultos'],
];

const D = (id, t, d, o) => ({ id, g: id.replace(/\d+$/, ''), t, d, tipo: 'dias', alvo: 'tarefa', meta: 5, periodo: 'semana', criterio: 'feita', para: 'caj', ...o });

export const DESAFIOS = [
  // Constância geral
  D('c1', 'Semana em dia', '80% das tarefas da semana feitas.', { tipo: 'pct', alvo: 'todas', meta: 80, icone: 'hoje' }),
  D('c2', 'Quase tudo', '90% das tarefas da semana feitas.', { tipo: 'pct', alvo: 'todas', meta: 90, icone: 'hoje' }),
  D('c3', 'Começo leve', '70% das tarefas da semana, para quem está começando.', { tipo: 'pct', alvo: 'todas', meta: 70, icone: 'tBroto' }),
  D('c4', 'Cinco dias bons', 'Dias com todas as tarefas feitas.', { alvo: 'todas', meta: 5, icone: 'hoje' }),
  D('c5', 'Sequência de 3', 'Dias seguidos com tudo feito.', { tipo: 'seq', alvo: 'todas', meta: 3, icone: 'hoje' }),
  D('c6', 'Sequência de 7', 'Dias seguidos com tudo feito.', { tipo: 'seq', alvo: 'todas', meta: 7, icone: 'hoje' }),
  D('c7', 'No horário', 'Tarefas com horário feitas na hora.', { alvo: 'horario', criterio: 'no_horario', meta: 4, icone: 'relogio' }),
  D('c8', 'Sem atrasadas', 'Tudo feito no próprio dia, sem passar para o dia seguinte.', { alvo: 'todas', criterio: 'no_dia', meta: 7, icone: 'agenda' }),
  D('c9', 'Feito com capricho', 'Semana sem nenhum pedido de refazer.', { tipo: 'capricho', alvo: 'todas', meta: 0, icone: 'check' }),
  D('c10', 'Fim de semana também', 'Tarefas de sábado e domingo todas feitas.', { tipo: 'pct', alvo: 'todas', meta: 100, dsem: [0, 6], icone: 'sol' }),
  D('c11', 'Segunda forte', 'Tudo feito na segunda e na terça.', { alvo: 'todas', meta: 2, dsem: [1, 2], icone: 'sol' }),
  D('c12', 'Melhor que a semana passada', 'Fazer mais tarefas do que na semana anterior.', { tipo: 'melhor', alvo: 'todas', meta: 0, icone: 'grafico' }),
  // Constância numa categoria
  D('k1', 'Quarto em ordem', 'Tarefas de Casa feitas.', { alvo: 'categoria', cats: ['Casa'], meta: 5, tarefa: { t: 'Arrumar o quarto', cat: 'Casa', h: '18:00' }, icone: 'cCasa' }),
  D('k2', 'Ajudante da casa', 'Uma tarefa de Casa todo dia.', { alvo: 'categoria', cats: ['Casa'], meta: 7, tarefa: { t: 'Ajudar em casa', cat: 'Casa' }, icone: 'cCasa' }),
  D('k3', 'Cuidado comigo', 'Cuidado pessoal (dentes, banho) todos os dias.', { alvo: 'categoria', cats: ['Cuidado pessoal'], meta: 7, tarefa: { t: 'Escovar os dentes', cat: 'Cuidado pessoal', h: '21:30' }, icone: 'cCuidado' }),
  D('k4', 'Sorriso brilhante', 'Escovar os dentes de manhã e à noite.', { meta: 6, tarefa: { t: 'Escovar os dentes de manhã e à noite', cat: 'Cuidado pessoal' }, icone: 'cCuidado' }),
  D('k5', 'Saúde em dia', 'Remédio, água e vitaminas em dia.', { alvo: 'categoria', cats: ['Saúde'], meta: 6, tarefa: { t: 'Tomar o remédio ou as vitaminas', cat: 'Saúde', h: '08:00' }, icone: 'cSaude' }),
  D('k6', 'Sono em dia', 'Dormir no horário combinado.', { meta: 5, tarefa: { t: 'Dormir no horário combinado', cat: 'Saúde', h: '21:30' }, icone: 'lua' }),
  D('k7', 'Água todo dia', 'Beber água ao longo do dia.', { meta: 6, tarefa: { t: 'Beber água ao longo do dia', cat: 'Saúde' }, icone: 'cCuidado' }),
  D('k8', 'Bichinho cuidado', 'Cuidar do animal de estimação todos os dias.', { meta: 7, tarefa: { t: 'Cuidar do bichinho', cat: 'Casa', h: '08:00' }, icone: 'cSaude' }),
  D('k9', 'Momento de fé', 'Tarefas da categoria Espiritual.', { alvo: 'categoria', cats: ['Espiritual'], meta: 5, tarefa: { t: 'Momento de oração ou reflexão', cat: 'Espiritual', h: '21:45' }, icone: 'cEspiritual' }),
  D('k10', 'Três gratidões', 'Escrever três gratidões à noite.', { meta: 5, tarefa: { t: 'Escrever três gratidões', cat: 'Espiritual', h: '21:45' }, icone: 'cEspiritual' }),
  D('k11', 'Amigos e família', 'Uma tarefa Social na semana (ligar para os avós, visitar alguém).', { alvo: 'categoria', cats: ['Social'], meta: 1, tarefa: { t: 'Ligar ou visitar alguém querido', cat: 'Social' }, icone: 'cSocial' }),
  D('k12', 'Dinheiro organizado', 'Tarefas de Financeiro em dia no mês.', { tipo: 'pct', alvo: 'categoria', cats: ['Financeiro'], meta: 100, periodo: 'mes', para: 'aj', tarefa: { t: 'Organizar o dinheiro', cat: 'Financeiro', dias: [0] }, icone: 'cFinanceiro' }),
  D('k13', 'Guardar parte da mesada', 'Guardar uma parte da mesada no mês.', { meta: 1, periodo: 'mes', tarefa: { t: 'Guardar parte da mesada', cat: 'Financeiro', rec: 'mensal' }, icone: 'cFinanceiro' }),
  D('k14', 'Trabalho em dia', 'Tarefas de Trabalho feitas na semana.', { tipo: 'pct', alvo: 'categoria', cats: ['Trabalho'], meta: 100, para: 'aj', tarefa: { t: 'Tarefa do trabalho', cat: 'Trabalho', dias: [1, 2, 3, 4, 5] }, icone: 'cTrabalho' }),
  D('k15', 'Categoria que mais falhou', 'O app escolhe a categoria com menos tarefas feitas nas últimas 4 semanas.', { alvo: 'categoria', cats: [], pior: true, meta: 5, icone: 'tBussola' }),
  // Atividade física
  D('f1', 'Mexer o corpo', 'Esporte ou brincadeira ativa.', { alvo: 'categoria', cats: ['Esporte'], meta: 4, tarefa: { t: 'Esporte ou brincadeira ativa', cat: 'Esporte' }, icone: 'cEsporte' }),
  D('f2', 'Brincar lá fora', 'Brincar ao ar livre.', { meta: 5, para: 'c', tarefa: { t: 'Brincar ao ar livre', cat: 'Lazer' }, icone: 'sol' }),
  D('f3', 'Caminhada', 'Caminhar 30 minutos.', { meta: 3, para: 'aj', tarefa: { t: 'Caminhar 30 minutos', cat: 'Esporte' }, icone: 'cEsporte' }),
  D('f4', 'Alongar todo dia', 'Alongamento de manhã.', { meta: 6, tarefa: { t: 'Alongamento', cat: 'Esporte', h: '07:00' }, icone: 'cEsporte' }),
  D('f5', 'Treino combinado', 'Ir a todos os treinos da semana.', { tipo: 'pct', alvo: 'categoria', cats: ['Esporte'], meta: 100, tarefa: { t: 'Treino', cat: 'Esporte', dias: [2, 4] }, icone: 'cEsporte' }),
  D('f6', 'Passos da família', 'Uma caminhada ou pedalada juntos no fim de semana.', { meta: 1, para: 'f', tarefa: { t: 'Caminhada ou pedalada em família', cat: 'Esporte', dias: [6] }, icone: 'familia' }),
  D('f7', 'Escada no lugar do elevador', 'Escolher a escada.', { meta: 5, para: 'aj', tarefa: { t: 'Ir de escada', cat: 'Esporte' }, icone: 'cEsporte' }),
  D('f8', 'Mês do movimento', 'Atividade física em 16 dias do mês.', { alvo: 'categoria', cats: ['Esporte'], meta: 16, periodo: 'mes', tarefa: { t: 'Atividade física', cat: 'Esporte' }, icone: 'cEsporte' }),
  // Estudo
  D('e1', 'Foco no Estudo', 'Tarefas de Estudo feitas.', { alvo: 'categoria', cats: ['Estudo'], meta: 5, para: 'ca', tarefa: { t: 'Estudar', cat: 'Estudo', h: '16:00' }, icone: 'cEstudo' }),
  D('e2', 'Lição em dia', 'Lição de casa feita todos os dias de aula.', { meta: 5, para: 'ca', tarefa: { t: 'Lição de casa', cat: 'Estudo', h: '16:00', dias: [1, 2, 3, 4, 5] }, icone: 'cEstudo' }),
  D('e3', 'Mochila pronta', 'Arrumar a mochila na noite anterior, de segunda a sexta.', { meta: 5, para: 'ca', tarefa: { t: 'Arrumar a mochila', cat: 'Estudo', h: '21:00', dias: [0, 1, 2, 3, 4] }, icone: 'cEstudo' }),
  D('e4', 'Revisão do dia', 'Revisar a matéria do dia.', { meta: 4, para: 'ca', tarefa: { t: 'Revisar a matéria do dia', cat: 'Estudo', h: '19:00' }, icone: 'cEstudo' }),
  D('e5', 'Inglês na rotina', 'Estudar inglês nos dias combinados.', { meta: 2, tarefa: { t: 'Estudar inglês', cat: 'Estudo', h: '19:30' }, icone: 'cEstudo' }),
  D('e6', 'Preparado para a prova', 'Estudar um pouco em 5 dias antes da prova.', { meta: 5, para: 'ca', tarefa: { t: 'Estudar para a prova', cat: 'Estudo' }, icone: 'cEstudo' }),
  D('e7', 'Estudar antes da tela', 'Estudo feito antes do horário de tela.', { meta: 5, para: 'ca', tarefa: { t: 'Estudar antes da tela', cat: 'Estudo', h: '15:00' }, icone: 'cEstudo' }),
  D('e8', 'Curso em dia', 'Aula ou módulo do curso feito na semana.', { meta: 1, para: 'aj', tarefa: { t: 'Aula ou módulo do curso', cat: 'Estudo' }, icone: 'cEstudo' }),
  // Leitura
  D('l1', 'Leitor da semana', 'Ler 20 minutos.', { meta: 4, tarefa: { t: 'Ler por 20 minutos', cat: 'Estudo', h: '20:30' }, icone: 'livro' }),
  D('l2', 'Leitura de toda noite', 'Ler antes de dormir.', { meta: 5, tarefa: { t: 'Ler antes de dormir', cat: 'Estudo', h: '21:00' }, icone: 'livro' }),
  D('l3', 'Um livro no mês', 'Terminar um livro no mês.', { meta: 1, periodo: 'mes', tarefa: { t: 'Terminei o livro do mês', cat: 'Estudo', rec: 'mensal' }, icone: 'livro' }),
  D('l4', 'História em família', 'Ler junto com os pais.', { meta: 3, para: 'c', tarefa: { t: 'Ler junto com o pai ou a mãe', cat: 'Estudo', h: '20:30' }, icone: 'livro' }),
  D('l5', 'Leitura sem tela', 'Ler livro de papel em vez do celular.', { meta: 3, para: 'aj', tarefa: { t: 'Ler livro de papel', cat: 'Lazer' }, icone: 'livro' }),
  D('l6', 'Ler para o irmão', 'Ler uma história para o irmão menor.', { meta: 2, para: 'ca', tarefa: { t: 'Ler uma história para o irmão', cat: 'Social', h: '20:30' }, icone: 'livro' }),
  D('l7', 'Mês da leitura', 'Ler em 15 dias do mês.', { meta: 15, periodo: 'mes', tarefa: { t: 'Ler um pouco', cat: 'Estudo' }, icone: 'livro' }),
  // Combinados de categorias
  D('m1', 'Corpo e mente', 'Esporte e Estudo no mesmo dia.', { alvo: 'combo', cats: ['Esporte', 'Estudo'], meta: 3, icone: 'cEsporte' }),
  D('m2', 'Manhã completa', 'Todas as tarefas da manhã feitas.', { alvo: 'manha', meta: 5, icone: 'sol' }),
  D('m3', 'Noite tranquila', 'Tarefas da noite (dentes, mochila, roupa) feitas.', { alvo: 'noite', meta: 5, icone: 'lua' }),
  D('m4', 'Casa e escola', 'Casa e Estudo feitos no mesmo dia.', { alvo: 'combo', cats: ['Casa', 'Estudo'], meta: 4, para: 'ca', icone: 'cCasa' }),
  D('m5', 'Saúde completa', 'Saúde e movimento no mesmo dia.', { alvo: 'combo', cats: ['Saúde', 'Esporte'], meta: 3, icone: 'cSaude' }),
  D('m7', 'Equilíbrio da semana', 'Pelo menos uma tarefa em 4 categorias diferentes.', { tipo: 'variedade', alvo: 'todas', meta: 4, icone: 'etiqueta' }),
  D('m8', 'Fé e gratidão', 'Espiritual e três gratidões.', { alvo: 'categoria', cats: ['Espiritual'], meta: 4, tarefa: { t: 'Oração e três gratidões', cat: 'Espiritual', h: '21:45' }, icone: 'cEspiritual' }),
  // Autonomia e responsabilidade
  D('a1', 'Eu monto minha rotina', 'Criar e cumprir 3 tarefas próprias na semana.', { tipo: 'proprias', alvo: 'todas', meta: 3, para: 'ca', icone: 'lapis' }),
  D('a3', 'Sem lembrete', 'Tarefas da manhã feitas antes do horário.', { alvo: 'manha', criterio: 'no_horario', meta: 4, para: 'ca', icone: 'relogio' }),
  D('a5', 'Planejei e fiz', 'Planejar a semana no domingo e cumprir 80%.', { tipo: 'pct', alvo: 'todas', meta: 80, para: 'aj', tarefaExtra: { t: 'Planejar a semana', cat: 'Outros', dias: [0], h: '19:00' }, icone: 'agenda' }),
  D('a6', 'Uma tarefa nova', 'Aprender uma tarefa de casa nova (cozinhar algo simples, lavar roupa).', { meta: 1, para: 'ca', tarefa: { t: 'Aprender uma tarefa de casa nova', cat: 'Casa', dias: [6] }, icone: 'cCasa' }),
  D('a7', 'Avisar no tempo certo', 'Pedir adiamento antes, em vez de deixar atrasar.', { alvo: 'todas', criterio: 'no_dia', meta: 6, para: 'ca', icone: 'agenda' }),
  D('a8', 'Eu cuido de mim', 'Todas as tarefas de Cuidado pessoal, sem ninguém pedir.', { alvo: 'categoria', cats: ['Cuidado pessoal'], meta: 7, para: 'ca', tarefa: { t: 'Cuidar de mim (banho e dentes)', cat: 'Cuidado pessoal' }, icone: 'cCuidado' }),
  // Tela e equilíbrio
  D('t1', 'Tela equilibrada', 'Tempo de tela dentro do previsto.', { tipo: 'tela_ok', alvo: 'todas', meta: 5, tela: true, icone: 'tela' }),
  D('t2', 'Tela depois das tarefas', 'Usar tela só depois das tarefas do dia.', { meta: 5, para: 'ca', tarefa: { t: 'Tarefas feitas antes da tela', cat: 'Lazer', h: '17:00' }, icone: 'tela' }),
  D('t3', 'Noite sem tela', 'Noites com atividade de Lazer sem tela.', { meta: 3, tarefa: { t: 'Noite de lazer sem tela', cat: 'Lazer', h: '19:30' }, icone: 'lua' }),
  D('t4', 'Lançar no horário', 'Lançar o tempo de tela todo dia no horário.', { alvo: 'tela', criterio: 'no_dia', meta: 7, tela: true, icone: 'tela' }),
  D('t5', 'Domingo desconectado', 'Uma manhã de domingo sem celular, todos juntos.', { meta: 1, para: 'f', tarefa: { t: 'Manhã de domingo sem celular', cat: 'Lazer', dias: [0] }, icone: 'familia' }),
  // Família juntos (meta única da família)
  D('j1', 'Família em dia', 'Todos juntos com 80% das tarefas da semana.', { tipo: 'pct', alvo: 'todas', meta: 80, para: 'f', icone: 'familia' }),
  D('j2', 'Mutirão da casa', 'Todas as tarefas de Casa do sábado feitas.', { tipo: 'pct', alvo: 'categoria', cats: ['Casa'], meta: 100, dsem: [6], para: 'f', icone: 'cCasa' }),
  D('j3', 'Jantar juntos', 'Jantar sem celular na mesa.', { meta: 4, para: 'f', tarefa: { t: 'Jantar sem celular na mesa', cat: 'Social', h: '19:30' }, icone: 'familia' }),
  D('j4', 'Jogo em família', 'Um jogo ou atividade juntos toda semana.', { meta: 1, para: 'f', tarefa: { t: 'Jogo ou atividade em família', cat: 'Lazer', dias: [6] }, icone: 'familia' }),
  D('j5', 'Ninguém fica para trás', 'Cada pessoa com pelo menos 70% da semana.', { tipo: 'pct_cada', alvo: 'todas', meta: 70, para: 'f', icone: 'familia' }),
  D('j6', 'Casa organizada no mês', 'Tarefas de Casa da família 80% no mês.', { tipo: 'pct', alvo: 'categoria', cats: ['Casa'], meta: 80, periodo: 'mes', para: 'f', icone: 'cCasa' }),
  D('j7', 'Momento de fé juntos', 'Oração ou reflexão em família.', { meta: 3, para: 'f', tarefa: { t: 'Oração ou reflexão em família', cat: 'Espiritual', h: '21:00' }, icone: 'cEspiritual' }),
  D('j8', 'Ajudar alguém', 'Uma ação de cuidado com alguém de fora (vizinho, avós).', { meta: 1, para: 'f', tarefa: { t: 'Ajudar alguém de fora', cat: 'Social', dias: [6] }, icone: 'cSocial' }),
  D('j9', 'Semana da gratidão', 'Cada um diz algo bom de outro da família.', { meta: 5, para: 'f', tarefa: { t: 'Dizer algo bom de alguém da família', cat: 'Social', h: '20:00' }, icone: 'cSocial' }),
  // Para adultos
  D('p1', 'Hábito pessoal', 'Uma tarefa pessoal escolhida.', { meta: 4, para: 'j', tarefa: { t: 'Meu hábito', cat: 'Outros' }, icone: 'tBroto' }),
  D('p2', 'Presente na rotina', 'Conferir as tarefas dos filhos todos os dias.', { meta: 7, para: 'j', tarefa: { t: 'Conferir as tarefas dos filhos', cat: 'Outros', h: '20:00' }, icone: 'painel' }),
  D('p3', 'Elogiar antes de corrigir', 'Mandar uma mensagem positiva antes de pedir para refazer.', { meta: 7, para: 'j', tarefa: { t: 'Um elogio antes de corrigir', cat: 'Social' }, icone: 'fala' }),
  D('p4', 'Contas do mês em dia', 'Todas as tarefas de Financeiro do mês.', { tipo: 'pct', alvo: 'categoria', cats: ['Financeiro'], meta: 100, periodo: 'mes', para: 'j', tarefa: { t: 'Pagar as contas', cat: 'Financeiro', rec: 'mensal' }, icone: 'cFinanceiro' }),
  D('p5', 'Agenda da semana', 'Organizar a agenda todo domingo.', { meta: 1, para: 'j', tarefa: { t: 'Organizar a agenda da semana', cat: 'Outros', dias: [0], h: '19:00' }, icone: 'agenda' }),
  D('p6', 'Dormir melhor', 'Dormir no horário.', { meta: 5, para: 'j', tarefa: { t: 'Dormir no horário', cat: 'Saúde', h: '22:30' }, icone: 'lua' }),
  D('p7', 'Tempo com cada filho', '15 minutos só com cada filho.', { meta: 3, para: 'j', tarefa: { t: '15 minutos só com cada filho', cat: 'Social' }, icone: 'familia' }),
];
export const desafioDe = (id) => DESAFIOS.find((d) => d.id === id);

// Tema do mês (janeiro = 0): desafios que aparecem primeiro nas sugestões.
export const TEMAS = [
  ['Família e lazer', ['j4', 'f6', 't5']], ['Volta às aulas', ['e2', 'e3', 'e1']], ['Casa organizada', ['k1', 'k2', 'j2']],
  ['Leitura', ['l1', 'l2', 'l4']], ['Família', ['j1', 'j4', 'j3']], ['Movimento', ['f1', 'f2', 'f3']],
  ['Férias ajudando em casa', ['a6', 'k2']], ['Sono e saúde', ['k6', 'k7', 'm5']], ['Leitura', ['l3', 'l7', 'l1']],
  ['Autonomia', ['a1', 'a5', 'a8']], ['Gratidão', ['k10', 'j8', 'j9']], ['Movimento', ['f1', 'f8', 'f2']],
];

// ===== Prêmios =====
// faixa: ate8 (até 8 anos) | mais8 (9 anos ou mais) | todos (criança de qualquer idade) | teen (adolescente, em semanas) | familia (vivência do desafio da família)
// padrao: entra sozinho na vitrine quando o gestor liga os desafios.
const P = (id, nome, custo, faixa, padrao = false, x = {}) => ({ id, nome, custo, moeda: faixa === 'teen' ? 'semanas' : 'estrelas', faixa, padrao, ...x });
export const PREMIOS = [
  P('s1', 'Escolher a sobremesa', 10, 'todos', true), P('s2', 'Figurinhas', 10, 'ate8'), P('s3', 'Adesivos', 10, 'ate8', true),
  P('s4', '15 minutos a mais de brincadeira', 10, 'ate8'), P('s5', 'História extra antes de dormir', 10, 'ate8', true),
  P('s6', 'Escolher o jantar', 15, 'todos', true), P('s7', 'Escolher o lanche do fim de semana', 15, 'todos'),
  P('s8', 'Pipoca no filme em casa', 15, 'todos', true), P('s9', 'Dormir 15 minutos mais tarde no sábado', 15, 'todos'),
  P('s10', 'Banho de mangueira ou piscininha', 15, 'ate8'), P('s11', 'Picolé', 20, 'todos'), P('s12', 'Sorvete', 20, 'todos', true),
  P('s13', 'Café da manhã especial', 20, 'todos'), P('s14', 'Tarde de jogos com os pais', 20, 'todos'), P('s15', 'Fazer um bolo junto', 20, 'todos'),
  P('s16', 'Açaí', 25, 'mais8', true), P('s17', 'Massinha ou slime', 25, 'ate8', true), P('s18', 'Livro de colorir ou de atividades', 25, 'ate8'),
  P('s19', 'Convidar um amigo para brincar', 30, 'todos'), P('s20', 'Brinquedo pequeno', 30, 'ate8', true), P('s21', 'Escolher o passeio do domingo', 30, 'todos'),
  P('s22', 'Lanche na padaria com o pai ou a mãe', 30, 'todos'),
  P('v1', 'Pizza no sábado', 40, 'todos'), P('v2', 'Noite de filme com pipoca', 20, 'todos'), P('v3', 'Piquenique no parque', 30, 'todos'),
  P('v4', 'Cinema', 60, 'todos', true), P('v5', 'Parque ou praça nova', 30, 'todos'), P('v6', 'Zoológico ou aquário', 60, 'todos'),
  P('v8', 'Passeio de bicicleta juntos', 30, 'todos'), P('v9', 'Acampar na sala', 30, 'ate8', true), P('v10', 'Noite de jogos de tabuleiro', 20, 'todos'),
  P('v11', 'Cozinhar juntos (pizza caseira, bolo)', 25, 'todos'), P('v12', 'Visitar os avós', 30, 'todos'), P('v13', 'Praia, cachoeira ou sítio', 80, 'todos'),
  P('v14', 'Sorveteria em família', 30, 'todos'), P('v15', 'Café da manhã fora', 40, 'todos'), P('v16', 'Passeio surpresa', 60, 'todos'),
  P('v17', 'Boliche', 70, 'mais8'), P('v18', 'Trilha ou caminhada na natureza', 40, 'todos'), P('v19', 'Pescaria', 60, 'todos'),
  P('v20', 'Show de talentos em casa', 15, 'ate8'), P('v21', 'Parque aquático', 120, 'todos'), P('v22', 'Parque de diversões', 120, 'todos'),
  P('g1', 'Livro novo escolhido', 50, 'todos', true), P('g2', 'Dormir na casa dos avós ou do primo', 60, 'todos'), P('g3', 'Jogo de tabuleiro novo', 80, 'todos'),
  P('g4', 'Festa do pijama', 80, 'todos'), P('g5', 'Passeio só com o pai ou a mãe', 80, 'todos', true), P('g6', 'Bola ou brinquedo de esporte', 80, 'todos'),
  P('g7', 'Brinquedo escolhido', 100, 'ate8', true), P('g8', 'Kit de arte ou de ciência', 100, 'todos'), P('g9', 'Aula experimental (dança, natação, música)', 100, 'mais8'),
  P('g10', 'Peça de montar (blocos)', 120, 'ate8'), P('g11', 'Teatro ou evento infantil', 120, 'ate8'), P('g12', 'Roupa ou tênis escolhido', 150, 'mais8'),
  P('g13', 'Mochila nova escolhida', 150, 'mais8'), P('g14', 'Jogo de videogame', 150, 'mais8', true), P('g15', 'Decorar o quarto', 150, 'mais8'),
  P('g16', 'Festa de aniversário com o tema escolhido', 200, 'todos'), P('g17', 'Patinete ou skate', 200, 'mais8'), P('g18', 'Bicicleta', 300, 'todos'),
  P('u1', 'Escolher o filme da noite', 1, 'teen', true), P('u2', 'Escolher o passeio do fim de semana', 2, 'teen', true), P('u3', 'Escolher o cardápio do fim de semana', 2, 'teen'),
  P('u4', 'Escolher o próprio horário de estudo', 2, 'teen'), P('u5', 'Mais 30 minutos de tela no fim de semana', 2, 'teen', true), P('u6', 'Cozinhar o jantar e escolher o prato', 2, 'teen'),
  P('u7', 'Convidar amigos para casa', 3, 'teen', true), P('u8', 'Dia livre das tarefas de casa', 3, 'teen'), P('u9', 'Ir sozinho a um lugar perto (combinado)', 3, 'teen'),
  P('u10', 'Voltar 1 hora mais tarde no sábado', 4, 'teen', true), P('u11', 'Sair com amigos (combinado)', 4, 'teen'), P('u12', 'Corte de cabelo diferente', 4, 'teen'),
  P('u13', 'Dormir na casa de um amigo', 5, 'teen'), P('u14', 'Roupa escolhida', 6, 'teen'), P('u15', 'Decorar o quarto do seu jeito', 6, 'teen'),
  P('u16', 'Jogo ou app novo', 6, 'teen', true), P('u17', 'Ganhar a própria chave de casa', 8, 'teen'), P('u18', 'Fone ou acessório', 8, 'teen'),
  P('u19', 'Curso ou aula que escolher', 8, 'teen'), P('u20', 'Show ou evento', 10, 'teen'), P('u21', 'Escolher o destino da viagem da família', 12, 'teen'),
  P('x1', 'Celular (com regras de uso combinadas antes)', 40, 'teen'), P('x2', 'Tablet (com tempo de tela combinado)', 30, 'teen'), P('x3', 'Videogame (com tempo de tela combinado)', 30, 'teen'),
  P('x4', 'Bicicleta melhor ou de marcha', 20, 'teen'), P('x6', 'Festa grande de aniversário', 20, 'teen'),
];
// Vivências que viram prêmio do desafio da família (sem custo: a meta da família é o caminho).
export const PREMIOS_FAMILIA = ['Pizza no sábado', 'Noite de filme com pipoca', 'Piquenique no parque', 'Cinema', 'Sorveteria em família', 'Noite de jogos de tabuleiro',
  'Acampar na sala', 'Cozinhar juntos', 'Café da manhã fora', 'Passeio surpresa', 'Trilha ou caminhada na natureza', 'Praia, cachoeira ou sítio', 'Parque aquático',
  'Parque de diversões', 'Viagem curta no fim do mês', 'Viagem especial em família'];
// Reconhecimento sem custo: ideia para os pais na hora de comemorar.
export const RECONHECIMENTO = [
  'Elogio em voz alta no jantar', 'Um bilhete escrito à mão, na cama ou na mochila', 'Certificado simples com o nome e o desafio', 'Medalha de papel feita em casa',
  'Nome no quadro "Destaque da semana"', 'Troféu da família, que passa de mão em mão', 'Foto da conquista no álbum da família', 'Ligação para os avós contando a conquista',
  'Rei ou rainha do dia: escolhe o cardápio, a música e a brincadeira', 'Escolher a música do carro na semana', 'Abraço coletivo da família', 'Conversa especial: do que mais se orgulharam',
];
export const ideiaComemorar = (semente) => RECONHECIMENTO[Math.abs(hash(semente)) % RECONHECIMENTO.length];
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

// ===== Perfil de quem faz o desafio =====
// criança: modo criança ligado · adolescente: filho(a) (qualquer parentesco) sem modo criança · adulto: os demais
export function perfil(m) {
  if (!m) return 'familia';
  if (m.papel === 'filho' && m.modo_crianca) return 'c';
  if (m.papel === 'filho' && ['filho', 'sobrinho', 'aluno', null, undefined].includes(m.funcao)) return 'a';
  return 'j';
}
export const recompensaDe = (pf) => (pf === 'c' ? 'estrelas' : pf === 'a' ? 'semanas' : pf === 'familia' ? 'premio' : 'nenhuma');
export const faixaDe = (m) => (perfil(m) === 'a' ? 'teen' : m?.premios_ate8 ? 'ate8' : 'mais8');
export const premioServe = (p, faixa) => (faixa === 'teen' ? p.faixa === 'teen' : p.faixa === 'todos' || p.faixa === faixa);

// Dias da tarefa criada pelo desafio, conforme a meta (vezes por semana).
export function diasPorMeta(n) {
  return ({ 1: [6], 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] })[n] || null; // 7 ou mais: todo dia
}

// Opções de meta que a pessoa pode trocar (o app já deixa a sugerida marcada).
export function opcoesMeta(d) {
  if (d.tipo === 'pct' || d.tipo === 'pct_cada') return [70, 80, 90, 100].map((v) => [v, `${v}%`]);
  if (d.tipo === 'seq') return [3, 5, 7].map((v) => [v, `${v} seguidos`]);
  if (d.tipo === 'dias') {
    if (d.periodo === 'mes') return [...new Set([Math.max(1, d.meta - 4), d.meta, Math.min(31, d.meta + 4)])].map((v) => [v, `${v} ${v === 1 ? 'vez' : 'dias'}`]);
    if (d.dsem) return [[d.meta, `${d.meta} de ${d.dsem.length}`]];
    return [1, 2, 3, 4, 5, 6, 7].map((v) => [v, v === 7 ? 'Todo dia' : v === 1 ? '1 vez' : `${v} dias`]);
  }
  if (d.tipo === 'variedade' || d.tipo === 'proprias' || d.tipo === 'tela_ok') return [3, 4, 5, 6].map((v) => [v, String(v)]);
  return [];
}

// Frase curta da meta: "5 de 7 dias", "80% da semana"...
export function textoMeta(d, meta = d.meta) {
  const per = d.periodo === 'mes' ? 'do mês' : 'da semana';
  switch (d.tipo) {
    case 'pct': return `${meta}% das tarefas ${per}`;
    case 'pct_cada': return `cada pessoa com ${meta}% ${per}`;
    case 'seq': return `${meta} dias seguidos`;
    case 'melhor': return 'mais tarefas que na semana passada';
    case 'capricho': return 'nenhum pedido de refazer';
    case 'variedade': return `${meta} categorias diferentes`;
    case 'proprias': return `${meta} tarefas criadas por você`;
    case 'tela_ok': return `${meta} dias dentro do previsto`;
    default:
      if (d.periodo === 'mes') return meta === 1 ? '1 vez no mês' : `${meta} dias no mês`;
      if (meta >= 7) return 'todo dia';
      return meta === 1 ? '1 vez na semana' : `${meta} dias na semana`;
  }
}

// Próximo nível sugerido depois de 3 semanas seguidas cumpridas (ou null se já está no topo).
export function proximoNivel(d) {
  if (d.tipo === 'dias' && d.periodo === 'semana' && !d.dias_semana && d.meta < 7) return d.meta + 1;
  if (d.tipo === 'pct' && d.meta < 90) return d.meta + 10;
  if (d.tipo === 'seq' && d.meta < 7) return d.meta === 3 ? 5 : 7;
  return null;
}

export const MAX_POR_PESSOA = 2;

// ===== Lista de desejos (SQL 0017) =====
// A criança (ou o adolescente) sugere; só Pai e Mãe definem o preço. O preço é medido em semanas de desafio
// (+10 estrelinhas por desafio cumprido; para o adolescente, 1 semana conquistada).
export const MAX_DESEJOS = 3;
export const PRECOS = { estrelas: [10, 30, 50, 80, 120, 200, 300, 500], semanas: [1, 2, 3, 4, 6, 8, 12] };
export const PRECO_PADRAO = { estrelas: 80, semanas: 3 };
// Prêmio grande: pede uma regra combinada antes de aprovar.
export const desejoGrande = (custo, moeda) => (moeda === 'semanas' ? custo >= 8 : custo >= 300);
export const AGORA_NAO = [
  'Que ideia legal! Vamos conversar sobre ela juntos.',
  'Esse fica para uma data especial, combinado?',
  'Vamos escolher outro desejo juntos?',
];
const palavras = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
// Sugere o preço comparando com os prêmios parecidos (os da vitrine da família primeiro, depois o banco do app).
const MUITO_GRANDE = /bicicleta|bike|celular|smartphone|videogame|video game|console|playstation|xbox|nintendo|tablet|ipad|notebook|computador|viagem|patinete|skate|drone/;
export function precoSugerido(nome, moeda, premios = []) {
  if (MUITO_GRANDE.test(palavras(nome).join(' '))) return moeda === 'semanas' ? 8 : 300;
  const ws = new Set(palavras(nome).filter((w) => !['nova', 'novo', 'com', 'para', 'uma', 'mais'].includes(w)));
  const parecido = (lista) => lista.filter((p) => (p.moeda || 'estrelas') === moeda).find((p) => palavras(p.nome).some((w) => ws.has(w)));
  const achou = parecido(premios) || parecido(PREMIOS);
  return achou ? achou.custo : PRECO_PADRAO[moeda];
}
// Opções de preço mostradas aos pais: a escala inteira (do pequeno ao muito grande), com o sugerido incluído.
export function opcoesPreco(sugerido, moeda) {
  return [...new Set([...PRECOS[moeda], sugerido])].sort((a, b) => a - b);
}
