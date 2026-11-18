import { notFound } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import TarefaForm from '@/components/TarefaForm';
import { excluirTarefa } from '@/app/acoes';

export default async function Editar({ params }) {
  const { id } = await params;
  const { supabase, membros, gestor, eu } = await exigirMembro();
  const { data: t } = await supabase.from('ra_tarefas').select('*').eq('id', id).maybeSingle();
  if (!t) notFound();
  const podeEditar = gestor || (t.criada_por === eu.id && t.responsavel_id === eu.id);
  if (!podeEditar) notFound();
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem');
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  return (
    <main className="estreito">
      <div className="cab"><h1 className="titulo">Editar tarefa</h1></div>
      <TarefaForm t={t} filhos={filhos} categorias={categorias || []} gestor={gestor} hoje={hojeISO()} />
      <form action={excluirTarefa} className="card">
        <input type="hidden" name="id" value={t.id} />
        <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--cinza)' }}>Excluir para de gerar a tarefa daqui para frente. O histórico já feito continua nos relatórios.</p>
        <button className="btn perigo">Excluir tarefa</button>
      </form>
    </main>
  );
}
