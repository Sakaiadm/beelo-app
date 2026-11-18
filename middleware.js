import { origem } from '@/lib/origem';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PUBLICAS = ['/login', '/auth', '/manifest.json', '/icone.svg', '/icone-', '/apple-touch-icon.png', '/sw.js', '/privacidade'];

export async function middleware(request) {
  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const caminho = request.nextUrl.pathname;
  if (!user && !PUBLICAS.some((p) => caminho.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', origem(request)));
  }
  return resposta;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
