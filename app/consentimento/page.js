// @arquivo  page.js: página pública com o texto de consentimento (LGPD).
// @tipo     tela
// @usa      components/Legal
// @usado-por Next.js (rota /consentimento)
import { L, PaginaLegal } from '@/components/Legal';

export const metadata = { title: 'Termo de consentimento · beelo' };

export default function Consentimento() {
  return (
    <PaginaLegal titulo="Termo de consentimento do responsável"
      links={<><a href="/privacidade">Política de privacidade</a> · <a href="/termos">Termos de uso</a> · <a href="/">Voltar</a></>}>
      <p>Este termo vale para cada criança ou adolescente (menor de 18 anos) cadastrado no beelo. Ele é aceito pelo pai, pela mãe ou pelo responsável legal ao marcar a caixa de autorização no cadastro da pessoa ou no aviso do primeiro acesso. O beelo registra quem autorizou, para qual pessoa, a versão deste texto e a data e hora.</p>

      <h2>O que você autoriza</h2>
      <p>Ao marcar a caixa, você declara que é pai, mãe ou responsável legal da criança ou do adolescente (ou que tem a autorização de quem é) e autoriza {L.controlador} ({L.documento}), responsável pelo beelo, a tratar os dados dele ou dela como descrito abaixo, conforme o art. 14 da LGPD.</p>

      <h2>Quais dados</h2>
      <ul>
        <li>Nome, papel no grupo, cor, avatar ou foto de perfil e, se tiver, o e-mail de acesso.</li>
        <li>Tarefas, horários, o que foi feito, fotos de comprovação das tarefas, justificativas e pedidos de adiamento.</li>
        <li>Tempo de tela lançado, desafios, estrelinhas, prêmios e lista de desejos.</li>
      </ul>

      <h2>Para quê</h2>
      <ul>
        <li>Organizar a rotina da criança ou do adolescente com a família.</li>
        <li>Mostrar a evolução, comemorar conquistas e avisar o responsável sobre o que precisa de atenção.</li>
      </ul>
      <p><b>Nunca</b> para publicidade, venda de dados ou perfil de consumo.</p>

      <h2>Quem vê</h2>
      <p>Só as pessoas do grupo, conforme os papéis definidos pelos pais (veja a <a href="/privacidade">Política de privacidade</a>). Os serviços que fazem o app funcionar (banco de dados, servidor e envio de avisos) tratam os dados em nome do beelo.</p>

      <h2>Cuidados combinados</h2>
      <ul>
        <li>O responsável acompanha o uso e decide o que cada pessoa pode fazer no app.</li>
        <li>Fotografe a tarefa feita (a cama arrumada, o caderno), não a criança.</li>
        <li>A criança recebe, na primeira entrada, um recado simples sobre os dados dela.</li>
      </ul>

      <h2>Por quanto tempo e como retirar</h2>
      <p>Os dados ficam enquanto a pessoa estiver no grupo. Você pode retirar esta autorização quando quiser: basta excluir a pessoa em Cadastros, apagar o grupo em Meu perfil ou escrever para {L.email}. Os dados e as fotos saem do app na hora e das cópias de segurança em até 14 dias.</p>

      <h2>Contato</h2>
      <p>Encarregado de dados: {L.encarregado}. E-mail {L.email} · WhatsApp {L.zap}.</p>
    </PaginaLegal>
  );
}
