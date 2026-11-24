import { exigirMembro } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

const FILHO = [
  ['Como ver o que tenho para fazer', 'Toque em Hoje. As tarefas aparecem em ordem de horário. Em Agenda você vê os outros dias (Dia, Semana e Mês). Toque na setinha ao lado da tarefa para abrir os detalhes dela.'],
  ['Como concluir uma tarefa', 'Toque no círculo ao lado da tarefa. Se a tarefa pede foto, o app abre a câmera ou a galeria. Escolha uma foto tirada hoje. A foto vale até as 7 da manhã do dia seguinte. Depois de enviar, a tarefa fica com o check verde.'],
  ['Por que o app não aceita minha foto', 'A foto precisa ser do dia da tarefa. Se for de outro dia, o app avisa. Tire a foto de novo e envie.'],
  ['Como adiar uma tarefa', 'Se a tarefa tem o botão Adiar, toque nele, escolha a nova data e, se quiser, um novo horário. Seus responsáveis recebem o pedido e aceitam ou não. Se não aparece o botão Adiar, essa tarefa não pode ser adiada.'],
  ['Tarefa atrasada e justificativa', 'Se a tarefa passou do horário, você pode tocar em Justificar e contar o motivo. Em algumas tarefas, se ela ficou para outro dia, a justificativa é obrigatória antes de concluir. Isso depende do que seus responsáveis definiram.'],
  ['Tempo de tela', 'Se estiver ativado para você, a aba Tela mostra o tempo previsto e o realizado. Toque na tarefa “Lançar tempo de tela” e coloque o tempo de ontem (celular e computador). Se quiser, envie a foto do relatório do aparelho. Precisa de mais tempo num dia? Peça na aba Tela, e seus responsáveis decidem.'],
  ['Ideias (a lâmpada)', 'A lâmpada no topo abre as Ideias: dicas curtas para você crescer com a sua rotina. De vez em quando aparece uma faixa com uma ideia em Hoje. Toque no X para fechar ou em Ver ideia para ler. Em Meu perfil você desliga essas dicas.'],
  ['Evolução', 'Mostra como você está indo: tarefas cumpridas, atrasos e a evolução por semana.'],
  ['Meu perfil, foto e avatar', 'Toque no seu nome ou foto no topo. Lá você escolhe uma foto sua ou um avatar e toca em Salvar. Também ativa os avisos no celular.'],
  ['Avisos neste aparelho', 'Em Meu perfil, no cartão Avisos neste aparelho, toque em Ativar avisos neste aparelho e permita. Use Enviar um teste para conferir. O sininho no topo guarda a lista de avisos. Tocar em um aviso o marca como lido.'],
];

const PAIS = [
  ['Visão geral', 'Painel mostra o dia de cada pessoa e o que precisa da sua atenção: tarefas atrasadas, pedidos de adiamento, justificativas e tempo de tela. Agenda mostra as tarefas por dia, semana e mês, Relatórios mostra o cumprimento, Tela cuida do tempo de tela e Cadastros guarda o grupo, as pessoas e as categorias.'],
  ['Cadastrar o grupo e as pessoas', 'Em Cadastros, abra Meu grupo para trocar o nome ou a foto. Em Pessoas, adicione cada pessoa com o nome e o e-mail dela. O convite chega por e-mail e, ao entrar, ela já cai no grupo certo.'],
  ['Criar uma tarefa', 'No Painel ou na Agenda, toque em Nova tarefa. Escolha a pessoa (ou você mesmo), o nome, a categoria, os dias e o horário (o horário é opcional). Salve.'],
  ['As cinco chaves de cada tarefa', 'Tem horário definido: a tarefa passa a ter hora de início (e fim, se quiser). Pode adiar: a pessoa pode pedir para adiar. Exige foto: ela só conclui com uma foto do dia. Exige justificativa: se ficar para outro dia, ela precisa explicar antes de concluir. Prioritária: ganha a bandeirinha e vem primeiro na lista. Todas começam desligadas. Ligue só nas tarefas que precisam.'],
  ['Ver ou editar uma tarefa', 'Na Agenda ou no Hoje, toque na setinha ao lado da tarefa para ver o quadrinho dela, com a foto quando houver. Para mudar regras, horário ou dias, toque em Editar.'],
  ['Conferir o que as pessoas fizeram', 'Tarefas concluídas aparecem com Conferido e Pedir para refazer. Conferido confirma. Pedir para refazer devolve a tarefa à pessoa.'],
  ['Pedidos de adiamento e justificativas', 'Aparecem no Painel e no sino. Toque em Aceitar ou Não aceitar. Você escolhe em Meu perfil quais avisos quer receber.'],
  ['Tempo de tela', 'Na aba Tela, em “Quem lança tempo de tela”, ligue para cada pessoa (e para você). Depois defina o previsto: tempo do celular e do computador e os dias. A pessoa lança o tempo de ontem na tarefa de Hoje e você acompanha a diferença.'],
  ['Ideias (a lâmpada)', 'A lâmpada no topo abre ideias de conduta: como começar o combinado, o que fazer quando o filho resiste ou esquece, adolescentes e o que evitar. A aba Filhos mostra o que eles leem. De vez em quando, no Painel, aparece uma faixa com a ideia certa para o momento, no máximo uma por dia. Em Meu perfil você desliga essas dicas.'],
  ['Relatórios', 'Escolha o período e as pessoas e filtre. Veja cumprimento, atrasos, adiamentos e justificativas. O botão de PDF gera o relatório para guardar ou imprimir.'],
  ['Categorias', 'Em Cadastros, Categorias, você cria, renomeia ou apaga categorias e muda a cor delas.'],
  ['Avisos neste aparelho', 'Em Meu perfil, no cartão Avisos neste aparelho, toque em Ativar avisos neste aparelho. Faça isso em cada aparelho que quiser. Em Avisos que eu quero receber, escolha o que avisar.'],
];

const ADMIN = [
  ['O que são os Grupos', 'Só o administrador geral vê Cadastros › Grupos. Lá ficam todas as famílias que usam o sistema.'],
  ['Criar uma família para outra pessoa', 'Em Cadastros › Grupos, toque em Novo grupo. Informe o nome do grupo, o nome do responsável e o e-mail Google dele. Quando ele entrar com esse e-mail, a família já estará pronta.'],
  ['Desativar ou ativar uma família', 'Em Cadastros › Grupos, cada grupo tem o botão para desativar ou ativar. Desativar não apaga nada: os dados continuam guardados, só o acesso é bloqueado. Ativar devolve o acesso.'],
  ['Quando alguém novo entra sozinho', 'Quem entra com um e-mail que não está cadastrado cai em uma tela que permite criar a própria família. Ela aparece depois em Cadastros › Grupos.'],
];

function Secao({ titulo, itens, abrirPrimeira }) {
  return (
    <section>
      <div className="ajuda-sec">{titulo}</div>
      {itens.map(([t, d], i) => (
        <details key={t} className="ajuda-item" open={abrirPrimeira && i === 0}>
          <summary>{t}</summary>
          <p>{d}</p>
        </details>
      ))}
    </section>
  );
}

export default async function Ajuda() {
  const { gestor, superAdmin } = await exigirMembro();
  return (
    <main className="estreito">
      <div className="cab"><div><h1 className="titulo">Ajuda</h1><p className="sub">Toque em uma pergunta para ver a resposta</p></div></div>
      <div className="card">
        {superAdmin && <Secao titulo="Administrador geral" itens={ADMIN} />}
        {gestor && <Secao titulo="Para responsáveis" itens={PAIS} abrirPrimeira={!superAdmin} />}
        <Secao titulo={gestor ? 'O que as pessoas veem' : 'Como usar o app'} itens={FILHO} abrirPrimeira={!gestor} />
      </div>
    </main>
  );
}
