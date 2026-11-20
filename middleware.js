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
  // Só lê (e renova, se vencida) a sessão guardada, sem ir ao Supabase a cada toque. Os dados continuam protegidos pelo banco (RLS).
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.access_token ? true : null;
  const caminho = request.nextUrl.pathname;
  if (!user && !PUBLICAS.some((p) => caminho.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', origem(request)));
  }
  // Abrir pelo ícone: vai direto para a tela de sempre (Painel ou Hoje), sem a tela de passagem
  // que consultava o banco 5 vezes só para decidir isso. Se o papel mudar, a própria tela corrige.
  const inicio = request.cookies.get('inicio')?.value;
  // Só quando o navegador abre a página inteira; as trocas de tela internas seguem o caminho normal.
  const pagina = request.headers.get('sec-fetch-dest') === 'document';
  if (user && caminho === '/' && pagina && (inicio === '/painel' || inicio === '/hoje')) {
    const destino = NextResponse.redirect(new URL(inicio, origem(request)));
    resposta.cookies.getAll().forEach((c) => destino.cookies.set(c));
    return destino;
  }
  return resposta;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
