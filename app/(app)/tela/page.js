import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { telaResumo, totalReal, textoPrevisto, telaSemana } from '@/lib/tela';
import { hojeISO, addDias, dataCurta, dataLonga, fmtMin, DIAS_CURTO } from '@/lib/util';
import { PrevistoForm, LancamentoForm, RealForm, PropostaForm } from '@/components/TelaForms';
import TelaGrafico from '@/components/TelaGrafico';
import Form from '@/components/Form';
import Responder from '@/components/Responder';
import { PEDIDO } from '@/lib/respostas';
import ConfirmarBotao from '@/components/ConfirmarBotao';
import TelaAjustes from '@/components/TelaAjustes';
import { encerrarPrevisto, responderTela, ligarTela } from '@/app/acoes';

export const dynamic = 'force-dynamic';

const TODOS = [0, 1, 2, 3, 4, 5, 6];
const soUmDia = (r) => r.vigencia_fim != null && r.vigencia_fim === r.vigencia_inicio;
const diasTxt = (r) => (soUmDia(r) ? `Só em ${dataCurta(r.vigencia_inicio)}` : r.dias_semana.length === 7 ? 'Todos os dias'
  : [...r.dias_semana].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DIAS_CURTO[d]).join(' '));
// Previsto salvo -> valores iniciais do formulário (Raio-X S6, S15).
const doPrevisto = (r) => (r ? { cel: r.min_celular, pc: r.min_computador, dias: r.dias_semana, inicio: r.vigencia_inicio, fim: r.vigencia_fim, umDia: soUmDia(r) } : null);

function Historico({ linhas }) {
  if (!linhas.length) return <div className="vazio">Nenhum lançamento nos últimos 14 dias.</div>;
  return (
    <div className="rolavel"><table>
      <thead><tr><th>Dia</th><th className="num">Previsto</th><th className="num">Realizado</th><th className="num">Diferença</th><th>Detalhe</th></tr></thead>
      <tbody>{linhas.map((r) => {
        const real = totalReal(r), prev = r.previsto?.min_total;
        const dif = prev != null ? real - prev : null;
        return (
          <tr key={r.id}>
            <td>{dataCurta(r.data)}</td><td className="num">{prev != null ? fmtMin(prev) : '—'}</td><td className="num">{fmtMin(real)}</td>
            <td className="num" style={{ fontWeight: 700, color: dif == null ? undefined : dif > 0 ? 'var(--erro)' : 'var(--ok)' }}>{dif == null ? '—' : (dif > 0 ? '+' : '') + fmtMin(dif)}</td>
            <td style={{ fontSize: 'var(--f-apoio)', color: 'var(--cinza)' }}>{r.min_celular == null && r.min_computador == null ? 'total' : [r.min_celular != null && `cel ${fmtMin(r.min_celular)}`, r.min_computador != null && `pc ${fmtMin(r.min_computador)}`].filter(Boolean).join(' · ')}{r.foto_celular || r.foto_computador ? ' · com foto' : ''}{r.obs ? ` · ${r.obs}` : ''}</td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

// Tabela dos 14 dias guardada atrás de "Ver dia a dia" (Raio-X S11).
const DiaADia = ({ linhas }) => (
  <details className="card mais-op"><summary>Ver dia a dia (últimos 14 dias)</summary><Historico linhas={linhas} /></details>
);

// Previstos em vigor: tocar para editar (S15). Excluir com balão.
function Previstos({ regras, base, editando }) {
  return (
    <div className="card"><h2>Previstos em vigor</h2>
      {regras.length === 0 && <div className="vazio">Nenhum previsto definido.</div>}
      {regras.map((r) => (
        <div key={r.id} className={`prev-linha${r.id === editando ? ' on' : ''}`}>
          <Link prefetch={false} href={`${base}${base.includes('?') ? '&' : '?'}e=${r.id}#previsto`} className="prev-txt" aria-label={`Editar ${textoPrevisto(r, fmtMin)}`}>
            <b>{textoPrevisto(r, fmtMin)}</b>
            <small>{diasTxt(r)}{r.vigencia_fim && !soUmDia(r) ? ` · até ${dataCurta(r.vigencia_fim)}` : ''}{r.vigencia_inicio > hojeISO() && !soUmDia(r) ? ` · a partir de ${dataCurta(r.vigencia_inicio)}` : ''}{r.origem === 'proposta' ? ' · pedido aprovado' : ''}</small>
          </Link>
          <ConfirmarBotao acao={encerrarPrevisto} campos={{ id: r.id }} rotulo="Excluir" classe="btn perigo peq" titulo="Excluir este previsto?" nome={textoPrevisto(r, fmtMin)}
            pergunta="Ele sai da tela. Os dias que já passaram continuam nos relatórios do mesmo jeito." sim="Sim, excluir" nao="Cancelar" />
        </div>
      ))}
    </div>
  );
}

// Valores para "Usar o mesmo de…" (S31): o previsto que repete mais recente de cada outra pessoa.
async function previstosDosOutros(supabase, pessoas, hoje) {
  const ids = pessoas.map((p) => p.id);
  if (!ids.length) return [];
  const { data } = await supabase.from('ra_tela_previsto').select('membro_id, dias_semana, min_celular, min_computador, vigencia_inicio, vigencia_fim, criado_em')
    .in('membro_id', ids).or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`).order('criado_em', { ascending: false });
  const out = [];
  for (const p of pessoas) {
    const r = (data || []).find((x) => x.membro_id === p.id && !soUmDia(x));
    if (r) out.push({ nome: p.nome, cel: r.min_celular, pc: r.min_computador, dias: r.dias_semana });
  }
  return out;
}

export default async function Tela({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor } = await exigirMembro();
  const hoje = hojeISO(), ontem = addDias(hoje, -1);

  if (!gestor) {
    if (!eu.tela_ativo) redirect('/hoje');
    const crianca = !!eu.modo_crianca;
    const adulto = eu.funcao === 'outro';
    // Sempre o tempo de ontem (S23). Um dia que ficou faltando abre pelo aviso, com ?d=.
    const dia = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || '') && sp.d < ontem && sp.d >= addDias(hoje, -14) ? sp.d : ontem;
    const [{ data: p }, { data: pHoje }, { data: atual }, { data: props }, { data: faltas }, hist, semana] = await Promise.all([
      supabase.rpc('ra_tela_previsto_dia', { p_membro: eu.id, p_data: dia }),
      supabase.rpc('ra_tela_previsto_dia', { p_membro: eu.id, p_data: hoje }),
      supabase.from('ra_tela_real').select('*').eq('membro_id', eu.id).eq('data', dia).maybeSingle(),
      adulto ? Promise.resolve({ data: [] }) : supabase.from('ra_tela_proposta').select('*').eq('membro_id', eu.id).order('criado_em', { ascending: false }).limit(5),
      // Tarefa de lançar ainda pendente em dias anteriores = faltou lançar o dia antes dela.
      supabase.from('ra_ocorrencias').select('data, tarefa:ra_tarefas!inner(especial)').eq('membro_id', eu.id).eq('tarefa.especial', 'tela')
        .eq('status', 'pendente').lt('data', hoje).gte('data', addDias(hoje, -13)).order('data', { ascending: false }),
      telaResumo(supabase, eu.id, addDias(hoje, -14), hoje),
      telaSemana(supabase, eu.id, ontem, addDias),
    ]);
    const lancados = new Set(hist.map((r) => r.data));
    const faltou = (faltas || []).map((o) => addDias(o.data, -1)).filter((d) => d !== dia && !lancados.has(d));
    let regras = [], editar = null;
    if (adulto) {
      ({ data: regras } = await supabase.from('ra_tela_previsto').select('*').eq('membro_id', eu.id).or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`).order('criado_em', { ascending: false }));
      regras = regras || [];
      editar = regras.find((r) => r.id === sp.e) || null;
    }
    return (
      <main className="estreito">
        <div className="cab"><div><h1 className="titulo">Tempo de tela</h1><p className="sub">{dataLonga(dia).replace(/^./, (c) => c.toUpperCase())}</p></div></div>
        {faltou.length > 0 && <div className="aviso info">Faltou lançar {dataCurta(faltou[0])}. <Link prefetch={false} href={`/tela?d=${faltou[0]}`}>Lançar agora</Link></div>}
        <div className="card">
          <RealForm key={dia} eu={eu.id} membroId={eu.id} familia={eu.familia_id} data={dia} previsto={p?.[0]} atual={atual} crianca={crianca} jaSabe={hist.length >= 3} />
        </div>
        {adulto ? (<>
          <div className="card" id="previsto"><h2>{editar ? 'Editar meu previsto' : 'Meu previsto'}</h2>
            <PrevistoForm key={editar?.id || 'novo'} membro={eu.id} hoje={hoje} inicial={doPrevisto(editar || regras.find((r) => !soUmDia(r)))}
              substitui={editar?.id} cancelarHref="/tela" />
          </div>
          <Previstos regras={regras} base="/tela" editando={editar?.id} />
        </>) : (
          <div className="card">
            <h2>Previsto de hoje</h2>
            <p style={{ margin: 0 }}>{pHoje?.[0] ? textoPrevisto(pHoje[0], fmtMin) : 'Seus responsáveis ainda não definiram.'}</p>
            {!crianca && <>
              <details className="mais-op" style={{ marginTop: 12 }}><summary>Precisa de mais tempo num dia?</summary>
                <PropostaForm hoje={hoje} previsto={pHoje?.[0]} /></details>
              {(props || []).length > 0 && <div style={{ marginTop: 12, fontSize: 'var(--f-apoio)', color: 'var(--cinza)' }}>
                {props.map((x) => <div key={x.id}>{dataCurta(x.data)}: {x.status === 'pendente' ? 'aguardando resposta' : x.status}</div>)}</div>}
            </>}
          </div>
        )}
        <TelaGrafico dias={semana} />
        {!crianca && <DiaADia linhas={[...hist].reverse()} />}
      </main>
    );
  }

  // ===== Pai e Mãe =====
  const ativos = [...membros.filter((m) => m.ativo && m.id === eu.id), ...membros.filter((m) => m.ativo && m.id !== eu.id)];
  const ligados = ativos.filter((m) => m.tela_ativo);
  const alvo = ligados.find((f) => f.id === sp.m) || ligados[0];
  const souEu = alvo?.id === eu.id;
  const quem = (
    // "Pessoas com tempo de tela": ativa e desativa por pessoa e para si (S3, S5, U83). Aberto quando ninguém tem.
    <div className="card">
      <h2>Pessoas com tempo de tela{ligados.length ? ` · ${ligados.length} de ${ativos.length}` : ''}</h2>
      <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '4px 0 6px' }}>Ative para quem vai anotar o tempo de tela todo dia.</p>
      {ativos.map((m) => (
        <div className="lin-chave" key={m.id}><span>{m.id === eu.id ? `${m.nome} (você)` : m.nome}</span>
          {m.tela_ativo ? (
            <ConfirmarBotao acao={ligarTela} campos={{ membro: m.id, ligar: '0' }} rotulo="" classe="chave on" icone="bloquear"
              gatilho={{ role: 'switch', 'aria-checked': true, 'aria-label': `Tempo de tela de ${m.nome}` }}
              titulo="Desativar o tempo de tela?" nome={m.nome} pergunta="A tarefa “Lançar tempo de tela” para de aparecer. O que já foi lançado continua nos relatórios." sim="Sim, desativar" nao="Cancelar" />
          ) : (
            <Form acao={ligarTela} simples><input type="hidden" name="membro" value={m.id} /><input type="hidden" name="ligar" value="1" />
              <button className="chave" role="switch" aria-checked={false} aria-label={`Tempo de tela de ${m.nome}`} /></Form>
          )}
        </div>
      ))}
    </div>
  );
  if (!alvo) {
    return (
      <main className="estreito">
        <div className="cab"><div><h1 className="titulo">Tempo de tela</h1><p className="sub">Ative para quem vai anotar o tempo de tela todo dia.</p></div></div>
        {quem}
      </main>
    );
  }
  const [{ data: regras0 }, { data: propostas }, hist, semana, { data: tarefaTela }, outros] = await Promise.all([
    supabase.from('ra_tela_previsto').select('*').eq('membro_id', alvo.id).or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`).order('criado_em', { ascending: false }),
    supabase.from('ra_tela_proposta').select('*').eq('membro_id', alvo.id).eq('status', 'pendente'),
    telaResumo(supabase, alvo.id, addDias(hoje, -14), hoje),
    telaSemana(supabase, alvo.id, ontem, addDias),
    supabase.from('ra_tarefas').select('hora_inicio, permite_adiar, exige_justificativa').eq('responsavel_id', alvo.id).eq('especial', 'tela').eq('ativa', true).maybeSingle(),
    previstosDosOutros(supabase, ligados.filter((m) => m.id !== alvo.id), hoje),
  ]);
  const regras = regras0 || [];
  const editar = regras.find((r) => r.id === sp.e) || null;
  // Sem nada salvo: vem a sugestão (3h de celular, todos os dias). Com previsto: vem o atual (S6, S30).
  const inicial = doPrevisto(editar || regras.find((r) => !soUmDia(r)));
  let meuPrev = null, meuAtual = null;
  if (souEu) {
    ({ data: meuPrev } = await supabase.rpc('ra_tela_previsto_dia', { p_membro: eu.id, p_data: ontem }));
    ({ data: meuAtual } = await supabase.from('ra_tela_real').select('*').eq('membro_id', eu.id).eq('data', ontem).maybeSingle());
  }
  const base = `/tela?m=${alvo.id}`;
  return (
    <main>
      <TelaAjustes titulo="Tempo de tela">
        {quem}
        {tarefaTela && <div className="card"><h2>Lançamento</h2>
          <LancamentoForm key={alvo.id} membro={alvo.id} hora={tarefaTela.hora_inicio?.slice(0, 5)} adiar={tarefaTela.permite_adiar} justificativa={tarefaTela.exige_justificativa} outro={!souEu} /></div>}
      </TelaAjustes>
      <div className="seg pessoas" aria-label="Pessoa">
        {ligados.map((f) => <Link prefetch={false} key={f.id} href={`/tela?m=${f.id}`} className={f.id === alvo.id ? 'on' : ''}>{f.id === eu.id ? 'Eu' : f.nome}</Link>)}
      </div>
      <div className="duas">
        <div className="lado">
          {(propostas || []).length > 0 && <div className="card"><h2>Pedidos para responder</h2>
            {propostas.map((p) => (
              <div key={p.id} className="tarefa" style={{ background: 'var(--aviso-fundo)', borderColor: 'var(--aviso-borda)' }}>
                <div className="tt">{dataCurta(p.data)}: {textoPrevisto({ ...p, formato: p.min_total != null ? 'total' : 'aparelho' }, fmtMin)}</div>
                <div className="meta">“{p.motivo}”</div>
                <Responder acao={responderTela} fila="responderTela" rotulo="Resposta sobre tempo de tela" campos={{ id: p.id }} opcoes={PEDIDO('aprovar')} />
              </div>))}
          </div>}
          {souEu && <div className="card"><h2>Meu tempo de ontem</h2><RealForm eu={eu.id} membroId={eu.id} familia={eu.familia_id} data={ontem} previsto={meuPrev?.[0]} atual={meuAtual} /></div>}
          {(() => {
            const form = <PrevistoForm key={`${alvo.id}-${editar?.id || 'novo'}`} membro={alvo.id} hoje={hoje} inicial={inicial} substitui={editar?.id} outros={outros} cancelarHref={base} />;
            const r0 = regras.find((r) => !soUmDia(r)) || regras[0];
            // Já definido: uma linha só, e o formulário abre ao tocar em Mudar (U82).
            if (r0 && !editar) return (
              <details className="card prev-fechado" id="previsto">
                <summary><span>{souEu ? 'Previsto' : `Previsto de ${alvo.nome}`}: {textoPrevisto(r0, fmtMin)}, {diasTxt(r0).toLowerCase()}</span><b>Mudar</b></summary>
                {form}
              </details>
            );
            return <div className="card" id="previsto"><h2>{editar ? 'Editar previsto' : souEu ? 'Meu previsto' : `Previsto de ${alvo.nome}`}</h2>{form}</div>;
          })()}
        </div>
        <div className="grande">
          <Previstos regras={regras} base={base} editando={editar?.id} />
          <TelaGrafico dias={semana} />
          <DiaADia linhas={[...hist].reverse()} />
        </div>
      </div>
    </main>
  );
}
