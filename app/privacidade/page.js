import { CONTATO, ATUALIZADO_EM } from '@/lib/contato';
import Preencher from '@/components/Preencher';

export const metadata = { title: 'Privacidade · beelo' };

const C = {
  quem: <Preencher valor={CONTATO.responsavel} rotulo="nome do responsável" />,
  email: <Preencher valor={CONTATO.email} rotulo="e-mail de contato" />,
  zap: <Preencher valor={CONTATO.whatsapp} rotulo="WhatsApp" />,
};

export default function Privacidade() {
  return (
    <main className="estreito">
      <a href="/" className="logo-beelo" role="img" aria-label="beelo" style={{ marginBottom: 18 }} />
      <h1 className="titulo">Privacidade</h1>
      <p style={{ color: 'var(--cinza)', fontSize: 'var(--f-apoio)', margin: '6px 0 16px' }}>Versão beta · atualizado em {ATUALIZADO_EM}</p>
      <div className="card texto-legal">
        <h2>Em poucas palavras</h2>
        <ul>
          <li>Guardamos só o que o beelo precisa para organizar as tarefas do seu grupo.</li>
          <li>Quem vê tudo do grupo são os responsáveis (Pai, Mãe ou quem eles autorizarem). Cada pessoa vê o que é seu.</li>
          <li>Não vendemos dados, não mostramos anúncios e não usamos ferramentas de rastreamento.</li>
          <li>Você pode pedir para ver, corrigir ou apagar seus dados a qualquer momento.</li>
        </ul>

        <h2>Quem cuida dos dados</h2>
        <p>Os dados são cuidados pela equipe do {C.quem}. Para qualquer assunto sobre privacidade, fale com a gente pelo e-mail {C.email} ou pelo WhatsApp {C.zap}.</p>

        <h2>O que guardamos</h2>
        <ul>
          <li><b>Cadastro:</b> nome, e-mail, papel no grupo (como Pai, Mãe, filho ou aluno), cor, foto ou avatar e se usa o modo criança.</li>
          <li><b>Grupo:</b> nome e foto do grupo e as categorias de tarefas.</li>
          <li><b>Tarefas:</b> nome, descrição, dia, horário, repetição, para quem é e quem criou.</li>
          <li><b>O dia a dia:</b> quando cada tarefa foi concluída, a foto de comprovação (só quando a tarefa pede foto), justificativas e pedidos para adiar, com as respostas.</li>
          <li><b>Tempo de tela:</b> os minutos que a própria pessoa lança, com print ou foto se ela quiser. O beelo não mede o uso do celular nem lê outros apps.</li>
          <li><b>Avisos:</b> os avisos dentro do app e, se a pessoa ligar os avisos no celular, um endereço técnico do navegador para entregá-los.</li>
          <li><b>Histórico:</b> registro das ações importantes (quem fez o quê e quando), visto só pelos responsáveis.</li>
        </ul>
        <p>Se você entra com o Google, recebemos do Google apenas o seu nome e e-mail para confirmar quem é você.</p>

        <h2>O que fica só no seu aparelho</h2>
        <p>Algumas preferências (tema claro ou escuro, som, dicas já vistas) e uma cópia das telas para usar sem internet ficam guardadas no próprio celular ou computador. O que você marcar sem internet é enviado quando a conexão voltar.</p>

        <h2>Fotos</h2>
        <p>As fotos ficam numa pasta privada e só abrem por um link temporário. A localização é removida antes do envio. Dica: fotografe a tarefa feita (a cama arrumada, o caderno), não a criança.</p>

        <h2>Quem vê o quê</h2>
        <ul>
          <li><b>Responsáveis</b> (Pai, Mãe e quem tiver permissão de gestor): todas as tarefas, fotos, tempo de tela, pedidos e o histórico do grupo.</li>
          <li><b>Cada pessoa</b> (filhos, alunos, outros adultos): as próprias tarefas, fotos e tempo de tela, além do nome e da foto das pessoas do mesmo grupo.</li>
          <li><b>Crianças no modo criança:</b> veem o mesmo que as outras pessoas, numa tela mais simples.</li>
          <li><b>Outros grupos</b> não veem nada do seu grupo. Essa regra é conferida no próprio banco de dados.</li>
        </ul>

        <h2>Onde os dados ficam</h2>
        <p>O banco de dados e as fotos ficam no Supabase, um serviço de banco de dados na nuvem. O app roda num servidor contratado pelo beelo, onde também ficam cópias de segurança do banco. Os e-mails de convite e de acesso saem por um serviço de e-mail, e os avisos no celular passam pelo serviço do próprio navegador (Google, Apple ou outro).</p>

        <h2>Crianças e adolescentes</h2>
        <p>O cadastro de crianças e adolescentes é feito pelo pai, pela mãe ou pelo responsável legal, que autoriza o uso dos dados ao fazer o cadastro, como pede a LGPD. Ninguém entra sozinho: só quem foi convidado pelo grupo. Usamos os dados das crianças apenas para o funcionamento do app, nunca para publicidade, e o responsável pode corrigir ou apagar tudo quando quiser.</p>

        <h2>Seus direitos e como apagar os dados</h2>
        <ul>
          <li>Os responsáveis podem corrigir ou excluir uma pessoa em <b>Cadastros</b>. Excluir a pessoa apaga também as tarefas e o histórico dela.</li>
          <li>Para receber uma cópia dos dados, apagar o grupo inteiro ou tirar qualquer dúvida, escreva para o e-mail {C.email}. Respondemos em até 15 dias.</li>
        </ul>

        <h2>Por quanto tempo guardamos</h2>
        <p>Enquanto o grupo usar o beelo. Quando um grupo ou uma pessoa é excluída, os dados saem do app na hora e das cópias de segurança em até 14 dias.</p>

        <h2>Versão beta</h2>
        <p>O beelo está em teste com poucas famílias. Este texto pode mudar, e avisaremos no app quando isso acontecer.</p>

        <p style={{ marginBottom: 0 }}><a href="/termos">Termos de uso</a> · <a href="/">Voltar</a></p>
      </div>
    </main>
  );
}
