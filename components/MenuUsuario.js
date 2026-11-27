'use client';
// @arquivo  MenuUsuario.js: botão com o nome no topo: perfil, ajuda, modo escuro, sair.
// @tipo     componente
// @usa      ./Icone, lib/contas, ./Reportar (item "Reportar ou sugerir" e print da tela)
// @usado-por app/(app)/layout.js
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Icone from './Icone';
import Reportar, { capturarTela } from './Reportar';
import { lerContas, trocaLigada, proxima, trocarPara, limparContas, uidAtual } from '@/lib/contas';

// Botão com o nome da pessoa no topo. Abre: Meu perfil, Ajuda, Modo escuro e Sair (Raio-X U67).
// Sair pergunta antes (U68).
// Troca de conta (só teste, só quem guardou contas neste aparelho): 2 toques rápidos no ícone giram para a próxima conta; a lista no menu pula direto para uma.
export default function MenuUsuario({ nome, familia, cadastros, relato, eu, children }) {
  const [contas, setContas] = useState([]);
  const ultimo = useRef(0);
  const [uid, setUid] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [escuro, setEscuro] = useState(false);
  const [sair, setSair] = useState(false);
  const [relatar, setRelatar] = useState(false);
  const [print, setPrint] = useState(null);
  const raiz = useRef(null);

  useEffect(() => { setContas(trocaLigada() ? lerContas() : []); uidAtual().then(setUid).catch(() => {}); }, [aberto]);
  useEffect(() => {
    if (!aberto) { setSair(false); return; }
    const el = document.documentElement;
    setEscuro((el.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro')) === 'escuro');
    const fora = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('pointerdown', fora); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  function alternar() {
    const novo = escuro ? 'claro' : 'escuro';
    document.documentElement.dataset.theme = novo;
    document.cookie = `tema=${novo}; path=/; max-age=31536000; samesite=lax`;
    setEscuro(!escuro);
  }

  function toque() {
    const agora = Date.now();
    const outra = contas.length >= 2 && uid ? proxima(uid) : null;
    if (outra && agora - ultimo.current < 400) { ultimo.current = 0; setAberto(false); trocarPara(outra); return; }
    ultimo.current = agora;
    setAberto((v) => !v);
  }

  return (
    <div className="usuario" ref={raiz}>
      <button type="button" className="usuario-btn" aria-label={`Menu de ${nome}`} aria-haspopup="menu" aria-expanded={aberto} onClick={toque}>
        {children}
        <span className="usuario-nome">{nome}{familia ? <small> · {familia}</small> : null}</span>
        <span className="usuario-seta" aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <div className="usuario-menu" role="menu">
          <div className="usuario-cab"><b>{nome}</b>{familia ? <small>{familia}</small> : null}</div>
          {contas.length >= 2 && eu && (
            <div role="group" aria-label="Trocar de conta">
              <small className="peq-cinza" style={{ padding: '4px 12px', display: 'block' }}>TROCAR DE CONTA</small>
              {contas.map((c) => (
                <button key={c.id} role="menuitem" type="button" onClick={() => (c.id === uid ? setAberto(false) : trocarPara(c))}>
                  <span className="avatar" style={{ width: 32, height: 32, fontSize: 13, borderRadius: '50%', background: c.cor || '#1a6fe0' }}>{(c.nome || '?')[0]}</span>
                  <span style={{ flex: 1, marginLeft: 10 }}><b>{c.nome}</b><small style={{ display: 'block', color: 'var(--cinza)' }}>{c.rotulo || c.papel}</small></span>
                  {c.id === uid && <Icone nome="check" tam={18} />}
                </button>
              ))}
            </div>
          )}
          {cadastros && <Link role="menuitem" href="/config" prefetch={false} onClick={() => setAberto(false)}>Cadastros</Link>}
          <Link role="menuitem" href="/perfil" prefetch={false} onClick={() => setAberto(false)}>Meu perfil</Link>
          <Link role="menuitem" href="/ajuda" prefetch={false} onClick={() => setAberto(false)}>Ajuda</Link>
          {relato && <button role="menuitem" type="button" onClick={async () => { setAberto(false); await new Promise((r) => setTimeout(r, 120)); setPrint(await capturarTela()); setRelatar(true); }}>Reportar ou sugerir<Icone nome="fala" tam={18} /></button>}
          <button role="menuitem" type="button" onClick={alternar}>Modo escuro<span className={`chave ${escuro ? 'on' : ''}`} aria-hidden="true" /></button>
          {sair ? (
            <form action="/auth/sair" method="post" className="sair-conf" onSubmit={limparContas} role="alertdialog" aria-label="Sair do beelo">
              <p>Sair do beelo neste aparelho?</p>
              <div className="acoes"><button className="btn perigo peq">Sim, sair</button><button type="button" className="btn sec peq" onClick={() => setSair(false)}>Cancelar</button></div>
            </form>
          ) : <button role="menuitem" type="button" className="sair" onClick={() => setSair(true)}><Icone nome="sair" tam={18} /> Sair</button>}
        </div>
      )}
      {relato && <Reportar {...relato} aberto={relatar} setAberto={setRelatar} print={print} setPrint={setPrint} />}
    </div>
  );
}
