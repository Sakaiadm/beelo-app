import Link from 'next/link';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import { CORES_VIVAS } from '@/lib/util';

export const dynamic = 'force-dynamic';

const AVISOS = { criada: 'Categoria criada.', salva: 'Categoria salva.', excluida: 'Categoria excluída.' };

export default async function Categorias({ searchParams }) {
  const sp = await searchParams;
  const { supabase } = await exigirGestor();
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem').order('nome');
  const lista = categorias || [];
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Categorias" sub={`${lista.length} ${lista.length === 1 ? 'categoria' : 'categorias'}`} />
      {AVISOS[sp?.aviso] && <div className="aviso ok" role="status">{AVISOS[sp.aviso]}</div>}
      <Link prefetch={false} href="/config/categorias/nova" className="btn bloco" style={{ marginBottom: 14 }}>+ Nova categoria</Link>
      {lista.length > 0 && (
        <div className="cat-lista">
          {lista.map((c) => (
            <Link prefetch={false} key={c.id} href={`/config/categorias/${c.id}`} className="cat-linha">
              <span className="cat-bolinha" style={{ background: CORES_VIVAS[c.cor] || CORES_VIVAS.cinza }} aria-hidden="true" />
              <span className="cat-nome">{c.nome}</span>
              <span className="cat-lapis" aria-label={`Editar ${c.nome}`}>✎</span>
            </Link>
          ))}
        </div>
      )}
      {lista.length === 0 && <p className="peq-cinza">Nenhuma categoria ainda.</p>}
    </main>
  );
}
