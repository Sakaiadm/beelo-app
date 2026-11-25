// @arquivo  page.js: criar um desafio (do catálogo ou personalizado).
// @tipo     tela
// @usa      lib/sessao, lib/util, lib/desafiosDados, lib/desafios, components/NovoDesafio, lib/sugestoesDesafio
// @usado-por Next.js (rota /desafios/novo)
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import { desafiosLigados, pessoasDesafio } from '@/lib/desafiosDados';
import { perfil } from '@/lib/desafios';
import NovoDesafio from '@/components/NovoDesafio';
import { sugestoesDesafio } from '@/lib/sugestoesDesafio';

export const dynamic = 'force-dynamic';

export default async function Novo({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia } = await exigirMembro();
  if (!desafiosLigados(familia)) redirect('/desafios');
  if (!gestor && perfil(eu) === 'c') redirect('/desafios');
  const todas = pessoasDesafio(membros);
  const pessoas = gestor ? todas : todas.filter((p) => p.id === eu.id);
  const hoje = hojeISO();
  const { sugestoes, nomeTema } = await sugestoesDesafio(supabase, pessoas, hoje);

  const inicial = sp?.m === 'familia' ? ['familia'] : pessoas.some((p) => p.id === sp?.m) ? [sp.m] : null;
  const leves = pessoas.map(({ id, nome, perfil: pf, tela_ativo }) => ({ id, nome, perfil: pf, tela_ativo: !!tela_ativo }));
  return (
    <main className="estreito">
      <NovoDesafio pessoas={leves} inicial={inicial} sugestoes={sugestoes} tema={nomeTema} gestor={gestor} />
    </main>
  );
}
