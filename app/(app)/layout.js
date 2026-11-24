import ChaveLinha from '@/components/ChaveLinha';
import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
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

export default async function AppLayout({ children }) {
  const { supabase, eu, naoLidas, gestor, superAdmin, familia, membros } = await exigirMembro();
  // Termos e Privacidade ainda não aceitos nesta versão (ou criança do grupo sem autorização do responsável).
  if (pendencias(eu, membros, gestor).algum) redirect('/aceite');
  // Pai e Mãe: sempre (é lá que ligam para cada pessoa). Os outros: só com o tempo de tela ligado.
  const telaLigada = gestor || !!eu.tela_ativo;
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const a = acesso(eu);
  const itens = gestor
    ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       { href: '/relatorios', txt: 'Relatórios', icone: 'grafico' }, ...(telaLigada ? [{ href: '/tela', txt: 'Tela', icone: 'tela' }] : []), { href: '/config', txt: 'Cadastros', icone: 'config' }]
    : [...(a.painel ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }] : []), { href: '/hoje', txt: 'Hoje', icone: 'hoje' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' },
       ...(telaLigada ? [{ href: '/tela', txt: 'Tela', icone: 'tela' }] : []), { href: '/relatorios', txt: a.relatorios ? 'Relatórios' : 'Evolução', icone: 'grafico' }];
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
      <ChaveLinha />
    </>
  );
}
