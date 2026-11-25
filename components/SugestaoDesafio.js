'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { criarDesafio } from '@/app/acoes-desafios';

// Painel: sugestão de desafio para quem está sem (Raio-X U98). Aceitar cria o desafio; Trocar abre o banco.
export default function SugestaoDesafio({ pessoa, desafio, tag, meta }) {
  const router = useRouter();
  const [env, setEnv] = useState(false);
  const [erro, setErro] = useState('');
  const aceitar = async () => {
    setEnv(true); setErro('');
    const fd = new FormData();
    fd.set('catalogo', desafio.id); fd.set('quem', pessoa.id); fd.set('meta', String(desafio.meta)); fd.set('coringa', '1');
    try {
      const r = await criarDesafio(null, fd);
      if (r?.erro) { setErro(r.erro); setEnv(false); } else router.refresh();
    } catch { setErro('Sem internet. Tente de novo.'); setEnv(false); }
  };
  return (
    <div className="card des-card sug-desafio">
      <p><b>Sugestão para {pessoa.nome}: {desafio.t}</b></p>
      <small className="peq-cinza">{tag ? `${tag} · ` : ''}{meta}</small>
      {erro && <div className="aviso erro" role="alert" style={{ marginTop: 8 }}>{erro}</div>}
      <div className="acoes">
        <button type="button" className="btn peq" disabled={env} onClick={aceitar}>Aceitar</button>
        <Link prefetch={false} className="btn sec peq" href={`/desafios/novo?m=${pessoa.id}`}>Trocar</Link>
      </div>
    </div>
  );
}
