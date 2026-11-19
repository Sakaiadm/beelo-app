import { notFound } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import TarefaForm from '@/components/TarefaForm';
import ExcluirTarefa from '@/components/ExcluirTarefa';

export default async function Editar({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const voltar = /^\d{4}-\d{2}-\d{2}$/.test(sp?.d || '') ? sp.d : '';
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
      <div className="cab"><h1 className="titulo">Editar tarefa</h1></div>
      <TarefaForm t={t} euId={eu.id} filhos={pessoas} categorias={categorias || []} gestor={gestor} hoje={hojeISO()} voltar={voltar} />
      <ExcluirTarefa id={t.id} voltar={voltar} />
    </main>
  );
}
