// @arquivo  page.js: lista dos relatos dos testadores (problemas e sugestões); só administrador geral.
// @tipo     tela
// @usa      rpc ra_relatos_lista, bucket rotina-fotos (links temporários), app/acoes.js (mudarRelato), lib/sessao, lib/links
// @usado-por Next.js (rota /config/relatos)
// @banco    ra_relatos (SQL 0033)
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import Form from '@/components/Form';
import { mudarRelato } from '@/app/acoes';
import { linksAssinados } from '@/lib/links';

export const dynamic = 'force-dynamic';

const quando = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default async function Relatos({ searchParams }) {
  const { supabase, superAdmin } = await exigirGestor();
  if (!superAdmin) redirect('/config');
  const sp = await searchParams;
  const { data } = await supabase.rpc('ra_relatos_lista');
  const todos = data || [];
  const filtro = ['novo', 'visto', 'resolvido'].includes(sp?.s) ? sp.s : 'novo';
  const lista = todos.filter((r) => r.status === filtro);
  const n = (s) => todos.filter((r) => r.status === s).length;
  const fotos = await linksAssinados(supabase, 'rotina-fotos', lista.map((r) => r.foto_path), 3600);
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Relatos dos testadores" sub={`${todos.length} no total`} />
      <div className="seg" role="tablist" aria-label="Andamento">
        {[['novo', 'Novos'], ['visto', 'Vistos'], ['resolvido', 'Resolvidos']].map(([k, rot]) => (
          <a key={k} href={`?s=${k}`} role="tab" aria-selected={filtro === k} className={filtro === k ? 'on' : ''}>{rot} · {n(k)}</a>
        ))}
      </div>
      {!lista.length && <p className="peq-cinza">Nada por aqui.</p>}
      {lista.map((r) => (
        <article key={r.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <span className={`tg ${r.tipo === 'problema' ? '' : 'cz'}`}>{r.tipo === 'problema' ? 'Problema' : 'Sugestão'}</span>
            <b>{r.nome}</b><small className="peq-cinza">{r.familia} · {quando(r.criado_em)}</small>
          </div>
          <p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{r.texto}</p>
          {fotos[r.foto_path] && <a href={fotos[r.foto_path]} target="_blank" rel="noreferrer"><img src={fotos[r.foto_path]} alt="Foto anexada ao relato" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--borda)', background: 'var(--fundo)' }} /></a>}
          <p className="peq-cinza" style={{ margin: '8px 0' }}>Tela: {r.tela} · {r.papel} · {r.aparelho}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {r.status !== 'visto' && <Form simples acao={mudarRelato}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="visto" /><button className="btn sec peq">Marcar como visto</button></Form>}
            {r.status !== 'resolvido' && <Form simples acao={mudarRelato}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="resolvido" /><button className="btn peq">Resolvido</button></Form>}
            {r.status !== 'novo' && <Form simples acao={mudarRelato}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="novo" /><button className="btn sec peq">Voltar para novos</button></Form>}
          </div>
        </article>
      ))}
    </main>
  );
}
