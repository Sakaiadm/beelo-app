'use client';
// @arquivo  FiltroHoje.js: filtro do cartão "Hoje" do Painel: abas por pessoa (Todos, cada pessoa, Eu) e lista de categoria.
// @tipo     componente
// @usa      next/navigation
// @usado-por app/(app)/painel/page.js
// @decisao  seção 35 da fila de ideias. O filtro vive no endereço (?hp=pessoa&hc=categoria) para o Painel (servidor) já devolver a lista filtrada. O padrão é Todos e Todas as categorias, então nada muda se a pessoa não usar.
// @cuidado  só filtra o cartão "Hoje". Os números do topo (Cumpridas hoje, Atrasadas…) continuam contando tudo.
import Link from 'next/link';

// pessoas: [{ id, rotulo }] (Todos entra sozinho); categorias: [{ id, nome }]; hp/hc: escolha atual ('' = todos).
export default function FiltroHoje({ pessoas, categorias, hp, hc }) {
  const url = (p, c) => {
    const q = new URLSearchParams();
    if (p) q.set('hp', p);
    if (c) q.set('hc', c);
    const s = q.toString();
    return `/painel${s ? `?${s}` : ''}#hoje`;
  };
  return (
    <>
      {pessoas.length > 1 && (
        <div className="seg pessoas" role="tablist" aria-label="Pessoa">
          {[{ id: '', rotulo: 'Todos' }, ...pessoas].map((x) => (
            <Link key={x.id || 'todos'} prefetch={false} scroll={false} role="tab" aria-selected={hp === x.id} className={hp === x.id ? 'on' : ''} href={url(x.id, hc)}>{x.rotulo}</Link>
          ))}
        </div>
      )}
      {categorias.length > 0 && (
        // Formulário comum (GET): escolher a categoria recarrega o Painel já filtrado, mesmo sem JavaScript pronto.
        <form action="/painel#hoje" method="get" style={{ marginBottom: 12 }}>
          {hp && <input type="hidden" name="hp" value={hp} />}
          <label htmlFor="hoje-cat" style={{ marginTop: 0 }}>Categoria</label>
          <select id="hoje-cat" name="hc" defaultValue={hc} onChange={(e) => e.currentTarget.form.requestSubmit()}>
            <option value="">Todas as categorias</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <noscript><button className="btn sec peq" style={{ marginTop: 8 }}>Filtrar</button></noscript>
        </form>
      )}
    </>
  );
}
