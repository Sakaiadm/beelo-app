import Link from 'next/link';
import { exigirGestor } from '@/lib/sessao';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import { telaResumo, totalReal } from '@/lib/tela';
import { hojeISO, addDias, inicioMes, fimMes, inicioSemana, dataLonga, dataCurta, statusExibido, fmtMin } from '@/lib/util';
import Calendario from '@/components/Calendario';
import Form from '@/components/Form';
import Icone from '@/components/Icone';
import { responderAdiamento, avaliarJustificativa, conferir, responderTela } from '@/app/acoes';

export const dynamic = 'force-dynamic';

export default async function Painel() {
  const { supabase, eu, membros, familia } = await exigirGestor();
  const hoje = hojeISO();
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));
  const de = [inicioMes(hoje), inicioSemana(hoje), addDias(hoje, -7)].sort()[0];
  const lista = (await ocorrencias(supabase, { de, ate: fimMes(hoje), membros: filhos.map((f) => f.id) })).map((o) => ({ o, st: statusExibido(o, hoje) }));
  const conta = (arr) => ({ total: arr.filter((x) => x.st !== 'adiada').length, feitas: arr.filter((x) => x.st.startsWith('cumprida')).length });
  const doDia = lista.filter((x) => x.o.data === hoje);
  const kHoje = conta(doDia);
  const semana = lista.filter((x) => x.o.data >= inicioSemana(hoje) && x.o.data <= hoje);
  const kSem = conta(semana);
  const atrasadas = lista.filter((x) => x.o.data <= hoje && x.o.data >= addDias(hoje, -7) && x.st === 'atrasada');
  const justif = lista.filter((x) => x.o.justificativa_status === 'pendente');
  const paraConferir = lista.filter((x) => x.st.startsWith('cumprida') && x.o.foto_path && !x.o.conferido && x.o.data >= addDias(hoje, -3));
  const { data: adiamentos } = await supabase.from('ra_adiamentos').select('*, oc:ra_ocorrencias(data, hora_inicio, tarefa:ra_tarefas(titulo))').eq('status', 'pendente').order('criado_em');
  const { data: propostas } = await supabase.from('ra_tela_proposta').select('*').eq('status', 'pendente').order('criado_em');
  const fotos = await urlsFotos(supabase, paraConferir.map((x) => x.o.foto_path));
  const porDia = {};
  lista.forEach(({ o, st }) => { if (st === 'adiada') return; const x = (porDia[o.data] ||= { total: 0, feitas: 0 }); x.total++; if (st.startsWith('cumprida') || st === 'justificada') x.feitas++; });
  const telas = {};
  for (const f of filhos.filter((f) => f.tela_ativo)) telas[f.id] = (await telaResumo(supabase, f.id, addDias(hoje, -1), addDias(hoje, -1)))[0];
  const pend = (adiamentos?.length || 0) + justif.length + (propostas?.length || 0);

  return (
    <main>
      <div className="cab">
        <div><h1 className="titulo">{familia.nome}</h1><p className="sub" style={{ textTransform: 'capitalize' }}>{dataLonga(hoje)}</p></div>
        <Link prefetch={false} className="btn" href="/tarefas/nova"><Icone nome="mais" tam={18} cor="#fff" />Nova tarefa</Link>
      </div>
      <div className="kpis">
        <div className="kpi destaque"><small>Cumpridas hoje</small><strong>{kHoje.feitas} <span style={{ fontSize: 16 }}>de {kHoje.total}</span></strong>
          <em>{filhos.map((f) => { const k = conta(doDia.filter((x) => x.o.membro_id === f.id)); return `${f.nome} ${k.feitas}/${k.total}`; }).join(' · ')}</em></div>
        <div className="kpi"><small>Atrasadas (7 dias)</small><strong style={{ color: atrasadas.length ? 'var(--erro)' : undefined }}>{atrasadas.length}</strong><em>{justif.length} justificativa(s) para avaliar</em></div>
        <div className="kpi"><small>Pedidos aguardando</small><strong style={{ color: pend ? 'var(--aviso)' : undefined }}>{pend}</strong><em>Adiamentos e tempo de tela</em></div>
        <div className="kpi"><small>Semana</small><strong>{kSem.total ? Math.round((kSem.feitas / kSem.total) * 100) : 0}<span style={{ fontSize: 16 }}>%</span></strong>
          <div className="barra" style={{ marginTop: 10 }}><div style={{ width: `${kSem.total ? (kSem.feitas / kSem.total) * 100 : 0}%` }} /></div></div>
      </div>

      <div className="duas">
        <div className="grande">
          <div className="card">
            <h2>Precisa da sua atenção</h2>
            {pend + atrasadas.length + paraConferir.length === 0 && <div className="vazio">Tudo em dia.</div>}
            {(adiamentos || []).map((a) => (
              <div key={a.id} className="tarefa" style={{ background: 'var(--aviso-fundo)', borderColor: 'var(--aviso-borda)' }}>
                <div className="tt">{nome[a.membro_id]} pediu adiamento: {a.oc?.tarefa?.titulo}</div>
                <div className="meta">{dataCurta(a.oc?.data || hoje)} → {dataCurta(a.nova_data)}{a.nova_hora ? ' ' + a.nova_hora.slice(0, 5) : ''} · “{a.motivo}”</div>
                <div className="acoes" style={{ marginTop: 8 }}>
                  <Form acao={responderAdiamento}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="aprovar" value="1" /><button className="btn peq">Aprovar</button></Form>
                  <Form acao={responderAdiamento}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="aprovar" value="0" /><button className="btn perigo peq">Recusar</button></Form>
                </div>
              </div>
            ))}
            {(propostas || []).map((p) => (
              <div key={p.id} className="tarefa" style={{ background: 'var(--aviso-fundo)', borderColor: 'var(--aviso-borda)' }}>
                <div className="tt">{nome[p.membro_id]} propôs outro tempo de tela para {dataCurta(p.data)}</div>
                <div className="meta">{p.min_total != null ? `Total ${fmtMin(p.min_total)}` : `Celular ${fmtMin(p.min_celular)} · Computador ${fmtMin(p.min_computador)}`} · “{p.motivo}”</div>
                <div className="acoes" style={{ marginTop: 8 }}>
                  <Form acao={responderTela}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aprovar" value="1" /><button className="btn peq">Validar</button></Form>
                  <Form acao={responderTela}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aprovar" value="0" /><button className="btn perigo peq">Recusar</button></Form>
                </div>
              </div>
            ))}
            {justif.map(({ o }) => (
              <div key={o.id} className="tarefa">
                <div className="tt">{nome[o.membro_id]} justificou: {o.tarefa?.titulo}</div>
                <div className="meta">{dataCurta(o.data)} · “{o.justificativa}”</div>
                <div className="acoes" style={{ marginTop: 8 }}>
                  <Form acao={avaliarJustificativa}><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="aceitar" value="1" /><button className="btn peq">Aceitar</button></Form>
                  <Form acao={avaliarJustificativa}><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="aceitar" value="0" /><button className="btn perigo peq">Não aceitar</button></Form>
                </div>
              </div>
            ))}
            {paraConferir.map(({ o }) => (
              <div key={o.id} className="tarefa" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {fotos[o.foto_path] && <a href={fotos[o.foto_path]} target="_blank" rel="noreferrer"><img className="foto-mini" src={fotos[o.foto_path]} alt={`Foto de ${o.tarefa?.titulo}`} /></a>}
                <div style={{ flex: 1 }}><div className="tt">{nome[o.membro_id]} concluiu com foto: {o.tarefa?.titulo}</div><div className="meta">{dataCurta(o.data)}</div></div>
                <Form acao={conferir}><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="valor" value="conferido" /><button className="btn sec peq">Conferido</button></Form>
                <Form acao={conferir}><input type="hidden" name="oc" value={o.id} /><input type="hidden" name="valor" value="refazer" /><button className="btn perigo peq">Refazer</button></Form>
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
            <h2>Hoje por filho</h2>
            <div className="linha">
              {filhos.map((f) => {
                const k = conta(doDia.filter((x) => x.o.membro_id === f.id));
                const falta = doDia.filter((x) => x.o.membro_id === f.id && !x.st.startsWith('cumprida') && x.st !== 'adiada').map((x) => x.o.tarefa?.titulo);
                const t = telas[f.id];
                const real = t ? totalReal(t) : null, prev = t?.previsto?.min_total;
                return (
                  <Link prefetch={false} key={f.id} href={`/hoje?m=${f.id}`} className="tarefa" style={{ textDecoration: 'none', color: 'var(--texto)', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>{f.nome}</span><span style={{ color: 'var(--azul)' }}>{k.feitas} de {k.total}</span></div>
                    <div className="barra" style={{ marginTop: 8 }}><div style={{ width: `${k.total ? (k.feitas / k.total) * 100 : 0}%` }} /></div>
                    <div className="meta" style={{ marginTop: 8 }}>{falta.length ? `Falta: ${falta.slice(0, 3).join(', ')}${falta.length > 3 ? '…' : ''}` : 'Tudo feito'}</div>
                    {f.tela_ativo && <div className="meta"><strong>Tela ontem:</strong> {t ? `${prev != null ? `previsto ${fmtMin(prev)} · ` : ''}realizado ${fmtMin(real)}` : 'não lançado'}
                      {t && prev != null && <span style={{ fontWeight: 700, color: real > prev ? 'var(--erro)' : 'var(--ok)' }}> ({real > prev ? '+' : ''}{fmtMin(real - prev)})</span>}</div>}
                  </Link>
                );
              })}
            </div>
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
