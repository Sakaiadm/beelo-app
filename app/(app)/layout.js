import { exigirMembro } from '@/lib/sessao';
import Icone from '@/components/Icone';
import Tema from '@/components/Tema';
import Menu from '@/components/Menu';

export default async function AppLayout({ children }) {
  const { eu, naoLidas, gestor } = await exigirMembro();
  const itens = gestor
    ? [{ href: '/painel', txt: 'Painel', icone: 'painel' }, { href: '/agenda', txt: 'Agenda', icone: 'agenda' }, { href: '/tarefas', txt: 'Tarefas', icone: 'lista' },
       { href: '/relatorios', txt: 'Relatórios', icone: 'grafico' }, { href: '/tela', txt: 'Tela', icone: 'tela' }, { href: '/config', txt: 'Família', icone: 'config' }]
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
            <span className="avatar" style={{ background: eu.cor }} aria-hidden="true">{eu.nome.slice(0, 1).toUpperCase()}</span>
            <span className="nome">{eu.nome}</span>
            <form action="/auth/sair" method="post"><button className="icone-btn" aria-label="Sair" title="Sair"><Icone nome="sair" cor="#fff" tam={20} /></button></form>
          </div>
        </div>
      </header>
      {children}
      <Menu itens={itens} baixo />
    </>
  );
}
