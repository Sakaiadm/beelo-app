import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';

export const dynamic = 'force-dynamic';

export default async function Ajustes() {
  await exigirGestor();
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Configurações" />
      <div className="card"><h2>Segurança e privacidade</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>
          <li>Só entra quem está cadastrado, com o e-mail cadastrado.</li>
          <li>As permissões são conferidas no banco: cada pessoa só vê e altera o que é dela.</li>
          <li>Fotos ficam em pasta privada e abrem só por link temporário. A localização é removida no envio.</li>
          <li>Toda ação importante fica registrada no histórico.</li>
        </ul>
        <p style={{ fontSize: 13 }}><a href="/privacidade">Aviso de privacidade</a></p>
      </div>
      <div className="card"><h2>Foto, justificativa e tempo de tela</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>Foto, adiamento e justificativa são definidos em cada tarefa. O tempo de tela se liga ou desliga em cada pessoa, em Cadastros &gt; Pessoas.</p>
      </div>
    </main>
  );
}
