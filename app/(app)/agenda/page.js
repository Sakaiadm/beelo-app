import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import Link from 'next/link';
import { hojeISO, addDias, inicioMes, fimMes, dataLonga, periodoSemana, diaSemana, statusExibido, hhmm, DIAS } from '@/lib/util';
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
  // O pai/mãe também pode ter tarefas próprias: "Eu" entra junto com as pessoas.
  // A supervisora com o painel liberado também vê a agenda de todos (sem editar).
  const a = acesso(eu);
  const veTodos = gestor || a.painel;
  const pessoas = veTodos ? [eu, ...filhos.filter((f) => f.id !== eu.id)] : [eu];
  const filtroM = veTodos ? (pessoas.find((f) => f.id === sp.m)?.id || '') : eu.id;
  const alvo = filtroM ? [filtroM] : pessoas.map((f) => f.id);
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));

  // A semana começa no dia escolhido (por padrão, hoje).
  const de = v === 'dia' ? d : v === 'semana' ? d : inicioMes(d);
  const ate = v === 'dia' ? d : v === 'semana' ? addDias(d, 6) : fimMes(d);
  const lista = (await ocorrencias(supabase, { de, ate, membros: alvo })).map((o) => ({ o, st: statusExibido(o, hoje) }));
  const qs = (o) => { const p = new URLSearchParams({ v, d, ...(filtroM && veTodos ? { m: filtroM } : {}), ...o }); return `/agenda?${p}`; };

  const porDia = {};
  lista.forEach(({ o, st }) => {
    if (st === 'adiada') return;
    const x = (porDia[o.data] ||= { total: 0, feitas: 0 });
    x.total++; if (st.startsWith('cumprida') || st === 'justificada') x.feitas++;
  });
  const fotos = v === 'dia' ? await urlsFotos(supabase, lista.map((x) => x.o.foto_path)) : {};
  // "Hoje" fica azul cheio quando o período na tela é o de hoje; em outra data, só o contorno (toque volta para hoje).
  const emHoje = v === 'mes' ? d.slice(0, 7) === hoje.slice(0, 7) : d === hoje;
  const passo = v === 'dia' ? 1 : v === 'semana' ? 7 : 31;

  return (
    <main className="agenda-tela">
      <div className="cab-agenda">
        <div className="tit"><h1 className="titulo">Agenda</h1>{emHoje
          ? <span className="hoje-peq on" aria-current="date" title="Você está vendo hoje">Hoje</span>
          : <Link prefetch={false} className="hoje-peq" href={qs({ d: hoje })} title="Voltar para hoje">Hoje</Link>}</div>
        <Link prefetch={false} className="btn" href={`/tarefas/nova?d=${d}`}><Icone nome="mais" tam={18} cor="#fff" />Nova tarefa</Link>
      </div>
      {sp.aviso === 'amanha' && <div className="aviso ok" role="status">Tarefa salva. Como o horário de hoje já passou, ela começa amanhã.</div>}
      <div className="seg" role="tablist" aria-label="Visão">
        <Link prefetch={false} href={qs({ v: 'dia' })} className={v === 'dia' ? 'on' : ''}>Dia</Link>
        <Link prefetch={false} href={qs({ v: 'semana' })} className={v === 'semana' ? 'on' : ''}>Semana</Link>
        <Link prefetch={false} href={qs({ v: 'mes' })} className={v === 'mes' ? 'on' : ''}>Mês</Link>
      </div>
      {v !== 'mes' && (
        <div className="nv-data">
          <Link prefetch={false} className="seta" href={qs({ d: addDias(d, -passo) })} aria-label="Anterior"><Icone nome="esq" tam={26} /></Link>
          <div className="dt">{v === 'semana' ? periodoSemana(de, ate) : dataLonga(d)}</div>
          <Link prefetch={false} className="seta" href={qs({ d: addDias(d, passo) })} aria-label="Próximo"><Icone nome="dir" tam={26} /></Link>
        </div>
      )}
      {veTodos && (
        <div className="seg pessoas" aria-label="Pessoa">
          <Link prefetch={false} href={`/agenda?v=${v}&d=${d}`} className={!filtroM ? 'on' : ''}>Todos</Link>
          {pessoas.map((f) => <Link prefetch={false} key={f.id} href={`/agenda?v=${v}&d=${d}&m=${f.id}`} className={filtroM === f.id ? 'on' : ''}>{f.id === eu.id ? 'Eu' : f.nome}</Link>)}
        </div>
      )}

      {v === 'mes' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <Calendario mes={d} porDia={porDia} hoje={hoje} sel={d}
            link={(x, dia) => (dia ? `/agenda?v=dia&d=${x}${filtroM && veTodos ? `&m=${filtroM}` : ''}` : qs({ d: x }))} />
        </div>
      )}

      {v === 'semana' && (
        <div className="rolavel"><div className="semana">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = addDias(de, i);
            const itens = lista.filter((x) => x.o.data === dia && x.st !== 'adiada');
            return (
              <Link prefetch={false} className="dia" key={dia} href={`/agenda?v=dia&d=${dia}${filtroM && veTodos ? `&m=${filtroM}` : ''}`} style={{ display: 'block', color: 'var(--texto)', textDecoration: 'none', ...(dia === hoje ? { outline: '2px solid var(--azul)' } : {}) }}>
                <h3>{DIAS[diaSemana(dia)].slice(0, 3)} {dia.slice(8)}</h3>
                {itens.length === 0 && <div style={{ fontSize: 'var(--f-etq)', color: 'var(--cinza)' }}>Livre</div>}
                {itens.map(({ o, st }) => (
                  <div key={o.id} className={`mini ${st.startsWith('cumprida') ? 'ok' : st === 'atrasada' || st === 'nao_cumprida' ? 'atr' : ''}`}>
                    <strong>{o.hora_inicio ? hhmm(o.hora_inicio) : '—'}</strong> {o.tarefa?.titulo}{!filtroM && veTodos ? ` · ${nome[o.membro_id]}` : ''}
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
            <Tarefa key={x.o.id} oc={x.o} st={x.st} dono={x.o.membro_id === eu.id} quemMarca={nome[x.o.membro_id]} gestor={gestor} confere={a.conferir} familia={eu.familia_id}
              editarHref={x.o.tarefa?.especial === 'tela' ? (gestor ? `/tela?m=${x.o.membro_id}` : null) : gestor || (x.o.tarefa?.criada_por === eu.id && x.o.membro_id === eu.id) ? `/tarefas/${x.o.tarefa_id}/editar?d=${d}` : null} fotoUrl={fotos[x.o.foto_path]} nomeMembro={veTodos && !filtroM ? nome[x.o.membro_id] : null} hoje={hoje} />
          ))}
        </div>
      )}
    </main>
  );
}
