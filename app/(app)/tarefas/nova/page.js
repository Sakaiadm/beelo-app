import { exigirMembro } from '@/lib/sessao';
import { hojeISO } from '@/lib/util';
import TarefaForm from '@/components/TarefaForm';

export default async function Nova() {
  const { supabase, membros, gestor } = await exigirMembro();
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem');
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  return (
    <main className="estreito">
      <div className="cab"><h1 className="titulo">Nova tarefa</h1></div>
      <TarefaForm filhos={filhos} categorias={categorias || []} gestor={gestor} hoje={hojeISO()} />
    </main>
  );
}
