import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { origem } from '@/lib/origem';

export async function POST(request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  const r = NextResponse.redirect(new URL('/login', origem(request)), { status: 303 });
  r.cookies.delete('inicio');
  r.cookies.delete('ra_u');
  return r;
}
