// @arquivo  statusConvite.js: texto curto do estado do convite de uma pessoa (Entrou, Enviado…).
// @tipo     regra
// @usado-por components/PessoaForm.js
// Texto curto do estado do convite de uma pessoa.
export function statusConvite(m) {
  if (m.user_id) return { txt: 'Entrou', tipo: 'ok' };
  if (!m.email) return null;
  if (m.convidado_em) {
    const d = new Date(m.convidado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
    return { txt: `Convidado em ${d}`, tipo: 'espera' };
  }
  return { txt: 'Sem convite', tipo: 'pend' };
}
