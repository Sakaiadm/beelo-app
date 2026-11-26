// @arquivo  page.js: ideias de conduta para Pai/Mãe e para os filhos (cartões curtos).
// @tipo     tela
// @usa      lib/sessao, lib/papeis, lib/util, lib/ideias, components/Icone, components/IdeiasCliente
// @usado-por Next.js (rota /ideias)
// @decisao  26/11 (2): a tela de cada ideia usa o mesmo cartão leve; a tarja azul grande saiu de todas.
// @decisao  26/11: tela Ideias com título e abas na mesma linha, cartão da semana leve e aberto, e aviso "+N ideias" (sem botão).
import Link from 'next/link';
import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { hojeISO } from '@/lib/util';
import { TEMAS, FILHOS, achar, ideiaDaSemana } from '@/lib/ideias';
import Icone from '@/components/Icone';
import { MarcarVista, MarcarTodasVistas, JaVistas } from '@/components/IdeiasCliente';

export const dynamic = 'force-dynamic';

// ═══ SEÇÃO: cartão de ideia (leve e já aberto) ═══
// @regra o mesmo cartão serve para a Ideia da semana e para a tela de cada ideia (rótulo muda).
// @decisao 26/11 (Thomas): sem banner azul nem recolher; lâmpada pequena, texto e "Experimente dizer" sempre à mostra.
function CartaoSemana({ ideia, rotulo = 'Ideia da semana' }) {
  return (
    <div className="ideia-cartao ideia-leve">
      <div className="ideia-leve-cab">
        <span className="tm-ic ideia-leve-ic"><Icone nome="lampada" tam={20} cor="#13203a" /></span>
        <span><small>{rotulo}</small><b>{ideia.t}</b></span>
      </div>
      <div className="ideia-corpo">
        <p>{ideia.d}</p>
        {ideia.f && <div className="ideia-fala"><small><Icone nome="fala" tam={14} larg={2.4} />Experimente dizer</small>“{ideia.f}”</div>}
      </div>
    </div>
  );
}

export default async function Ideias({ searchParams }) {
  const sp = await searchParams;
  const { eu, gestor } = await exigirMembro();
  const hoje = hojeISO();
  const podePais = gestor || acesso(eu).painel;
  const paraPais = podePais && sp.p !== 'filhos';
  const q = (extra) => `/ideias?${new URLSearchParams({ ...(podePais && !paraPais ? { p: 'filhos' } : {}), ...extra })}`;

  // Uma ideia aberta
  const ideia = sp.i ? achar(sp.i) : null;
  if (ideia && (podePais || ideia.tema.id === 'filhos')) {
    const deFilho = ideia.tema.id === 'filhos';
    const lista = ideia.tema.ideias;
    const k = lista.findIndex((x) => x.id === ideia.id);
    const ant = lista[k - 1], prox = lista[k + 1];
    const base = podePais && deFilho ? { p: 'filhos' } : {};
    const link = (extra) => `/ideias?${new URLSearchParams({ ...base, ...extra })}`;
    return (
      <main className="estreito ideias">
        <Link prefetch={false} className="ideias-volta" href={deFilho ? link({}) : link({ t: ideia.tema.id })}><Icone nome="esq" tam={18} />{deFilho ? 'Ideias' : ideia.tema.nome}</Link>
        <CartaoSemana ideia={ideia} rotulo={`${ideia.tema.nome} · 1 min`} />
        <div className="acoes" style={{ justifyContent: 'space-between' }}>
          {ant ? <Link prefetch={false} className="btn sec peq" href={link({ i: ant.id })}><Icone nome="esq" tam={16} />Anterior</Link> : <span />}
          {prox && <Link prefetch={false} className="btn peq" href={link({ i: prox.id })}>Próxima ideia<Icone nome="dir" tam={16} cor="#fff" /></Link>}
        </div>
        <MarcarVista membro={eu.id} ideia={ideia.id} hoje={hoje} />
      </main>
    );
  }

  // Um tema aberto (só para responsáveis)
  const tema = paraPais && sp.t ? TEMAS.find((t) => t.id === sp.t) : null;
  if (tema) {
    return (
      <main className="estreito ideias">
        <Link prefetch={false} className="ideias-volta" href="/ideias"><Icone nome="esq" tam={18} />Ideias</Link>
        <div className="cab"><div><h1 className="titulo">{tema.nome}</h1><p className="sub">{tema.ideias.length} ideias · 1 minuto cada</p></div></div>
        <div className="cat-lista">
          {tema.ideias.map((i) => <Link prefetch={false} key={i.id} className="cat-linha" href={`/ideias?i=${i.id}`}><span className="cat-bolinha" /><span className="cat-nome">{i.t}</span><span className="cat-lapis">›</span></Link>)}
        </div>
      </main>
    );
  }

  const semana = ideiaDaSemana(paraPais, hoje);
  const maisAbaixo = TEMAS.reduce((n, t) => n + t.ideias.length, 0) - TEMAS[0].ideias.length;
  return (
    <main className="estreito ideias">
      {podePais ? (
        <div className="cab centro ideias-cab">
          <h1 className="titulo">Ideias</h1>
          <div className="abas">
            <Link prefetch={false} href="/ideias" className={paraPais ? 'ativo' : ''}>Responsáveis</Link>
            <Link prefetch={false} href="/ideias?p=filhos" className={!paraPais ? 'ativo' : ''}>Acompanhados</Link>
          </div>
        </div>
      ) : (
        <div className="cab"><div><h1 className="titulo">Ideias</h1><p className="sub">Dicas para você crescer com a sua rotina</p></div></div>
      )}
      <Link prefetch={false} href={q({ i: semana.id })} className="ideia-link"><CartaoSemana ideia={semana} /></Link>
      {/* @regra a contagem é real: todas as ideias dos temas menos as do primeiro tema, que já aparece na tela. Não é botão. */}
      {paraPais && maisAbaixo > 0 && (
        <div className="ideias-mais" role="note"><span className="tg ideias-mais-n">+{maisAbaixo}</span><b>ideias para ler logo abaixo</b></div>
      )}
      {paraPais ? <>
        {TEMAS.map((t) => (
          <section key={t.id} className="ideias-grupo">
            <h2 className="tm-cab"><span className="tm-ic" style={{ background: t.cor }}><Icone nome={t.icone} tam={16} cor="#fff" /></span><b>{t.nome}</b><small>{t.ideias.length} ideias</small></h2>
            <div className="cat-lista">
              {t.ideias.map((i) => <Link prefetch={false} key={i.id} className="cat-linha" href={`/ideias?i=${i.id}`}><span className="cat-bolinha" /><span className="cat-nome">{i.t}</span><span className="cat-lapis">›</span></Link>)}
            </div>
          </section>
        ))}
      </> : <>
        <div className="grupo-titulo">{podePais ? 'O que os acompanhados leem' : 'Todas as ideias'}</div>
        <div className="cat-lista" style={{ marginBottom: 16 }}>
          {FILHOS.ideias.map((i) => <Link prefetch={false} key={i.id} className="cat-linha" href={q({ i: i.id })}><span className="cat-bolinha" /><span className="cat-nome">{i.t}</span><span className="cat-lapis">›</span></Link>)}
        </div>
      </>}
      <MarcarTodasVistas membro={eu.id} hoje={hoje} />
      <div style={{ marginTop: 16 }}><JaVistas membro={eu.id} paraPais={podePais} /></div>
      <p className="sub ideias-missao">Fazer da rotina da família um caminho de responsabilidade, parceria e carinho.</p>
    </main>
  );
}
