import { exigirMembro } from '@/lib/sessao';
import Icone from '@/components/Icone';
import Tema from '@/components/Tema';
import Menu from '@/components/Menu';
import Avatar from '@/components/Avatar';
import { urlsAvatares } from '@/lib/avatar';

export default async function AppLayout({ children }) {
  const { supabase, eu, naoLidas, gestor, superAdmin } = await exigirMembro();
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const itens = gestor
    ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' }, { href: '/tarefas', txt: 'Tarefas', icone: 'lista' },
       { href: '/relatorios', txt: 'Relatórios', icone: 'grafico' }, { href: '/tela', txt: 'Tela', icone: 'tela' }, { href: '/config', txt: 'Cadastros', icone: 'config' },
       ...(superAdmin ? [{ href: '/admin', txt: 'Admin', icone: 'painel' }] : [])]
    : [{ href: '/hoje', txt: 'Hoje', icone: 'hoje' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' }, { href: '/tarefas', txt: 'Minhas', icone: 'lista' },
       ...(eu.tela_ativo ? [{ href: '/tela', txt: 'Tela', icone: 'tela' }] : []), { href: '/relatorios', txt: 'Evolução', icone: 'grafico' }];
  return (
    <>
      <header className="topo">
        <div className="topo-in">
          <a className="marca" href="/"><span className="logo"><Icone nome="check" tam={20} cor="#fff" /></span>Rotina Ativa</a>
          <Menu itens={itens} />
          <div className="quem">
            <Tema />
            <a className="icone-btn" href="/notificacoes" aria-label={`Notificações, ${naoLidas} novas`}>
              <Icone nome="sino" cor="#fff" />{naoLidas > 0 && <span className="selo">{naoLidas > 99 ? '99+' : naoLidas}</span>}
            </a>
            <a href="/perfil" title="Meu perfil" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
              <Avatar nome={eu.nome} cor={eu.cor} url={urls[eu.avatar]} /><span className="nome">{eu.nome}</span>
            </a>
            <form action="/auth/sair" method="post"><button className="icone-btn" aria-label="Sair" title="Sair"><Icone nome="sair" cor="#fff" tam={20} /></button></form>
          </div>
        </div>
      </header>
      {children}
      <Menu itens={itens} baixo />
    </>
  );
}
