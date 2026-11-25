// @arquivo  page.js: raiz "/": decide se vai para Painel, Hoje ou Sem acesso.
// @tipo     tela
// @usa      lib/sessao, lib/papeis
// @usado-por Next.js (arquivo especial do app)
import { redirect } from 'next/navigation';
import { sessao } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';

export default async function Inicio() {
  const s = await sessao();
  if (!s.eu) redirect('/sem-acesso');
  redirect(acesso(s.eu).painel ? '/painel' : '/hoje');
}
