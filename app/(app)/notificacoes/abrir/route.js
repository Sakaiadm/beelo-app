import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { origem } from '@/lib/origem';
import { esquecerSessoes } from '@/lib/sessao';

// Abre a notificação: marca como lida e leva para o assunto.
export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  let destino = '/';
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const supabase = await supabaseServer();
    const { data } = await supabase.from('ra_notificacoes').select('link').eq('id', id).maybeSingle();
    if (data?.link && /^\/(?!\/)/.test(data.link)) destino = data.link;
    await supabase.from('ra_notificacoes').update({ lida: true }).eq('id', id);
    esquecerSessoes();
  }
  return NextResponse.redirect(new URL(destino, origem(request)));
}
