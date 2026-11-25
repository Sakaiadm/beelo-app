// @arquivo  page.js: página pública dos termos de uso.
// @tipo     tela
// @usa      components/Legal
// @usado-por Next.js (rota /termos)
// @cuidado  texto jurídico: precisa de revisão de advogado antes de cobrar.
import { L, PaginaLegal } from '@/components/Legal';

export const metadata = { title: 'Termos de uso · beelo' };

export default function Termos() {
  return (
    <PaginaLegal titulo="Termos de uso"
      links={<><a href="/privacidade">Política de privacidade</a> · <a href="/consentimento">Termo de consentimento</a> · <a href="/">Voltar</a></>}>
      <h2>O que é o beelo</h2>
      <p>O beelo ajuda famílias e grupos a combinar tarefas, acompanhar o dia a dia e comemorar cada conquista. Ele é oferecido por {L.controlador} ({L.documento}). Ao marcar a caixa de aceite no primeiro acesso, você concorda com estes termos e declara que leu a <a href="/privacidade">Política de privacidade</a>.</p>

      <h2>Versão beta</h2>
      <p>Esta é uma versão de teste, aberta a poucas famílias e sem custo durante os testes. Algumas telas podem mudar e podem aparecer falhas. Se um dia o beelo passar a ser pago, você será avisado antes, com o preço e as regras de cobrança e cancelamento, e só paga se aceitar.</p>

      <h2>Quem pode usar</h2>
      <ul>
        <li>Só entra quem foi convidado por um responsável do grupo.</li>
        <li>Quem cria ou cuida de um grupo (Pai, Mãe ou responsável) precisa ter 18 anos ou mais.</li>
        <li>Crianças e adolescentes usam o beelo com a autorização e o acompanhamento do pai, da mãe ou do responsável legal, que marca a autorização em destaque ao cadastrá-los e responde pelo cadastro deles.</li>
        <li>Cada pessoa cuida do próprio acesso (e-mail ou conta Google) e não deve emprestá-lo.</li>
      </ul>

      <h2>Combinados de uso</h2>
      <ul>
        <li>Use o beelo para organizar a rotina, com respeito e carinho entre as pessoas do grupo.</li>
        <li>Envie só fotos da tarefa feita. Não envie fotos íntimas, de outras pessoas sem permissão ou de conteúdo impróprio.</li>
        <li>Não tente acessar dados de outros grupos, não tente burlar as regras do app e não atrapalhe o funcionamento dele.</li>
      </ul>

      <h2>Seus conteúdos</h2>
      <p>As tarefas, fotos e textos são do seu grupo. Usamos esses conteúdos só para fazer o beelo funcionar para vocês. A marca, o visual e o código do beelo são do beelo.</p>

      <h2>Ideias e sugestões</h2>
      <p>As ideias, desafios e sugestões do app são dicas gerais para o dia a dia. Elas não substituem a orientação de um psicólogo, pedagogo, médico ou outro profissional.</p>

      <h2>Disponibilidade</h2>
      <p>Fazemos o possível para o beelo estar sempre no ar e guardamos cópias de segurança diárias. Por ser uma versão de teste, não garantimos que ele funcione sem interrupções ou sem falhas.</p>

      <h2>Encerrar o uso</h2>
      <p>Você pode parar de usar quando quiser. Pai ou Mãe pode apagar o grupo em Meu perfil, e qualquer pessoa pode pedir a exclusão dos próprios dados (veja a <a href="/privacidade">Política de privacidade</a>). Podemos suspender um acesso que desrespeite estes termos, ou encerrar a versão beta, sempre avisando antes.</p>

      <h2>Mudanças nos termos</h2>
      <p>Estes termos podem mudar com a evolução do app. Quando a mudança for importante, o app pede um novo aceite no próximo acesso.</p>

      <h2>Lei aplicável</h2>
      <p>Estes termos seguem as leis do Brasil, incluindo o Código de Defesa do Consumidor, a Lei Geral de Proteção de Dados e o Estatuto da Criança e do Adolescente. Fica eleito o foro do domicílio do usuário.</p>

      <h2 id="contato">Relatar um problema ou tirar uma dúvida</h2>
      <p>Achou algo estranho, tem uma ideia ou precisa de ajuda? Escreva para {L.email} ou chame no WhatsApp {L.zap}. Se puder, conte o que estava fazendo e mande um print da tela.</p>
    </PaginaLegal>
  );
}
