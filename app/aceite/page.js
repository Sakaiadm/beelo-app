import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import { pendencias, ehMenor } from '@/lib/aceite';
import AceiteForm from '@/components/AceiteForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Antes de continuar · beelo' };

export default async function Aceite() {
  const { eu, membros, gestor, familia } = await exigirMembro();
  const p = pendencias(eu, membros, gestor);
  if (!p.algum) redirect('/');
  const crianca = ehMenor(eu);
  const primeiro = (eu.nome || '').split(' ')[0];
  return (
    <main className="estreito" style={{ paddingTop: 32 }}>
      <span className="logo-beelo" role="img" aria-label="beelo" style={{ marginBottom: 18 }} />
      {crianca ? (
        <>
          <h1 className="titulo">Oi, {primeiro}!</h1>
          <p className="sub" style={{ marginBottom: 16 }}>Antes de começar, um recado rápido sobre os seus dados.</p>
          <div className="card texto-legal">
            <ul>
              <li>O beelo guarda as suas tarefas, o que você já fez e as fotos que você manda das tarefas.</li>
              <li>Quem vê é só a sua família: o pai, a mãe ou quem cuida de você.</li>
              <li>Ninguém de fora vê nada, e o beelo não mostra propaganda.</li>
              <li>Fotografe a tarefa feita (a cama arrumada, o caderno), não você.</li>
              <li>Ficou com dúvida? Pergunte para quem cuida de você.</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <h1 className="titulo">Antes de continuar</h1>
          <p className="sub" style={{ marginBottom: 16 }}>
            {p.meu ? 'Leia e aceite os documentos do beelo. É rapidinho e só pedimos de novo quando o texto mudar.' : `Falta só autorizar o uso dos dados de quem é criança ou adolescente no grupo ${familia.nome}.`}
          </p>
        </>
      )}
      <AceiteForm meu={p.meu} crianca={crianca}
        menores={p.menores.map((m) => ({ id: m.id, nome: m.nome }))} />
      <form action="/auth/sair" method="post" style={{ marginTop: 8, textAlign: 'center' }}>
        <button style={{ background: "none", border: 0, padding: 8, fontSize: 'var(--f-apoio)', color: "var(--cinza)", textDecoration: "underline", cursor: "pointer" }}>Sair</button>
      </form>
    </main>
  );
}
