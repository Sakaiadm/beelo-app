import { VERSAO_TERMOS } from '@/lib/contato';
import { temModoCrianca } from '@/lib/papeis';

// Quem tem papel de criança ou adolescente (Filho, Sobrinho, Aluno). Pai e Mãe nunca.
export const ehMenor = (m) => m?.papel !== 'gestor' && temModoCrianca(m?.funcao);

// O que falta aceitar: o próprio aceite (versão atual) e, para Pai e Mãe,
// a autorização de cada criança ou adolescente ativo do grupo que ainda não tem.
export function pendencias(eu, membros, gestor) {
  const meu = eu?.termos_versao !== VERSAO_TERMOS;
  const menores = gestor ? (membros || []).filter((m) => m.ativo && ehMenor(m) && !m.autorizado_em) : [];
  return { meu, menores, algum: meu || menores.length > 0 };
}
