import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { hojeISO, addDias } from '@/lib/util';
import Form from '@/components/Form';
import VoltarHistorico from '@/components/VoltarHistorico';
import Responder from '@/components/Responder';
import { PEDIDO } from '@/lib/respostas';
import { marcarLidas, responderAdiamento, avaliarJustificativa, responderTela } from '@/app/acoes';

export const dynamic = 'force-dynamic';

const diaSP = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
const diaHora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default async function Notificacoes() {
  const { supabase, eu, membros } = await exigirMembro();
  const gestor = acesso(eu).gestor;
  const [{ data }, ped] = await Promise.all([
    supabase.from('ra_notificacoes').select('*').order('criado_em', { ascending: false }).limit(60),
    // Pedidos ainda sem resposta: o aviso leva direto ao pedido (U40) e responde ali mesmo (U41).
    gestor ? Promise.all([
      supabase.from('ra_adiamentos').select('id, membro_id, oc:ra_ocorrencias(tarefa:ra_tarefas(titulo))').eq('status', 'pendente'),
      supabase.from('ra_ocorrencias').select('id, membro_id, tarefa:ra_tarefas(titulo)').eq('justificativa_status', 'pendente'),
      supabase.from('ra_tela_proposta').select('id, membro_id').eq('status', 'pendente'),
    ]) : null,
  ]);
  const lista = data || [];
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));

  // Liga cada aviso ao pedido pelo texto (o aviso guarda só o título): "Eduardo pediu adiamento: Ler".
  const usados = new Set();
  const achar = (n) => {
    if (!ped) return null;
    const [adi, jus, tel] = ped.map((r) => r.data || []);
    const t = n.titulo || '';
    const casa = (arr, tipo, txt, f) => {
      const x = arr.find((p) => !usados.has(p.id) && f(p));
      if (!x) return null;
      usados.add(x.id);
      return { tipo, id: x.id, txt };
    };
    let m;
    if ((m = t.match(/^(.+?) pediu adiamento: (.+)$/))) return casa(adi, 'a', m, (p) => nome[p.membro_id] === m[1] && p.oc?.tarefa?.titulo === m[2]);
    if ((m = t.match(/^(.+?) justificou: (.+)$/))) return casa(jus, 'j', m, (p) => nome[p.membro_id] === m[1] && p.tarefa?.titulo === m[2]);
    if ((m = t.match(/^(.+?) propôs outro previsto de tela/))) return casa(tel, 'p', m, (p) => nome[p.membro_id] === m[1]);
    return null;
  };

  // U42: avisos separados por dia.
  const hoje = hojeISO(), ontem = addDias(hoje, -1);
  const grupos = [['Hoje', []], ['Ontem', []], ['Antes', []]];
  lista.forEach((n) => {
    const d = diaSP.format(new Date(n.criado_em));
    grupos[d === hoje ? 0 : d === ontem ? 1 : 2][1].push({ n, d, p: achar(n) });
  });

  const resposta = (p) => {
    if (p.tipo === 'a') return <Responder acao={responderAdiamento} fila="responderAdiamento" rotulo="Resposta ao pedido de adiamento" campos={{ id: p.id }} opcoes={PEDIDO('aprovar')} />;
    if (p.tipo === 'j') return <Responder acao={avaliarJustificativa} fila="avaliarJustificativa" rotulo="Resposta à justificativa" campos={{ oc: p.id }} opcoes={PEDIDO('aceitar')} />;
    return <Responder acao={responderTela} fila="responderTela" rotulo="Resposta sobre tempo de tela" campos={{ id: p.id }} opcoes={PEDIDO('aprovar')} />;
  };

  return (
    <main className="estreito">
      <div className="cab">
        <VoltarHistorico href={acesso(eu).painel ? '/painel' : '/hoje'} titulo="Notificações" />
        {lista.some((n) => !n.lida) && <Form acao={marcarLidas} simples><button className="btn sec peq">Marcar todas como lidas</button></Form>}
      </div>
      {lista.length === 0 && <div className="card"><div className="vazio">Nada por aqui ainda.</div></div>}
      {grupos.filter(([, l]) => l.length).map(([titulo, l]) => (
        <section key={titulo} className="not-grupo">
          <h2 className="grupo-titulo">{titulo}</h2>
          <div className="card not-lista">
            {l.map(({ n, d, p }) => (
              <div key={n.id} className={`not-item${n.lida ? '' : ' nova'}`}>
                <a href={`/notificacoes/abrir?id=${n.id}${p ? `&foco=${p.tipo}-${p.id}` : ''}`}>
                  <i aria-hidden="true" />
                  <span><b>{n.titulo}</b><small>{d === hoje || d === ontem ? hora.format(new Date(n.criado_em)) : diaHora.format(new Date(n.criado_em))}{n.lida ? '' : ' · nova'}</small></span>
                </a>
                {p && <div className="not-resp">{resposta(p)}</div>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
