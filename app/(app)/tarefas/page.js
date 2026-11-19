import Link from 'next/link';
import { exigirMembro } from '@/lib/sessao';
import { ocorrencias } from '@/lib/dados';
import { CORES_CAT, hhmm, DIAS_CURTO, dataCurta, dataExtensa, hojeISO, statusExibido } from '@/lib/util';
import Icone from '@/components/Icone';

export const dynamic = 'force-dynamic';

const REC = { diaria: 'Todo dia', semanal: 'Toda semana', mensal: 'Todo mês' };
const NOMES_DIA = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
function quando(t) {
  if (t.tipo === 'pontual') return `Em ${dataCurta(t.data_inicio)}`;
  if (t.recorrencia === 'dias_semana') {
    const d = [...t.dias_semana].sort();
    if (d.join() === '1,2,3,4,5') return 'Seg. a Sex.';
    return d.map((x) => NOMES_DIA[x]).join(' ');
  }
  return REC[t.recorrencia] || 'Repete';
}

export default async function Tarefas({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor } = await exigirMembro();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || '') ? sp.d : null;
  const { data } = await supabase.from('ra_tarefas').select('*, categoria:ra_categorias(nome, cor)').eq('ativa', true).order('titulo');
  let tarefas = data || [];
  if (dia) {
    // Só as tarefas que acontecem no dia escolhido na Agenda.
    const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo).map((f) => f.id);
    const alvo = gestor ? (filhos.includes(sp.m) ? [sp.m] : filhos) : [eu.id];
    const oc = await ocorrencias(supabase, { de: dia, ate: dia, membros: alvo });
    const ids = new Set(oc.filter((o) => statusExibido(o, hojeISO()) !== 'adiada').map((o) => o.tarefa_id));
    tarefas = tarefas.filter((t) => ids.has(t.id));
  }
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));
  const grupos = gestor
    ? membros.filter((m) => m.papel === 'filho').map((f) => ({ titulo: f.nome, itens: tarefas.filter((t) => t.responsavel_id === f.id) }))
    : [{ titulo: 'Criadas por você', itens: tarefas.filter((t) => t.criada_por === eu.id) }, { titulo: 'Dos seus pais', itens: tarefas.filter((t) => t.criada_por !== eu.id) }];
  const novaHref = dia ? `/tarefas/nova?d=${dia}` : '/tarefas/nova';
  return (
    <main>
      <div className="cab">
        <div>
          <h1 className="titulo">Tarefas</h1>
          <p className="sub">{dia ? dataExtensa(dia) : gestor ? 'Todas as tarefas. Toque numa tarefa para ver os detalhes. O lápis edita.' : 'Crie tarefas suas para organizar a rotina.'}</p>
        </div>
        <div className="acoes">
          <Link prefetch={false} className="btn" href={novaHref}><Icone nome="mais" tam={18} cor="#fff" />Adicionar tarefa</Link>
          {dia ? <Link prefetch={false} className="btn sec" href="/tarefas">Ver todas</Link> : <Link prefetch={false} className="btn sec" href="/agenda">Agenda</Link>}
        </div>
      </div>
      {sp.ok && <div className="aviso ok">Tarefa salva.</div>}
      {grupos.map((g) => (
        <div className="card" key={g.titulo}>
          <h2>{g.titulo} <span style={{ color: 'var(--cinza)', fontWeight: 600, fontSize: 14 }}>· {g.itens.length}</span></h2>
          {g.itens.length === 0 && <div className="vazio">{dia ? 'Nenhuma tarefa neste dia.' : 'Nenhuma tarefa.'}</div>}
          <div className="lista-tarefas">
            {g.itens.map((t) => {
              const [f, l] = CORES_CAT[t.categoria?.cor] || CORES_CAT.cinza;
              const pode = gestor || t.criada_por === eu.id;
              const hora = t.hora_inicio ? `${hhmm(t.hora_inicio)}${t.hora_fim ? '–' + hhmm(t.hora_fim) : ''}` : 'Sem horário';
              return (
                <div key={t.id} className="linha-tarefa">
                  {pode && <Link prefetch={false} className="btn sec peq icone lapis" href={`/tarefas/${t.id}/editar`} aria-label={`Editar ${t.titulo}`} title="Editar"><Icone nome="lapis" tam={18} /></Link>}
                  <div className="texto">
                    <Link prefetch={false} className="cobre" href={`/tarefas/${t.id}`}>{t.titulo}</Link>
                    <small>{quando(t)} · {hora}{t.exige_foto ? ' · com foto' : ''}</small>
                    {t.criada_por === t.responsavel_id && gestor && <small>criada por {nome[t.criada_por]}</small>}
                  </div>
                  {t.categoria && <span className="pilula" style={{ background: f, color: l }}>{t.categoria.nome}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}
