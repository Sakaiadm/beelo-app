// @arquivo  jeito.js: jeito de ver o beelo (Divertido, Calmo, Como os adultos) por faixa de idade.
// @tipo     regra
// @usado-por app/(app)/ajuda/page.js, app/(app)/hoje/page.js, app/(app)/layout.js, app/(app)/painel/page.js, app/(app)/perfil/page.js, app/(app)/relatorios/page.js e mais 4
// @cuidado  muda só a aparência; o cofrinho segue o modo criança.
// Jeito de ver o beelo (pedido do Thomas, 25/11): quem está no modo criança escolhe em Meu perfil
// entre Divertido, Calmo e Como os adultos. Muda só a aparência: o cofrinho (estrelinhas ou semanas)
// continua seguindo o modo criança, escolhido pelo Pai e pela Mãe (lib/desafios.js, perfil()).
export const JEITOS = [
  { id: 'divertido', nome: 'Divertido', desc: 'Estrelinhas, sons e festa a cada tarefa feita.' },
  { id: 'calmo', nome: 'Calmo', desc: 'As mesmas estrelinhas, com festa curtinha e sons suaves.' },
  { id: 'adultos', nome: 'Como os adultos', desc: 'Tela limpa, só com o essencial do dia.' },
];
export const jeitoValido = (j) => JEITOS.some((x) => x.id === j);

// Quem tem a escolha: Filho(a) (de qualquer parentesco) com o modo criança ativo.
export const temJeito = (m) => !!m && m.papel === 'filho' && !!m.modo_crianca;

// Jeito em uso. Sem escolha guardada, fica o Divertido (como o modo criança de sempre).
export function jeitoDe(m) {
  if (!temJeito(m)) return 'adultos';
  return jeitoValido(m.jeito) ? m.jeito : 'divertido';
}
// Telas com cara de criança (estrelinhas, lista única, festa): Divertido e Calmo.
export const visaoCrianca = (m) => jeitoDe(m) !== 'adultos';

// Idade aproximada: o app guarda só o ano aproximado de nascimento (nunca a data), e conta sozinho.
export const anoAgora = () => Number(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 4));
export const idadeDe = (m, ano = anoAgora()) => (m?.idade_ano ? ano - m.idade_ano : null);
// Jeito que começa conforme a idade: até 9 anos Divertido, de 10 a 12 Calmo, 13 ou mais Como os adultos.
export const jeitoPorIdade = (idade) => (idade == null ? null : idade <= 9 ? 'divertido' : idade <= 12 ? 'calmo' : 'adultos');
