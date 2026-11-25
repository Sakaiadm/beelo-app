import AvisosConvite from '@/components/AvisosConvite';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import { telaResumo, totalReal, textoPrevisto } from '@/lib/tela';
import { hojeISO, addDias, inicioMes, fimMes, inicioSemana, dataTitulo, dataCurta, statusExibido, fmtMin } from '@/lib/util';
import Calendario from '@/components/Calendario';
import Form from '@/components/Form';
import Icone from '@/components/Icone';
import LampadaFlutuante from '@/components/LampadaFlutuante';
import { fatos, candidatosPais } from '@/lib/dicas';
import { carregarDesafios, desafiosLigados } from '@/lib/desafiosDados';
import Responder from '@/components/Responder';
import { PEDIDO, CONFERIR } from '@/lib/respostas';
import { responderAdiamento, avaliarJustificativa, conferir, conferirTodas, responderTela, lembrarTela } from '@/app/acoes';

export const dynamic = 'force-dynamic';

export default async function Painel() {
  const { supabase, eu, membros, familia } = await exigirMembro();
  // Pai e Mãe respondem a tudo; a supervisora (com a chave Ver o painel) acompanha e, se liberado, confere.
  const a = acesso(eu);
  if (!a.painel) redirect('/hoje');
  const gestor = a.gestor;
  const hoje = hojeISO();
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  // Todas as pessoas ativas (inclui responsáveis com tarefas para si), quem é você aparece primeiro.
  const pessoas = [...membros.filter((m) => m.ativo && m.id === eu.id), ...membros.filter((m) => m.ativo && m.id !== eu.id)];
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));
  const de = [inicioMes(hoje), inicioSemana(hoje), addDias(hoje, -7)].sort()[0];
  const telaFilhos = filhos.filter((f) => f.tela_ativo);
  // Tudo ao mesmo tempo: antes cada consulta esperava a anterior terminar.
  const [ocs, { data: adiamentos }, { data: propostas }, telaRes] = await Promise.all([
    ocorrencias(supabase, { de, ate: fimMes(hoje), membros: pessoas.map((f) => f.id) }),
    supabase.from('ra_adiamentos').select('*, oc:ra_ocorrencias(data, hora_inicio, tarefa:ra_tarefas(titulo))').eq('status', 'pendente').order('criado_em'),
    supabase.from('ra_tela_proposta').select('*').eq('status', 'pendente').order('criado_em'),
    Promise.all(telaFilhos.map((f) => telaResumo(supabase, f.id, addDias(hoje, -1), addDias(hoje, -1)))),
  ]);
  const lista = ocs.map((o) => ({ o, st: statusExibido(o, hoje) }));
  const conta = (arr) => ({ total: arr.filter((x) => x.st !== 'adiada').length, feitas: arr.filter((x) => x.st.startsWith('cumprida')).length });
  const doDia = lista.filter((x) => x.o.data === hoje);
  const kHoje = conta(doDia);
  const semana = lista.filter((x) => x.o.data >= inicioSemana(hoje) && x.o.data <= hoje);
  const kSem = conta(semana);
  const atrasadas = lista.filter((x) => x.o.data <= hoje && x.o.data >= addDias(hoje, -7) && x.st === 'atrasada');
  const justif = lista.filter((x) => x.o.justificativa_status === 'pendente');
  const paraConferir = lista.filter((x) => x.st.startsWith('cumprida') && x.o.foto_path && !x.o.conferido && x.o.data >= addDias(hoje, -3));
  // U34: as tarefas feitas sem foto também podem ser conferidas pelo Painel, uma linha por pessoa.
  const semFoto = a.conferir ? pessoas.filter((f) => f.id !== eu.id).map((f) => ({ f, l: lista.filter((x) => x.o.membro_id === f.id && x.st.startsWith('cumprida') && !x.o.foto_path && !x.o.conferido && x.o.data >= addDias(hoje, -3) && x.o.data <= hoje) })).filter((x) => x.l.length) : [];
  const fotos = await urlsFotos(supabase, paraConferir.map((x) => x.o.foto_path));
  const porDia = {};
  lista.forEach(({ o, st }) => { if (st === 'adiada') return; const x = (porDia[o.data] ||= { total: 0, feitas: 0 }); x.total++; if (st.startsWith('cumprida') || st === 'justificada') x.feitas++; });
  const telas = {};
  telaFilhos.forEach((f, i) => { telas[f.id] = telaRes[i][0]; });
  const dicas = candidatosPais(filhos.map((f) => ({ nome: f.nome, fatos: fatos(lista, f.id, hoje) })), hoje);
  // Desafios (beta): resumo com o andamento de cada desafio e os prêmios para entregar.
  const des = gestor && desafiosLigados(familia) ? await carregarDesafios(supabase, { eu, membros }) : null;
  const paraEntregar = des ? des.pedidos.filter((p) => p.status === 'pedido').length : 0;
  const paraAprovar = des ? des.desejos.filter((x) => x.desejo === 'esperando').length : 0;
  const pend = (adiamentos?.length || 0) + justif.length + (propostas?.length || 0);

  const nPedidos = (adiamentos?.length || 0) + (propostas?.length || 0) + justif.length;
  const nada = nPedidos + atrasadas.length + paraConferir.length + semFoto.length === 0;
  const resp = (t) => (gestor ? null : <div className="meta" style={{ marginTop: 6 }}>Os responsáveis respondem.</div>);
  const pctSem = kSem.total ? Math.round((kSem.feitas / kSem.total) * 100) : 0;
  const cumpridos = des ? des.desafios.filter((d) => d.atual?.status === 'cumprido').length : 0;

  return (
    <main>
      <div className="cab">
        <div><h1 className="titulo">{familia.nome}</h1><p className="sub">{dataTitulo(hoje)}</p></div>
        {gestor && <Link prefetch={false} className="btn" href="/tarefas/nova?volta=/painel"><Icone nome="mais" tam={18} cor="#fff" />Nova tarefa</Link>}
      </div>

      {/* U29: o motivo de abrir o app logo abaixo do título. Sem nada pendente, uma linha só. */}
      {nada ? (
        <div className="tudo-dia"><Icone nome="check" tam={20} /> Tudo em dia. Nenhum pedido esperando.</div>
      ) : (
        <div className="card atencao">
          <h2>Precisa da sua atenção</h2>
          {nPedidos > 0 && <div id="pedidos" className="alvo-ancora" />}
          {(adiamentos || []).map((a) => (
            <div key={a.id} id={`a-${a.id}`} className="tarefa pedido alvo">
              <div className="tt">{nome[a.membro_id]} pediu adiamento: {a.oc?.tarefa?.titulo}</div>
              <div className="meta">{dataCurta(a.oc?.data || hoje)} → {dataCurta(a.nova_data)}{a.nova_hora ? ' ' + a.nova_hora.slice(0, 5) : ''} · “{a.motivo}”</div>
              {gestor ? <Responder acao={responderAdiamento} fila="responderAdiamento" rotulo="Resposta ao pedido de adiamento" campos={{ id: a.id }} opcoes={PEDIDO('aprovar')} /> : resp()}
            </div>
          ))}
          {(propostas || []).map((p) => (
            <div key={p.id} id={`p-${p.id}`} className="tarefa pedido alvo">
              <div className="tt">{nome[p.membro_id]} propôs outro tempo de tela para {dataCurta(p.data)}</div>
              <div className="meta">{textoPrevisto({ ...p, formato: p.min_total != null ? 'total' : 'aparelho' }, fmtMin)} · “{p.motivo}”</div>
              {gestor ? <Responder acao={responderTela} fila="responderTela" rotulo="Resposta sobre tempo de tela" campos={{ id: p.id }} opcoes={PEDIDO('aprovar')} /> : resp()}
            </div>
          ))}
          {justif.map(({ o }) => (
            <div key={o.id} id={`j-${o.id}`} className="tarefa alvo">
              <div className="tt">{nome[o.membro_id]} justificou: {o.tarefa?.titulo}</div>
              <div className="meta">{dataCurta(o.data)} · “{o.justificativa}”</div>
              {gestor ? <Responder acao={avaliarJustificativa} fila="avaliarJustificativa" rotulo="Resposta à justificativa" campos={{ oc: o.id }} opcoes={PEDIDO('aceitar')} /> : resp()}
            </div>
          ))}
          {paraConferir.map(({ o }) => (
            <div key={o.id} id={`c-${o.id}`} className="tarefa alvo">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {fotos[o.foto_path] && <a href={fotos[o.foto_path]} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}><img className="foto-mini" src={fotos[o.foto_path]} alt={`Foto de ${o.tarefa?.titulo}`} /></a>}
                <div style={{ flex: 1, minWidth: 0 }}><div className="tt">{nome[o.membro_id]} concluiu com foto: {o.tarefa?.titulo}</div><div className="meta">{dataCurta(o.data)}</div></div>
              </div>
              {a.conferir && <Responder acao={conferir} fila="conferir" rotulo="Conferência de tarefa" campos={{ oc: o.id }} opcoes={CONFERIR} />}
            </div>
          ))}
          {semFoto.map(({ f, l }) => (
            <details key={f.id} className="tarefa conf-pessoa">
              <summary><span><b>{f.nome}</b> fez {l.length === 1 ? '1 tarefa' : `${l.length} tarefas`}</span><span className="ver">Ver</span></summary>
              <Form acao={conferirTodas} rotulo={`Conferir as tarefas de ${f.nome}`}>
                {l.map(({ o }) => <input key={o.id} type="hidden" name="oc" value={o.id} />)}
                <button className="btn sec peq">{l.length === 1 ? 'Conferir' : 'Conferir todas'}</button>
              </Form>
              <div className="conf-lista">
                {l.map(({ o }) => (
                  <div key={o.id} className="conf-l"><span>{o.tarefa?.titulo}<small>{dataCurta(o.data)}</small></span>
                    <Responder acao={conferir} fila="conferir" rotulo="Conferência de tarefa" campos={{ oc: o.id }} opcoes={CONFERIR} /></div>
                ))}
              </div>
            </details>
          ))}
          {atrasadas.length > 0 && <div id="atrasadas" className="alvo-ancora" />}
          {(() => {
            // U35: tocar abre o dia da pessoa já na tarefa. Só as 3 primeiras à vista; o resto abre num toque.
            const item = ({ o }) => (
              <Link prefetch={false} key={o.id} href={`/hoje?m=${o.membro_id}&d=${o.data}#t-${o.id}`} className="tarefa atrasada tarefa-ir">
                <span><span className="tt">{nome[o.membro_id]} · {o.tarefa?.titulo} está atrasada</span>
                  <span className="meta">{dataCurta(o.data)}{o.hora_inicio ? ' ' + o.hora_inicio.slice(0, 5) : ''} · {o.justificativa ? 'justificativa enviada' : 'sem justificativa ainda'}</span></span>
                <Icone nome="dir" tam={20} />
              </Link>
            );
            return <>{atrasadas.slice(0, 3).map(item)}
              {atrasadas.length > 3 && <details className="mais-atr"><summary>Ver mais {atrasadas.length - 3 === 1 ? '1 atrasada' : `${atrasadas.length - 3} atrasadas`}</summary>{atrasadas.slice(3).map(item)}</details>}</>;
          })()}
        </div>
      )}

      {/* U30 e U31: os 4 números em 2 por 2, e cada um abre o que conta. */}
      <div className="kpis k4">
        <a href="#hoje" className="kpi destaque"><small>Cumpridas hoje</small><strong>{kHoje.feitas} <span style={{ fontSize: 'var(--f-texto)' }}>de {kHoje.total}</span></strong></a>
        <a href={atrasadas.length ? '#atrasadas' : '#hoje'} className="kpi"><small>Atrasadas (7 dias)</small><strong style={{ color: atrasadas.length ? 'var(--erro)' : undefined }}>{atrasadas.length}</strong><em>{justif.length === 0 ? 'nada para avaliar' : justif.length === 1 ? '1 justificativa' : `${justif.length} justificativas`}</em></a>
        <a href={nPedidos ? '#pedidos' : '#hoje'} className="kpi"><small>Pedidos aguardando</small><strong style={{ color: pend ? 'var(--aviso)' : undefined }}>{pend}</strong><em>adiamentos, justificativas e tela</em></a>
        <Link prefetch={false} href="/relatorios?per=semana" className="kpi"><small>Semana</small><strong>{pctSem}<span style={{ fontSize: 'var(--f-texto)' }}>%</span></strong>
          <div className="barra" style={{ marginTop: 10 }}><div style={{ width: `${pctSem}%` }} /></div></Link>
      </div>

      {des && (
        // U38: os desafios numa linha só; as barras por pessoa ficam na tela de Desafios.
        <Link prefetch={false} href={paraAprovar > 0 ? '/desafios#desejos' : paraEntregar > 0 ? '/desafios#premios' : '/desafios'} className="card des-card des-linha">
          <span className="des-ic mel"><Icone nome="check" tam={20} /></span>
          <span className="des-txt"><b>Desafios da semana</b><small>{des.desafios.length ? `${cumpridos} de ${des.desafios.length} cumpridos` : 'Nenhum desafio ainda. Toque para escolher.'}</small></span>
          {paraEntregar > 0 && <span className="tg mel">{paraEntregar === 1 ? '1 prêmio para entregar' : `${paraEntregar} prêmios para entregar`}</span>}
          {paraAprovar > 0 && <span className="tg mel">{paraAprovar === 1 ? '1 desejo para aprovar' : `${paraAprovar} desejos para aprovar`}</span>}
          <span className="selo-beta">beta</span>
        </Link>
      )}

      <AvisosConvite chavePublica={process.env.VAPID_PUBLIC_KEY || ''} texto="Saiba na hora quando alguém concluir uma tarefa, justificar ou pedir para adiar." />

      <div className="duas">
        <div className="grande">
          <div className="card alvo" id="hoje">
            <h2>Hoje</h2>
            <div className="linha">
              {pessoas.filter((f) => doDia.some((x) => x.o.membro_id === f.id && x.st !== 'adiada')).map((f) => {
                const k = conta(doDia.filter((x) => x.o.membro_id === f.id));
                const falta = doDia.filter((x) => x.o.membro_id === f.id && !x.st.startsWith('cumprida') && x.st !== 'adiada').map((x) => x.o.tarefa?.titulo);
                const t = telas[f.id];
                const real = t ? totalReal(t) : null, prev = t?.previsto?.min_total;
                const lembrar = gestor && f.tela_ativo && f.papel === 'filho' && !t && f.id !== eu.id;
                return (
                  <div key={f.id} className="tarefa" style={{ padding: 0 }}>
                  <Link prefetch={false} href={`/hoje?m=${f.id}`} className="tarefa-link" style={{ textDecoration: 'none', color: 'var(--texto)', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>{f.nome}{f.id === eu.id ? ' (você)' : ''}</span><span style={{ color: 'var(--azul)' }}>{k.feitas} de {k.total}</span></div>
                    <div className="barra" style={{ marginTop: 8 }}><div style={{ width: `${k.total ? (k.feitas / k.total) * 100 : 0}%` }} /></div>
                    <div className="meta" style={{ marginTop: 8 }}>{falta.length ? `Falta: ${falta.slice(0, 3).join(', ')}${falta.length > 3 ? '…' : ''}` : 'Tudo feito'}</div>
                    {f.tela_ativo && f.papel === 'filho' && <div className="meta"><strong>Tela ontem:</strong> {t ? `${prev != null ? `previsto ${fmtMin(prev)} · ` : ''}realizado ${fmtMin(real)}` : 'não lançado'}
                      {t && prev != null && <span style={{ fontWeight: 700, color: real > prev ? 'var(--erro)' : 'var(--ok)' }}> ({real > prev ? '+' : ''}{fmtMin(real - prev)})</span>}</div>}
                  </Link>
                  {lembrar && (
                    // "Lembrar": aviso no celular da pessoa para lançar o tempo de ontem (Raio-X S17).
                    <Form acao={lembrarTela} className="tarefa-acao"><input type="hidden" name="membro" value={f.id} /><button className="btn sec peq">Lembrar</button></Form>
                  )}
                  </div>
                );
              })}
            </div>
            {(() => {
              const sem = pessoas.filter((f) => !doDia.some((x) => x.o.membro_id === f.id && x.st !== 'adiada'));
              return sem.length > 0 && <p className="meta" style={{ margin: '12px 0 0' }}>Sem tarefas hoje: {sem.map((f) => f.nome).join(', ')}</p>;
            })()}
          </div>
        </div>
        <div className="lado so-pc3">
          <div className="card">
            <Calendario mes={hoje} porDia={porDia} hoje={hoje} sel={null} link={(x, dia) => (dia ? `/agenda?d=${x}` : `/agenda?v=mes&d=${x}`)} />
            <p style={{ fontSize: 'var(--f-apoio)', color: 'var(--cinza)', margin: '12px 0 0' }}>A cor mostra quanto da rotina foi cumprida no dia. Toque num dia para ver as tarefas.</p>
          </div>
        </div>
      </div>
      {/* U37: no celular, o calendário do mês fica na Agenda. */}
      <Link prefetch={false} href={`/agenda?v=mes&d=${hoje}`} className="card linha-ir so-cel3"><Icone nome="agenda" tam={20} /><span>Ver o mês na Agenda</span><Icone nome="dir" tam={20} /></Link>
      {/* Ideia do dia: bolinha amarela flutuante no canto direito (L1 + balão B2). */}
      {filhos.length > 0 && <LampadaFlutuante membro={eu.id} hoje={hoje} cands={dicas} />}
    </main>
  );
}
