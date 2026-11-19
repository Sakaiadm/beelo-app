import Link from 'next/link';

// Título de tela com a seta azul de voltar.
export default function Voltar({ href, titulo, sub }) {
  return (
    <div className="vt">
      <Link prefetch={false} className="volta" href={href} aria-label="Voltar">←</Link>
      <div><h1>{titulo}</h1>{sub && <p className="sub">{sub}</p>}</div>
    </div>
  );
}
