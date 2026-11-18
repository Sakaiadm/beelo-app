import { exigirMembro } from '@/lib/sessao';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import { hojeISO, addDias, inicioSemana, inicioMes, fimMes, dataLonga, statusExibido, hhmm, DIAS } from '@/lib/util';
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

  const de = v === 'dia' ? d : v === 'semana' ? inicioSemana(d) : inicioMes(d);
  const ate = v === 'dia' ? d : v === 'semana' ? addDias(inicioSemana(d), 6) : fimMes(d);
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
    <main>
      <div className="cab">
        <div><h1 className="titulo">Agenda</h1><p className="sub" style={{ textTransform: 'capitalize' }}>{v === 'dia' ? dataLonga(d) : v === 'semana' ? `Semana de ${dataLonga(de)}` : ''}</p></div>
        <div className="acoes">
          <div className="abas">
            <a href={qs({ v: 'dia' })} className={v === 'dia' ? 'ativo' : ''}>Dia</a>
            <a href={qs({ v: 'semana' })} className={v === 'semana' ? 'ativo' : ''}>Semana</a>
            <a href={qs({ v: 'mes' })} className={v === 'mes' ? 'ativo' : ''}>Mês</a>
          </div>
          {v !== 'mes' && <>
            <a className="btn sec peq" href={qs({ d: addDias(d, -passo) })} aria-label="Anterior">‹</a>
            <a className="btn sec peq" href={qs({ d: hoje })}>Hoje</a>
            <a className="btn sec peq" href={qs({ d: addDias(d, passo) })} aria-label="Próximo">›</a>
          </>}
        </div>
      </div>
      {gestor && (
        <div className="abas" style={{ marginBottom: 14 }}>
          <a href={`/agenda?v=${v}&d=${d}`} className={!filtroM ? 'ativo' : ''}>Todos</a>
          {filhos.map((f) => <a key={f.id} href={`/agenda?v=${v}&d=${d}&m=${f.id}`} className={filtroM === f.id ? 'ativo' : ''}>{f.nome}</a>)}
        </div>
      )}

      {v === 'mes' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <Calendario mes={d} porDia={porDia} hoje={hoje} sel={d}
            link={(x, dia) => (dia ? qs({ v: 'dia', d: x }) : qs({ d: x }))} />
        </div>
      )}

      {v === 'semana' && (
        <div className="rolavel"><div className="semana">
          {Array.from({ length: 7 }).map((_, i) => {
            const dia = addDias(de, i);
            const itens = lista.filter((x) => x.o.data === dia && x.st !== 'adiada');
            return (
              <div className="dia" key={dia} style={dia === hoje ? { outline: '2px solid var(--azul)' } : undefined}>
                <h3><a href={qs({ v: 'dia', d: dia })} style={{ color: 'var(--texto)', textDecoration: 'none' }}>{DIAS[i].slice(0, 3)} {dia.slice(8)}</a></h3>
                {itens.length === 0 && <div style={{ fontSize: 12, color: 'var(--cinza)' }}>Livre</div>}
                {itens.map(({ o, st }) => (
                  <div key={o.id} className={`mini ${st.startsWith('cumprida') ? 'ok' : st === 'atrasada' || st === 'nao_cumprida' ? 'atr' : ''}`}>
                    <strong>{o.hora_inicio ? hhmm(o.hora_inicio) : '—'}</strong> {o.tarefa?.titulo}{!filtroM && gestor ? ` · ${nome[o.membro_id]}` : ''}
                  </div>
                ))}
              </div>
            );
          })}
        </div></div>
      )}

      {v === 'dia' && (
        <div style={{ maxWidth: 680 }}>
          {lista.length === 0 && <div className="card vazio">Nenhuma tarefa neste dia.</div>}
          {lista.map((x) => (
            <Tarefa key={x.o.id} oc={x.o} st={x.st} dono={!gestor && x.o.membro_id === eu.id} gestor={gestor} familia={eu.familia_id} fotoHoras={fam.foto_max_horas}
              fotoUrl={fotos[x.o.foto_path]} nomeMembro={gestor && !filtroM ? nome[x.o.membro_id] : null} hoje={hoje} />
          ))}
        </div>
      )}
    </main>
  );
}
