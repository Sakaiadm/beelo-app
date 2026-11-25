// @arquivo  page.js: Ajuda com busca, mais procuradas e blocos por assunto, uma por perfil (responsável, adolescente, criança).
// @tipo     tela
// @usa      lib/ajudaBusca (via AjudaBusca), lib/jeito, lib/sessao, lib/papeis, components/VoltarHistorico, components/Icone, components/AjudaBusca, lib/contato
// @usado-por Next.js (rota /ajuda); o livro do topo (app/(app)/layout.js) abre esta tela
// @regra    25/11 Thomas: cada perfil tira dúvidas com a sua visão e a sua linguagem; a criança lê frases curtas.
// @cuidado  Mudou uma função? Atualize aqui e nos manuais públicos (public/manual*.html, gerados fora do repositório; veja docs/09-manuais.md).
import Link from 'next/link';
import { visaoCrianca } from '@/lib/jeito';
import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import VoltarHistorico from '@/components/VoltarHistorico';
import Icone from '@/components/Icone';
import AjudaBusca from '@/components/AjudaBusca';
import { CONTATO } from '@/lib/contato';
import GuiaAjuda from '@/components/GuiaAjuda';
import { publicoDe } from '@/lib/guia';

export const dynamic = 'force-dynamic';

// ═══ SEÇÃO: Perguntas do adolescente (Filho(a) "como os adultos") e do adulto que ajuda ═══
const ADOLESCENTE = [
  ['Como entrar no app e esqueci a senha', 'O beelo não usa senha. Abra beeloapp.com e toque em Entrar com Google, ou peça o link por e-mail. O link vale por pouco tempo e só funciona uma vez.', 'entrar'],
  ['Instalar como aplicativo', 'No Android (Chrome): três pontinhos › Adicionar à tela inicial. No iPhone (Safari): Compartilhar › Adicionar à Tela de Início.', 'instalar'],
  ['Como ver o que tenho para fazer', 'Toque em Hoje. As tarefas aparecem em três grupos: Ficou de outro dia, A qualquer hora e Com hora marcada. Em Agenda você vê a semana e o mês. Toque na tarefa para abrir os detalhes dela.', 'dia'],
  ['Como concluir uma tarefa', 'Toque no círculo ao lado da tarefa. Se a tarefa pede foto, o app abre a câmera ou a galeria. Escolha uma foto tirada hoje. A foto vale até as 7 da manhã do dia seguinte. Depois de enviar, a tarefa fica com o check verde.', 'concluir'],
  ['Por que o app não aceita minha foto', 'A foto precisa ser do dia da tarefa. Se for de outro dia, o app avisa. Tire a foto de novo e envie.', 'concluir'],
  ['Como adiar uma tarefa', 'Toque na tarefa para abrir os detalhes e depois em Adiar. Escolha Amanhã, Depois de amanhã ou Outro dia, e conte o motivo. Seus responsáveis recebem o pedido e respondem. Se não aparece o botão Adiar, essa tarefa não pode ser adiada.', 'atrasou'],
  ['Tarefa atrasada e justificativa', 'Se a tarefa passou do horário, toque em Justificar e conte o motivo. Em algumas tarefas, se ela ficou para outro dia, a justificativa é obrigatória antes de concluir. Isso depende do que seus responsáveis definiram.', 'atrasou'],
  ['Como escolher o meu desafio', 'No cartão Desafios e conquistas, em Hoje, abra Meus desafios e toque em Escolher meu desafio. Veja a meta e as regras e escolha. O desafio renova sozinho toda segunda. Os desafios ainda estão em teste (beta).', 'desafios'],
  ['O que são semanas conquistadas', 'Cada semana em que você cumpre a meta do desafio vira uma semana conquistada. Elas não vencem. Você usa quando quiser, nos combinados de autonomia que aparecem em Semanas conquistadas, tocando em Usar.', 'desafios'],
  ['Dia coringa', 'Um dia difícil na semana vira dia coringa e não conta contra você. A semana não se perde por causa dele.', 'desafios'],
  ['Como sugerir um desejo', 'Em Semanas conquistadas, vá em Meus desejos e toque em Sugerir um desejo. Você pode ter até 3 desejos esperando. Seus responsáveis aprovam e definem o preço em semanas. Se não der agora, eles respondem com uma mensagem.', 'premios'],
  ['Quem vê meus desejos e pedidos', 'Só você e seus responsáveis. Seus irmãos não veem os seus desejos nem os seus pedidos de prêmio em aberto. O mural de conquistas pode ser da família toda ou só dos responsáveis e de cada pessoa: quem escolhe são eles.', 'privacidade'],
  ['Tempo de tela', 'Se estiver ativado para você, a aba Tela mostra o tempo previsto e o realizado. Toque na tarefa “Lançar tempo de tela” e coloque o tempo de ontem (celular e computador). Se quiser, envie a foto do relatório do aparelho. Precisa de mais tempo num dia? Peça na aba Tela, e seus responsáveis decidem.', 'tela'],
  ['Ideias (a lâmpada)', 'A lâmpada no topo abre as Ideias: dicas curtas para você crescer com a sua rotina. De vez em quando aparece uma faixa com uma ideia em Hoje. Toque no X para fechar ou em Ver ideia para ler. Em Meu perfil você desliga essas dicas.', 'ideias'],
  ['Dicas da Mel', 'Se o guia da Mel estiver ativo no seu grupo, aparecem dicas curtas quando você usa cada tela. Toque em Entendi ou Pular. Em Ajuda › Guia da Mel você recomeça o guia.', 'mel'],
  ['Evolução', 'Mostra como você está indo nesta semana ou neste mês: quantas tarefas fez, quantas no dia certo e o seu melhor dia.', 'evolucao'],
  ['Meu perfil, foto e modo escuro', 'Toque no seu nome ou foto no topo. Lá você escolhe uma foto sua ou um avatar e a sua cor. Vale na hora, sem botão Salvar. Também ativa os avisos no celular e o modo escuro.', 'seu-jeito'],
  ['Avisos neste aparelho', 'Em Meu perfil, no cartão Avisos, toque em Ativar avisos neste aparelho e permita. Use Enviar um teste para conferir. O sininho no topo guarda a lista de avisos. Tocar em um aviso o marca como lido.', 'seu-jeito'],
];

// ═══ SEÇÃO: Perguntas da criança (modo criança, Divertido e Calmo): frases curtas ═══
const CRIANCA = [
  ['Como eu faço uma tarefa', 'Toque no círculo ao lado da tarefa quando terminar. Saem estrelinhas e toca uma musiquinha!', 'festa'],
  ['Marquei sem querer', 'Sem problema! Toque de novo na tarefa para desfazer.', 'festa'],
  ['A tarefa pede foto', 'Toque no círculo e escolha tirar uma foto. A foto tem que ser de hoje. Foto antiga não vale. Precisa de internet.', 'foto'],
  ['Esqueci ou não deu tempo', 'Tudo bem! Toque em Justificar e conte o que aconteceu, ou toque em Adiar e escolha outro dia. Seus pais respondem.', 'esqueci'],
  ['O que são as 5 estrelas do dia', 'Cada tarefa feita acende estrelas. Acendeu todas? Dia completo! Parabéns!', 'estrelas'],
  ['O que é o desafio da semana', 'É uma missão. Toque em Desafios e conquistas, na tela de hoje. Faça as tarefas e as bolinhas ficam verdes. Cumpriu a meta? Você ganha estrelinhas!', 'desafio'],
  ['O que é o dia coringa', 'Teve um dia difícil? Ele vira dia coringa e não estraga a sua semana.', 'desafio'],
  ['O meu cofrinho', 'As estrelinhas ficam guardadas no cofrinho. Elas não somem! Toque em Meu cofrinho para ver quantas você tem e o próximo prêmio.', 'cofrinho'],
  ['Como eu troco por um prêmio', 'No cofrinho, quando der para trocar, toque em Trocar. Quer juntar mais para um prêmio maior? Toque em Continuar juntando. Seus pais combinam como entregar.', 'cofrinho'],
  ['Como eu peço uma coisa que quero', 'No cofrinho, em Meus desejos, toque em Sugerir um desejo e escreva. Seus pais olham e respondem. Só você e seus pais veem.', 'desejos'],
  ['Como eu crio uma tarefa minha', 'Toque em Adicionar minha tarefa, escreva o nome e escolha o dia. Esse botão só aparece se seus pais deixarem.', 'minha'],
  ['Como eu troco o meu rostinho', 'Toque no seu nome, lá em cima, e depois em Meu perfil. Toque no lápis da foto e escolha Avatar.', 'rostinho'],
  ['Divertido ou Calmo', 'Em Meu perfil, em Como eu quero ver o beelo, você escolhe Divertido (estrelinhas, sons e festa), Calmo (festa curtinha e sons suaves) ou Como os adultos.', 'rostinho'],
  ['Quem é a Mel', 'É a abelhinha do beelo. Às vezes ela aparece com uma dica rapidinha. Toque em Entendi ou em Pular.', 'mel'],
  ['Ficou sem internet', 'Pode marcar as tarefas do mesmo jeito. Quando a internet voltar, o app envia tudo sozinho.', 'offline'],
  ['O app na tela do celular', 'Peça a um adulto para colocar o beelo na tela do celular, como um jogo. Aí abre com um toque.', 'instalar'],
  ['Preciso de ajuda', 'Peça a um adulto para ler o manual com você. Toque em Manual do app, aqui no alto.', 'ajuda'],
];

// ═══ SEÇÃO: Perguntas dos responsáveis (Pai e Mãe) ═══
const PAIS = [
  ['Visão geral', 'Painel mostra o dia de cada pessoa e o que precisa da sua atenção: tarefas atrasadas, pedidos de adiamento, justificativas e tempo de tela. Agenda mostra as tarefas por dia, semana e mês, Relatórios mostra o cumprimento, Tela cuida do tempo de tela e Cadastros guarda o grupo, as pessoas e as categorias.', 'painel'],
  ['Entrar no app e esqueci a senha', 'O beelo não usa senha. Abra beeloapp.com e toque em Entrar com Google, ou digite seu e-mail e toque em Enviar link de acesso. O link chega por e-mail, vale por pouco tempo e só funciona uma vez. Abra no mesmo aparelho em que você pediu.', 'entrar'],
  ['Instalar como aplicativo', 'No Android (Chrome): três pontinhos › Adicionar à tela inicial. No iPhone (Safari): Compartilhar › Adicionar à Tela de Início. Os avisos no iPhone só funcionam depois de instalar.', 'instalar'],
  ['O convite não chegou', 'Em Cadastros › Pessoas, toque em Convidar ao lado da pessoa para reenviar o convite, ou em Enviar e-mail de acesso. Confira o e-mail digitado e a caixa de spam. Também dá para avisar pelo WhatsApp.', 'grupo'],
  ['Cadastrar o grupo e as pessoas', 'Em Cadastros, abra Meu grupo para trocar o nome ou a foto. Em Pessoas, toque em + Pessoa e informe o nome, o e-mail dela, o parentesco (opcional) e o papel. O convite chega por e-mail, e você também pode avisar pelo WhatsApp. Ao entrar, ela já cai no grupo certo.', 'grupo'],
  ['Criar uma tarefa', 'No Painel ou na Agenda, toque em + Tarefa. Escolha a pessoa (ou você mesmo), o nome, a categoria, os dias e o horário (o horário é opcional). Salve.', 'tarefa'],
  ['As cinco chaves de cada tarefa', 'Tem horário definido: a tarefa passa a ter hora de início (e fim, se quiser). Pode adiar: a pessoa pode pedir para adiar. Exige foto: ela só conclui com uma foto do dia. Exige justificativa: se ficar para outro dia, ela precisa explicar antes de concluir. Prioritária: ganha a bandeirinha e vem primeiro na lista. Todas começam desligadas. Ligue só nas tarefas que precisam.', 'tarefa'],
  ['Papéis e parentesco', 'O papel decide o que a pessoa pode fazer: Pai e Mãe (responsáveis, acesso total), Adulto que ajuda (cuida das próprias tarefas e só acompanha o que você liberar) e Filho(a) (faz as próprias tarefas e o próprio tempo de tela). O parentesco (Avó, Tia, Cuidador, Enteado…) é só um rótulo no perfil e não muda permissões.', 'grupo'],
  ['Modo criança e jeito de ver', 'No cadastro da pessoa, ative o Modo criança (bom até uns 10 anos): estrelinhas, festa e cofrinho de estrelinhas. Quem está no modo criança escolhe em Meu perfil o jeito de ver: Divertido, Calmo ou Como os adultos. O jeito muda só a aparência; o cofrinho segue o modo criança que você escolheu.', 'crianca'],
  ['Desafios (beta)', 'Em Desafios, toque em + Desafio, escolha para quem (uma ou mais pessoas, ou a Família toda) e um desafio sugerido. O app propõe meta e prêmio. Cada pessoa pode ter até 2 desafios. Renova toda segunda, com dia coringa. Criança junta estrelinhas, adolescente junta semanas conquistadas e adultos acompanham o percentual. Se aparecer Ligar os desafios, quem ativa é o administrador geral. O botão Como funciona explica tudo na própria tela.', 'desafios'],
  ['Vitrine de prêmios e cofrinho', 'Em Desafios › Vitrine, escolha a aba Criança (estrelinhas) ou Adolescente (semanas), tire ou acrescente prêmios do banco ou crie o seu. Para ver o cofrinho de alguém, toque nas estrelinhas ao lado do nome dela. Quando ela troca por um prêmio, ele aparece em Prêmio para entregar: toque em Marcar como entregue.', 'premios'],
  ['Desejos dos filhos', 'Quando alguém sugere um desejo, ele aparece em Desejos para aprovar, na tela Desafios. Toque em Aprovar (dá para ajustar nome e preço) ou em Agora não, com uma mensagem carinhosa.', 'premios'],
  ['Mural, ajustes e privacidade', 'Em Desafios › Mural estão os desafios cumpridos, os prêmios entregues e as medalhas. Em Ajustes, escolha: A família toda vê ou Só os pais e a própria pessoa (isso também esconde dos irmãos os desafios e pedidos). Os desejos e pedidos em aberto são só da própria pessoa e dos responsáveis. Só os responsáveis montam a vitrine; só o administrador geral ativa ou desativa os desafios.', 'mural'],
  ['Guia da Mel (beta)', 'A Mel mostra dicas curtas, uma por vez (no máximo uma nova por dia). Para os responsáveis, começa pela entrada: primeira pessoa, grupo e primeira tarefa. Ela só aparece se o administrador geral ativar a caixinha Guia da Mel em Cadastros. Em Ajuda › Guia da Mel você recomeça o guia.', 'mel'],
  ['Manuais de cada perfil', 'Cada perfil tem o seu manual: este para Pai e Mãe, um para adolescentes e um para crianças, com linguagem simples. Abra os outros em Manual do adolescente e Manual da criança, aqui no alto, para ver o que cada um vê.', 'ajuda'],
  ['Ver ou editar uma tarefa', 'Na Agenda ou no Hoje, toque na tarefa para ver os detalhes, com a foto quando houver. Para mudar regras, horário ou dias, toque em Editar, dentro dos detalhes.', 'tarefa'],
  ['Conferir o que as pessoas fizeram', 'Tarefas concluídas aparecem com Conferido e Refazer. Conferido confirma. Refazer devolve a tarefa à pessoa. Depois de tocar, dá para desfazer por 5 segundos.', 'responder'],
  ['Pedidos de adiamento e justificativas', 'Aparecem no Painel e no sino. Toque em Aprovar ou Agora não, ali mesmo no aviso ou no Painel. Depois de tocar, dá para desfazer por 5 segundos. Você escolhe em Meu perfil quais avisos quer receber.', 'responder'],
  ['Tempo de tela', 'Na aba Tela, em “Quem lança tempo de tela”, ative para cada pessoa (e para você). Depois defina o previsto: tempo do celular e do computador e os dias. A pessoa lança o tempo de ontem na tarefa de Hoje e você acompanha a diferença.', 'tela'],
  ['Ideias (a lâmpada)', 'A lâmpada no topo abre ideias de conduta: como começar o combinado, o que fazer quando o filho resiste ou esquece, adolescentes e o que evitar. A aba Filhos mostra o que eles leem. De vez em quando, no Painel, aparece uma faixa com a ideia certa para o momento, no máximo uma por dia. Em Meu perfil você desliga essas dicas.', 'ideias'],
  ['Relatórios', 'Toque no período (Semana, Mês ou Outro) e na pessoa: muda na hora. Categoria e situação ficam em Mais filtros. Toque em cada parte para abrir. O botão Exportar PDF, no fim da tela, gera o relatório para guardar ou imprimir.', 'relatorios'],
  ['Categorias', 'Em Cadastros, Categorias, você cria, renomeia ou apaga categorias e muda a cor delas.', 'grupo'],
  ['Avisos neste aparelho', 'Em Meu perfil, no cartão Avisos, toque em Ativar avisos neste aparelho. Faça isso em cada aparelho que quiser. Em Escolher quais avisos, escolha o que avisar. Vale na hora.', 'seu-jeito'],
];

const ADMIN = [
  ['O que são os Grupos', 'Só o administrador geral vê Cadastros › Grupos. Lá ficam todas as famílias que usam o sistema.'],
  ['Criar uma família para outra pessoa', 'Em Cadastros › Grupos, toque em + Grupo. Informe o nome do grupo, o nome do responsável e o e-mail Google dele. Quando ele entrar com esse e-mail, a família já estará pronta.'],
  ['Desativar ou ativar uma família', 'Em Cadastros › Grupos, cada grupo tem o botão para desativar ou ativar. Desativar não apaga nada: os dados continuam guardados, só o acesso é bloqueado. Ativar devolve o acesso.'],
  ['Quando alguém novo entra sozinho', 'Quem entra com um e-mail que não está cadastrado cai em uma tela que permite criar a própria família. Ela aparece depois em Cadastros › Grupos.'],
];

// As 5 mais procuradas de cada público (Raio-X U69).
const TOP_PAIS = ['Criar uma tarefa', 'Pedidos de adiamento e justificativas', 'Desafios (beta)', 'Cadastrar o grupo e as pessoas', 'Papéis e parentesco'];
const TOP_FILHO = ['Como concluir uma tarefa', 'Como adiar uma tarefa', 'Tarefa atrasada e justificativa', 'Como escolher o meu desafio', 'Como sugerir um desejo'];
const TOP_CRIANCA = ['Como eu faço uma tarefa', 'Marquei sem querer', 'Esqueci ou não deu tempo', 'O que é o desafio da semana', 'O meu cofrinho', 'Como eu peço uma coisa que quero', 'Quem é a Mel', 'Preciso de ajuda'];
const WHATS = 'https://wa.me/55' + CONTATO.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Oi! Preciso de ajuda com o beelo.');

export default async function Ajuda() {
  const { gestor, superAdmin, eu, familia } = await exigirMembro();
  // @regra O livro do topo abre esta tela, e "Manual do app" leva ao manual do PERFIL de quem está logado:
  // responsáveis (e adulto que ajuda com painel) → /manual; criança (Divertido/Calmo) → /manual/crianca; demais → /manual/pessoa.
  const crianca = !gestor && visaoCrianca(eu);
  const manual = gestor || acesso(eu).painel ? '/manual' : crianca ? '/manual/crianca' : '/manual/pessoa';
  const rotuloManual = gestor ? 'Manual do app para Pai e Mãe' : crianca ? 'Manual do app para crianças' : 'Manual do app';
  const grupos = [
    ...(superAdmin ? [{ titulo: 'Administrador geral', itens: ADMIN, manual: '/manual' }] : []),
    ...(gestor ? [{ titulo: 'Para responsáveis', itens: PAIS, manual: '/manual' }] : []),
    gestor ? { titulo: 'O que o adolescente vê', itens: ADOLESCENTE, manual: '/manual/pessoa', principal: false } : { titulo: crianca ? 'Perguntas e respostas' : 'Como usar o app', itens: crianca ? CRIANCA : ADOLESCENTE, manual: crianca ? '/manual/crianca' : '/manual/pessoa' },
    ...(gestor ? [{ titulo: 'O que a criança vê', itens: CRIANCA, manual: '/manual/crianca', principal: false }] : []),
  ];
  const todas = grupos.flatMap((g) => g.itens);
  const top = (gestor ? TOP_PAIS : crianca ? TOP_CRIANCA : TOP_FILHO).map((t) => todas.find((x) => x[0] === t)).filter(Boolean);
  return (
    <main className="estreito">
      <VoltarHistorico href="/" titulo="Ajuda" />
      {/* U67: um lugar só para ajuda. O livro do topo também abre esta tela. */}
      <div className="card ajuda-atalhos">
        <a href={`${manual}?app=1`} className="linha-ir"><Icone nome="livro" tam={20} /><span>{rotuloManual}</span><Icone nome="dir" tam={20} /></a>
        {gestor && <a href="/manual/pessoa?app=1" className="linha-ir"><Icone nome="livro" tam={20} /><span>Manual do adolescente<small>O que ele vê no app</small></span><Icone nome="dir" tam={20} /></a>}
        {gestor && <a href="/manual/crianca?app=1" className="linha-ir"><Icone nome="livro" tam={20} /><span>Manual da criança<small>Linguagem simples, com estrelinhas</small></span><Icone nome="dir" tam={20} /></a>}
        <a href={WHATS} target="_blank" rel="noopener noreferrer" className="linha-ir"><Icone nome="fala" tam={20} /><span>Falar com a gente<small>WhatsApp {CONTATO.whatsapp}</small></span><Icone nome="dir" tam={20} /></a>
        <Link prefetch={false} href="/seguranca" className="linha-ir"><Icone nome="escudo" tam={20} /><span>Segurança e privacidade</span><Icone nome="dir" tam={20} /></Link>
      </div>
      {familia.guia_mel === true && publicoDe(eu, gestor) && <GuiaAjuda membro={eu.id} gestor={gestor} />}
      <AjudaBusca top={top} grupos={grupos} crianca={crianca} />
    </main>
  );
}
