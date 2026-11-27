'use client';
// @arquivo  ContasAlternar.js: tela "Contas para alternar (teste)": liga a troca rápida, lista as contas guardadas e adiciona outra.
// @tipo     componente
// @usa      lib/contas, components/Avatar
// @usado-por app/(app)/config/contas/page.js
// @decisao  27/11 Thomas: só o administrador geral abre esta tela; máximo de 3 contas.
import { useEffect, useState } from 'react';
import { lerContas, guardarAtual, remover, trocaLigada, ligarTroca, marcarAdicionando, sairSemRevogar, MAX_CONTAS } from '@/lib/contas';

export default function ContasAlternar({ eu }) {
  const [contas, setContas] = useState([]);
  const [ligada, setLigada] = useState(true);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    (async () => { await guardarAtual(eu); setContas(lerContas()); setLigada(trocaLigada()); setPronto(true); })();
  }, [eu.id]);
  const alternar = () => { ligarTroca(!ligada); setLigada(!ligada); };
  const tirar = (id) => { remover(id); setContas(lerContas()); };
  const adicionar = async () => { marcarAdicionando(true); await sairSemRevogar(); };
  return (
    <>
      <div className="card">
        <div className="lin-chave" style={{ border: 0, padding: 0 }}>
          <span>Troca rápida neste aparelho<small>Toque 2 vezes no seu ícone no topo para passar para a próxima conta.</small></span>
          <button type="button" className={`chave ${ligada ? 'on' : ''}`} role="switch" aria-checked={ligada} aria-label="Troca rápida" onClick={alternar} />
        </div>
      </div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {pronto && contas.map((c) => (
          <div className="lin-chave" key={c.id}>
            <span className="avatar" style={{ width: 32, height: 32, fontSize: 13, borderRadius: '50%', background: c.cor || '#1a6fe0' }}>{(c.nome || '?')[0]}</span>
            <span style={{ flex: 1, marginLeft: 10 }}><b>{c.nome}</b><small>{c.rotulo || c.papel}{c.id === eu.id ? ' · você agora' : ''}</small></span>
            {c.id !== eu.id && <button type="button" className="btn sec peq" onClick={() => tirar(c.id)}>Tirar</button>}
          </div>
        ))}
        {pronto && contas.length === 0 && <p className="peq-cinza" style={{ padding: 10 }}>Nenhuma conta guardada ainda.</p>}
      </div>
      {contas.length < MAX_CONTAS && <button type="button" className="btn sec bloco" style={{ marginTop: 6 }} onClick={adicionar}>+ Conta</button>}
      <p className="peq-cinza" style={{ marginTop: 10 }}>Até {MAX_CONTAS} contas. Ao tocar em "+ Conta", peça o link de entrada do outro e-mail. Só aparece para você.</p>
    </>
  );
}
