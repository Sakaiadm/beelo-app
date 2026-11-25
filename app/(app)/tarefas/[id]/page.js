// @arquivo  page.js: rota antiga de detalhes; redireciona para Editar ou Agenda.
// @tipo     tela
// @usa      banco ra_tarefas, lib/sessao
// @usado-por Next.js (rota /tarefas/[id])
import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';

// Esta tela foi removida (Raio-X U27): tudo o que ela mostrava está nos detalhes do cartão e no Editar.
// Links antigos continuam funcionando: quem pode editar vai para o Editar; os outros, para a Agenda.
export default async function Detalhes({ params }) {
  const { id } = await params;
  const { supabase, eu, gestor } = await exigirMembro();
  const { data: t } = await supabase.from('ra_tarefas').select('id, criada_por, responsavel_id').eq('id', id).maybeSingle();
  if (t && (gestor || (t.criada_por === eu.id && t.responsavel_id === eu.id))) redirect(`/tarefas/${t.id}/editar`);
  redirect('/agenda');
}
