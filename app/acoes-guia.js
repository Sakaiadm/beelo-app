'use server';
// @arquivo  app/acoes-guia.js: liga e desliga o Guia da Mel (beta) de um grupo. Só o administrador geral.
// @tipo     acao
// @usa      @rpc ra_guia_mel_ligar (SQL 0024)
// @usado-por components/GuiaChave.js
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { esquecerSessoes } from '@/lib/sessao';

export async function ligarGuiaMel(fd) {
  const supabase = await supabaseServer();
  const id = String(fd.get('familia') || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  // @rpc ra_guia_mel_ligar: o banco confere se é o administrador geral
  await supabase.rpc('ra_guia_mel_ligar', { p_familia: id, p_ligar: fd.get('ligar') === '1' });
  esquecerSessoes(); // a sessão guarda a família por 30 s: limpa para a chave valer na hora
  revalidatePath('/', 'layout');
}
