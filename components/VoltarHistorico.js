'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icone from './Icone';

// Igual ao Voltar, mas volta para a tela em que a pessoa estava (href só vale se não houver histórico).
export default function VoltarHistorico({ href, titulo }) {
  const router = useRouter();
  const voltar = (e) => { if (typeof window !== 'undefined' && window.history.length > 1) { e.preventDefault(); router.back(); } };
  return (
    <div className="vt">
      <Link prefetch={false} className="volta" href={href} aria-label="Voltar" onClick={voltar}><Icone nome="esq" tam={26} /></Link>
      <div><h1>{titulo}</h1></div>
    </div>
  );
}
