import { exigirMembro } from '@/lib/sessao';
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

export default async function AppLayout({ children }) {
  const { supabase, eu, naoLidas, gestor, superAdmin, familia } = await exigirMembro();
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const itens = gestor
    ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       { href: '/relatorios', txt: 'Relatórios', icone: 'grafico' }, { href: '/tela', txt: 'Tela', icone: 'tela' }, { href: '/config', txt: 'Cadastros', icone: 'config' }]
    : [{ href: '/hoje', txt: 'Hoje', icone: 'hoje' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       ...(eu.tela_ativo ? [{ href: '/tela', txt: 'Tela', icone: 'tela' }] : []), { href: '/relatorios', txt: 'Evolução', icone: 'grafico' }];
  // Ícone do manual: cada perfil abre o seu (Pai, Mãe e Supervisor, o completo).
  const manual = gestor || eu.funcao === 'supervisor' ? '/manual' : eu.modo_crianca ? '/manual/crianca' : '/manual/pessoa';
  return (
    <>
      <Suspense fallback={null}><Progresso /></Suspense>
      <LembrarInicio caminho={gestor ? '/painel' : '/hoje'} quem={eu.id} gerado={Date.now()} />
      <header className="topo">
        <div className="topo-in">
          <Link className="marca" href="/"><span className="logo"><Icone nome="check" tam={20} cor="#fff" /></span>Rotina Ativa</Link>
          <Menu itens={itens} />
          <LampadaBtn membro={eu.id} hoje={hojeISO()} />
          <a className="icone-btn manual" href={`${manual}?app=1`} aria-label="Manual do app" title="Manual do app">
            <Icone nome="livro" cor="#fff" />
          </a>
          <Link className="icone-btn sino" href="/notificacoes" aria-label={`Notificações, ${naoLidas} novas`}>
            <Icone nome="sino" cor="#fff" />{naoLidas > 0 && <span className="selo">{naoLidas > 99 ? '99+' : naoLidas}</span>}
          </Link>
          <MenuUsuario nome={eu.nome} familia={familia.nome}>
            <Avatar nome={eu.nome} cor={eu.cor} url={urls[eu.avatar]} avatar={eu.avatar} tam={28} />
          </MenuUsuario>
        </div>
      </header>
      <Selo n={naoLidas} />
      <Conexao />
      {children}
      <Festa crianca={!gestor && !!eu.modo_crianca} nome={(eu.nome || '').split(' ')[0]} />
      <Menu itens={itens} baixo />
    </>
  );
}
