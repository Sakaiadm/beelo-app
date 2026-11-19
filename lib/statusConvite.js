// Texto curto do estado do convite de uma pessoa.
export function statusConvite(m) {
  if (m.user_id) return { txt: 'Entrou', tipo: 'ok' };
  if (!m.email) return null;
  if (m.convidado_em) {
    const d = new Date(m.convidado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
    return { txt: `Convite enviado em ${d} · aguardando`, tipo: 'espera' };
  }
  return { txt: 'Convite ainda não enviado', tipo: 'pend' };
}
