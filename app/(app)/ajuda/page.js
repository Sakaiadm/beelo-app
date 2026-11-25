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

const FILHO = [
  ['Como ver o que tenho para fazer', 'Toque em Hoje. As tarefas aparecem em três grupos: Ficou de outro dia, A qualquer hora e Com hora marcada. Em Agenda você vê a semana e o mês. Toque na tarefa para abrir os detalhes dela.'],
  ['Como concluir uma tarefa', 'Toque no círculo ao lado da tarefa. Se a tarefa pede foto, o app abre a câmera ou a galeria. Escolha uma foto tirada hoje. A foto vale até as 7 da manhã do dia seguinte. Depois de enviar, a tarefa fica com o check verde.'],
  ['Por que o app não aceita minha foto', 'A foto precisa ser do dia da tarefa. Se for de outro dia, o app avisa. Tire a foto de novo e envie.'],
  ['Como adiar uma tarefa', 'Toque na tarefa para abrir os detalhes e depois em Adiar. Escolha Amanhã, Depois de amanhã ou Outro dia, e o motivo. Seus responsáveis recebem o pedido e respondem. Se não aparece o botão Adiar, essa tarefa não pode ser adiada.'],
  ['Tarefa atrasada e justificativa', 'Se a tarefa passou do horário, você pode tocar em Justificar e contar o motivo. Em algumas tarefas, se ela ficou para outro dia, a justificativa é obrigatória antes de concluir. Isso depende do que seus responsáveis definiram.'],
  ['Tempo de tela', 'Se estiver ativado para você, a aba Tela mostra o tempo previsto e o realizado. Toque na tarefa “Lançar tempo de tela” e coloque o tempo de ontem (celular e computador). Se quiser, envie a foto do relatório do aparelho. Precisa de mais tempo num dia? Peça na aba Tela, e seus responsáveis decidem.'],
  ['Ideias (a lâmpada)', 'A lâmpada no topo abre as Ideias: dicas curtas para você crescer com a sua rotina. De vez em quando aparece uma faixa com uma ideia em Hoje. Toque no X para fechar ou em Ver ideia para ler. Em Meu perfil você desliga essas dicas.'],
  ['Evolução', 'Mostra como você está indo nesta semana ou neste mês: quantas tarefas fez, quantas no dia certo e o seu melhor dia. No modo criança aparecem as estrelas de cada dia.'],
  ['Meu perfil, foto e avatar', 'Toque no seu nome ou foto no topo. Lá você escolhe uma foto sua ou um avatar e a sua cor. Vale na hora, sem botão Salvar. Também ativa os avisos no celular.'],
  ['Avisos neste aparelho', 'Em Meu perfil, no cartão Avisos, toque em Ativar avisos neste aparelho e permita. Use Enviar um teste para conferir. O sininho no topo guarda a lista de avisos. Tocar em um aviso o marca como lido.'],
];

const PAIS = [
  ['Visão geral', 'Painel mostra o dia de cada pessoa e o que precisa da sua atenção: tarefas atrasadas, pedidos de adiamento, justificativas e tempo de tela. Agenda mostra as tarefas por dia, semana e mês, Relatórios mostra o cumprimento, Tela cuida do tempo de tela e Cadastros guarda o grupo, as pessoas e as categorias.'],
  ['Cadastrar o grupo e as pessoas', 'Em Cadastros, abra Meu grupo para trocar o nome ou a foto. Em Pessoas, toque em Nova pessoa e informe o nome, quem é e o e-mail dela. O convite chega por e-mail, e você também pode avisar pelo WhatsApp. Ao entrar, ela já cai no grupo certo.'],
  ['Criar uma tarefa', 'No Painel ou na Agenda, toque em + Tarefa. Escolha a pessoa (ou você mesmo), o nome, a categoria, os dias e o horário (o horário é opcional). Salve.'],
  ['As cinco chaves de cada tarefa', 'Tem horário definido: a tarefa passa a ter hora de início (e fim, se quiser). Pode adiar: a pessoa pode pedir para adiar. Exige foto: ela só conclui com uma foto do dia. Exige justificativa: se ficar para outro dia, ela precisa explicar antes de concluir. Prioritária: ganha a bandeirinha e vem primeiro na lista. Todas começam desligadas. Ligue só nas tarefas que precisam.'],
  ['Ver ou editar uma tarefa', 'Na Agenda ou no Hoje, toque na tarefa para ver os detalhes, com a foto quando houver. Para mudar regras, horário ou dias, toque em Editar, dentro dos detalhes.'],
  ['Conferir o que as pessoas fizeram', 'Tarefas concluídas aparecem com Conferido e Refazer. Conferido confirma. Refazer devolve a tarefa à pessoa. Depois de tocar, dá para desfazer por 5 segundos.'],
  ['Pedidos de adiamento e justificativas', 'Aparecem no Painel e no sino. Toque em Aprovar ou Agora não, ali mesmo no aviso ou no Painel. Depois de tocar, dá para desfazer por 5 segundos. Você escolhe em Meu perfil quais avisos quer receber.'],
  ['Tempo de tela', 'Na aba Tela, em “Quem lança tempo de tela”, ligue para cada pessoa (e para você). Depois defina o previsto: tempo do celular e do computador e os dias. A pessoa lança o tempo de ontem na tarefa de Hoje e você acompanha a diferença.'],
  ['Ideias (a lâmpada)', 'A lâmpada no topo abre ideias de conduta: como começar o combinado, o que fazer quando o filho resiste ou esquece, adolescentes e o que evitar. A aba Filhos mostra o que eles leem. De vez em quando, no Painel, aparece uma faixa com a ideia certa para o momento, no máximo uma por dia. Em Meu perfil você desliga essas dicas.'],
  ['Relatórios', 'Toque no período (Semana, Mês ou Outro) e na pessoa: muda na hora. Categoria e situação ficam em Mais filtros. Toque em cada parte para abrir. O botão Exportar PDF, no fim da tela, gera o relatório para guardar ou imprimir.'],
  ['Categorias', 'Em Cadastros, Categorias, você cria, renomeia ou apaga categorias e muda a cor delas.'],
  ['Avisos neste aparelho', 'Em Meu perfil, no cartão Avisos, toque em Ativar avisos neste aparelho. Faça isso em cada aparelho que quiser. Em Escolher quais avisos, escolha o que avisar. Vale na hora.'],
];

const ADMIN = [
  ['O que são os Grupos', 'Só o administrador geral vê Cadastros › Grupos. Lá ficam todas as famílias que usam o sistema.'],
  ['Criar uma família para outra pessoa', 'Em Cadastros › Grupos, toque em + Grupo. Informe o nome do grupo, o nome do responsável e o e-mail Google dele. Quando ele entrar com esse e-mail, a família já estará pronta.'],
  ['Desativar ou ativar uma família', 'Em Cadastros › Grupos, cada grupo tem o botão para desativar ou ativar. Desativar não apaga nada: os dados continuam guardados, só o acesso é bloqueado. Ativar devolve o acesso.'],
  ['Quando alguém novo entra sozinho', 'Quem entra com um e-mail que não está cadastrado cai em uma tela que permite criar a própria família. Ela aparece depois em Cadastros › Grupos.'],
];

// As 5 mais procuradas de cada público (Raio-X U69).
const TOP_PAIS = ['Criar uma tarefa', 'Pedidos de adiamento e justificativas', 'Conferir o que as pessoas fizeram', 'Cadastrar o grupo e as pessoas', 'Avisos neste aparelho'];
const TOP_FILHO = ['Como concluir uma tarefa', 'Como adiar uma tarefa', 'Tarefa atrasada e justificativa', 'Por que o app não aceita minha foto', 'Avisos neste aparelho'];
const WHATS = 'https://wa.me/55' + CONTATO.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent('Oi! Preciso de ajuda com o beelo.');

export default async function Ajuda() {
  const { gestor, superAdmin, eu, familia } = await exigirMembro();
  const manual = gestor || acesso(eu).painel ? '/manual' : visaoCrianca(eu) ? '/manual/crianca' : '/manual/pessoa';
  const grupos = [
    ...(superAdmin ? [{ titulo: 'Administrador geral', itens: ADMIN }] : []),
    ...(gestor ? [{ titulo: 'Para responsáveis', itens: PAIS }] : []),
    { titulo: gestor ? 'O que as pessoas veem' : 'Como usar o app', itens: FILHO },
  ];
  const todas = grupos.flatMap((g) => g.itens);
  const top = (gestor ? TOP_PAIS : TOP_FILHO).map((t) => todas.find((x) => x[0] === t)).filter(Boolean);
  return (
    <main className="estreito">
      <VoltarHistorico href="/" titulo="Ajuda" />
      {/* U67: um lugar só para ajuda. O livro do topo também abre esta tela. */}
      <div className="card ajuda-atalhos">
        <a href={`${manual}?app=1`} className="linha-ir"><Icone nome="livro" tam={20} /><span>Manual do app</span><Icone nome="dir" tam={20} /></a>
        <a href={WHATS} target="_blank" rel="noopener noreferrer" className="linha-ir"><Icone nome="fala" tam={20} /><span>Falar com a gente<small>WhatsApp {CONTATO.whatsapp}</small></span><Icone nome="dir" tam={20} /></a>
        <Link prefetch={false} href="/seguranca" className="linha-ir"><Icone nome="escudo" tam={20} /><span>Segurança e privacidade</span><Icone nome="dir" tam={20} /></Link>
      </div>
      {familia.guia_mel === true && publicoDe(eu, gestor) && <GuiaAjuda membro={eu.id} gestor={gestor} />}
      <AjudaBusca top={top} grupos={grupos} />
    </main>
  );
}
