// @arquivo  page.js: menu de Cadastros: pessoas, categorias, famílias e grupos.
// @tipo     tela
// @usa      banco ra_categorias, rpc ra_admin_familias, lib/sessao, components/Icone
// @usado-por Next.js (rota /config)
import Link from 'next/link';
import { exigirGestor } from '@/lib/sessao';
import Icone from '@/components/Icone';
import GuiaChave from '@/components/GuiaChave';

export const dynamic = 'force-dynamic';

function Item({ href, icone, titulo, sub }) {
  return (
    <Link prefetch={false} href={href} className="cartao-l">
      <span className="icone-cad"><Icone nome={icone} tam={22} /></span>
      <span className="corpo"><b>{titulo}</b><small className="peq-cinza">{sub}</small></span>
      <span className="seta" aria-hidden="true">›</span>
    </Link>
  );
}

export default async function Config({ searchParams }) {
  const { supabase, membros, familia, superAdmin } = await exigirGestor();
  const sp = await searchParams;
  const [{ count: nCat }, adm] = await Promise.all([
    supabase.from('ra_categorias').select('id', { count: 'exact', head: true }),
    superAdmin ? supabase.rpc('ra_admin_familias') : Promise.resolve({ data: null }),
  ]);
  const n = membros.length;
  return (
    <main className="estreito">
      <div className="cab"><div><h1 className="titulo">Cadastros</h1></div></div>
      {sp?.nova && <div className="aviso ok" role="status">Família criada. Agora cadastre as pessoas.</div>}
      {superAdmin
        ? <Item href="/config/familias" icone="familia" titulo="Grupos" sub={`${adm.data?.length ?? 0} grupos · só você vê`} />
        : <Item href={`/config/familias/${familia.id}`} icone="familia" titulo="Meu grupo" sub={familia.nome} />}
      <Item href="/config/pessoas" icone="pessoa" titulo="Pessoas" sub={`${n} ${n === 1 ? 'pessoa' : 'pessoas'}`} />
      <Item href="/config/categorias" icone="etiqueta" titulo="Categorias" sub={`${nCat ?? 0} categorias`} />
      {superAdmin && <GuiaChave familiaId={familia.id} ligado={familia.guia_mel === true} />}
    </main>
  );
}
