// @arquivo  page.js: criar um desafio (do catálogo ou personalizado).
// @tipo     tela
// @usa      lib/sessao, lib/util, lib/desafiosDados, lib/desafios, components/NovoDesafio, lib/sugestoesDesafio
// @usado-por Next.js (rota /desafios/novo)
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import { desafiosLigados, pessoasDesafio } from '@/lib/desafiosDados';
import { perfil, desafioDe } from '@/lib/desafios';
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
  // Vindo de uma sugestão da criança (?c=desafio&s=sugestão): já abre o desafio escolhido. @decisao 25/11 Thomas
  const cat = gestor && desafioDe(sp?.c) && inicial?.length === 1 ? sp.c : null;
  const sugestao = cat && /^[0-9a-f-]{36}$/i.test(String(sp?.s || '')) ? sp.s : null;
  return (
    <main className="estreito">
      <NovoDesafio pessoas={leves} inicial={inicial} euId={eu.id} sugestoes={sugestoes} tema={nomeTema} gestor={gestor} catalogoInicial={cat} sugestao={sugestao} />
    </main>
  );
}
