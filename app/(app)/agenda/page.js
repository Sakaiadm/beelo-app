import { exigirMembro } from '@/lib/sessao';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import Link from 'next/link';
import { hojeISO, addDias, inicioMes, fimMes, dataExtensa, diaSemana, statusExibido, hhmm, DIAS } from '@/lib/util';
import Icone from '@/components/Icone';
import Calendario from '@/components/Calendario';
import Tarefa from '@/components/Tarefa';

export const dynamic = 'force-dynamic';

export default async function Agenda({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia: fam } = await exigirMembro();
  const hoje = hojeISO();
  const v = ['dia', 'semana', 'mes'].includes(sp.v) ? sp.v : 'semana';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || '') ? sp.d : hoje;
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  const filtroM = gestor ? (filhos.find((f) => f.id === sp.m)?.id || '') : eu.id;
  const alvo = filtroM ? [filtroM] : filhos.map((f) => f.id);
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));

  // A semana começa no dia escolhido (por padrão, hoje).
  const de = v === 'dia' ? d : v === 'semana' ? d : inicioMes(d);
  const ate = v === 'dia' ? d : v === 'semana' ? addDias(d, 6) : fimMes(d);
  const lista = (await ocorrencias(supabase, { de, ate, membros: alvo })).map((o) => ({ o, st: statusExibido(o, hoje) }));
  const qs = (o) => { const p = new URLSearchParams({ v, d, ...(filtroM && gestor ? { m: filtroM } : {}), ...o }); return `/agenda?${p}`; };

  const porDia = {};
  lista.forEach(({ o, st }) => {
    if (st === 'adiada') return;
    const x = (porDia[o.data] ||= { total: 0, feitas: 0 });
    x.total++; if (st.startsWith('cumprida') || st === 'justificada') x.feitas++;
  });
  const fotos = v === 'dia' ? await urlsFotos(supabase, lista.map((x) => x.o.foto_path)) : {};
  const passo = v === 'dia' ? 1 : v === 'semana' ? 7 : 31;

  return (
    <main className="agenda-tela">
      <div className="cab"><div><h1 className="titulo">Agenda</h1>{v === 'mes' && <p className="sub">{dataExtensa(d)}</p>}</div></div>
      <div className="seg" role="tablist" aria-label="Visão">
        <Link prefetch={false} href={qs({ v: 'dia' })} className={v === 'dia' ? 'on' : ''}>Dia</Link>
        <Link prefetch={false} href={qs({ v: 'semana' })} className={v === 'semana' ? 'on' : ''}>Semana</Link>
        <Link prefetch={false} href={qs({ v: 'mes' })} className={v === 'mes' ? 'on' : ''}>Mês</Link>
      </div>
      {v !== 'mes' && (
        <div className="nv">
          <Link prefetch={false} className="b" href={qs({ d: addDias(d, -passo) })} aria-label="Anterior">‹</Link>
          <Link prefetch={false} className="b" href={qs({ d: hoje })}>Hoje</Link>
          <Link prefetch={false} className="b" href={qs({ d: addDias(d, passo) })} aria-label="Próximo">›</Link>
          <span className="dt">{dataExtensa(d)}</span>
        </div>
      )}
      <div className="dois">
        <Link prefetch={false} className="bt az" href={`/tarefas/nova?d=${d}`}><Icone nome="mais" tam={16} cor="#fff" />Adicionar tarefa</Link>
      </div>
      {gestor && (
        <div className="seg" aria-label="Pessoa">
          <Link prefetch={false} href={`/agenda?v=${v}&d=${d}`} className={!filtroM ? 'on' : ''}>Todos</Link>
          {filhos.map((f) => <Link prefetch={false} key={f.id} href={`/agenda?v=${v}&d=${d}&m=${f.id}`} className={filtroM === f.id ? 'on' : ''}>{f.nome}</Link>)}
        </div>
      )}

      {v === 'mes' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <Calendario mes={d} porDia={porDia} hoje={hoje} sel={d}
            link={(x, dia) => (dia ? `/agenda?v=dia&d=${x}${filtroM && gestor ? `&m=${filtroM}` : ''}` : qs({ d: x }))} />
        </div>
      )}

      {v === 'semana' && (
        <div className="rolavel"><div className="semana">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = addDias(de, i);
            const itens = lista.filter((x) => x.o.data === dia && x.st !== 'adiada');
            return (
              <Link prefetch={false} className="dia" key={dia} href={`/agenda?v=dia&d=${dia}${filtroM && gestor ? `&m=${filtroM}` : ''}`} style={{ display: 'block', color: 'var(--texto)', textDecoration: 'none', ...(dia === hoje ? { outline: '2px solid var(--azul)' } : {}) }}>
                <h3>{DIAS[diaSemana(dia)].slice(0, 3)} {dia.slice(8)}</h3>
                {itens.length === 0 && <div style={{ fontSize: 12, color: 'var(--cinza)' }}>Livre</div>}
                {itens.map(({ o, st }) => (
                  <div key={o.id} className={`mini ${st.startsWith('cumprida') ? 'ok' : st === 'atrasada' || st === 'nao_cumprida' ? 'atr' : ''}`}>
                    <strong>{o.hora_inicio ? hhmm(o.hora_inicio) : '—'}</strong> {o.tarefa?.titulo}{!filtroM && gestor ? ` · ${nome[o.membro_id]}` : ''}
                  </div>
                ))}
              </Link>
            );
          })}
        </div></div>
      )}

      {v === 'dia' && (
        <div style={{ maxWidth: 680 }}>
          {lista.length === 0 && <div className="card vazio">Nenhuma tarefa neste dia.</div>}
          {lista.map((x) => (
            <Tarefa key={x.o.id} oc={x.o} st={x.st} dono={!gestor && x.o.membro_id === eu.id} gestor={gestor} familia={eu.familia_id}
              editarHref={gestor || (x.o.tarefa?.criada_por === eu.id && x.o.membro_id === eu.id) ? `/tarefas/${x.o.tarefa_id}/editar?d=${d}` : null} fotoUrl={fotos[x.o.foto_path]} nomeMembro={gestor && !filtroM ? nome[x.o.membro_id] : null} hoje={hoje} />
          ))}
        </div>
      )}
    </main>
  );
}
