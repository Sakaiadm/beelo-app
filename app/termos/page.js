import { CONTATO, ATUALIZADO_EM } from '@/lib/contato';
import Preencher from '@/components/Preencher';

export const metadata = { title: 'Termos de uso · beelo' };

const C = {
  quem: <Preencher valor={CONTATO.responsavel} rotulo="nome do responsável" />,
  email: <Preencher valor={CONTATO.email} rotulo="e-mail de contato" />,
  zap: <Preencher valor={CONTATO.whatsapp} rotulo="WhatsApp" />,
};

export default function Termos() {
  return (
    <main className="estreito">
      <a href="/" className="logo-beelo" role="img" aria-label="beelo" style={{ marginBottom: 18 }} />
      <h1 className="titulo">Termos de uso</h1>
      <p style={{ color: 'var(--cinza)', fontSize: 14, margin: '6px 0 16px' }}>Versão beta · atualizado em {ATUALIZADO_EM}</p>
      <div className="card texto-legal">
        <h2>O que é o beelo</h2>
        <p>O beelo ajuda famílias e grupos a combinar tarefas, acompanhar o dia a dia e comemorar cada conquista. Ao usar o beelo, você concorda com estes termos e com a <a href="/privacidade">Privacidade</a>.</p>

        <h2>Versão beta</h2>
        <p>Esta é uma versão de teste, aberta a poucas famílias e sem custo durante o período de testes. Algumas telas podem mudar e podem aparecer falhas. Se algo não funcionar, conte para a gente: a sua ajuda deixa o beelo melhor para todos.</p>

        <h2>Quem pode usar</h2>
        <ul>
          <li>Só entra quem foi convidado por um responsável do grupo.</li>
          <li>Crianças e adolescentes usam o beelo com autorização e acompanhamento do pai, da mãe ou do responsável legal, que responde pelo cadastro deles.</li>
          <li>Cada pessoa cuida do próprio acesso (e-mail ou conta Google) e não deve emprestá-lo.</li>
        </ul>

        <h2>Combinados de uso</h2>
        <ul>
          <li>Use o beelo para organizar a rotina, com respeito e carinho entre as pessoas do grupo.</li>
          <li>Envie só fotos da tarefa feita. Não envie fotos íntimas, de outras pessoas sem permissão ou de conteúdo impróprio.</li>
          <li>Não tente acessar dados de outros grupos nem atrapalhar o funcionamento do app.</li>
        </ul>

        <h2>Seus conteúdos</h2>
        <p>As tarefas, fotos e textos são do seu grupo. Usamos esses conteúdos só para fazer o beelo funcionar para vocês.</p>

        <h2>Ideias e sugestões do app</h2>
        <p>As ideias e sugestões de tarefas são dicas gerais para o dia a dia. Elas não substituem a orientação de um psicólogo, pedagogo ou outro profissional.</p>

        <h2>Disponibilidade</h2>
        <p>Fazemos o possível para o beelo estar sempre no ar e para guardar cópias de segurança, mas, por ser uma versão de teste, não garantimos que ele funcione sem interrupções ou sem falhas.</p>

        <h2>Encerrar o uso</h2>
        <p>Você pode parar de usar quando quiser e pedir a exclusão dos dados (veja a <a href="/privacidade">Privacidade</a>). Podemos suspender um acesso que desrespeite estes termos, ou encerrar a versão beta, sempre avisando antes.</p>

        <h2>Mudanças nos termos</h2>
        <p>Estes termos podem mudar com a evolução do app. Avisaremos no beelo antes de qualquer mudança importante.</p>

        <h2>Lei aplicável</h2>
        <p>Estes termos seguem as leis do Brasil.</p>

        <h2 id="contato">Relatar um problema ou tirar uma dúvida</h2>
        <p>Achou algo estranho, tem uma ideia ou precisa de ajuda? Escreva para o e-mail {C.email} ou chame no WhatsApp {C.zap}. Se puder, conte o que estava fazendo e mande um print da tela.</p>

        <p style={{ marginBottom: 0 }}><a href="/privacidade">Privacidade</a> · <a href="/">Voltar</a></p>
      </div>
    </main>
  );
}
