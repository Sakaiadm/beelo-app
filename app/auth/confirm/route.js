import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { origem } from '@/lib/origem';

// Link do e-mail (Magic Link ou Confirmar cadastro). Usa token_hash + verifyOtp,
// que funciona mesmo se o link abrir em outro navegador (ex.: o do aplicativo de e-mail).
export async function GET(request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const tipo = url.searchParams.get('type') === 'signup' ? 'signup' : 'email';
  const base = origem(request);
  if (token_hash) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: tipo });
    if (!error) return NextResponse.redirect(new URL('/', base));
  }
  return NextResponse.redirect(new URL('/login?erro=link', base));
}
