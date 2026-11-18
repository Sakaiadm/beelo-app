import { redirect } from 'next/navigation';
import { sessao } from '@/lib/sessao';

export default async function Inicio() {
  const s = await sessao();
  if (!s.eu) redirect('/sem-acesso');
  redirect(s.gestor ? '/painel' : '/hoje');
}
