// @arquivo   desafios/page.js: tela Desafios (opção A, 25/11): Pai/Mãe veem abas Desafios | Mural | Vitrine; os outros veem "Desafios" com abas (e o troféu no menu de baixo, 28/11).
// @tipo      tela
// @usa       lib/desafiosDados.js, lib/desafios.js, lib/sugestoesDesafio.js, components/DesafiosTopo, DesafiosVazio, SugerirDesafio, app/acoes-desafios.js; tabelas ra_desafio*, ra_premios, ra_cofrinho*
// @usado-por menu de baixo (Desafios), cartões do Hoje e do Painel
// @cuidado   Abas e "Ajustes" só no ramo do gestor (Ajustes fica discreto no pé). Sem setinha de voltar para Pai/Mãe; o filho mantém a setinha.
//            Desligado: gestor vê o cartão "Ligar os desafios"; os outros vão para /hoje. Sugestão da criança: tabela ra_desafio_sugestoes (SQL 0028).

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { urlsAvatares } from '@/lib/avatar';
import { ocorrencias } from '@/lib/dados';
import { statusExibido, addDias } from '@/lib/util';
import { carregarDesafios, desafiosLigados, paraComemorar, pessoasDesafio } from '@/lib/desafiosDados';
import { perfil, ideiaComemorar, textoMeta, MAX_POR_PESSOA, precoSugerido, desafioDe, cicloDe, contaNoLimite } from '@/lib/desafios';
import { sugestoesDesafio } from '@/lib/sugestoesDesafio';
import { linksAssinados } from '@/lib/links';
import DesejoAprovar from '@/components/DesejoAprovar';
import { DesafioCartao, Estrela, Hexagono } from '@/components/DesafioCartao';
import DecidirSemana from '@/components/DecidirSemana';
import SubirDeNovo from '@/components/SubirDeNovo';
import Avatar from '@/components/Avatar';
import Icone from '@/components/Icone';
import Form from '@/components/Form';
import ConfirmarBotao from '@/components/ConfirmarBotao';
import ComoFunciona, { ComoFuncionaBotao } from '@/components/ComoFunciona';
import DesafiosTopo from '@/components/DesafiosTopo';
import DesafiosVazio from '@/components/DesafiosVazio';
import SugerirDesafio from '@/components/SugerirDesafio';
import Comemorar from '@/components/Comemorar';
import FimCicloAcoes from '@/components/FimCicloAcoes';
import { ligarDesafios, entregarPremio, encerrarDesafio, subirMeta, fecharSugestaoDesafio } from '@/app/acoes-desafios';

export const dynamic = 'force-dynamic';

const AVISOS = { criado: 'Desafio criado. Ele dura 4 semanas e recomeça a cada segunda. Menos é mais!', encerrado: 'Desafio encerrado.' };

// Só aparece com os desafios desligados. Desafios é painel principal: sem setinha de voltar.
function Titulo({ texto }) {
  return <div className="cab"><div><h1 className="titulo titulo-beta">{texto} <span className="selo-beta">beta</span></h1></div></div>;
}

// Sugestões que as crianças fizeram (SQL 0028). Sem a tabela ainda, a lista vem vazia e o resto da tela funciona.
async function sugestoesAbertas(supabase) {
  const { data, error } = await supabase.from('ra_desafio_sugestoes').select('id, membro_id, catalogo, titulo, criado_em').eq('status', 'esperando').order('criado_em'); // @banco ra_desafio_sugestoes
  return error ? [] : data || [];
}

// Estrelinhas (criança) ou semanas conquistadas (adolescente) de uma pessoa.
function Saldo({ m, saldo }) {
  const pf = perfil(m);
  if (pf === 'c') return <span className="medalha" style={{ paddingLeft: 7 }}><Estrela tam={14} />{saldo?.estrelas || 0}</span>;
  if (pf === 'a') return <span className="medalha" style={{ paddingLeft: 5 }}><Hexagono tam={16} />{saldo?.semanas || 0} {saldo?.semanas === 1 ? 'semana' : 'semanas'}</span>;
  return null;
}

// @regra 28/11: pede a decisão quando a meta da semana ficou impossível (desafios de "dia bom") e ainda ninguém decidiu nesta semana.
// @regra 28/11: depois de "pegar mais leve", a partir da semana seguinte aparece "Subir de novo" (meta_normal guarda a meta de antes).
const segundaDe = (hoje) => addDias(hoje, -((new Date(hoje + 'T12:00:00Z').getUTCDay() + 6) % 7));
const podeSubir = (d, hoje) => !d.descansando_em && d.meta_normal != null && d.decisao === 'leve' && !!d.semana_decidida && d.semana_decidida < segundaDe(hoje);
const precisaDecidir = (d) => !d.descansando_em && (d.dia_bom_pct ?? 100) < 100 && !!d.atual?.detalhe?.impossivel && d.atual.status !== 'cumprido' && d.semana_decidida !== d.atual.inicio;

export default async function Desafios({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia, superAdmin } = await exigirMembro();

  if (!desafiosLigados(familia)) {
    if (!gestor) redirect('/hoje');
    return (
      <main className="estreito">
        <Titulo texto="Desafios" />
        <div className="card">
          <h2>Desafios e prêmios</h2>
          <p style={{ margin: '0 0 10px', lineHeight: 1.5 }}>Um desafio por semana para cada pessoa, com meta sugerida pelo app, dia coringa e renovação automática. A criança junta estrelinhas num cofrinho que não vence; o adolescente junta semanas conquistadas; a família pode ter uma meta juntos com um prêmio de vivência.</p>
          <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '0 0 14px' }}>Função em teste (beta). Fica desligada até o administrador geral ligar; desligando, nada se perde.</p>
          {superAdmin
            ? <Form acao={ligarDesafios}><input type="hidden" name="ligar" value="1" /><button className="btn bloco">Ligar os desafios</button></Form>
            : <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: 0 }}>Ainda não está disponível para o seu grupo.</p>}
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
      {gestor && precisaDecidir(d) && <DecidirSemana d={d} pf="j" />}
      {gestor && podeSubir(d, hoje) && <SubirDeNovo d={d} pf="j" />}
      {d.premio && <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>Prêmio da família: <b>{d.premio}</b></p>}
      {contrib.length > 0 && ['pct', 'pct_cada'].includes(d.tipo) && (
        <div className="barras-h contrib" style={{ marginTop: 14, fontSize: 'var(--f-apoio)' }}>
          {contrib.map(({ p, n, f }) => <div className="l" key={p.id}><span>{p.nome}</span><div className="barra"><div style={{ width: `${(f / n) * 100}%` }} /></div><span>{Math.round((f / n) * 100)}%</span></div>)}
        </div>
      )}
      {gestor && (d.descansando_em
        ? <FimCicloAcoes d={d} c={cicloDe(d, hoje)} />
        : <div className="des-acoes"><ConfirmarBotao acao={encerrarDesafio} campos={{ id: d.id }} rotulo="Encerrar" titulo="Encerrar desafio?" nome={d.titulo} detalhe="Desafio da família" pergunta="O que já foi conquistado continua no mural. Trocar de desafio no meio do ciclo vale 1 vez por semana." sim="Sim, encerrar" icone="bloquear" /></div>)}
    </DesafioCartao>
  ));

  // ===== Pai e Mãe =====
  if (gestor) {
    const abertos = pedidos.filter((p) => p.status === 'pedido');
    const nomePor = Object.fromEntries(pessoas.map((p) => [p.id, p]));
    // Desejos esperando a resposta dos pais (lista de desejos).
    const semDesafio = pessoas.filter((m) => deQuem(m.id).length === 0);
    const sugsCrianca = (await sugestoesAbertas(supabase)).filter((x) => nomePor[x.membro_id]);
    // Nada de desafio em ninguém: 2 ou 3 sugestões prontas, um toque cria.
    const nenhum = desafios.length === 0 && semDesafio.length > 0;
    const sugsPessoas = nenhum ? (await sugestoesDesafio(supabase, pessoas, hoje)).sugestoes : {};
    const itensVazio = nenhum ? semDesafio.map((m) => {
      const c = (sugsPessoas[m.id] || []).map((x) => desafioDe(x.id)).find(Boolean);
      return c && { pessoa: { id: m.id, nome: m.nome }, desafio: { id: c.id, t: c.t, meta: c.meta }, sub: textoMeta(c, c.meta), avatar: <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} /> };
    }).filter(Boolean).slice(0, 3) : [];
    const esperando = dados.desejos.filter((x) => x.desejo === 'esperando' && nomePor[x.membro_id]);
    const fotos = esperando.some((x) => x.foto) ? await linksAssinados(supabase, 'rotina-fotos', esperando.map((x) => x.foto), 3600) : {};
    return (
      <main className="estreito">
        <Comemorar itens={comemorar} nome={eu.nome.split(' ')[0]} crianca={!gestor && !!eu.modo_crianca} />
        {/* @decisao 25/11 Thomas (opção A): "+ Desafio" ao lado do título, abas Desafios | Mural | Vitrine, sem setinha. */}
        <DesafiosTopo gestor ativo={0} />
        <ComoFunciona perfil="gestor" membro={eu.id} semLinha />
        {aviso}

        {sugsCrianca.length > 0 && (
          <div className="card des-card" id="sugestoes">
            <h2 style={{ marginBottom: 10 }}>{sugsCrianca.length === 1 ? 'Sugestão de desafio' : 'Sugestões de desafio'}</h2>
            {sugsCrianca.map((x, i) => {
              const m = nomePor[x.membro_id];
              return (
                <div key={x.id} style={{ borderTop: i ? '1px solid var(--borda)' : 0, paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0 }}>
                  <div className="des-top">
                    <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} />
                    <span><b>{m.nome} sugeriu: {x.titulo}</b><small>Você confere a meta e salva.</small></span>
                  </div>
                  <div className="des-acoes">
                    {/* @regra Pai/Mãe abrem o desafio já escolhido, conferem a meta e salvam; a sugestão fecha sozinha. */}
                    <Link prefetch={false} className="btn peq" href={`/desafios/novo?m=${x.membro_id}&c=${x.catalogo}&s=${x.id}`}>Criar este desafio</Link>
                    <Form acao={fecharSugestaoDesafio}><input type="hidden" name="id" value={x.id} /><button className="link-btn">Agora não</button></Form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

        {nenhum && <DesafiosVazio itens={itensVazio} />}

        {pessoas.filter((m) => deQuem(m.id).length > 0).map((m) => {
          const ds = deQuem(m.id);
          // @regra 26/11 Thomas: ideal 1 por pessoa, no máximo 2 (o desafio que descansa não conta). O banco também confere.
          const nAtivos = ds.filter(contaNoLimite).length;
          return (
            <section key={m.id}>
              <div className="des-pessoa">
                <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={34} />
                <b>{m.nome}{m.id === eu.id ? ' (você)' : ''}</b>
                <small className="peq-cinza">{nAtivos} de {MAX_POR_PESSOA} desafios</small>
                {m.perfil !== 'j' && <Link prefetch={false} href={`/desafios/cofrinho?m=${m.id}`} style={{ textDecoration: 'none' }}><Saldo m={m} saldo={saldo[m.id]} /></Link>}
              </div>
              {ds.map((d) => (
                <DesafioCartao key={d.id} d={d} p={d.atual} pf={m.perfil}>
                  {precisaDecidir(d) && <DecidirSemana d={d} pf={m.perfil} quem={m.id === eu.id ? '' : m.nome} />}
                  {podeSubir(d, hoje) && <SubirDeNovo d={d} pf={m.perfil} />}
                  {d.descansando_em ? <FimCicloAcoes d={d} c={cicloDe(d, hoje)} /> : <>
                  <div className="des-acoes">
                    {d.prox && <Form acao={subirMeta}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="meta" value={d.prox} /><button className="btn peq">Subir a meta para {textoMeta(d, d.prox)}</button></Form>}
                    <ConfirmarBotao acao={encerrarDesafio} campos={{ id: d.id }} rotulo="Encerrar" titulo="Encerrar desafio?" nome={d.titulo} detalhe={m.nome} pergunta="O que já foi conquistado continua no mural e no cofrinho. Trocar de desafio no meio do ciclo vale 1 vez por semana." sim="Sim, encerrar" icone="bloquear" />
                  </div>
                  {d.prox && <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>3 semanas seguidas cumpridas. Hora de um passo a mais?</p>}
                  </>}
                </DesafioCartao>
              ))}
              {nAtivos < MAX_POR_PESSOA ? (
                <>
                  <Link prefetch={false} className="btn sec bloco" style={{ borderStyle: 'dashed', marginBottom: 6 }} href={`/desafios/novo?m=${m.id}`}><Icone nome="mais" tam={18} />Mais um desafio</Link>
                  <p className="des-limite">O ideal é 1 por vez. O segundo é um extra.</p>
                </>
              ) : <p className="des-limite">{m.nome} já tem {MAX_POR_PESSOA} desafios. Menos é mais: termine ou troque um para começar outro.</p>}
            </section>
          );
        })}

        {!nenhum && semDesafio.length > 0 && (
          <section className="sem-desafio">
            <h2 className="ajuda-sec" style={{ margin: '6px 0 10px' }}>Sem desafio ainda</h2>
            {semDesafio.map((m) => (
              <Link key={m.id} prefetch={false} href={`/desafios/novo?m=${m.id}`} className="cartao-l">
                <Avatar nome={m.nome} cor={m.cor} url={urls[m.avatar]} avatar={m.avatar} tam={42} />
                <span className="corpo"><b>{m.nome}</b><small className="peq-cinza">Escolher um desafio</small></span>
                <span className="seta" aria-hidden="true">›</span>
              </Link>
            ))}
          </section>
        )}

        {/* @regra Ajustes só para quem é gestor (Pai/Mãe) e fica discreto, no pé. A chave de desligar os desafios é só do administrador geral (dentro de Ajustes). */}
        <div className="des-rodape">
          <ComoFuncionaBotao />
          <Link prefetch={false} className="link-btn discreto" href="/desafios/ajustes"><Icone nome="ajustes" tam={18} />&nbsp;Ajustes</Link>
        </div>
      </main>
    );
  }

  // ===== Criança, adolescente e adultos =====
  const pf = perfil(eu);
  const meus = deQuem(eu.id);
  // Criança sem desafio: pode sugerir um aos pais (SQL 0028). Quem cria continua sendo Pai ou Mãe.
  const sugsMinhas = pf === 'c' ? (await sugestoesAbertas(supabase)).filter((x) => x.membro_id === eu.id) : [];
  const idsSug = pf === 'c' && meus.length === 0 ? (await sugestoesDesafio(supabase, [{ id: eu.id, perfil: 'c' }], dados.hoje)).sugestoes[eu.id] || [] : [];
  const paraSugerir = idsSug.map((x) => desafioDe(x.id)).filter((c) => c && c.para.includes('c')).slice(0, 3).map(({ id, t, d }) => ({ id, t, d }));
  return (
    <main className={`estreito${pf === 'c' ? ' des-crianca' : ''}`}>
      <Comemorar itens={comemorar} nome={eu.nome.split(' ')[0]} crianca={!gestor && !!eu.modo_crianca} />
      {/* @decisao 25/11 Thomas (opção A): abas Desafios | Mural | Cofrinho. Desde 28/11 o menu de baixo do filho tem o troféu Desafios, então sem setinha. */}
      <DesafiosTopo gestor={false} perfil={pf} ativo={0} />
      {aviso}
      <ComoFunciona perfil={pf} membro={eu.id} semLinha />
      {meus.map((d) => (
        <DesafioCartao key={d.id} d={d} p={d.atual} pf={pf}>
          {pf !== 'c' && d.criado_por === eu.id && precisaDecidir(d) && <DecidirSemana d={d} pf={pf} />}
          {pf !== 'c' && d.criado_por === eu.id && podeSubir(d, hoje) && <SubirDeNovo d={d} pf={pf} />}
          {pf === 'c' && precisaDecidir(d) && <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>Seus responsáveis vão ver e combinar com você.</p>}
          {d.descansando_em
            ? (pf !== 'c' && d.criado_por === eu.id ? <FimCicloAcoes d={d} c={cicloDe(d, dados.hoje)} /> : <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>Os responsáveis escolhem o próximo desafio com você.</p>)
            : pf !== 'c' && d.criado_por === eu.id && <div className="des-acoes"><ConfirmarBotao acao={encerrarDesafio} campos={{ id: d.id }} rotulo="Encerrar" titulo="Encerrar desafio?" nome={d.titulo} pergunta="O que você já conquistou continua guardado. Trocar de desafio no meio do ciclo vale 1 vez por semana." sim="Sim, encerrar" icone="bloquear" /></div>}
        </DesafioCartao>
      ))}
      {meus.length === 0 && <div className="card vazio">{pf === 'c' ? 'Ainda não tem desafio. Combine um com seus responsáveis!' : 'Você ainda não tem desafio.'}</div>}
      {pf !== 'c' && meus.length === 0 && <Link prefetch={false} className="btn sec bloco" style={{ borderStyle: 'dashed', marginBottom: 16 }} href="/desafios/novo"><Icone nome="mais" tam={18} />Escolher meu desafio</Link>}
      {pf === 'c' && meus.length === 0 && paraSugerir.length > 0 && <SugerirDesafio itens={paraSugerir} esperando={sugsMinhas.map((x) => x.titulo)} />}
      {cartaoFamilia}
      <div className="des-rodape"><ComoFuncionaBotao /></div>
    </main>
  );
}
