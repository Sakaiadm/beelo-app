'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Painel de família nova: três passos até começar sozinha. Some quando termina, ou com "Agora não" (Raio-X U79).
export default function PrimeirosPassos({ passos, chave }) {
  const [oculto, setOculto] = useState(true);
  useEffect(() => { try { setOculto(localStorage.getItem(chave) === '1'); } catch { setOculto(false); } }, [chave]);
  if (oculto) return null;
  const feitos = passos.filter((p) => p.ok).length;
  return (
    <section className="card primeiros" aria-label="Primeiros passos">
      <h2>Primeiros passos</h2>
      <p className="sub" style={{ margin: 0, fontSize: 'var(--f-apoio)' }}>{feitos} de {passos.length} feitos. Faltam poucos toques para a sua família começar.</p>
      <ol>
        {passos.map((p, i) => (
          <li key={p.txt} className={p.ok ? 'feito' : ''}>
            {p.ok ? <span><i className="num" aria-hidden="true">✓</i>{p.txt}</span>
              : <Link prefetch={false} href={p.href}><i className="num" aria-hidden="true">{i + 1}</i>{p.txt}</Link>}
          </li>
        ))}
      </ol>
      <button type="button" className="link-btn dispensar" onClick={() => { setOculto(true); try { localStorage.setItem(chave, '1'); } catch {} }}>Agora não</button>
    </section>
  );
}
