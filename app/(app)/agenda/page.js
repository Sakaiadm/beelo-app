import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import Link from 'next/link';
import BotaoMais from '@/components/BotaoMais';
import { hojeISO, addDias, inicioMes, fimMes, dataLonga, diaSemana, statusExibido, hhmm, DIAS, MESES } from '@/lib/util';
import Icone from '@/components/Icone';
import Calendario from '@/components/Calendario';
import Tarefa from '@/components/Tarefa';
import Pessoas from '@/components/Pessoas';

export const dynamic = 'force-dynamic';
const LETRA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default async function Agenda({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor } = await exigirMembro();
  const hoje = hojeISO();
  // Duas visões (Raio-X U14): Semana (7 bolinhas e a lista do dia tocado) e Mês. O antigo "Dia" virou a Semana.
  const v = sp.v === 'mes' ? 'mes' : 'semana';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || '') ? sp.d : hoje;
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  const a = acesso(eu);
  const veTodos = gestor || a.painel;
  const pessoas = veTodos ? [eu, ...filhos.filter((f) => f.id !== eu.id)] : [eu];
  const filtroM = veTodos ? (pessoas.find((f) => f.id === sp.m)?.id || '') : eu.id;
  const alvo = filtroM ? [filtroM] : pessoas.map((f) => f.id);
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));

  // Semana sempre de segunda a domingo (U15).
  const seg = addDias(d, -((diaSemana(d) + 6) % 7));
  const de = v === 'semana' ? seg : inicioMes(d);
  const ate = v === 'semana' ? addDias(seg, 6) : fimMes(d);
  const lista = (await ocorrencias(supabase, { de, ate, membros: alvo })).map((o) => ({ o, st: statusExibido(o, hoje) }));
  const qs = (o) => { const p = new URLSearchParams({ ...(v === 'mes' ? { v } : {}), d, ...(filtroM && veTodos ? { m: filtroM } : {}), ...o }); return `/agenda?${p}`; };

  const porDia = {};
  lista.forEach(({ o, st }) => {
    if (st === 'adiada') return;
    const x = (porDia[o.data] ||= { total: 0, feitas: 0 });
    x.total++; if (st.startsWith('cumprida') || st === 'justificada') x.feitas++;
  });
  const doDia = v === 'semana' ? lista.filter((x) => x.o.data === d && x.st !== 'adiada') : [];
  const fotos = doDia.length ? await urlsFotos(supabase, doDia.map((x) => x.o.foto_path)) : {};
  const emHoje = v === 'mes' ? d.slice(0, 7) === hoje.slice(0, 7) : hoje >= seg && hoje <= addDias(seg, 6);
  const volta = qs({});
  const fimSem = addDias(seg, 6);
  const periodo = seg.slice(5, 7) === fimSem.slice(5, 7)
    ? `${Number(seg.slice(8))} a ${Number(fimSem.slice(8))} ${MESES[Number(fimSem.slice(5, 7)) - 1].slice(0, 3)}.`
    : `${Number(seg.slice(8))} ${MESES[Number(seg.slice(5, 7)) - 1].slice(0, 3)}. a ${Number(fimSem.slice(8))} ${MESES[Number(fimSem.slice(5, 7)) - 1].slice(0, 3)}.`;
  const cartao = (x) => (
    <Tarefa key={x.o.id} oc={x.o} st={x.st} dono={x.o.membro_id === eu.id} quemMarca={nome[x.o.membro_id]} gestor={gestor} confere={a.conferir} familia={eu.familia_id}
      editarHref={x.o.tarefa?.especial === 'tela' ? (gestor ? `/tela?m=${x.o.membro_id}` : null) : gestor || (x.o.tarefa?.criada_por === eu.id && x.o.membro_id === eu.id) ? `/tarefas/${x.o.tarefa_id}/editar?${new URLSearchParams({ d, volta })}` : null}
      fotoUrl={fotos[x.o.foto_path]} hoje={hoje} />
  );
  const ordem = (p, q) => (hhmm(p.o.hora_inicio) || '99').localeCompare(hhmm(q.o.hora_inicio) || '99');

  return (
    <main className="agenda-tela">
      {/* Cabeçalho mais baixo (U16): título, "Hoje" e as setas na mesma linha. */}
      <div className="cab-agenda">
        <div className="tit"><h1 className="titulo">Agenda</h1>{emHoje
          ? <span className="hoje-peq on" aria-current="date" title="Você está vendo hoje">Hoje</span>
          : <Link prefetch={false} className="hoje-peq" href={qs({ d: hoje })} title="Voltar para hoje">Hoje</Link>}</div>
        {v === 'semana' && (
          <div className="nv-curta">
            <Link prefetch={false} className="seta" href={qs({ d: addDias(d, -7) })} aria-label="Semana anterior"><Icone nome="esq" tam={24} /></Link>
            <span>{periodo}</span>
            <Link prefetch={false} className="seta" href={qs({ d: addDias(d, 7) })} aria-label="Próxima semana"><Icone nome="dir" tam={24} /></Link>
          </div>
        )}
      </div>
      {sp.aviso === 'amanha' && <div className="aviso ok" role="status">Tarefa salva. Como o horário de hoje já passou, ela começa amanhã.</div>}
      <div className="seg" role="tablist" aria-label="Visão">
        <Link prefetch={false} href={qs({ v: 'semana' })} className={v === 'semana' ? 'on' : ''}>Semana</Link>
        <Link prefetch={false} href={qs({ v: 'mes' })} className={v === 'mes' ? 'on' : ''}>Mês</Link>
      </div>
      {veTodos && (
        <Pessoas rotulo="Pessoa" itens={[{ id: 'todos', nome: 'Todos', cor: null, href: `/agenda?${new URLSearchParams({ ...(v === 'mes' ? { v } : {}), d })}`, on: !filtroM },
          ...pessoas.map((f) => ({ id: f.id, nome: f.id === eu.id ? 'Eu' : f.nome, cor: f.cor, href: `/agenda?${new URLSearchParams({ ...(v === 'mes' ? { v } : {}), d, m: f.id })}`, on: filtroM === f.id }))]} />
      )}

      {v === 'mes' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <Calendario mes={d} porDia={porDia} hoje={hoje} sel={d}
            link={(x, dia) => (dia ? `/agenda?d=${x}${filtroM && veTodos ? `&m=${filtroM}` : ''}` : qs({ d: x }))} />
        </div>
      )}

      {v === 'semana' && <>
        {/* Celular: 7 bolinhas de dia com o "3 de 5" de cada um. */}
        <div className="dias-ag" role="tablist" aria-label="Dia da semana">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = addDias(seg, i); const x = porDia[dia];
            return (
              <Link prefetch={false} key={dia} href={qs({ d: dia })} role="tab" aria-selected={dia === d}
                className={`${dia === d ? 'on' : ''} ${dia === hoje ? 'hoje' : ''} ${x && x.total && x.feitas === x.total && dia <= hoje ? 'tudo' : ''}`}
                aria-label={`${DIAS[diaSemana(dia)]} ${Number(dia.slice(8))}${x?.total ? `: ${x.feitas} de ${x.total} feitas` : ''}`}>
                <small>{LETRA[diaSemana(dia)]}</small><b>{Number(dia.slice(8))}</b><em>{x?.total ? `${x.feitas}/${x.total}` : '·'}</em>
              </Link>
            );
          })}
        </div>
        {/* Computador: as 7 colunas continuam. */}
        <div className="semana so-pc">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = addDias(seg, i);
            const itens = lista.filter((x) => x.o.data === dia && x.st !== 'adiada').sort(ordem);
            return (
              <Link prefetch={false} className={`dia ${dia === d ? 'sel' : ''}`} key={dia} href={qs({ d: dia })} style={{ display: 'block', color: 'var(--texto)', textDecoration: 'none', ...(dia === hoje ? { outline: '2px solid var(--azul)' } : {}) }}>
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
        </div>

        <div className="ag-lista">
          <div className="grupo-titulo">{dataLonga(d).replace(/^./, (c) => c.toUpperCase())}</div>
          {doDia.length === 0 && <div className="card vazio">Nenhuma tarefa neste dia.</div>}
          {/* Em "Todos", um título por pessoa, que abre e fecha (U18). */}
          {veTodos && !filtroM ? pessoas.map((p) => {
            const dela = doDia.filter((x) => x.o.membro_id === p.id).sort(ordem);
            if (!dela.length) return null;
            const f = dela.filter((x) => x.st.startsWith('cumprida') || x.st === 'justificada').length;
            return (
              <details key={p.id} className="ag-pessoa" open>
                <summary><i style={{ background: p.cor || 'var(--cinza)' }} aria-hidden="true" /><b>{p.id === eu.id ? 'Eu' : p.nome}</b><span>{f} de {dela.length}</span></summary>
                {dela.map(cartao)}
              </details>
            );
          }) : doDia.sort(ordem).map(cartao)}
        </div>
      </>}
      <BotaoMais href={`/tarefas/nova?${new URLSearchParams({ d: d < hoje ? hoje : d, volta, ...(filtroM && gestor ? { m: filtroM } : {}) })}`} />
    </main>
  );
}
