import { exigirMembro } from '@/lib/sessao';
import Voltar from '@/components/VoltarHistorico';

export const dynamic = 'force-dynamic';

// Só informação. Abre pela Ajuda (Segurança e privacidade).
export default async function Seguranca() {
  await exigirMembro();
  return (
    <main className="estreito">
      <Voltar href="/ajuda" titulo="Segurança e privacidade" />
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 'var(--f-apoio)' }}>
          <li>Só entra quem está cadastrado, com o e-mail cadastrado.</li>
          <li>As permissões são conferidas no banco: cada pessoa só vê e altera o que é dela.</li>
          <li>Fotos ficam em pasta privada e abrem só por link temporário. A localização é removida no envio.</li>
          <li>Toda ação importante fica registrada no histórico.</li>
        </ul>
        <p style={{ fontSize: 'var(--f-apoio)', marginBottom: 0 }}><a href="/privacidade">Aviso de privacidade</a></p>
      </div>
    </main>
  );
}
