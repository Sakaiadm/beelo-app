// @arquivo  page.js: lista dos relatos dos testadores (problemas e sugestões); só administrador geral.
// @tipo     tela
// @usa      rpc ra_relatos_lista, bucket rotina-fotos (links temporários), components/RelatosPainel (cartões, marcar e gerar prompt), lib/sessao, lib/links
// @usado-por Next.js (rota /config/relatos)
// @banco    ra_relatos (SQL 0033)
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import RelatosPainel from '@/components/RelatosPainel';
import { linksAssinados } from '@/lib/links';

export const dynamic = 'force-dynamic';

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
      <RelatosPainel key={filtro} lista={lista} fotos={fotos} />
    </main>
  );
}
