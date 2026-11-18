import { sessao } from '@/lib/sessao';
import { lerFiltros, dadosRelatorio } from '@/lib/relatorio';
import { STATUS_TXT, hhmm } from '@/lib/util';

const cel = (v) => { const s = String(v ?? ''); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s.replace(/^([=+\-@])/, "'$1"); };

export async function GET(request) {
  const s = await sessao();
  if (!s.eu) return new Response('Sem acesso', { status: 403 });
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const f = lerFiltros(sp);
  const { lista } = await dadosRelatorio(s.supabase, f, s);
  const nome = Object.fromEntries(s.membros.map((m) => [m.id, m.nome]));
  const linhas = [['Data', 'Filho', 'Tarefa', 'Categoria', 'Início', 'Fim', 'Status', 'Concluída em', 'Com foto', 'Justificativa', 'Criada por']];
  lista.forEach(({ o, st }) => linhas.push([o.data, nome[o.membro_id], o.tarefa?.titulo, o.tarefa?.categoria?.nome || '', hhmm(o.hora_inicio), hhmm(o.hora_fim),
    STATUS_TXT[st], o.concluida_em ? new Date(o.concluida_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '', o.foto_path ? 'sim' : '',
    o.justificativa || '', o.tarefa?.criada_por === o.membro_id ? 'Filho' : 'Pais']));
  const csv = '﻿' + linhas.map((l) => l.map(cel).join(';')).join('\r\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="rotina-ativa-${f.de}-a-${f.ate}.csv"`, 'Cache-Control': 'no-store' } });
}
