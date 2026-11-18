import { sessao } from '@/lib/sessao';
import { redirect } from 'next/navigation';

export default async function SemAcesso() {
  const s = await sessao();
  if (s.eu) redirect('/');
  return (
    <main className="estreito" style={{ paddingTop: 60 }}>
      <div className="card">
        <h1 className="titulo">Acesso não liberado</h1>
        <p className="sub">O e-mail <strong>{s.user.email}</strong> ainda não foi convidado. Peça para o pai ou a mãe cadastrar este e-mail em Família.</p>
        <form action="/auth/sair" method="post" style={{ marginTop: 16 }}><button className="btn sec">Entrar com outra conta</button></form>
      </div>
    </main>
  );
}
