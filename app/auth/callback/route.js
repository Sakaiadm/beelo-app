import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { origem } from '@/lib/origem';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL('/login?erro=link', origem(request)));
  }
  return NextResponse.redirect(new URL('/', origem(request)));
}
