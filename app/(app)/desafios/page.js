// @arquivo   desafios/page.js: tela Desafios (gestor vê tudo e liga/desliga o beta; os outros veem "Meus desafios").
// @tipo      tela
// @usa       lib/desafiosDados.js, lib/desafios.js, app/acoes-desafios.js; tabelas ra_desafio*, ra_premios, ra_cofrinho*
// @usado-por menu de baixo (Desafios), cartões do Hoje e do Painel
// @cuidado   Pílulas Mural/Vitrine/Ajustes só no ramo do gestor. Desligado: gestor vê o cartão "Ligar os desafios"; os outros vão para /hoje.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { urlsAvatares } from '@/lib/avatar';
import { ocorrencias } from '@/lib/dados';
import { statusExibido, addDias } from '@/lib/util';
import { carregarDesafios, desafiosLigados, paraComemorar, pessoasDesafio, vitrineDe } from '@/lib/desafiosDados';
import { perfil, ideiaComemorar, textoMeta, MAX_POR_PESSOA, precoSugerido } from '@/lib/desafios';
import { linksAssinados } from '@/lib/links';
import DesejoAprovar from '@/components/DesejoAprovar';
import { DesafioCartao, Estrela, Hexagono } from '@/components/DesafioCartao';
import Avatar from '@/components/Avatar';
import Icone from '@/components/Icone';
import Form from '@/components/Form';
import ConfirmarBotao from '@/components/ConfirmarBotao';
import ComoFunciona from '@/components/ComoFunciona';
import Comemorar from '@/components/Comemorar';
import { ligarDesafios, entregarPremio, encerrarDesafio, subirMeta } from '@/app/acoes-desafios';

export const dynamic = 'force-dynamic';

const AVISOS = { criado: 'Desafio criado. Ele renova sozinho toda semana.', encerrado: 'Desafio encerrado.' };

function Titulo({ texto, acao, volta = '/painel' }) {
  return (
    <div className="cab">
      <div className="vt" style={{ alignItems: 'flex-start' }}><Link prefetch={false} className="volta" href={volta} aria-label="Voltar"><Icone nome="esq" tam={26} /></Link><div><h1 className="titulo titulo-beta">{texto} <span className="selo-beta">beta</span></h1><p className="sub">A semana vai de segunda a domingo.</p></div></div>
      {acao}
    </div>
  );
}

function Item({ href, icone, titulo, sub, mel }) {
  return (
    <Link prefetch={false} href={href} className="cartao-l">
      <span className={`des-ic${mel ? ' mel' : ''}`}><Icone nome={icone} tam={22} /></span>
      <span className="corpo"><b>{titulo}</b><small className="peq-cinza">{sub}</small></span>
      <span className="seta" aria-hidden="true">›</span>
    </Link>
  );
}

// Estrelinhas (criança) ou semanas conquistadas (adolescente) de uma pessoa.
function Saldo({ m, saldo }) {
  const pf = perfil(m);
  if (pf === 'c') return <span className="medalha" style={{ paddingLeft: 7 }}><Estrela tam={14} />{saldo?.estrelas || 0}</span>;
  if (pf === 'a') return <span className="medalha" style={{ paddingLeft: 5 }}><Hexagono tam={16} />{saldo?.semanas || 0} {saldo?.semanas === 1 ? 'semana' : 'semanas'}</span>;
  return null;
}

export default async function Desafios({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia } = await exigirMembro();

  if (!desafiosLigados(familia)) {
    if (!gestor) redirect('/hoje');
    return (
      <main className="estreito">
        <Titulo texto="Desafios" />
        <div className="card">
          <h2>Desafios e prêmios</h2>
          <p style={{ margin: '0 0 10px', lineHeight: 1.5 }}>Um desafio por semana para cada pessoa, com meta sugerida pelo app, dia coringa e renovação automática. A criança junta estrelinhas num cofrinho que não vence; o adolescente junta semanas conquistadas; a família pode ter uma meta juntos com um prêmio de vivência.</p>
          <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '0 0 14px' }}>Função em teste (beta). Fica desligada até você ligar, e pode desligar quando quiser: nada se perde.</p>
          <Form acao={ligarDesafios}><input type="hidden" name="ligar" value="1" /><button className="btn bloco">Ligar os desafios</button></Form>
        </div>
      </main>
    );
  }

  const dados = await carregarDesafios(supabase, { eu, membros });
  const { desafios, saldo, pedidos, premios, periodos, hoje } = dados;
  const pessoas = pessoasDesafio(membros);
  const urls = await urlsAvatares(supabase, pessoas.map((m) => m.avatar));
  const daFamilia = desafios.filter((d) => !d.membro_id);
  const deQuem = (id) => desafios.filter((d) => d.membro_id === id);
  const aviso = AVISOS[sp?.aviso] && <div className="aviso ok" role="status">{AVISOS[sp.aviso]}</div>;
  const comemorar = paraComemorar(periodos, eu, desafios);

  // Contribuição de cada pessoa nos desafios da família em percentual (barras, sem ranking).
  let contrib = [];
  if (daFamilia.some((d) => ['pct', 'pct_cada'].includes(d.tipo)) && gestor) {
    const seg = addDias(hoje, -((new Date(hoje + 'T12:00:00Z').getUTCDay() + 6) % 7));
    const ocs = await ocorrencias(supabase, { de: seg, ate: addDias(seg, 6), membros: pessoas.map((p) => p.id) });
    contrib = pessoas.map((p) => {
      const l = ocs.filter((o) => o.membro_id === p.id).map((o) => statusExibido(o, hoje)).filter((s) => s !== 'adiada');
      return { p, n: l.length, f: l.filter((s) => s.startsWith('cumprida')).length };
    }).filter((x) => x.n > 0);
  }

  const cartaoFamilia = daFamilia.map((d) => (
    <DesafioCartao key={d.id} d={d} p={d.atual}>
      {d.premio && <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>Prêmio da família: <b>{d.premio}</b></p>}
      {contrib.length > 0 && ['pct', 'pct_cada'].includes(d.tipo) && (
        <div className="barras-h contrib" style={{ marginTop: 14, fontSize: 'var(--f-apoio)' }}>
          {contrib.map(({ p, n, f }) => <div className="l" key={p.id}><span>{p.nome}</span><div className="barra"><div style={{ width: `${(f / n) * 100}%` }} /></div><span>{Math.round((f / n) * 100)}%</span></div>)}
        </div>
      )}
      {gestor && <div className="des-acoes"><ConfirmarBotao acao={encerrarDesafio} campos={{ id: d.id }} rotulo="Encerrar" titulo="Encerrar desafio?" nome={d.titulo} detalhe="Desafio da família" pergunta="O que já foi conquistado continua no mural." sim="Sim, encerrar" icone="bloquear" /></div>}
    </DesafioCartao>
  ));

  // ===== Pai e Mãe =====
  if (gestor) {
    const abertos = pedidos.filter((p) => p.status === 'pedido');
    const nomePor = Object.fromEntries(pessoas.map((p) => [p.id, p]));
    // Desejos esperando a resposta dos pais (lista de desejos).
    const semDesafio = pessoas.filter((m) => deQuem(m.id).length === 0);
    const esperando = dados.desejos.filter((x) => x.desejo === 'esperando' && nomePor[x.membro_id]);
    const fotos = esperando.some((x) => x.foto) ? await linksAssinados(supabase, 'rotina-fotos', esperando.map((x) => x.foto), 3600) : {};
    return (
      <main className="estreito">
        <Comemorar itens={comemorar} nome={eu.nome.split(' ')[0]} crianca={!gestor && !!eu.modo_crianca} />
        <Titulo texto="Desafios" acao={<Link prefetch={false} className="btn" href="/desafios/novo"><Icone nome="mais" tam={18} cor="#fff" />Desafio</Link>} />
        <ComoFunciona perfil="gestor" membro={eu.id}>
          <Link prefetch={false} className="btn sec peq" href="/desafios/mural"><Icone nome="check" tam={18} />Mural</Link>
          <Link prefetch={false} className="btn sec peq" href="/desafios/premios"><Icone nome="etiqueta" tam={18} />Vitrine</Link>
          {/* @regra Ajustes só para quem é gestor (Pai/Mãe): este bloco só existe no ramo do gestor. */}
          <Link prefetch={false} className="btn sec peq" href="/desafios/ajustes"><Icone nome="ajustes" tam={18} />Ajustes</Link>
        </ComoFunciona>
        {aviso}

        {esperando.length > 0 && (
          <div className="card des-card" id="desejos">
            <h2 style={{ marginBottom: 10 }}>{esperando.length === 1 ? 'Desejo para aprovar' : 'Desejos para aprovar'}</h2>
            {esperando.map((x, i) => {
              const m = nomePor[x.membro_id];
              const nDes = desafios.filter((d) => d.membro_id === m.id && d.recompensa === 'estrelas').length;
              return (
                <div key={x.id} style={{ borderTop: i ? '1px solid var(--borda)' : 0, paddingTop: i ? 14 : 0, marginTop: i ? 14 : 0 }}>
                  <DesejoAprovar desejo={x} nome={m.nome} tem={saldo[m.id]?.[x.moeda] || 0} porSemana={x.moeda === 'semanas' ? 1 : nDes * 10}
                    sugerido={precoSugerido(x.sugerido || x.nome, x.moeda, premios.filter((p) => !p.membro_id))} foto={x.foto ? fotos[x.foto] : null}
                    avatar={<Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} />} />
                </div>
              );
            })}
          </div>
        )}

        {abertos.length > 0 && (
          <div className="card des-card" id="premios">
            <h2 style={{ marginBottom: 10 }}>{abertos.length === 1 ? 'Prêmio para entregar' : 'Prêmios para entregar'}</h2>
            {abertos.map((pe, i) => {
              const m = nomePor[pe.membro_id];
              return (
                <div key={pe.id} style={{ borderTop: i ? '1px solid var(--borda)' : 0, paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0 }}>
                  <div className="des-top">
                    {m ? <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} /> : <span className="des-ic mel"><Icone nome="familia" tam={22} /></span>}
                    <span><b>{m ? (pe.custo ? `${m.nome} trocou ${pe.custo} ${pe.moeda === 'semanas' ? (pe.custo === 1 ? 'semana' : 'semanas') : 'estrelinhas'}` : `${m.nome} cumpriu o desafio`) : 'A família cumpriu o desafio'}</b><small>{pe.nome}</small></span>
                  </div>
                  <div className="frase"><Icone nome="fala" tam={18} /><span>Ideia para comemorar: {ideiaComemorar(pe.id).toLowerCase()}.</span></div>
                  <Form acao={entregarPremio}><input type="hidden" name="id" value={pe.id} /><input type="hidden" name="entregue" value="1" /><button className="btn bloco" style={{ marginTop: 12, minHeight: 46 }}>Marcar como entregue</button></Form>
                  {pe.custo > 0 && <ConfirmarBotao acao={entregarPremio} simples={false} campos={{ id: pe.id, entregue: '0' }} rotulo="Desfazer a troca" classe="link-btn" titulo="Desfazer a troca?" nome={pe.nome} detalhe={m?.nome} pergunta={`O que ${m?.nome || 'a pessoa'} juntou volta para o cofrinho.`} sim="Sim, desfazer" icone="bloquear" />}
                </div>
              );
            })}
          </div>
        )}

        {cartaoFamilia}

        {semDesafio.length > 0 && (
          <div className="card des-card sem-desafio">
            <p><b>{semDesafio.map((m) => m.nome).join(', ').replace(/, ([^,]*)$/, ' e $1')}</b> {semDesafio.length === 1 ? 'ainda está sem desafio' : 'ainda estão sem desafio'}. Escolher para:</p>
            <div className="acoes">{semDesafio.map((m) => <Link key={m.id} prefetch={false} className="btn sec peq" href={`/desafios/novo?m=${m.id}`}>{m.nome}</Link>)}</div>
          </div>
        )}

        {pessoas.filter((m) => deQuem(m.id).length > 0).map((m) => {
          const ds = deQuem(m.id);
          return (
            <section key={m.id}>
              <div className="des-pessoa">
                <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={34} />
                <b>{m.nome}{m.id === eu.id ? ' (você)' : ''}</b>
                {m.perfil !== 'j' && <Link prefetch={false} href={`/desafios/cofrinho?m=${m.id}`} style={{ textDecoration: 'none' }}><Saldo m={m} saldo={saldo[m.id]} /></Link>}
              </div>
              {ds.map((d) => (
                <DesafioCartao key={d.id} d={d} p={d.atual}>
                  <div className="des-acoes">
                    {d.prox && <Form acao={subirMeta}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="meta" value={d.prox} /><button className="btn peq">Subir a meta para {textoMeta(d, d.prox)}</button></Form>}
                    <ConfirmarBotao acao={encerrarDesafio} campos={{ id: d.id }} rotulo="Encerrar" titulo="Encerrar desafio?" nome={d.titulo} detalhe={m.nome} pergunta="O que já foi conquistado continua no mural e no cofrinho." sim="Sim, encerrar" icone="bloquear" />
                  </div>
                  {d.prox && <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>3 semanas seguidas cumpridas. Hora de um passo a mais?</p>}
                </DesafioCartao>
              ))}
              {ds.length < MAX_POR_PESSOA && (
                <Link prefetch={false} className="btn sec bloco" style={{ borderStyle: 'dashed', marginBottom: 6 }} href={`/desafios/novo?m=${m.id}`}><Icone nome="mais" tam={18} />Mais um desafio</Link>
              )}
            </section>
          );
        })}

      </main>
    );
  }

  // ===== Criança, adolescente e adultos =====
  const pf = perfil(eu);
  const meus = deQuem(eu.id);
  const v = vitrineDe(eu, premios, saldo);
  return (
    <main className={`estreito${pf === 'c' ? ' des-crianca' : ''}`}>
      <Comemorar itens={comemorar} nome={eu.nome.split(' ')[0]} crianca={!gestor && !!eu.modo_crianca} />
      <Titulo texto="Meus desafios" volta="/hoje" />
      {aviso}
      <ComoFunciona perfil={pf} membro={eu.id} />
      {meus.map((d) => (
        <DesafioCartao key={d.id} d={d} p={d.atual}>
          {pf !== 'c' && d.criado_por === eu.id && <div className="des-acoes"><ConfirmarBotao acao={encerrarDesafio} campos={{ id: d.id }} rotulo="Encerrar" titulo="Encerrar desafio?" nome={d.titulo} pergunta="O que você já conquistou continua guardado." sim="Sim, encerrar" icone="bloquear" /></div>}
        </DesafioCartao>
      ))}
      {meus.length === 0 && <div className="card vazio">{pf === 'c' ? 'Ainda não tem desafio. Combine um com seus pais!' : 'Você ainda não tem desafio.'}</div>}
      {pf !== 'c' && meus.length === 0 && <Link prefetch={false} className="btn sec bloco" style={{ borderStyle: 'dashed', marginBottom: 16 }} href="/desafios/novo"><Icone nome="mais" tam={18} />Escolher meu desafio</Link>}
      {cartaoFamilia}
      {pf === 'c' && (
        <Link prefetch={false} href="/desafios/cofrinho" className="card des-card">
          <div className="des-top"><span className="des-ic mel"><Estrela tam={22} /></span><span><b>Meu cofrinho</b><small>{v.tem} estrelinhas guardadas</small></span><span className="seta" style={{ color: 'var(--cinza)', fontSize: 20 }} aria-hidden="true">›</span></div>
          {v.meta && <div className="vit" style={{ borderTop: '1px solid var(--borda)', marginTop: 12, paddingBottom: 0 }}><span className="corpo"><b>{v.meta.nome}</b><small><Estrela tam={14} /> {Math.min(v.tem, v.meta.custo)} de {v.meta.custo}{v.tem < v.meta.custo ? ` · faltam ${v.meta.custo - v.tem}` : ' · já dá para trocar!'}</small><div className="barra"><div style={{ width: `${Math.min(100, (v.tem / v.meta.custo) * 100)}%` }} /></div></span></div>}
        </Link>
      )}
      {pf === 'a' && (
        <Link prefetch={false} href="/desafios/cofrinho" className="card des-card">
          <div className="des-top"><span className="des-ic mel"><Icone nome="check" tam={22} /></span><span><b>Semanas conquistadas</b><small>Não vencem. Você decide quando usar.</small></span><span className="seta" style={{ color: 'var(--cinza)', fontSize: 20 }} aria-hidden="true">›</span></div>
          <div className="hexes">{Array.from({ length: Math.max(6, Math.min(v.tem + 1, 12)) }, (_, i) => <Hexagono key={i} tam={30} on={i < v.tem} />)}</div>
          {v.tem > 12 && <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: 0 }}>{v.tem} semanas guardadas.</p>}
        </Link>
      )}
      <Item href="/desafios/mural" icone="check" titulo="Mural de conquistas" sub="Desafios cumpridos e medalhas" mel />
    </main>
  );
}
