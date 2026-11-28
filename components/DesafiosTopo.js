// @arquivo   DesafiosTopo.js: topo das telas de Desafios: título, botão "+ Desafio" (Pai/Mãe) e abas.
// @tipo      componente
// @usa       components/Icone
// @usado-por app/(app)/desafios/page.js, mural/page.js, premios/page.js, cofrinho/page.js
// @cuidado   @decisao 25/11 Thomas (opção A): Pai/Mãe NÃO têm setinha de voltar (Desafios é painel principal, a navegação é pelo menu de baixo).
//            @decisao 28/11 Thomas: quem não é responsável também ganha o troféu "Desafios" no menu de baixo, então sem setinha.
//            Abas: Pai/Mãe = Desafios | Mural | Vitrine; filho = Desafios | Mural | Cofrinho (criança) ou Cofre (adolescente).
import Link from 'next/link';
import Icone from './Icone';

// ativo: 0 primeira aba, 1 Mural, 2 terceira aba (Vitrine ou Cofrinho).
export default function DesafiosTopo({ gestor, perfil, ativo = 0 }) {
  const abas = gestor
    ? [['Desafios', '/desafios'], ['Mural', '/desafios/mural'], ['Vitrine', '/desafios/premios']]
    : [['Desafios', '/desafios'], ['Mural', '/desafios/mural'], ...(perfil === 'c' ? [['Cofrinho', '/desafios/cofrinho']] : perfil === 'a' ? [['Cofre', '/desafios/cofrinho']] : [])];
  const titulo = <h1 className="titulo titulo-beta" style={{ margin: 0 }}>Desafios <span className="selo-beta">beta</span></h1>;
  return (
    <>
      <div className="cab-agenda" style={{ marginBottom: 12 }}>
        <div className="tit">{titulo}</div>
        {gestor && <Link prefetch={false} className="btn" href="/desafios/novo"><Icone nome="mais" tam={18} cor="#fff" />Desafio</Link>}
      </div>
      {abas.length > 1 && (
        <div className="seg" role="tablist" aria-label="Desafios">
          {abas.map(([t, href], i) => <Link key={href} prefetch={false} href={href} className={i === ativo ? 'on' : ''} aria-current={i === ativo ? 'page' : undefined}>{t}</Link>)}
        </div>
      )}
    </>
  );
}
