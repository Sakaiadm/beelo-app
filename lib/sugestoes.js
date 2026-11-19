// Sugestões de atividades para quem está começando. Lista fixa dentro do app.
// idade: c = criança (até ~12), a = adolescente (13 a 17), j = jovem adulto (18+)
// rec: uma | diaria | semana (seg. a sex.) | pers (usa dias) | semanal | mensal
export const IDADES = [['c', 'Criança'], ['a', 'Adolescente'], ['j', 'Jovem adulto']];

export const SUGESTOES = [
  // Casa
  { nome: 'Arrumar o quarto', cat: 'Casa', idade: 'caj', rec: 'diaria', hora: '18:00' },
  { nome: 'Arrumar a cama', cat: 'Casa', idade: 'caj', rec: 'diaria', hora: '07:30' },
  { nome: 'Lavar a louça', cat: 'Casa', idade: 'aj', rec: 'diaria', hora: '20:00' },
  { nome: 'Tirar o lixo', cat: 'Casa', idade: 'aj', rec: 'pers', dias: [1, 3, 5] },
  { nome: 'Guardar a roupa lavada', cat: 'Casa', idade: 'caj', rec: 'semanal' },
  { nome: 'Passear com o cachorro', cat: 'Casa', idade: 'aj', rec: 'diaria', hora: '17:30' },
  { nome: 'Dar comida aos animais', cat: 'Casa', idade: 'caj', rec: 'diaria', hora: '08:00' },
  { nome: 'Limpar o banheiro', cat: 'Casa', idade: 'aj', rec: 'semanal', foto: true },
  { nome: 'Ajudar a pôr a mesa', cat: 'Casa', idade: 'c', rec: 'diaria', hora: '12:00' },
  // Estudo
  { nome: 'Lição de casa', cat: 'Estudo', idade: 'ca', rec: 'semana', hora: '16:00' },
  { nome: 'Ler por 20 minutos', cat: 'Estudo', idade: 'caj', rec: 'diaria', hora: '21:00' },
  { nome: 'Estudar para a prova', cat: 'Estudo', idade: 'aj', rec: 'uma' },
  { nome: 'Arrumar a mochila', cat: 'Estudo', idade: 'ca', rec: 'semana', hora: '21:30' },
  { nome: 'Revisar a matéria do dia', cat: 'Estudo', idade: 'aj', rec: 'semana', hora: '19:00' },
  { nome: 'Estudar inglês', cat: 'Estudo', idade: 'aj', rec: 'pers', dias: [2, 4], hora: '19:30' },
  // Saúde
  { nome: 'Tomar o remédio', cat: 'Saúde', idade: 'caj', rec: 'diaria', hora: '08:00' },
  { nome: 'Beber água ao longo do dia', cat: 'Saúde', idade: 'caj', rec: 'diaria' },
  { nome: 'Dormir até as 22h', cat: 'Saúde', idade: 'caj', rec: 'diaria', hora: '22:00' },
  { nome: 'Tomar as vitaminas', cat: 'Saúde', idade: 'caj', rec: 'diaria', hora: '08:00' },
  { nome: 'Consulta de rotina', cat: 'Saúde', idade: 'caj', rec: 'uma' },
  // Cuidado pessoal
  { nome: 'Escovar os dentes', cat: 'Cuidado pessoal', idade: 'caj', rec: 'diaria', hora: '21:30' },
  { nome: 'Tomar banho', cat: 'Cuidado pessoal', idade: 'ca', rec: 'diaria', hora: '18:30' },
  { nome: 'Passar o fio dental', cat: 'Cuidado pessoal', idade: 'aj', rec: 'diaria', hora: '21:30' },
  { nome: 'Separar a roupa do dia seguinte', cat: 'Cuidado pessoal', idade: 'ca', rec: 'diaria', hora: '21:00' },
  { nome: 'Cuidar da pele', cat: 'Cuidado pessoal', idade: 'aj', rec: 'diaria', hora: '22:00' },
  // Esporte
  { nome: 'Treino', cat: 'Esporte', idade: 'aj', rec: 'pers', dias: [1, 3, 5], hora: '18:00' },
  { nome: 'Caminhar por 30 minutos', cat: 'Esporte', idade: 'caj', rec: 'diaria', hora: '17:00' },
  { nome: 'Alongar', cat: 'Esporte', idade: 'caj', rec: 'diaria', hora: '07:00' },
  { nome: 'Brincar ao ar livre', cat: 'Esporte', idade: 'c', rec: 'diaria', hora: '16:30' },
  // Lazer e Social
  { nome: 'Tempo livre sem tela', cat: 'Lazer', idade: 'caj', rec: 'diaria', hora: '19:00' },
  { nome: 'Jogo ou atividade em família', cat: 'Lazer', idade: 'caj', rec: 'pers', dias: [6], hora: '16:00' },
  { nome: 'Ligar para os avós', cat: 'Social', idade: 'caj', rec: 'semanal' },
  { nome: 'Encontrar os amigos', cat: 'Social', idade: 'aj', rec: 'semanal' },
  // Espiritual
  { nome: 'Momento de oração ou reflexão', cat: 'Espiritual', idade: 'caj', rec: 'diaria', hora: '21:45' },
  { nome: 'Escrever três gratidões do dia', cat: 'Espiritual', idade: 'aj', rec: 'diaria', hora: '22:00' },
  // Financeiro
  { nome: 'Anotar os gastos da semana', cat: 'Financeiro', idade: 'aj', rec: 'semanal' },
  { nome: 'Guardar parte da mesada', cat: 'Financeiro', idade: 'ca', rec: 'mensal' },
  { nome: 'Pagar as contas do mês', cat: 'Financeiro', idade: 'j', rec: 'mensal' },
  // Trabalho
  { nome: 'Entregar o relatório do estágio', cat: 'Trabalho/Estágio', idade: 'j', rec: 'semanal' },
  { nome: 'Organizar a agenda da semana', cat: 'Trabalho/Estágio', idade: 'j', rec: 'semanal', hora: '20:00' },
];

const NOMES_DIA = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
export function resumoSugestao(s) {
  const r = s.rec === 'uma' ? 'Uma vez' : s.rec === 'diaria' ? 'Todo dia' : s.rec === 'semana' ? 'Seg. a Sex.' : s.rec === 'semanal' ? 'Toda semana' : s.rec === 'mensal' ? 'Todo mês'
    : [...s.dias].sort().map((d) => NOMES_DIA[d]).join(', ').replace(/, ([^,]*)$/, ' e $1');
  return s.hora ? `${r} · ${s.hora}` : r;
}
