export const TZ = 'America/Sao_Paulo';

export function hojeISO(base = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(base);
}
export function agoraHHMM() {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}
export function addDias(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function diaSemana(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }
export function inicioSemana(iso) { return addDias(iso, -diaSemana(iso)); }
export function inicioMes(iso) { return iso.slice(0, 8) + '01'; }
export function fimMes(iso) {
  const d = new Date(iso.slice(0, 8) + '01T12:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DIAS_CURTO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export { DIAS, DIAS_CURTO, MESES };
export function dataLonga(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}
export function dataCurta(iso) { return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`; }
export function mesAno(iso) { const d = new Date(iso + 'T12:00:00Z'); return `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }
export function hhmm(t) { return t ? t.slice(0, 5) : ''; }

export function fmtMin(min) {
  if (min == null) return '—';
  const s = min < 0 ? '−' : '';
  const m = Math.abs(Math.round(min));
  const h = Math.floor(m / 60), r = m % 60;
  if (h === 0) return `${s}${r}min`;
  return `${s}${h}h${String(r).padStart(2, '0')}`;
}
export function parseMin(txt) {
  if (txt == null) return null;
  const t = String(txt).trim().toLowerCase().replace(',', '.');
  if (!t) return null;
  let m = t.match(/^(\d{1,2})\s*h\s*(\d{1,2})?\s*(min)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2] || 0);
  m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^(\d{1,4})\s*(min|m)$/);
  if (m) return Number(m[1]);
  m = t.match(/^(\d{1,2}(\.\d+)?)$/);
  if (m) return Math.round(Number(m[1]) * 60);
  return NaN;
}

export function statusExibido(oc, hoje = hojeISO(), agora = agoraHHMM()) {
  if (oc.status === 'cumprida') {
    const prazo = prazoISO(oc);
    const atrasou = oc.concluida_em && new Date(oc.concluida_em) > new Date(prazo);
    return atrasou ? 'cumprida_atraso' : 'cumprida';
  }
  if (oc.status === 'adiamento_pedido') return 'adiamento_pedido';
  if (oc.status === 'adiada') return 'adiada';
  if (oc.status === 'cancelada') return 'cancelada';
  const limite = hhmm(oc.hora_fim || oc.hora_inicio) || '23:59';
  const passou = oc.data < hoje || (oc.data === hoje && agora > limite);
  if (!passou) return 'pendente';
  if (oc.justificativa_status === 'aceita') return 'justificada';
  if (oc.data < addDias(hoje, -1) && !oc.justificativa) return 'nao_cumprida';
  return 'atrasada';
}
export function prazoISO(oc) {
  const h = hhmm(oc.hora_fim || oc.hora_inicio) || '23:59';
  return `${oc.data}T${h}:59-03:00`;
}
export const STATUS_TXT = {
  pendente: 'Pendente', cumprida: 'Cumprida', cumprida_atraso: 'Cumprida com atraso', atrasada: 'Atrasada',
  adiamento_pedido: 'Adiamento pedido', adiada: 'Adiada', nao_cumprida: 'Não cumprida', justificada: 'Justificada', cancelada: 'Cancelada',
};
export const CORES_CAT = {
  laranja: ['#fdecd8', '#8a4a0b'], indigo: ['#e6e9fd', '#3b3fa8'], verde: ['#dff3e6', '#1f6b3a'], vermelho: ['#fde4e6', '#9b1c2a'],
  azul: ['#dceafc', '#0f4fae'], rosa: ['#fce4f0', '#9c1f5f'], teal: ['#ddf1f1', '#0f5f62'], roxo: ['#f1e6fb', '#6b2fa0'], cinza: ['#eceff3', '#4a5568'],
  ciano: ['#dcf4fb', '#0b5d73'], amarelo: ['#fdf4cf', '#7a5c00'], oliva: ['#eef2d9', '#4d5a12'], marrom: ['#efe5dc', '#6b4423'],
};
export const NOMES_CORES = {
  laranja: 'Laranja', indigo: 'Índigo', verde: 'Verde', vermelho: 'Vermelho', azul: 'Azul', rosa: 'Rosa', teal: 'Verde-água',
  roxo: 'Roxo', cinza: 'Cinza', ciano: 'Ciano', amarelo: 'Amarelo', oliva: 'Oliva', marrom: 'Marrom',
};
