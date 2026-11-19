import { redirect } from 'next/navigation';
import { cache } from 'react';
import { supabaseServer } from '@/lib/supabase/server';

export const sessao = cache(async () => {
  const supabase = await supabaseServer();
  // O middleware já confirmou o login no Supabase; aqui basta ler a sessão guardada (sem outra ida à rede).
  const [{ data: { session } }, r1] = await Promise.all([supabase.auth.getSession(), supabase.rpc('ra_eu')]);
  const user = session?.user;
  if (!user) redirect('/login');
  let eu = r1.data;
  if (!eu?.id) {
    const r = await supabase.rpc('ra_vincular');
    eu = r.data;
  }
  if (!eu?.id) return { supabase, user, eu: null };
  // Tudo ao mesmo tempo, em vez de uma consulta depois da outra.
  const [{ data: membros }, { count }, { data: familia }, { data: superAdmin }] = await Promise.all([
    supabase.from('ra_membros').select('*').eq('familia_id', eu.familia_id).order('papel').order('nome'),
    supabase.from('ra_notificacoes').select('id', { count: 'exact', head: true }).eq('lida', false),
    supabase.from('ra_familias').select('*').eq('id', eu.familia_id).maybeSingle(),
    supabase.rpc('ra_sou_super'),
  ]);
  return { supabase, user, eu, membros: membros || [], naoLidas: count || 0, gestor: eu.papel === 'gestor', familia: familia || { id: eu.familia_id, nome: 'Família' }, superAdmin: superAdmin === true };
});

export async function exigirMembro() {
  const s = await sessao();
  if (!s.eu) redirect('/sem-acesso');
  return s;
}
export async function exigirGestor() {
  const s = await exigirMembro();
  if (!s.gestor) redirect('/hoje');
  return s;
}
