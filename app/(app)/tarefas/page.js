import { redirect } from 'next/navigation';

// A lista "Tarefas" foi substituída pela Agenda em Dia (com o lápis para editar).
export default async function Tarefas({ searchParams }) {
  const sp = await searchParams;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || '') ? `&d=${sp.d}` : '';
  redirect(`/agenda?v=dia${d}`);
}
