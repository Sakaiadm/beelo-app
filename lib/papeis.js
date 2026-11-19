// Funções das pessoas. "papel" no banco continua sendo gestor (pai/mãe) ou filho (quem recebe tarefas).
export const FUNCOES = [
  { id: 'pai', nome: 'Pai', papel: 'gestor', desc: 'Gestor da família: cria tarefas, confere, vê relatórios e cuida das pessoas e do tempo de tela. Acesso total.', chaves: [] },
  { id: 'mae', nome: 'Mãe', papel: 'gestor', desc: 'Gestora da família: cria tarefas, confere, vê relatórios e cuida das pessoas e do tempo de tela. Acesso total.', chaves: [] },
  { id: 'supervisor', ga: true, nome: 'Supervisor', papel: 'filho', desc: 'Acompanha quem você liberar: vê o painel, confere tarefas e vê relatórios. Não muda cadastros nem a família.',
    chaves: [['ver_painel', 'Ver o painel', true], ['conferir', 'Conferir tarefas', true], ['criar_tarefas', 'Criar e editar tarefas', false], ['ver_relatorios', 'Ver relatórios', true], ['gerir_tela', 'Gerir tempo de tela', false]] },
  { id: 'filho', ga: true, nome: 'Filho', papel: 'filho', desc: 'Faz só as próprias tarefas e o próprio tempo de tela. Os pais conferem.',
    chaves: [['criar_tarefa_si', 'Criar tarefa para si', false], ['propor_tela', 'Propor tempo de tela', true], ['ver_painel', 'Ver o painel da família', false]] },
  { id: 'sobrinho', ga: true, nome: 'Sobrinho', papel: 'filho', desc: 'Faz só as próprias tarefas e o próprio tempo de tela. Os gestores conferem.',
    chaves: [['criar_tarefa_si', 'Criar tarefa para si', false], ['propor_tela', 'Propor tempo de tela', true], ['ver_painel', 'Ver o painel da família', false]] },
  { id: 'aluno', ga: true, nome: 'Aluno', papel: 'filho', desc: 'Faz as próprias tarefas e é acompanhado por um supervisor ou pelos pais.',
    chaves: [['criar_tarefa_si', 'Criar tarefa para si', false], ['propor_tela', 'Propor tempo de tela', true], ['ver_painel', 'Ver o painel da família', false]] },
  { id: 'outro', nome: 'Outro usuário', papel: 'filho', desc: 'Outra pessoa que não é criança: cuida das próprias tarefas. Você libera o resto nas chaves.',
    chaves: [['criar_tarefa_si', 'Criar tarefa para si', true], ['propor_tela', 'Propor tempo de tela', true], ['ver_painel', 'Ver o painel da família', false]] },
];
// ga = tem forma feminina (Filho/Filha). Sem o sexo escolhido, mostra "Filho(a)".
const FEM = { supervisor: 'Supervisora', filho: 'Filha', sobrinho: 'Sobrinha', aluno: 'Aluna' };
const MASC = { supervisor: 'Supervisor', filho: 'Filho', sobrinho: 'Sobrinho', aluno: 'Aluno' };
export function rotuloFuncao(id, sexo) {
  const f = FUNCOES.find((x) => x.id === id);
  if (!f) return '';
  if (!f.ga) return f.nome;
  return sexo === 'f' ? FEM[id] : sexo === 'm' ? MASC[id] : `${f.nome}(a)`;
}
export const funcaoDe = (id) => FUNCOES.find((f) => f.id === id);
export const nomeFuncao = (m) => (funcaoDe(m?.funcao) ? rotuloFuncao(m.funcao, m.sexo) : m?.papel === 'gestor' ? 'Pai ou mãe' : 'Filho(a)');
export function chavesIniciais(funcaoId, salvas) {
  const f = funcaoDe(funcaoId);
  const out = {};
  (f?.chaves || []).forEach(([k, , padrao]) => { out[k] = salvas && k in salvas ? !!salvas[k] : padrao; });
  return out;
}
