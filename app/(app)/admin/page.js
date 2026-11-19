import { redirect } from 'next/navigation';

// A administração de famílias agora fica em Cadastros > Famílias e grupos.
export default function Admin() {
  redirect('/config/familias');
}
