// @arquivo  DesafioCartao.js: cartão de um desafio com barra de progresso.
// @tipo     componente
// @usa      ./Icone, lib/desafios
// @usado-por app/(app)/desafios/cofrinho/page.js, app/(app)/desafios/mural/page.js, app/(app)/desafios/page.js, app/(app)/hoje/page.js, components/PremioLinha.js
import Link from 'next/link';
import Icone from './Icone';
import Termo from './Termo';
import CarimboDia from './CarimboDia';
import { textoMeta, cicloDe, balanco, usaDiaBom, termoDia } from '@/lib/desafios';
import { hojeISO } from '@/lib/util';

const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';
export function Estrela({ tam = 18, cor = 'var(--mel)' }) {
  return <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true" style={{ fill: cor, flex: 'none' }}><path d={STAR} /></svg>;
}
// Semana conquistada: hexágono mel com check (vazio tracejado = ainda por conquistar).
export function Hexagono({ tam = 30, on = true }) {
  return on
    ? <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7z" fill="var(--mel)" /><path d="m8.3 12.2 2.5 2.5 4.9-5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    : <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7z" fill="none" stroke="var(--campo)" strokeWidth="1.6" strokeDasharray="2.5 2" /></svg>;
}

const LETRA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOME_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay();

// Bolinhas da semana: feito, dia coringa, hoje, ainda vem, sem tarefa que conte.
export function DiasSemana({ dias, desafio }) {
  if (!dias?.length || dias.length > 7) return null;
  const txt = { ok: 'feito', cor: 'dia coringa', hoje: 'hoje', futuro: 'ainda vem', livre: 'não conta', falta: 'não feito' };
  return (
    <div className="des-dias">
      {dias.map((x) => (
        <div key={x.d} data-dia={x.d} data-desafio={desafio}>
          <i className={x.s} aria-label={`${NOME_DIA[dow(x.d)]}: ${txt[x.s] || ''}`}>{x.s === 'ok' ? <Icone nome="check" tam={18} cor="#fff" larg={3} /> : x.s === 'cor' ? '★' : ''}</i>
          {LETRA[dow(x.d)]}
        </div>
      ))}
    </div>
  );
}

// Mensagem curta e positiva sobre o andamento.
export function mensagem(d, p, pf = 'j') {
  if (!p) return 'Começa a contar hoje.';
  const det = p.detalhe || {};
  if (p.status === 'cumprido') {
    const premio = d.recompensa === 'estrelas' ? ` +${d.estrelas} estrelinhas no cofrinho.` : d.recompensa === 'semanas' ? ' Mais uma semana conquistada.' : d.premio ? ` Prêmio: ${d.premio}.` : '';
    return `Desafio cumprido!${premio}`;
  }
  if (usaDiaBom(d)) {
    const T = termoDia(pf);
    const falta = Math.max(p.meta - p.progresso, 0);
    return `${p.progresso} de ${p.meta} ${T.varios}.${falta ? ` Faltam ${falta}.` : ''}`;
  }
  const cor = det.coringa ? ` A ${NOME_DIA[dow(det.coringa)]} virou dia coringa.` : '';
  if (d.tipo === 'capricho') return p.progresso === 0 ? 'Nenhum pedido de refazer até agora. Continue assim!' : 'Teve um pedido de refazer. Semana que vem tem mais!';
  if (d.tipo === 'melhor') return `${p.progresso} feitas. Na semana passada foram ${Math.max(p.meta - 1, 0)}.`;
  if (d.tipo === 'pct' || d.tipo === 'pct_cada') {
    const base = d.tipo === 'pct' && det.total ? `${det.feitas} de ${det.total} tarefas (${p.progresso}%).` : `${p.progresso}%.`;
    return `${base} Meta: ${p.meta}%.`;
  }
  if (p.possivel === 0 && ['dias', 'seq'].includes(d.tipo)) return 'Ainda não há tarefas que contam para este desafio neste período.';
  const falta = Math.max(p.meta - p.progresso, 0);
  const un = d.tipo === 'variedade' ? 'categorias' : d.tipo === 'proprias' ? 'tarefas' : d.tipo === 'seq' ? 'dias seguidos' : 'dias';
  const fim = falta === 0 ? '' : falta <= 2 ? ` Falta${falta > 1 ? 'm' : ''} só ${falta}!` : ` Faltam ${falta}.`;
  return `${p.progresso} de ${p.meta} ${un}.${fim}${cor}`;
}

export function rotuloPeriodo(d) {
  return d.periodo === 'mes' ? 'renova no dia 1º' : 'começa de novo na segunda';
}

// Cartão do desafio (Hoje, Painel e Desafios).
export function DesafioCartao({ d, p, nome, href, pf = 'j', children }) {
  const icone = d.icone || 'hoje';
  const familia = !d.membro_id;
  const barra = ['pct', 'pct_cada'].includes(d.tipo) || d.periodo === 'mes' || ['variedade', 'proprias', 'melhor'].includes(d.tipo);
  // @regra 26/11 Thomas: todo desafio tem fim combinado ("Semana 2 de 4"); no fim ele descansa, não renova sozinho.
  const ciclo = cicloDe(d, hojeISO());
  const corpo = (
    <>
      <div className="des-top">
        <span className={`des-ic${familia ? ' mel' : ''}`}><Icone nome={icone} tam={22} /></span>
        <span><b>{familia ? 'Desafio da família' : 'Desafio'}: {d.titulo}</b><small>{nome ? `${nome} · ` : ''}{textoMeta(d, d.meta)} · {rotuloPeriodo(d)}</small></span>
      </div>
      {ciclo && !ciclo.terminou && (
        <div className="des-ciclo" aria-label={`Desafio de ${ciclo.total} semanas, na semana ${ciclo.semana}`}>
          {/* @decisao 28/11 Thomas: "Semana 1 de 4" parecia tarefas; agora diz que é o ciclo do desafio. */}
          <span>Desafio de {ciclo.total} semanas · {ciclo.ultima ? 'última semana' : `você está na ${ciclo.semana}ª`}</span>
          <div className="barra"><div style={{ width: `${(ciclo.semana / ciclo.total) * 100}%` }} /></div>
        </div>
      )}
      {ciclo?.terminou ? (
        <div className="des-msg des-fim"><b>Ciclo completo! {balanco(d, ciclo)}.</b> {ciclo.feitas > 0 ? 'Que tal continuar?' : 'Sem pressa: recomeçar com calma ou trocar por outro desafio?'}</div>
      ) : usaDiaBom(d) ? (
        <DiaBom d={d} p={p} pf={pf} />
      ) : barra ? (
        <>
          <div className="des-num"><strong>{['pct', 'pct_cada'].includes(d.tipo) ? `${p?.progresso ?? 0}%` : `${p?.progresso ?? 0} de ${p?.meta ?? d.meta}`}</strong><span>{['pct', 'pct_cada'].includes(d.tipo) ? `meta ${p?.meta ?? d.meta}%` : d.periodo === 'mes' ? 'neste mês' : 'nesta semana'}</span></div>
          <div className="barra"><div style={{ width: `${Math.min(100, p?.meta ? (p.progresso / p.meta) * 100 : 0)}%`, background: p?.status === 'cumprido' ? 'var(--ok)' : undefined }} /></div>
          <div className="des-msg" style={{ marginTop: 10 }}>{mensagem(d, p)}</div>
        </>
      ) : (
        <>
          <DiasSemana dias={p?.detalhe?.dias} />
          <div className="des-msg">{mensagem(d, p)}</div>
        </>
      )}
      {children}
    </>
  );
  return href
    ? <Link prefetch={false} href={href} className="card des-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>{corpo}</Link>
    : <div className="card des-card">{corpo}</div>;
}

// Corpo do cartão para desafios de "dia bom" (migração 0037): bolinhas, "N dias bons" e a explicação ao toque.
// @decisao 28/11 Thomas: hoje fica em andamento; o resultado do dia sai amanhã (carimbo). Meta impossível: faixa de 1 linha.
function DiaBom({ d, p, pf }) {
  const T = termoDia(pf);
  const det = p?.detalhe || {};
  const hoje = hojeISO();
  const dHoje = (det.dias || []).find((x) => x.s === 'hoje');
  const impossivel = !!det.impossivel && p?.status !== 'cumprido';
  const falta = Math.max((p?.meta ?? d.meta) - (p?.progresso ?? 0), 0);
  const pct = d.dia_bom_pct;
  return (
    <>
      <CarimboDia desafio={d.id} dias={det.dias || []} hoje={hoje} crianca={pf === 'c'} />
      <DiasSemana dias={det.dias} desafio={d.id} />
      <div className="des-num" style={{ marginTop: 4 }}><strong>{p?.progresso ?? 0} {(p?.progresso ?? 0) === 1 ? T.um : T.varios}</strong><span>meta {p?.meta ?? d.meta}</span></div>
      <div className="des-msg">
        {p?.status === 'cumprido' ? mensagem(d, p, pf)
          : dHoje && dHoje.n > 0 ? `Hoje: ${dHoje.f} de ${dHoje.n} tarefas. O resultado do dia sai amanhã.`
          : 'O resultado de hoje sai amanhã.'}
        {p?.status !== 'cumprido' && falta > 0 && !impossivel ? ` Faltam ${falta}.` : ''}
      </div>
      {impossivel && <div className="aviso info" style={{ margin: '10px 0 0', padding: '6px 12px', fontSize: 13 }}>Esta semana não dá mais para bater a meta. A próxima começa do zero.</div>}
      {d.decisao && d.semana_decidida && p && d.semana_decidida === p.inicio && (
        <div className="aviso ok" style={{ margin: '10px 0 0', padding: '6px 12px', fontSize: 13 }}>{d.decisao === 'leve' ? 'Combinado: a meta ficou mais leve nesta semana.' : 'Combinado: segue como está.'}</div>
      )}
      <small className="peq-cinza" style={{ display: 'block', marginTop: 6 }}>
        O que é <Termo texto={T.nome} titulo={`O que é um ${T.nome}?`}>É o dia em que você faz pelo menos {pct}% das suas tarefas. Se fizer 4 de 5, já conta! O resultado do dia aparece no dia seguinte, com um carimbo.</Termo>? Toque para ver.
      </small>
    </>
  );
}
