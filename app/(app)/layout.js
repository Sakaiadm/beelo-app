// @arquivo  layout.js: moldura de todas as telas com login: topo, menu de baixo, avisos, lâmpada de dicas e conexão.
// @tipo     tela
// @usa      components/ChaveLinha, lib/jeito, lib/sessao, lib/papeis, components/Icone, components/MenuUsuario, components/Menu, components/Avatar, components/Selo, lib/avatar, components/Progresso, components/LembrarInicio, components/Conexao, components/Festa, components/LampadaBtn, lib/util, lib/aceite
// @cuidado  toda tela passa por aqui: exigirMembro() (lib/sessao.js) decide quem entra e o que o menu mostra.
import ChaveLinha from '@/components/ChaveLinha';
import { visaoCrianca, jeitoDe } from '@/lib/jeito';
import { exigirMembro } from '@/lib/sessao';
import { acesso, nomeFuncao } from '@/lib/papeis';
import Link from 'next/link';
import Icone from '@/components/Icone';
import MenuUsuario from '@/components/MenuUsuario';
import Menu from '@/components/Menu';
import Avatar from '@/components/Avatar';
import Selo from '@/components/Selo';
import { urlsAvatares } from '@/lib/avatar';
import { Suspense } from 'react';
import Progresso from '@/components/Progresso';
import LembrarInicio from '@/components/LembrarInicio';
import Conexao from '@/components/Conexao';
import Festa from '@/components/Festa';
import LampadaBtn from '@/components/LampadaBtn';
import { hojeISO } from '@/lib/util';
import { redirect } from 'next/navigation';
import { pendencias } from '@/lib/aceite';
import GuiaMel from '@/components/GuiaMel';
import { publicoDe, jeitoGuia } from '@/lib/guia';

export default async function AppLayout({ children }) {
  const { supabase, eu, naoLidas, gestor, superAdmin, familia, membros } = await exigirMembro();
  // Termos e Privacidade ainda não aceitos nesta versão (ou criança do grupo sem autorização do responsável).
  if (pendencias(eu, membros, gestor).algum) redirect('/aceite');
  // Pai e Mãe: sempre (é lá que ligam para cada pessoa). Os outros: só com o tempo de tela ligado.
  const telaLigada = gestor || !!eu.tela_ativo;
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const a = acesso(eu);
  // Responsáveis: Painel, Agenda, Desafios, Tela, Relatórios (penúltimo) e Cadastros (sempre o último, à direita).
  // @decisao ordem pedida pelo Thomas em 26/11; os menus de quem não é responsável não mudam.
  const itens = gestor
    ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       { href: '/desafios', txt: 'Desafios', icone: 'trofeu' },
       ...(telaLigada ? [{ href: '/tela', txt: 'Tela', icone: 'tela' }] : []),
       { href: '/relatorios', txt: 'Relatórios', icone: 'grafico' },
       { href: '/config', txt: 'Cadastros', icone: 'config' }]
    : [...(a.painel ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }] : []), { href: '/hoje', txt: 'Hoje', icone: 'hoje' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       ...(telaLigada ? [{ href: '/tela', txt: 'Tela', icone: 'tela' }] : []), { href: '/relatorios', txt: a.relatorios ? 'Relatórios' : 'Evolução', icone: 'grafico' }];
  // Guia da Mel (beta, SQL 0024): só aparece com a chave do grupo ligada. Desligada, o app é o de sempre.
  // @banco ra_tarefas (só a contagem, só para o gestor e só com o guia ligado)
  const guiaPublico = familia.guia_mel === true ? publicoDe(eu, gestor) : null;
  let guiaTarefas = false;
  if (guiaPublico === 'gestor') {
    const { count } = await supabase.from('ra_tarefas').select('id', { count: 'exact', head: true }).is('especial', null);
    guiaTarefas = (count || 0) > 0;
  }
  const guiaPessoas = membros.some((m) => m.ativo && m.papel !== 'gestor');
  return (
    <>
      <Suspense fallback={null}><Progresso /></Suspense>
      <LembrarInicio caminho={a.painel ? '/painel' : '/hoje'} quem={eu.id} gerado={Date.now()} />
      <header className="topo">
        <div className="topo-in">
          <Link className="marca" href="/"><span className="logo-topo" role="img" aria-label="beelo" /></Link>
          <Menu itens={itens} />
          <LampadaBtn membro={eu.id} hoje={hojeISO()} />
          <Link className="icone-btn manual" href="/ajuda" prefetch={false} aria-label="Ajuda e manual" title="Ajuda e manual">
            <Icone nome="livro" cor="#fff" />
          </Link>
          <Link className="icone-btn sino" href="/notificacoes" aria-label={`Notificações, ${naoLidas} novas`}>
            <Icone nome="sino" cor="#fff" />{naoLidas > 0 && <span className="selo">{naoLidas > 99 ? '99+' : naoLidas}</span>}
          </Link>
          <MenuUsuario nome={eu.nome} familia={familia.nome} relato={{ familia: familia.id, membro: eu.id, papel: nomeFuncao(eu) }}>
            <Avatar nome={eu.nome} cor={eu.cor} url={urls[eu.avatar]} avatar={eu.avatar} tam={28} />
          </MenuUsuario>
        </div>
      </header>
      <Selo n={naoLidas} />
      <Conexao />
      {children}
      <Festa crianca={!gestor && visaoCrianca(eu)} calmo={!gestor && jeitoDe(eu) === 'calmo'} nome={(eu.nome || '').split(' ')[0]} />
      {guiaPublico && <GuiaMel membro={eu.id} publico={guiaPublico} jeito={jeitoGuia(eu)} familiaId={familia.id} pessoas={guiaPessoas} tarefas={guiaTarefas} />}
      <Menu itens={itens} baixo />
      <ChaveLinha />
    </>
  );
}
