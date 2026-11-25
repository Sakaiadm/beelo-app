'use client';
// @arquivo   DesafiosVazio.js: tela Desafios sem nenhum desafio: 2 ou 3 sugestões prontas, um toque cria.
// @tipo      componente
// @usa       app/acoes-desafios (criarDesafio), components/Avatar
// @usado-por app/(app)/desafios/page.js (gestor)
// @cuidado   Mesma ideia do cartão do Painel (SugestaoDesafio): criar usa a meta sugerida e o dia coringa ligado.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarDesafio } from '@/app/acoes-desafios';

// itens: [{ pessoa: {id, nome}, avatar: <Avatar/>, desafio: {id, t, meta}, sub }]
export default function DesafiosVazio({ itens }) {
  const router = useRouter();
  const [env, setEnv] = useState('');
  const [erro, setErro] = useState('');
  async function criar(i) {
    setEnv(i.pessoa.id); setErro('');
    const fd = new FormData();
    fd.set('catalogo', i.desafio.id); fd.set('quem', i.pessoa.id); fd.set('meta', String(i.desafio.meta)); fd.set('coringa', '1');
    try {
      const r = await criarDesafio(null, fd);
      if (r?.erro) { setErro(r.erro); setEnv(''); } else router.refresh();
    } catch { setErro('Sem internet. Tente de novo.'); setEnv(''); }
  }
  return (
    <>
      <div className="card des-card">
        <b>Ninguém tem desafio ainda.</b>
        <p className="sub" style={{ margin: '4px 0 0' }}>Comece por uma sugestão. Um toque cria, e o desafio renova sozinho toda semana.</p>
      </div>
      {erro && <div className="aviso erro" role="alert">{erro}</div>}
      {itens.map((i) => (
        <button key={i.pessoa.id} type="button" className="cartao-l cartao-btn" disabled={!!env} onClick={() => criar(i)} aria-label={`Criar o desafio ${i.desafio.t} para ${i.pessoa.nome}`}>
          {i.avatar}
          <span className="corpo"><b>{i.desafio.t}</b><small className="peq-cinza">{i.pessoa.nome} · {i.sub}</small></span>
          <span className="seta" aria-hidden="true">{env === i.pessoa.id ? '…' : '›'}</span>
        </button>
      ))}
      {/* @decisao 25/11 Thomas: sem botão "Escolher outro desafio" aqui; o "+ Desafio" do topo leva ao mesmo lugar. */}
    </>
  );
}
