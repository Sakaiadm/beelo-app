import { exigirMembro } from '@/lib/sessao';

export const dynamic = 'force-dynamic';

const FILHO = [
  ['Como ver o que tenho para fazer', 'Toque em Hoje. As tarefas aparecem em ordem de horário. Em Agenda você vê outros dias e em Minhas vê a lista de todas as suas tarefas. Tocar em uma tarefa abre os detalhes dela.'],
  ['Como concluir uma tarefa', 'Toque no círculo ao lado da tarefa. Se a tarefa pede foto, o app abre a câmera ou a galeria. Escolha uma foto tirada hoje. A foto vale até as 7 da manhã do dia seguinte. Depois de enviar, a tarefa fica com o check verde.'],
  ['Por que o app não aceita minha foto', 'A foto precisa ser do dia da tarefa. Se for de outro dia, o app avisa. Tire a foto de novo e envie.'],
  ['Como adiar uma tarefa', 'Se a tarefa tem o botão Adiar, toque nele, escolha a nova data e, se quiser, um novo horário. Seus pais recebem o pedido e aceitam ou não. Se não aparece o botão Adiar, essa tarefa não pode ser adiada.'],
  ['Tarefa atrasada e justificativa', 'Se a tarefa passou do horário, você pode tocar em Justificar e contar o motivo. Em algumas tarefas a justificativa é obrigatória antes de concluir. Isso depende do que seus pais definiram.'],
  ['Tempo de tela', 'Se estiver ativado para você, a aba Tela mostra o tempo previsto e o realizado. Lance o tempo de ontem (celular e computador) e, se quiser, envie a foto do relatório do aparelho. Você também pode propor um tempo diferente, e seus pais decidem.'],
  ['Evolução', 'Mostra como você está indo: tarefas cumpridas, atrasos e a evolução por semana.'],
  ['Meu perfil, foto e avatar', 'Toque no seu nome ou foto no topo. Lá você escolhe uma foto sua ou um avatar e toca em Salvar. Também ativa os avisos no celular.'],
  ['Avisos no celular', 'Em Meu perfil, no cartão Avisos no celular, toque em Ativar avisos neste aparelho e permita. Use Enviar um teste para conferir. O sininho no topo guarda a lista de avisos. Tocar em um aviso o marca como lido.'],
];

const PAIS = [
  ['Visão geral', 'Painel mostra o dia de cada filho e o que precisa da sua atenção: tarefas atrasadas, pedidos de adiamento, justificativas e tempo de tela. Agenda mostra os dias, Tarefas é a lista de todas, Relatórios mostra o cumprimento, Tela cuida do tempo de tela e Cadastros guarda família, pessoas e categorias.'],
  ['Cadastrar a família e os filhos', 'Em Cadastros, abra Família para trocar o nome ou o avatar da família. Em Pessoas, adicione cada filho com o nome e o e-mail Google dele. Quando ele entrar com esse e-mail, já cai na família certa.'],
  ['Criar uma tarefa', 'Em Tarefas, toque em Nova tarefa. Escolha o filho, o nome, a categoria, os dias e o horário (o horário é opcional). Salve.'],
  ['As três chaves de cada tarefa', 'Pode adiar: o filho pode pedir para adiar. Exige foto: ele só conclui com uma foto do dia. Exige justificativa: se atrasar, ele precisa explicar antes de concluir. Todas começam desligadas. Ligue só nas tarefas que precisam.'],
  ['Ver ou editar uma tarefa', 'Em Tarefas, toque na tarefa para ver o quadrinho dela, com a foto quando houver. Para mudar regras, horário ou dias, toque no lápis.'],
  ['Conferir o que os filhos fizeram', 'Tarefas concluídas aparecem com Conferido e Pedir para refazer. Conferido confirma. Pedir para refazer devolve a tarefa ao filho.'],
  ['Pedidos de adiamento e justificativas', 'Aparecem no Painel e no sino. Toque em Aceitar ou Não aceitar. Você escolhe em Meu perfil quais avisos quer receber.'],
  ['Tempo de tela', 'Na aba Tela, defina o tempo previsto por filho (celular, computador ou total), por dia, dias da semana ou semana. Os filhos lançam o realizado e você acompanha a diferença. Nas Pessoas, ative ou desative o tempo de tela de cada filho.'],
  ['Relatórios', 'Escolha o período e os filhos e filtre. Veja cumprimento, atrasos, adiamentos e justificativas. O botão de PDF gera o relatório para guardar ou imprimir.'],
  ['Categorias', 'Em Cadastros, Categorias, você cria, renomeia ou apaga categorias e muda a cor delas.'],
  ['Avisos no celular', 'Em Meu perfil, Avisos no celular, toque em Ativar avisos neste aparelho. Faça isso em cada aparelho que quiser. Em Avisos que eu quero receber, escolha o que avisar.'],
];

const ADMIN = [
  ['O que é o Admin', 'Só o administrador geral vê a aba Admin. Ela lista todas as famílias que usam o sistema.'],
  ['Criar uma família para outra pessoa', 'Em Admin, use Criar família para outra pessoa. Informe o nome da família, o nome do responsável e o e-mail Google dele. Quando ele entrar com esse e-mail, a família já estará pronta.'],
  ['Desativar ou ativar uma família', 'Em Admin, cada família tem o botão para desativar ou ativar. Desativar não apaga nada: os dados continuam guardados, só o acesso é bloqueado. Ativar devolve o acesso.'],
  ['Quando alguém novo entra sozinho', 'Quem entra com um e-mail que não está cadastrado cai em uma tela que permite criar a própria família. Ela aparece depois em Admin.'],
];

function Secao({ titulo, itens, aberta }) {
  return (
    <details className="card" open={aberta}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>{titulo}</summary>
      <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
        {itens.map(([t, d]) => (
          <div key={t}><h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{t}</h3><p style={{ margin: 0, lineHeight: 1.5 }}>{d}</p></div>
        ))}
      </div>
    </details>
  );
}

export default async function Ajuda() {
  const { gestor, superAdmin } = await exigirMembro();
  return (
    <main className="estreito">
      <div className="cab"><div><h1 className="titulo">Ajuda</h1><p className="sub">Como usar o Rotina Ativa. Toque em um título para abrir.</p></div></div>
      {gestor ? <>
        <Secao titulo="Para pai e mãe" itens={PAIS} aberta />
        <Secao titulo="Para os filhos (o que eles veem)" itens={FILHO} />
        {superAdmin && <Secao titulo="Administrador geral" itens={ADMIN} />}
      </> : <>
        <Secao titulo="Para os filhos" itens={FILHO} aberta />
      </>}
    </main>
  );
}
