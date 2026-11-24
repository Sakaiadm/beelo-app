import { notFound } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import TarefaForm from '@/components/TarefaForm';
import ExcluirTarefa from '@/components/ExcluirTarefa';
import Voltar from '@/components/Voltar';
import { lerVolta, hrefVolta } from '@/lib/volta';

export default async function Editar({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const voltar = lerVolta(sp);
  const { supabase, membros, gestor, eu } = await exigirMembro();
  const { data: t } = await supabase.from('ra_tarefas').select('*').eq('id', id).maybeSingle();
  if (!t) notFound();
  const podeEditar = gestor || (t.criada_por === eu.id && t.responsavel_id === eu.id);
  if (!podeEditar) notFound();
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem');
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  const pessoas = gestor ? [eu, ...filhos] : filhos;
  return (
    <main className="estreito">
      <Voltar href={hrefVolta(voltar)} titulo="Editar tarefa" />
      <TarefaForm t={t} euId={eu.id} filhos={pessoas} categorias={categorias || []} gestor={gestor} hoje={hojeISO()} voltar={voltar} />
      <ExcluirTarefa id={t.id} voltar={voltar} titulo={t.titulo} detalhe={membros.find((m) => m.id === t.responsavel_id)?.nome} />
    </main>
  );
}
