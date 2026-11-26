// @arquivo  papeis.js: papéis (Pai, Mãe, Adulto que ajuda, Filho(a)), parentescos e o que cada um pode (acesso()).
// @tipo     regra
// @usado-por app/(app)/agenda/page.js, app/(app)/ajuda/page.js, app/(app)/config/familias/[id]/page.js, app/(app)/config/pessoas/page.js, app/(app)/hoje/page.js, app/(app)/ideias/page.js e mais 9
// @cuidado  papel no banco é gestor ou filho; função e parentesco são rótulos e chaves.
// Papéis das pessoas. "papel" no banco continua sendo gestor (pai/mãe) ou filho (quem recebe tarefas).
export const FUNCOES = [
  { id: 'pai', nome: 'Pai', papel: 'gestor', desc: 'Gestor da família: cria tarefas, confere, vê relatórios e cuida das pessoas e do tempo de tela. Acesso total.', chaves: [] },
  { id: 'mae', nome: 'Mãe', papel: 'gestor', desc: 'Gestora da família: cria tarefas, confere, vê relatórios e cuida das pessoas e do tempo de tela. Acesso total.', chaves: [] },
  { id: 'outro', nome: 'Adulto que ajuda', papel: 'filho', desc: 'Cuida das próprias tarefas e pode ajudar a família. Você libera o resto nas chaves.',
    chaves: [['criar_tarefa_si', 'Cria tarefa para si', true], ['ver_painel', 'Vê o painel da família', false], ['conferir', 'Confere tarefas', false], ['ver_relatorios', 'Vê relatórios', false]] },
  { id: 'filho', ga: true, nome: 'Acompanhado', papel: 'filho', desc: 'Faz só as próprias tarefas e o próprio tempo de tela. Os responsáveis conferem.',
    chaves: [['criar_tarefa_si', 'Cria tarefa para si', false], ['ver_painel', 'Vê o painel da família', false]] },
];
// Papéis antigos (Supervisor, Sobrinho, Aluno) valem como os novos até o SQL 0023 converter os cadastros.
const ANTIGOS = { supervisor: 'outro', sobrinho: 'filho', aluno: 'filho' };
// Parentesco: só um rótulo exibido no perfil. Não muda permissões. "papel" é a sugestão ao escolher.
// ga = tem forma feminina (Filho/Filha); sem o sexo escolhido, mostra "Filho(a)".
export const PARENTESCOS = [
  { id: 'pai', nome: 'Pai', papel: 'pai' },
  { id: 'mae', nome: 'Mãe', papel: 'mae' },
  { id: 'padrasto', nome: 'Padrasto', papel: 'outro' },
  { id: 'madrasta', nome: 'Madrasta', papel: 'outro' },
  { id: 'filho', nome: 'Filho', ga: ['Filha'], papel: 'filho' },
  { id: 'enteado', nome: 'Enteado', ga: ['Enteada'], papel: 'filho' },
  { id: 'irmao', nome: 'Irmão', papel: 'filho' },
  { id: 'irma', nome: 'Irmã', papel: 'filho' },
  { id: 'avo', nome: 'Avô', papel: 'outro' },
  { id: 'avoa', nome: 'Avó', papel: 'outro' },
  { id: 'tio', nome: 'Tio', papel: 'outro' },
  { id: 'tia', nome: 'Tia', papel: 'outro' },
  { id: 'sobrinho', nome: 'Sobrinho', ga: ['Sobrinha'], papel: 'filho' },
  { id: 'neto', nome: 'Neto', ga: ['Neta'], papel: 'filho' },
  { id: 'padrinho', nome: 'Padrinho', papel: 'outro' },
  { id: 'madrinha', nome: 'Madrinha', papel: 'outro' },
  { id: 'afilhado', nome: 'Afilhado', ga: ['Afilhada'], papel: 'filho' },
  { id: 'cuidador', nome: 'Cuidador', ga: ['Cuidadora'], papel: 'outro' },
  { id: 'outro', nome: 'Outro', papel: null },
];
export const parentescoValido = (id) => PARENTESCOS.some((x) => x.id === id);
export const parentescoDe = (id) => PARENTESCOS.find((x) => x.id === id);
export const rotuloParentesco = (id, sexo) => {
  const x = parentescoDe(id);
  if (!x) return '';
  if (!x.ga) return x.nome;
  return sexo === 'f' ? x.ga[0] : sexo === 'm' ? x.nome : `${x.nome}(a)`;
};
// Rótulo da lista de escolha (sem sexo ainda): "Filho(a)", "Neto(a)"...
export const nomeListaParentesco = (x) => (x.ga ? `${x.nome}(a)` : x.nome);
const FEM = { filho: 'Acompanhada' };
const MASC = { filho: 'Acompanhado' };
export function rotuloFuncao(id, sexo) {
  const f = funcaoDe(id);
  if (!f) return '';
  if (!f.ga) return f.nome;
  return sexo === 'f' ? FEM[f.id] : sexo === 'm' ? MASC[f.id] : `${f.nome}(a)`;
}
export const funcaoDe = (id) => FUNCOES.find((f) => f.id === (ANTIGOS[id] || id));
// Modo criança só para quem é acompanhado como criança (não vale para perfis de adulto).
export const temModoCrianca = (id) => (ANTIGOS[id] || id) === 'filho';
// Parentesco guardado (ou o de quem ainda era "Sobrinho" antes do SQL 0023).
const parentescoGuardado = (m) => m?.parentesco || (m?.funcao === 'sobrinho' ? 'sobrinho' : '');
export function nomeFuncao(m) {
  const papel = funcaoDe(m?.funcao) ? rotuloFuncao(funcaoDe(m.funcao).id, m.sexo) : m?.papel === 'gestor' ? 'Responsável' : 'Acompanhado(a)';
  const par = parentescoGuardado(m);
  // Só mostra o parentesco quando ele diz algo além do papel (ex.: "Neta · Filho(a)").
  if (!par || par === funcaoDe(m?.funcao)?.id) return papel;
  return `${rotuloParentesco(par, m.sexo)} · ${papel}`;
}
export function chavesIniciais(funcaoId, salvas) {
  const f = funcaoDe(funcaoId);
  const out = {};
  (f?.chaves || []).forEach(([k, , padrao]) => { out[k] = salvas && k in salvas ? !!salvas[k] : (funcaoId === 'supervisor' && k !== 'criar_tarefa_si') || padrao; });
  return out;
}

// O que cada pessoa pode fazer, pelas chaves do cadastro. Pai e Mãe: tudo.
// Os padrões são os mesmos das chaves no cadastro (e os mesmos do banco, função ra_pode).
export function acesso(eu) {
  const gestor = eu?.papel === 'gestor';
  const k = gestor ? {} : chavesIniciais(eu?.funcao || 'filho', eu?.permissoes);
  const painel = gestor || !!k.ver_painel, relatorios = gestor || !!k.ver_relatorios;
  return {
    gestor, painel, relatorios, conferir: gestor || !!k.conferir,
  };
}
