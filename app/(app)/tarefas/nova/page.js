// @arquivo  page.js: criar tarefa (com sugestões prontas).
// @tipo     tela
// @usa      banco ra_categorias, lib/sessao, lib/util, components/TarefaForm, components/Voltar, lib/volta
// @usado-por Next.js (rota /tarefas/nova)
import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import TarefaForm from '@/components/TarefaForm';
import Voltar from '@/components/Voltar';
import { lerVolta, hrefVolta } from '@/lib/volta';

export default async function Nova({ searchParams }) {
  const sp = await searchParams;
  const { supabase, membros, gestor, eu } = await exigirMembro();
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem');
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  const pessoas = gestor ? [eu, ...filhos] : filhos;
  const voltar = lerVolta(sp);
  return (
    <main className="estreito">
      <Voltar href={hrefVolta(voltar)} titulo="Nova tarefa" />
      <TarefaForm paraId={gestor ? pessoas.find((p) => p.id === sp?.m)?.id : undefined} euId={eu.id} filhos={pessoas} categorias={categorias || []} gestor={gestor} hoje={/^\d{4}-\d{2}-\d{2}$/.test(sp?.d || '') ? sp.d : hojeISO()} voltar={voltar} />
    </main>
  );
}
