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
import DicaFaixa from '@/components/DicaFaixa';
import { fatos, candidatosPais } from '@/lib/dicas';
import { carregarDesafios, desafiosLigados } from '@/lib/desafiosDados';
import { responderAdiamento, avaliarJustificativa, conferir, responderTela, lembrarTela } from '@/app/acoes';

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

  return (
    <main>
      {filhos.length > 0 && <DicaFaixa membro={eu.id} hoje={hoje} cands={dicas} />}
      <div className="cab">
        <div><h1 className="titulo">{familia.nome}</h1><p className="sub">{dataTitulo(hoje)}</p></div>
        {gestor && <Link prefetch={false} className="btn" href="/tarefas/nova"><Icone nome="mais" tam={18} cor="#fff" />Nova tarefa</Link>}
      </div>
      <AvisosConvite chavePublica={process.env.VAPID_PUBLIC_KEY || ''} texto="Saiba na hora quando alguém concluir uma tarefa, justificar ou pedir para adiar." />
      <div className="kpis">
        <div className="kpi destaque"><small>Cumpridas hoje</small><strong>{kHoje.feitas} <span style={{ fontSize: 16 }}>de {kHoje.total}</span></strong>
          <em>{pessoas.map((f) => ({ f, k: conta(doDia.filter((x) => x.o.membro_id === f.id)) })).filter((x) => x.k.total > 0).map(({ f, k }) => `${f.nome} ${k.feitas}/${k.total}`).join(' · ') || 'Sem tarefas hoje'}</em></div>
        <div className="kpi"><small>Atrasadas (7 dias)</small><strong style={{ color: atrasadas.length ? 'var(--erro)' : undefined }}>{atrasadas.length}</strong><em>{justif.length} justificativa(s) para avaliar</em></div>
        <div className="kpi"><small>Pedidos aguardando</small><strong style={{ color: pend ? 'var(--aviso)' : undefined }}>{pend}</strong><em>Adiamentos e tempo de tela</em></div>
        <div className="kpi"><small>Semana</small><strong>{kSem.total ? Math.round((kSem.feitas / kSem.total) * 100) : 0}<span style={{ fontSize: 16 }}>%</span></strong>
          <div className="barra" style={{ marginTop: 10 }}><div style={{ width: `${kSem.total ? (kSem.feitas / kSem.total) * 100 : 0}%` }} /></div></div>
      </div>

      {des && (
        <Link prefetch={false} href="/desafios" className="card des-card">
          <div className="des-top"><span className="des-ic mel"><Icone nome="check" tam={22} /></span>
            <span><b>Desafios da semana</b><small>{des.desafios.length ? `${des.desafios.filter((d) => d.atual?.status === 'cumprido').length} de ${des.desafios.length} cumpridos` : 'Nenhum desafio ainda. Toque para escolher.'}</small></span>
            <span className="selo-beta">beta</span></div>
          {paraEntregar > 0 && <div className="aviso info" style={{ margin: '12px 0 0' }}>{paraEntregar === 1 ? '1 prêmio para entregar' : `${paraEntregar} prêmios para entregar`}</div>}
          {paraAprovar > 0 && <div className="aviso info" style={{ margin: '12px 0 0' }}>{paraAprovar === 1 ? '1 desejo para aprovar' : `${paraAprovar} desejos para aprovar`}</div>}
          {des.desafios.length > 0 && (
            <div className="barras-h contrib" style={{ marginTop: 14, fontSize: 13 }}>
              {des.desafios.map((d) => {
                const p = d.atual, w = p?.meta ? Math.min(100, (p.progresso / p.meta) * 100) : 0;
                return <div className="l" key={d.id}><span>{d.membro_id ? nome[d.membro_id] : 'Família'}</span><div className="barra" title={d.titulo}><div style={{ width: `${w}%`, background: p?.status === 'cumprido' ? 'var(--ok)' : undefined }} /></div><span>{p?.status === 'cumprido' ? 'feito' : `${Math.round(w)}%`}</span></div>;
              })}
            </div>
          )}
        </Link>
      )}

      <div className="duas">
        <div className="grande">
          <div className="card">
            <h2>Precisa da sua atenção</h2>
            {pend + atrasadas.length + paraConferir.length === 0 && <div className="vazio">Tudo em dia.</div>}
            {(adiamentos || []).map((a) => (
              <div key={a.id} className="tarefa" style={{ background: 'var(--aviso-fundo)', borderColor: 'var(--aviso-borda)' }}>
                <div className="tt">{nome[a.membro_id]} pediu adiamento: {a.oc?.tarefa?.titulo}</div>
                <div className="meta">{dataCurta(a.oc?.data || hoje)} → {dataCurta(a.nova_data)}{a.nova_hora ? ' ' + a.nova_hora.slice(0, 5) : ''} · “{a.motivo}”</div>
                {gestor ? <div className="acoes" style={{ marginTop: 8 }}>
                  <Form acao={responderAdiamento} fila="responderAdiamento" rotulo="Resposta ao pedido de adiamento"><input type="hidden" name="id" value={a.id} /><input type="hidden" name="aprovar" value="1" /><button className="btn peq">Aprovar</button></Form>
                  <Form acao={responderAdiamento} fila="responderAdiamento" rotulo="Resposta ao pedido de adiamento"><input type="hidden" name="id" value={a.id} /><input type="hidden" name="aprovar" value="0" /><button className="btn perigo peq">Recusar</button></Form>
                </div> : <div className="meta" style={{ marginTop: 6 }}>Os responsáveis respondem.</div>}
              </div>
            ))}
            {(propostas || []).map((p) => (
              <div key={p.id} className="tarefa" style={{ background: 'var(--aviso-fundo)', borderColor: 'var(--aviso-borda)' }}>
                <div className="tt">{nome[p.membro_id]} propôs outro tempo de tela para {dataCurta(p.data)}</div>
                <div className="meta">{textoPrevisto({ ...p, formato: p.min_total != null ? 'total' : 'aparelho' }, fmtMin)} · “{p.motivo}”</div>
                {gestor ? <div className="acoes" style={{ marginTop: 8 }}>
                  <Form acao={responderTela} fila="responderTela" rotulo="Resposta sobre tempo de tela"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aprovar" value="1" /><button className="btn peq">Validar</button></Form>
                  <Form acao={responderTela} fila="responderTela" rotulo="Resposta sobre tempo de tela"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aprovar" value="0" /><button className="btn perigo peq">Recusar</button></Form>
                </div> : <div className="meta" style={{ marginTop: 6 }}>Os responsáveis respondem.</div>}
              </div>
            ))}
            {justif.map(({ o }) => (
              <div key={o.id} className="tarefa">
                <div className="tt">{nome[o.membro_id]} justificou: {o.tarefa?.titulo}</div>
                <div className="meta">{dataCurta(o.data)} · “{o.justificativa}”</div>
                {gestor ? <div className="acoes" style={{ marginTop: 8 }}>
                  <Form acao={avaliarJustificativa} fila="avaliarJustificativa" rotulo="Resposta à justificativa"><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="aceitar" value="1" /><button className="btn peq">Aceitar</button></Form>
                  <Form acao={avaliarJustificativa} fila="avaliarJustificativa" rotulo="Resposta à justificativa"><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="aceitar" value="0" /><button className="btn perigo peq">Não aceitar</button></Form>
                </div> : <div className="meta" style={{ marginTop: 6 }}>Os responsáveis respondem.</div>}
              </div>
            ))}
            {paraConferir.map(({ o }) => (
              <div key={o.id} className="tarefa">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {fotos[o.foto_path] && <a href={fotos[o.foto_path]} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}><img className="foto-mini" src={fotos[o.foto_path]} alt={`Foto de ${o.tarefa?.titulo}`} /></a>}
                  <div style={{ flex: 1, minWidth: 0 }}><div className="tt">{nome[o.membro_id]} concluiu com foto: {o.tarefa?.titulo}</div><div className="meta">{dataCurta(o.data)}</div></div>
                </div>
                {a.conferir && <div className="acoes" style={{ marginTop: 8 }}>
                <Form acao={conferir} fila="conferir" rotulo="Conferência de tarefa"><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="valor" value="conferido" /><button className="btn sec peq">Conferido</button></Form>
                <Form acao={conferir} fila="conferir" rotulo="Conferência de tarefa"><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="valor" value="refazer" /><button className="btn perigo peq">Refazer</button></Form>
                </div>}
              </div>
            ))}
            {atrasadas.map(({ o }) => (
              <div key={o.id} className="tarefa atrasada">
                <div className="tt">{nome[o.membro_id]} · {o.tarefa?.titulo} está atrasada</div>
                <div className="meta">{dataCurta(o.data)}{o.hora_inicio ? ' ' + o.hora_inicio.slice(0, 5) : ''} · {o.justificativa ? 'justificativa enviada' : 'sem justificativa ainda'}</div>
              </div>
            ))}
          </div>

          <div className="card">
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
        <div className="lado">
          <div className="card">
            <Calendario mes={hoje} porDia={porDia} hoje={hoje} sel={null} link={(x, dia) => (dia ? `/agenda?v=dia&d=${x}` : `/agenda?v=mes&d=${x}`)} />
            <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '12px 0 0' }}>A cor mostra quanto da rotina foi cumprida no dia. Toque num dia para ver as tarefas.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
