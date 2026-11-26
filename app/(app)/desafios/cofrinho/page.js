// @arquivo  page.js: cofrinho de estrelinhas ou semanas e troca por prêmios.
// @tipo     tela
// @usa      banco ra_cofrinho, lib/sessao, lib/desafiosDados, components/Icone, components/SugerirDesejo, lib/desafios, lib/util, components/DesafioCartao, components/Voltar, components/Form, components/TrocarPremio, app/acoes-desafios
// @usado-por Next.js (rota /desafios/cofrinho)
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { carregarDesafios, desafiosLigados, vitrineDe, desejosVisiveis } from '@/lib/desafiosDados';
import Icone from '@/components/Icone';
import SugerirDesejo from '@/components/SugerirDesejo';
import { perfil } from '@/lib/desafios';
import { addDias, dataCurta } from '@/lib/util';
import { Estrela, Hexagono } from '@/components/DesafioCartao';
import Voltar from '@/components/Voltar';
import DesafiosTopo from '@/components/DesafiosTopo';
import Form from '@/components/Form';
import TrocarPremio from '@/components/TrocarPremio';
import { metaCofrinho } from '@/app/acoes-desafios';

export const dynamic = 'force-dynamic';

// Cofrinho (criança: estrelinhas) ou semanas conquistadas (adolescente). Pai e Mãe abrem o de cada pessoa (?m=).
export default async function Cofrinho({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia } = await exigirMembro();
  if (!desafiosLigados(familia)) redirect('/hoje');
  const m = gestor ? membros.find((x) => x.id === sp?.m && x.ativo) : eu;
  if (!m || perfil(m) === 'j') redirect('/desafios');
  const dados = await carregarDesafios(supabase, { eu, membros, atualizar: false });
  const v = vitrineDe(m, dados.premios, dados.saldo);
  const semanas = v.moeda === 'semanas';
  const proprio = m.id === eu.id;
  const { data: mov } = await supabase.from('ra_cofrinho').select('*').eq('membro_id', m.id).order('criado_em', { ascending: false }).limit(12);
  const semana = addDias(dados.hoje, -((new Date(dados.hoje + 'T12:00:00Z').getUTCDay() + 6) % 7));
  const nestaSemana = (mov || []).filter((x) => x.valor > 0 && x.criado_em.slice(0, 10) >= semana).reduce((s, x) => s + x.valor, 0);
  const esperando = dados.pedidos.filter((p) => p.membro_id === m.id && p.status === 'pedido');
  const maior = (p) => v.lista.find((x) => x.custo > v.tem && x.id !== p.id && x.custo > p.custo) || null;
  const meus = desejosVisiveis(dados.desejos, m.id);
  const nEsperando = meus.filter((x) => x.desejo === 'esperando').length;
  const titulo = semanas ? (proprio ? 'Semanas conquistadas' : `Semanas de ${m.nome}`) : (proprio ? 'Meu cofrinho' : `Cofrinho de ${m.nome}`);

  return (
    <main className="estreito">
      {/* @decisao 25/11 Thomas (opção A): para o filho o Cofrinho é uma aba (Meus desafios | Mural | Cofrinho). Pai/Mãe vendo o cofrinho de alguém voltam com a setinha. */}
      {proprio && !gestor
        ? <><DesafiosTopo gestor={false} perfil={perfil(m)} ativo={2} /><p className="sub" style={{ margin: '-4px 0 12px' }}>{semanas ? 'Não vencem. Use quando quiser.' : 'Suas estrelinhas ficam guardadas. Não somem.'}</p></>
        : <Voltar href="/desafios" titulo={titulo} sub={semanas ? 'Não vencem. Use quando quiser.' : 'Suas estrelinhas ficam guardadas. Não somem.'} />}
      <div className="kpi destaque" style={{ marginBottom: 14 }}>
        <small>Guardadas</small>
        <div className="cofre-n">{semanas ? <Hexagono tam={34} /> : <Estrela tam={34} />}<strong>{v.tem}</strong></div>
        <em>{nestaSemana ? `+${nestaSemana} nesta semana` : 'Cumpra o desafio da semana para juntar mais.'}</em>
      </div>

      {esperando.length > 0 && (
        <div className="aviso info">Esperando a entrega: {esperando.map((p) => p.nome).join(', ')}.</div>
      )}

      {v.meta && (
        <div className="card des-card">
          <small className="peq-cinza" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{v.sugerida ? 'Próximo prêmio (sugestão do app)' : v.meta.membro_id ? `${proprio ? 'Estou juntando' : `${m.nome} está juntando`} para (${proprio ? 'meu desejo' : 'desejo'})` : `${proprio ? 'Estou juntando' : `${m.nome} está juntando`} para`}</small>
          <div className="vit" style={{ paddingBottom: 0 }}><span className="corpo"><b>{v.meta.nome}</b><small>{semanas ? <Hexagono tam={14} /> : <Estrela tam={14} />} {Math.min(v.tem, v.meta.custo)} de {v.meta.custo}{v.tem < v.meta.custo ? ` · faltam ${v.meta.custo - v.tem}` : ''}</small><div className="barra"><div style={{ width: `${Math.min(100, (v.tem / v.meta.custo) * 100)}%` }} /></div></span></div>
        </div>
      )}

      {(proprio || meus.length > 0) && <>
        <div className="grupo-titulo">{proprio ? 'Meus desejos' : `Desejos de ${m.nome}`}</div>
        <div className="card" style={{ padding: '12px 18px' }}>
          {meus.length === 0 && <div className="vazio" style={{ padding: '6px 0' }}>Tem algo que você quer muito? Sugira a quem cuida de você.</div>}
          {meus.map((x) => (
            <div className="vit" key={x.id}>
              <span className="des-ic"><Icone nome="presente" tam={22} /></span>
              <span className="corpo"><b>{x.sugerido || x.nome}</b>
                <small>{x.desejo === 'esperando' ? (proprio ? 'Esperando os responsáveis' : 'Esperando a resposta. Veja em Desafios.') : `Os responsáveis: “${x.resposta}”`}</small></span>
            </div>
          ))}
          {proprio && <SugerirDesejo familia={m.familia_id} membro={m.id} esperando={nEsperando} moeda={v.moeda} />}
        </div>
      </>}

      <div className="grupo-titulo">{semanas ? 'Combinados para usar as semanas' : 'Prêmios combinados'}</div>
      <div className="card" style={{ padding: '12px 18px' }}>
        {v.lista.length === 0 && <div className="vazio">Os responsáveis ainda não montaram a vitrine.</div>}
        {v.lista.map((p) => (
          <div className="vit" key={p.id}>
            <span className="des-ic mel">{semanas ? <Hexagono tam={22} /> : <Estrela tam={22} />}</span>
            <span className="corpo"><b>{p.nome}</b><small>{p.custo} {semanas ? (p.custo === 1 ? 'semana' : 'semanas') : 'estrelinhas'}{p.membro_id ? (proprio ? ' · meu desejo' : ' · desejo') : ''}{p.regra ? ` · ${p.regra}` : ''}{v.tem < p.custo ? ` · faltam ${p.custo - v.tem}` : ''}</small>
              {v.tem < p.custo && <div className="barra"><div style={{ width: `${(v.tem / p.custo) * 100}%` }} /></div>}</span>
            {v.tem >= p.custo
              ? <TrocarPremio premio={p} membro={proprio ? null : m.id} tem={v.tem} moeda={v.moeda} maior={maior(p)} />
              : p.id !== v.meta?.id || v.sugerida
                ? (proprio ? <Form acao={metaCofrinho}><input type="hidden" name="premio" value={p.id} /><button className="btn sec peq" aria-label={`Quero juntar para ${p.nome}`}>Quero este</button></Form> : null)
                : <span className="tg vd">{proprio ? 'Estou juntando' : 'Juntando'}</span>}
          </div>
        ))}
      </div>
      <p className="sub" style={{ fontSize: 'var(--f-apoio)', textAlign: 'center' }}>Troque agora ou continue juntando para um prêmio maior.</p>

      {(mov || []).length > 0 && (
        <>
          <div className="grupo-titulo">Últimos movimentos</div>
          <div className="card" style={{ padding: '8px 18px' }}>
            {mov.map((x) => (
              <div className="mural-item" key={x.id}>
                <span className="corpo"><b>{x.motivo || (x.valor > 0 ? 'Desafio cumprido' : 'Troca')}</b><small>{dataCurta(x.criado_em.slice(0, 10))}</small></span>
                <strong style={{ color: x.valor > 0 ? 'var(--ok)' : 'var(--cinza)' }}>{x.valor > 0 ? '+' : ''}{x.valor}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
