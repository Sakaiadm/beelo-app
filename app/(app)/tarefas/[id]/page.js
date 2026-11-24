import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import { hojeISO, addDias, statusExibido, CORES_CAT, DIAS_CURTO, hhmm, dataCurta } from '@/lib/util';
import Tarefa from '@/components/Tarefa';
import Icone from '@/components/Icone';

export const dynamic = 'force-dynamic';
const REC = { diaria: 'Todo dia', semanal: 'Toda semana', mensal: 'Todo mês' };

export default async function Detalhes({ params }) {
  const { id } = await params;
  const { supabase, eu, membros, gestor } = await exigirMembro();
  const { data: t } = await supabase.from('ra_tarefas').select('*, categoria:ra_categorias(nome, cor)').eq('id', id).maybeSingle();
  if (!t) notFound();
  const hoje = hojeISO();
  const pode = gestor || (t.criada_por === eu.id && t.responsavel_id === eu.id);
  const lista = await ocorrencias(supabase, { de: addDias(hoje, -30), ate: addDias(hoje, 7), tarefaId: t.id });
  const fotos = await urlsFotos(supabase, lista.map((o) => o.foto_path));
  // Só o quadrinho que importa: o de hoje; se não houver, o próximo; se não, o último que passou.
  const escolhida = lista.find((o) => o.data === hoje) || lista.find((o) => o.data > hoje) || [...lista].reverse()[0];
  const itens = escolhida ? [{ o: escolhida, st: statusExibido(escolhida, hoje) }] : [];
  const resp = membros.find((m) => m.id === t.responsavel_id);
  const [f, l] = CORES_CAT[t.categoria?.cor] || CORES_CAT.cinza;
  const quando = t.tipo === 'pontual' ? `Em ${dataCurta(t.data_inicio)}` : t.recorrencia === 'dias_semana' ? t.dias_semana.map((d) => DIAS_CURTO[d]).join(' ') : REC[t.recorrencia] || 'Repete';
  const horario = t.hora_inicio ? `${hhmm(t.hora_inicio)}${t.hora_fim ? '–' + hhmm(t.hora_fim) : ''}` : 'Sem horário';
  const regras = [t.exige_foto && 'Exige foto', t.permite_adiar && 'Pode adiar', t.exige_justificativa && 'Exige justificativa se atrasar'].filter(Boolean);
  return (
    <main className="estreito">
      <div className="cab">
        <div><h1 className="titulo">{t.titulo}</h1><p className="sub">{resp?.nome} · {quando} · {horario}</p></div>
        <div className="acoes">
          <Link prefetch={false} className="btn sec peq" href="/tarefas">Voltar</Link>
          {pode && <Link prefetch={false} className="btn peq icone" href={`/tarefas/${t.id}/editar`} aria-label="Editar tarefa" title="Editar"><Icone nome="lapis" tam={18} cor="#fff" /></Link>}
        </div>
      </div>
      <div className="card">
        <div className="acoes" style={{ alignItems: 'center' }}>
          {t.categoria && <span className="pilula" style={{ background: f, color: l }}>{t.categoria.nome}</span>}
          {regras.length ? regras.map((r) => <span key={r} className="pilula" style={{ background: 'var(--campo)', color: 'var(--texto)' }}>{r}</span>) : <span style={{ fontSize: 'var(--f-apoio)', color: 'var(--cinza)' }}>Sem regras extras</span>}
        </div>
        {t.descricao && <p style={{ marginBottom: 0 }}>{t.descricao}</p>}
      </div>
      <div className="grupo-titulo">{itens[0]?.o.data === hoje ? 'Hoje' : 'Tarefa'}</div>
      {itens.length === 0 && <div className="card vazio">Nenhuma ocorrência neste período.</div>}
      {itens.map((x) => <Tarefa key={x.o.id} oc={x.o} st={x.st} dono={!gestor && x.o.membro_id === eu.id} gestor={gestor} familia={eu.familia_id} fotoUrl={fotos[x.o.foto_path]} hoje={hoje} />)}
    </main>
  );
}
