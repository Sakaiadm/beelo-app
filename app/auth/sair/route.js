// @arquivo  route.js: rota que encerra a sessão e volta para o login.
// @tipo     tela
// @usa      lib/supabase/server, lib/origem
// @usado-por Next.js (rota /auth/sair)
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { origem } from '@/lib/origem';

export async function POST(request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  // "Entrar com o e-mail do convite": volta ao login já com o e-mail certo preenchido.
  const fd = await request.formData().catch(() => null);
  const email = String(fd?.get('email') || '').trim().toLowerCase();
  const destino = new URL('/login', origem(request));
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120) { destino.searchParams.set('email', email); destino.searchParams.set('convite', '1'); }
  const r = NextResponse.redirect(destino, { status: 303 });
  r.cookies.delete('inicio');
  r.cookies.delete('ra_u');
  return r;
}
