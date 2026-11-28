'use client';
// @arquivo  SugestaoDesafio.js: sugestão de desafio baseada na categoria mais fraca.
// @tipo     componente
// @usa      app/acoes-desafios, components/Icone
// @usado-por app/(app)/painel/page.js
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icone from '@/components/Icone';
import { criarDesafio, dispensarSugestaoDesafio } from '@/app/acoes-desafios';

// Painel: sugestão de desafio para quem está sem (Raio-X U98). Aceitar e criar cria o desafio; Escolher outro abre o banco.
// @decisao Selo "Desafio sugerido" + X que fecha só esta pessoa por 14 dias (SQL 0030); texto aprovado pelo Thomas em 26/11.
export default function SugestaoDesafio({ pessoa, desafio, tag, meta }) {
  const router = useRouter();
  const [env, setEnv] = useState(false);
  const [erro, setErro] = useState('');
  const aceitar = async () => {
    setEnv(true); setErro('');
    const fd = new FormData();
    fd.set('catalogo', desafio.id); fd.set('quem', pessoa.id); fd.set('meta', String(desafio.meta)); fd.set('coringa', '0');
    try {
      const r = await criarDesafio(null, fd);
      if (r?.erro) { setErro(r.erro); setEnv(false); } else router.refresh();
    } catch { setErro('Sem internet. Tente de novo.'); setEnv(false); }
  };
  const fechar = async () => {
    setEnv(true); setErro('');
    try {
      const r = await dispensarSugestaoDesafio(pessoa.id);
      if (r?.erro) { setErro(r.erro); setEnv(false); } else router.refresh();
    } catch { setErro('Sem internet. Tente de novo.'); setEnv(false); }
  };
  return (
    <div className="card des-card sug-desafio">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="tg mel">Desafio sugerido</span>
        <button type="button" className="favo-x" style={{ margin: '-10px -10px -10px 0' }} aria-label={`Fechar a sugestão para ${pessoa.nome}`} disabled={env} onClick={fechar}><Icone nome="x" tam={16} larg={2.4} /></button>
      </div>
      <p style={{ marginTop: 10 }}><b>Que tal um desafio para {pessoa.nome}?</b></p>
      <small className="peq-cinza" style={{ display: 'block' }}>O beelo sugere este para começar. Aceitar cria na hora; Escolher outro abre a lista.</small>
      <p style={{ margin: '8px 0 0' }}><b>{desafio.t}</b></p>
      <small className="peq-cinza">{tag ? `${tag} · ` : ''}{meta}</small>
      {erro && <div className="aviso erro" role="alert" style={{ marginTop: 8 }}>{erro}</div>}
      <div className="acoes">
        <button type="button" className="btn peq" disabled={env} onClick={aceitar}>Aceitar e criar</button>
        <Link prefetch={false} className="btn sec peq" href={`/desafios/novo?m=${pessoa.id}`}>Escolher outro</Link>
      </div>
    </div>
  );
}
