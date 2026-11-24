import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { ocorrencias } from '@/lib/dados';
import { hojeISO, addDias, statusExibido, MESES } from '@/lib/util';
import { desafiosLigados, pessoasDesafio } from '@/lib/desafiosDados';
import { desafioDe, perfil, TEMAS } from '@/lib/desafios';
import NovoDesafio from '@/components/NovoDesafio';

export const dynamic = 'force-dynamic';

// Categoria mais fraca → desafio de constância naquela categoria.
const POR_CATEGORIA = { casa: 'k1', estudo: 'e1', saude: 'k5', 'cuidado pessoal': 'k3', esporte: 'f1', espiritual: 'k9', social: 'k11', financeiro: 'k12', trabalho: 'k14' };
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const serve = (c, pf) => c && (pf === 'familia' ? c.para === 'f' : c.para.includes(pf));

export default async function Novo({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia } = await exigirMembro();
  if (!desafiosLigados(familia)) redirect('/desafios');
  if (!gestor && perfil(eu) === 'c') redirect('/desafios');
  const todas = pessoasDesafio(membros);
  const pessoas = gestor ? todas : todas.filter((p) => p.id === eu.id);
  const hoje = hojeISO();
  const mes = Number(hoje.slice(5, 7)) - 1;
  const [nomeTema, idsTema] = TEMAS[mes];

  // Sugestões inteligentes (v1): a categoria que mais falhou nas últimas 4 semanas, o tema do mês e a família.
  const ocs = await ocorrencias(supabase, { de: addDias(hoje, -28), ate: addDias(hoje, -1), membros: pessoas.map((p) => p.id) });
  const sugestoes = {};
  for (const p of pessoas) {
    const lista = [];
    const minhas = ocs.filter((o) => o.membro_id === p.id).map((o) => ({ o, st: statusExibido(o, hoje) })).filter((x) => x.st !== 'adiada');
    const porCat = {};
    minhas.forEach(({ o, st }) => { const c = o.tarefa?.categoria?.nome; if (!c) return; const x = (porCat[c] ||= { n: 0, f: 0 }); x.n++; if (st.startsWith('cumprida')) x.f++; });
    const fraca = Object.entries(porCat).filter(([c, x]) => x.n >= 4 && POR_CATEGORIA[norm(c)] && serve(desafioDe(POR_CATEGORIA[norm(c)]), p.perfil))
      .sort((a, b) => a[1].f / a[1].n - b[1].f / b[1].n)[0];
    if (fraca && fraca[1].f / fraca[1].n < 0.9) {
      const pct = Math.round((fraca[1].f / fraca[1].n) * 100);
      lista.push({ id: POR_CATEGORIA[norm(fraca[0])], tag: 'Para crescer', por: `${fraca[0]} ficou em ${pct}% nas últimas 4 semanas. O app sugere um passo de cada vez.` });
    }
    const geral = minhas.length ? minhas.filter((x) => x.st.startsWith('cumprida')).length / minhas.length : null;
    if (geral != null && geral < 0.6 && serve(desafioDe('c3'), p.perfil)) lista.push({ id: 'c3', tag: 'Começo leve', por: `Ficou em ${Math.round(geral * 100)}% nas últimas 4 semanas. Começar leve ajuda a ganhar ritmo.` });
    else if (serve(desafioDe('c1'), p.perfil)) lista.push({ id: 'c1', tag: 'Constância' });
    const doTema = idsTema.map(desafioDe).find((c) => serve(c, p.perfil) && !lista.some((x) => x.id === c.id));
    if (doTema) lista.push({ id: doTema.id, tag: `Tema de ${MESES[mes]}: ${nomeTema.toLowerCase()}` });
    sugestoes[p.id] = lista;
  }
  const temaFam = idsTema.map(desafioDe).find((c) => serve(c, 'familia'));
  sugestoes.familia = [{ id: 'j1', tag: 'Em família' }, ...(temaFam && temaFam.id !== 'j1' ? [{ id: temaFam.id, tag: `Tema de ${MESES[mes]}` }] : []), { id: 'j5', tag: 'Ninguém fica para trás' }];

  const inicial = sp?.m === 'familia' ? ['familia'] : pessoas.some((p) => p.id === sp?.m) ? [sp.m] : null;
  const leves = pessoas.map(({ id, nome, perfil: pf, tela_ativo }) => ({ id, nome, perfil: pf, tela_ativo: !!tela_ativo }));
  return (
    <main className="estreito">
      <NovoDesafio pessoas={leves} inicial={inicial} sugestoes={sugestoes} tema={nomeTema} gestor={gestor} />
    </main>
  );
}
