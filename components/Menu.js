'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icone from './Icone';

export default function Menu({ itens, baixo }) {
  const p = usePathname();
  const ativo = (h) => (p === h || p.startsWith(h + '/') ? 'ativo' : '');
  if (baixo) return (
    <nav className="navbaixo" aria-label="Navegação">
      {itens.slice(0, 7).map((i) => <Link key={i.href} href={i.href} prefetch={false} className={ativo(i.href)}><Icone nome={i.icone} tam={22} />{i.txt}</Link>)}
    </nav>
  );
  return <nav className="menu" aria-label="Menu">{itens.map((i) => <Link key={i.href} href={i.href} prefetch={false} className={ativo(i.href)}>{i.txt}</Link>)}</nav>;
}
