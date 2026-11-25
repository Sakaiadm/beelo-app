// @arquivo  page.js: página pública da política de privacidade.
// @tipo     tela
// @usa      components/Legal
// @usado-por Next.js (rota /privacidade)
// @cuidado  texto jurídico: precisa de revisão de advogado antes de cobrar.
import { L, PaginaLegal } from '@/components/Legal';

export const metadata = { title: 'Privacidade · beelo' };

export default function Privacidade() {
  return (
    <PaginaLegal titulo="Política de privacidade"
      links={<><a href="/termos">Termos de uso</a> · <a href="/consentimento">Termo de consentimento</a> · <a href="/">Voltar</a></>}>
      <h2>Em poucas palavras</h2>
      <ul>
        <li>Guardamos só o que o beelo precisa para organizar a rotina do seu grupo.</li>
        <li>Os responsáveis (Pai e Mãe) e quem eles autorizarem veem o grupo. Cada pessoa vê o que é seu. Outros grupos não veem nada.</li>
        <li>Não vendemos dados, não mostramos anúncios, não criamos perfil para publicidade e não usamos rastreadores.</li>
        <li>Dados de crianças e adolescentes só entram com a autorização do pai, da mãe ou do responsável legal.</li>
        <li>Você pode baixar, corrigir ou apagar os seus dados quando quiser.</li>
      </ul>

      <h2>Quem cuida dos dados</h2>
      <p>O controlador dos dados é {L.controlador} ({L.documento}), responsável pelo beelo. O encarregado pelo tratamento de dados pessoais é {L.encarregado}, que atende pelo e-mail {L.email} e pelo WhatsApp {L.zap}.</p>

      <h2>Que dados guardamos e para quê</h2>
      <ul>
        <li><b>Cadastro:</b> nome, e-mail, papel no grupo (Pai, Mãe, Adulto que ajuda ou Filho(a)), parentesco (opcional, como neto ou tio), cor, foto ou avatar e se usa o modo criança. Serve para criar a conta e o grupo.</li>
        <li><b>Rotina:</b> tarefas, dias, horários, quando cada tarefa foi feita, foto de comprovação (só quando a tarefa pede), justificativas e pedidos de adiamento com as respostas.</li>
        <li><b>Tempo de tela:</b> os minutos que a própria pessoa lança, e o previsto combinado. O beelo não mede o uso do celular nem lê outros apps.</li>
        <li><b>Desafios e cofrinho:</b> desafios, estrelinhas, prêmios combinados e a lista de desejos.</li>
        <li><b>Avisos:</b> os avisos dentro do app e, se a pessoa ativar os avisos no celular, um endereço técnico do navegador para entregá-los.</li>
        <li><b>Histórico e aceites:</b> registro das ações importantes do grupo e de cada aceite destes documentos (quem aceitou, qual versão e quando).</li>
        <li><b>Login:</b> se você entra com o Google, recebemos só o seu nome e e-mail. O beelo não usa senha.</li>
      </ul>

      <h2>Por que podemos usar esses dados (base legal)</h2>
      <ul>
        <li>Para os adultos: para prestar o serviço que você pediu ao entrar no beelo (LGPD, art. 7º, V).</li>
        <li>Para crianças e adolescentes: com o consentimento específico e em destaque de pelo menos um dos pais ou do responsável legal, sempre no melhor interesse deles (LGPD, art. 14).</li>
        <li>Histórico, registros de acesso e aceites: para a segurança do app, para cumprir a lei e para comprovar as autorizações (LGPD, art. 7º, II e IX, e art. 8º).</li>
      </ul>

      <h2>Crianças e adolescentes</h2>
      <p>Ninguém entra sozinho no beelo: o cadastro de crianças e adolescentes é feito pelo pai, pela mãe ou pelo responsável legal, que marca a autorização em destaque. O app registra quem autorizou, quando e qual versão do texto. Os dados deles servem só para o funcionamento do app, nunca para publicidade ou perfil de consumo. Na primeira entrada, a criança vê um recado simples sobre os dados dela. O responsável pode retirar a autorização a qualquer momento, e os dados da criança são apagados.</p>

      <h2>Quem vê o quê</h2>
      <ul>
        <li><b>Pai e Mãe:</b> tudo do grupo, inclusive fotos, tempo de tela, pedidos, histórico e os e-mails das pessoas.</li>
        <li><b>Adulto que ajuda, com as chaves liberadas:</b> o painel, as conferências e os relatórios, conforme o que os responsáveis liberarem.</li>
        <li><b>Cada pessoa:</b> as próprias tarefas, fotos e tempo de tela, além do nome e da foto das pessoas do grupo.</li>
        <li><b>Outros grupos:</b> nada. Essa regra é conferida no próprio banco de dados.</li>
      </ul>

      <h2>Com quem os dados são compartilhados</h2>
      <p>Só com serviços que fazem o beelo funcionar, que tratam os dados em nosso nome:</p>
      <ul>
        <li><b>Supabase:</b> banco de dados e fotos, em servidores em São Paulo, Brasil.</li>
        <li><b>Hostinger:</b> servidor onde o app roda, cópias de segurança e envio dos e-mails de convite e de acesso.</li>
        <li><b>Google e Apple:</b> login com o Google e entrega dos avisos no celular (o aviso passa pelo serviço do navegador). Esses serviços podem processar dados fora do Brasil, com as garantias da LGPD (art. 33).</li>
      </ul>
      <p>Também podemos informar dados quando a lei ou uma autoridade exigir.</p>

      <h2>Cookies e dados no aparelho</h2>
      <p>O beelo usa só cookies necessários: o do login e o que lembra a tela inicial. Não há cookies de propaganda nem de estatística. Algumas preferências (tema, som, dicas vistas) e uma cópia das telas para usar sem internet ficam no próprio aparelho.</p>

      <h2>Segurança</h2>
      <p>Conexão sempre protegida (HTTPS), regras de acesso conferidas no banco, fotos em pasta privada que só abrem por um link temporário, localização removida das fotos antes do envio e cópias de segurança diárias. Se acontecer um incidente que possa trazer risco, avisaremos as pessoas afetadas e a ANPD.</p>

      <h2>Por quanto tempo guardamos</h2>
      <p>Enquanto o grupo usar o beelo. Quando uma pessoa ou o grupo é apagado, os dados e as fotos saem do app na hora e das cópias de segurança em até 14 dias. Os registros de acesso podem ser guardados por 6 meses, como pede o Marco Civil da Internet.</p>

      <h2>Seus direitos</h2>
      <p>Você pode confirmar se tratamos seus dados, ter acesso, corrigir, pedir a portabilidade, a anonimização ou a exclusão, saber com quem compartilhamos, retirar o consentimento e reclamar na Autoridade Nacional de Proteção de Dados (ANPD). No app:</p>
      <ul>
        <li><b>Meu perfil › Baixar meus dados:</b> um arquivo com os seus dados (ou os do grupo, para Pai e Mãe).</li>
        <li><b>Cadastros:</b> Pai e Mãe corrigem ou excluem uma pessoa (as fotos dela saem junto).</li>
        <li><b>Meu perfil › Apagar o grupo:</b> Pai ou Mãe apaga tudo do grupo.</li>
      </ul>
      <p>Para o resto, inclusive apagar a conta de login, escreva para {L.email}. Respondemos em até 15 dias.</p>

      <h2>Mudanças</h2>
      <p>Quando este texto mudar de forma importante, o app pede um novo aceite no próximo acesso.</p>
    </PaginaLegal>
  );
}
