// @arquivo  Voltar.js: seta de voltar para um endereço fixo.
// @tipo     componente
// @usa      ./Icone
// @usado-por app/(app)/config/categorias/[id]/page.js, app/(app)/config/categorias/nova/page.js, app/(app)/config/categorias/page.js, app/(app)/config/familias/[id]/page.js, app/(app)/config/familias/nova/page.js, app/(app)/config/familias/page.js e mais 9
import Link from 'next/link';
import Icone from './Icone';

// Título de tela com a setinha azul de voltar (mesma das setas de trocar o dia na Agenda).
export default function Voltar({ href, titulo, sub }) {
  return (
    <div className="vt">
      <Link prefetch={false} className="volta" href={href} aria-label="Voltar"><Icone nome="esq" tam={26} /></Link>
      <div><h1>{titulo}</h1>{sub && <p className="sub">{sub}</p>}</div>
    </div>
  );
}
