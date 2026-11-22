import Link from 'next/link';
import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import { TEMAS, FILHOS, achar, ideiaDaSemana } from '@/lib/ideias';
import Icone from '@/components/Icone';
import { MarcarVista, JaVistas } from '@/components/IdeiasCliente';

export const dynamic = 'force-dynamic';

// Lâmpada acesa desenhada (cartão "Ilustrado azul", seção 66 opção 1).
function Ilustracao({ tam = 96 }) {
  return (
    <svg className="ideia-ilu" width={tam} height={tam} viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="44" r="34" fill="#fff" opacity=".18" /><circle cx="48" cy="44" r="24" fill="#fff" opacity=".22" />
      <path d="M48 18a20 20 0 0 0-11.5 36.4c1.7 1.3 2.8 3.2 2.8 5.4V62h17.4v-2.2c0-2.2 1.1-4.1 2.8-5.4A20 20 0 0 0 48 18Z" fill="#ffd166" />
      <path d="M42 40c0-3.5 2.6-6.4 6-6.9" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".9" />
      <rect x="39" y="64" width="18" height="5" rx="2.5" fill="#e8eef7" /><rect x="41" y="71" width="14" height="5" rx="2.5" fill="#e8eef7" />
      <g stroke="#ffd166" strokeWidth="3" strokeLinecap="round"><path d="M48 6v5M20 18l3.5 3.5M76 18l-3.5 3.5M10 44h5M81 44h5" /></g>
      <path d="M80 66l1.6 3.4L85 71l-3.4 1.6L80 76l-1.6-3.4L75 71l3.4-1.6Z" fill="#fff" />
      <path d="M16 62l1.2 2.5L20 66l-2.8 1.2L16 70l-1.2-2.8L12 66l2.8-1.5Z" fill="#fff" opacity=".85" />
    </svg>
  );
}

function Cartao({ ideia, rotulo }) {
  return (
    <div className="ideia-cartao">
      <div className="ideia-ban">
        <div><small>{rotulo}</small><b>{ideia.t}</b></div>
        <Ilustracao />
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
  const podePais = gestor || eu.funcao === 'supervisor';
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
        <Cartao ideia={ideia} rotulo={`${ideia.tema.nome} · 1 min`} />
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
  return (
    <main className="estreito ideias">
      <div className="cab"><div><h1 className="titulo">Ideias</h1><p className="sub">{podePais ? 'Pequenas atitudes para a rotina virar parceria' : 'Dicas para você crescer com a sua rotina'}</p></div></div>
      {podePais && (
        <div className="abas" style={{ marginBottom: 16 }}>
          <Link prefetch={false} href="/ideias" className={paraPais ? 'ativo' : ''}>Responsáveis</Link>
          <Link prefetch={false} href="/ideias?p=filhos" className={!paraPais ? 'ativo' : ''}>Filhos</Link>
        </div>
      )}
      <Link prefetch={false} href={q({ i: semana.id })} className="ideia-link"><Cartao ideia={semana} rotulo="Ideia da semana" /></Link>
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
        <div className="grupo-titulo">{podePais ? 'O que os filhos leem' : 'Todas as ideias'}</div>
        <div className="cat-lista" style={{ marginBottom: 16 }}>
          {FILHOS.ideias.map((i) => <Link prefetch={false} key={i.id} className="cat-linha" href={q({ i: i.id })}><span className="cat-bolinha" /><span className="cat-nome">{i.t}</span><span className="cat-lapis">›</span></Link>)}
        </div>
      </>}
      <div style={{ marginTop: 16 }}><JaVistas membro={eu.id} paraPais={podePais} /></div>
      <p className="sub ideias-missao">Fazer da rotina da família um caminho de responsabilidade, parceria e carinho.</p>
    </main>
  );
}
