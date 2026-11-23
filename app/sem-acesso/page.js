import { sessao } from '@/lib/sessao';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Form from '@/components/Form';
import { criarFamilia } from '@/app/acoes';
import { CONTATO } from '@/lib/contato';

export const dynamic = 'force-dynamic';

export default async function SemAcesso() {
  const s = await sessao();
  if (s.eu) redirect('/');
  const { data: { user } } = await s.supabase.auth.getUser();
  const meu = (user?.email || '').toLowerCase();
  let convite = '';
  try { convite = decodeURIComponent((await cookies()).get('convite_email')?.value || '').toLowerCase(); } catch {}
  const outroEmail = convite && convite !== meu;
  const aberto = process.env.CADASTRO_ABERTO === '1';
  const zap = CONTATO.whatsapp.replace(/\D/g, '');
  return (
    <main className="estreito" style={{ paddingTop: 60 }}>
      {outroEmail ? (
        <div className="card">
          <h1 className="titulo">Este não é o e-mail do convite</h1>
          <p className="sub">O convite foi enviado para <strong>{convite}</strong>, mas você entrou com <strong>{meu}</strong>. Entre com o e-mail do convite para participar do grupo.</p>
          <form action="/auth/sair" method="post" style={{ marginTop: 16 }}>
            <input type="hidden" name="email" value={convite} />
            <button className="btn">Entrar com {convite}</button>
          </form>
        </div>
      ) : (
        <div className="card">
          <h1 className="titulo">Acesso não liberado</h1>
          <p className="sub">O e-mail <strong>{meu}</strong> ainda não participa de nenhum grupo. Se você foi convidado(a), entre com o mesmo e-mail que recebeu o convite, ou peça ao responsável para cadastrar este e-mail em Cadastros.</p>
          <form action="/auth/sair" method="post" style={{ marginTop: 16 }}><button className="btn sec">Entrar com outra conta</button></form>
        </div>
      )}
      {aberto ? (
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
      ) : (
        <div className="card">
          <h2>Quer usar o beelo com a sua família?</h2>
          <p className="sub" style={{ marginTop: 0 }}>Estamos na versão beta, com algumas famílias convidadas. Fale com a gente para participar.</p>
          <p className="sub" style={{ margin: 0 }}>WhatsApp: <a href={`https://wa.me/55${zap}`}>{CONTATO.whatsapp}</a><br />E-mail: <a href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a></p>
        </div>
      )}
    </main>
  );
}
