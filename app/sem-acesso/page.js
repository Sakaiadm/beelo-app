import { sessao } from '@/lib/sessao';
import { redirect } from 'next/navigation';
import Form from '@/components/Form';
import { criarFamilia } from '@/app/acoes';

export default async function SemAcesso() {
  const s = await sessao();
  if (s.eu) redirect('/');
  return (
    <main className="estreito" style={{ paddingTop: 60 }}>
      <div className="card">
        <h1 className="titulo">Acesso não liberado</h1>
        <p className="sub">O e-mail <strong>{s.user.email}</strong> ainda não participa de nenhum grupo. Se você foi convidado(a), peça ao responsável para cadastrar este e-mail em Cadastros.</p>
        <form action="/auth/sair" method="post" style={{ marginTop: 16 }}><button className="btn sec">Entrar com outra conta</button></form>
      </div>
      <div className="card">
        <h2>Começar um grupo novo</h2>
        <p className="sub" style={{ marginTop: 0 }}>Se você é o responsável, crie seu grupo. Você entra como responsável e depois cadastra as outras pessoas.</p>
        <Form acao={criarFamilia}>
          <div className="linha">
            <div><label htmlFor="cf">Nome da família ou grupo</label><input id="cf" name="familia" required maxLength={60} placeholder="Família Silva" /></div>
            <div><label htmlFor="cn">Seu nome</label><input id="cn" name="nome" required maxLength={60} /></div>
          </div>
          <button className="btn" style={{ marginTop: 10 }}>Criar meu grupo</button>
        </Form>
      </div>
    </main>
  );
}
