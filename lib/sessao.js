import { redirect } from 'next/navigation';
import { cache } from 'react';
import { supabaseServer } from '@/lib/supabase/server';

export const sessao = cache(async () => {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  let { data: eu } = await supabase.rpc('ra_eu');
  if (!eu?.id) {
    const r = await supabase.rpc('ra_vincular');
    eu = r.data;
  }
  if (!eu?.id) return { supabase, user, eu: null };
  const { data: membros } = await supabase.from('ra_membros').select('*').eq('familia_id', eu.familia_id).order('papel').order('nome');
  const { count } = await supabase.from('ra_notificacoes').select('id', { count: 'exact', head: true }).eq('lida', false);
  return { supabase, user, eu, membros: membros || [], naoLidas: count || 0, gestor: eu.papel === 'gestor' };
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
