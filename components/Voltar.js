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
