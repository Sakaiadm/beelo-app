// Colunas de ra_membros que todo mundo do grupo pode ler. O e-mail fica de fora:
// só Pai e Mãe recebem, pela função ra_emails_grupo (varredura de segurança, item B4).
export const COLS_MEMBRO = 'id, familia_id, user_id, nome, papel, cor, ativo, tela_ativo, termos_aceitos_em, termos_versao, criado_em, avatar, notif, funcao, permissoes, sexo, convidado_em, modo_crianca, premios_ate8, cofrinho_meta, autorizado_em, autorizado_por, autorizado_versao';

// Junta os e-mails (quando quem pede é Pai ou Mãe) à lista de pessoas.
export function juntarEmails(membros, emails) {
  const mapa = new Map((emails || []).map((e) => [e.id, e.email]));
  return (membros || []).map((m) => ({ ...m, email: mapa.get(m.id) ?? null }));
}

// E-mail de uma pessoa do grupo (só funciona para Pai e Mãe).
export async function emailsDoGrupo(supabase) {
  const { data } = await supabase.rpc('ra_emails_grupo');
  return data || [];
}
