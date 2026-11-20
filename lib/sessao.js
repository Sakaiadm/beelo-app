import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createHash } from 'node:crypto';
import { supabaseServer } from '@/lib/supabase/server';
import { traduzirErro } from '@/lib/rede';

// Guarda por alguns segundos o que o topo de toda tela precisa (eu, família, pessoas, avisos não lidos).
// Assim, trocar de tela não faz mais 5 idas ao Supabase toda vez. A chave é o próprio token de login
// (com hash), então só quem tem aquele login recebe aqueles dados. Qualquer alteração no app limpa tudo.
const VIDA_MS = 30000;
const memo = new Map();
export function esquecerSessoes() { memo.clear(); }
const chaveDe = (token) => createHash('sha256').update(token).digest('hex');

export const sessao = cache(async () => {
  const supabase = await supabaseServer();
  // O middleware já confirmou o login no Supabase; aqui basta ler a sessão guardada (sem outra ida à rede).
  // Uma única rodada de consultas ao mesmo tempo. O banco só devolve dados da própria família (RLS),
  // então não precisa esperar o perfil para buscar o resto; filtramos aqui.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  const chave = chaveDe(session.access_token);
  const guardado = memo.get(chave);
  if (guardado && guardado.ate > Date.now()) return { supabase, ...guardado.dados };
  const [r1, rm, rn, rf, rs] = await Promise.all([
    supabase.rpc('ra_eu'),
    supabase.from('ra_membros').select('*').order('papel').order('nome'),
    supabase.from('ra_notificacoes').select('id', { count: 'exact', head: true }).eq('lida', false),
    supabase.from('ra_familias').select('*'),
    supabase.rpc('ra_sou_super'),
  ]);
  // Banco fora do ar ou login vencido: não confunde com "sem acesso" (que mandaria a pessoa criar outra família).
  falhaDoServidor(r1.error);
  let eu = r1.data;
  if (!eu?.id) {
    const r = await supabase.rpc('ra_vincular');
    falhaDoServidor(r.error);
    eu = r.data;
    if (!eu?.id) return { supabase, user: true, eu: null };
    return sessaoCompleta(supabase, eu);
  }
  const membros = (rm.data || []).filter((m) => m.familia_id === eu.familia_id);
  const familia = (rf.data || []).find((f) => f.id === eu.familia_id) || { id: eu.familia_id, nome: 'Família' };
  const dados = { user: true, eu, membros, naoLidas: rn.count || 0, gestor: eu.papel === 'gestor', familia, superAdmin: rs.data === true };
  // Só guarda se tudo veio sem erro.
  if (!r1.error && !rm.error && !rn.error && !rf.error && !rs.error) {
    if (memo.size > 300) memo.clear();
    memo.set(chave, { ate: Date.now() + VIDA_MS, dados });
  }
  return { supabase, ...dados };
});

function falhaDoServidor(error) {
  if (!error) return;
  if (traduzirErro(error).sessao) redirect('/login?expirou=1');
  throw new Error('O servidor não respondeu: ' + String(error.message || '').slice(0, 120));
}

// Caminho raro: acabou de ser vinculado a uma família (primeiro acesso).
async function sessaoCompleta(supabase, eu) {
  const [{ data: membros }, { count }, { data: familia }, { data: superAdmin }] = await Promise.all([
    supabase.from('ra_membros').select('*').eq('familia_id', eu.familia_id).order('papel').order('nome'),
    supabase.from('ra_notificacoes').select('id', { count: 'exact', head: true }).eq('lida', false),
    supabase.from('ra_familias').select('*').eq('id', eu.familia_id).maybeSingle(),
    supabase.rpc('ra_sou_super'),
  ]);
  return { supabase, user: true, eu, membros: membros || [], naoLidas: count || 0, gestor: eu.papel === 'gestor', familia: familia || { id: eu.familia_id, nome: 'Família' }, superAdmin: superAdmin === true };
}

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
