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

export default async function AppLayout({ children }) {
  const { supabase, eu, naoLidas, gestor, superAdmin, familia } = await exigirMembro();
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const itens = gestor
    ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       { href: '/relatorios', txt: 'Relatórios', icone: 'grafico' }, { href: '/tela', txt: 'Tela', icone: 'tela' }, { href: '/config', txt: 'Cadastros', icone: 'config' }]
    : [{ href: '/hoje', txt: 'Hoje', icone: 'hoje' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       ...(eu.tela_ativo ? [{ href: '/tela', txt: 'Tela', icone: 'tela' }] : []), { href: '/relatorios', txt: 'Evolução', icone: 'grafico' }];
  return (
    <>
      <Suspense fallback={null}><Progresso /></Suspense>
      <LembrarInicio caminho={gestor ? '/painel' : '/hoje'} quem={eu.id} gerado={Date.now()} />
      <header className="topo">
        <div className="topo-in">
          <Link className="marca" href="/"><span className="logo"><Icone nome="check" tam={20} cor="#fff" /></span>Rotina Ativa</Link>
          <Menu itens={itens} />
          <Link className="icone-btn sino" href="/notificacoes" aria-label={`Notificações, ${naoLidas} novas`}>
            <Icone nome="sino" cor="#fff" />{naoLidas > 0 && <span className="selo">{naoLidas > 99 ? '99+' : naoLidas}</span>}
          </Link>
          <MenuUsuario nome={eu.nome} familia={familia.nome}>
            <Avatar nome={eu.nome} cor={eu.cor} url={urls[eu.avatar]} avatar={eu.avatar} tam={28} />
          </MenuUsuario>
        </div>
      </header>
      <Selo n={naoLidas} />
      {children}
      <Menu itens={itens} baixo />
    </>
  );
}
