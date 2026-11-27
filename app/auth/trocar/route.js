// @arquivo  route.js: rota que troca o login do aparelho para outra conta já entrada (alternar contas de teste).
// @tipo     tela
// @usa      lib/supabase/server
// @usado-por lib/contas.js
// @cuidado  não dá poder a ninguém: só aceita tokens que o próprio aparelho já tinha (login válido no Supabase). Token inválido = erro. NUNCA chamar signOut aqui: revogaria a conta guardada.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request) {
  const corpo = await request.json().catch(() => ({}));
  const store = await cookies();
  const limpar = () => {
    ['ra_u', 'inicio'].forEach((n) => store.delete(n));
  };
  // "Sair sem revogar": só apaga os cookies de login deste navegador; o login guardado continua valendo.
  if (corpo.sair === true) {
    store.getAll().filter((c) => c.name.startsWith('sb-')).forEach((c) => store.delete(c.name));
    limpar();
    return NextResponse.json({ ok: true });
  }
  const a = String(corpo.access_token || ''), r = String(corpo.refresh_token || '');
  if (!a || !r || a.length > 4000 || r.length > 400) return NextResponse.json({ ok: false }, { status: 400 });
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.setSession({ access_token: a, refresh_token: r });
  if (error || !data?.session) return NextResponse.json({ ok: false }, { status: 401 });
  limpar(); // esquece a tela guardada de quem usava antes
  return NextResponse.json({ ok: true, uid: data.session.user?.id, access_token: data.session.access_token, refresh_token: data.session.refresh_token });
}
