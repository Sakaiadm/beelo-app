'use client';
// @arquivo  AjudaBusca.js: Ajuda com a caixa "O que você quer saber?" (respostas prontas), mais procuradas e blocos por assunto.
// @tipo     componente
// @usa      lib/ajudaBusca.js (sinônimos, sem acento, erro de digitação)
// @usado-por app/(app)/ajuda/page.js
// @regra    25/11 Thomas: criança não tem busca: só as perguntas mais procuradas, em botões grandes e frases curtas.
// @cuidado  Cada item é [titulo, texto, capitulo?]; o grupo diz de qual manual o capítulo é. "Ver no manual" leva o termo digitado (?q=) para o manual destacar.
import { useState } from 'react';
import { buscar } from '@/lib/ajudaBusca';

// Ajuda com busca no alto, as mais procuradas à vista e o resto em blocos por assunto (Raio-X U69).
export default function AjudaBusca({ top, grupos, crianca = false }) {
  const [q, setQ] = useState('');
  const termo = q.trim();
  const todas = [];
  const vistas = new Set();
  const outras = []; // perguntas de outros perfis (o que o adolescente e a criança veem): só entram se faltar resposta no perfil de quem busca
  for (const g of grupos) for (const [t, d, cap] of g.itens) {
    const chave = `${g.manual}|${t}`;
    if (!vistas.has(chave)) { vistas.add(chave); (g.principal === false ? outras : todas).push([t, d, cap, g.manual]); }
  }
  let achadas = termo.length >= 2 ? buscar(todas, termo) : [];
  if (achadas.length < 3 && termo.length >= 2) achadas = [...achadas, ...buscar(outras, termo, 5 - achadas.length)];
  const item = ([t, d], aberto, grande) => <details key={t} className={`ajuda-item${grande ? ' grande' : ''}`} open={aberto}><summary>{t}</summary><p>{d}</p></details>;

  if (crianca) {
    return (
      <div id="perguntas">
        <div className="ajuda-sec" style={{ marginTop: 4 }}>Perguntas mais procuradas</div>
        {top.map((x) => <div className="card ajuda-grande" key={x[0]}>{item(x, false, true)}</div>)}
      </div>
    );
  }
  return (
    <div id="perguntas">
      <label htmlFor="ajuda-q" className="ajuda-pergunta">O que você quer saber?</label>
      <input id="ajuda-q" type="search" className="ajuda-busca" placeholder="Ex.: adiar, foto, convite, prêmio…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      {termo.length >= 2 ? (
        <div className="card" role="status" aria-live="polite">
          <div className="ajuda-sec">{achadas.length ? (achadas.length === 1 ? '1 resposta' : `${achadas.length} respostas`) : 'Nada encontrado'}</div>
          {achadas.map(([t, d, cap, manual]) => (
            <div className="ajuda-resp" key={`${manual}|${t}`}>
              <b>{t}</b>
              <p>{d}</p>
              {cap && manual && <a href={`${manual}?app=1&q=${encodeURIComponent(termo)}#${cap}`} className="btn sec peq">Ver no manual</a>}
            </div>
          ))}
          {!achadas.length && <p className="peq-cinza">Tente outras palavras, como “adiar”, “prêmio” ou “convite”, ou fale com a gente pelo WhatsApp, no alto desta tela.</p>}
        </div>
      ) : (
        <>
          <div className="card"><div className="ajuda-sec">As mais procuradas</div>{top.map((x) => item(x, false))}</div>
          {grupos.map((g) => (
            <details key={g.titulo} className="card rel-sec ajuda-grupo">
              <summary><h2>{g.titulo}</h2><span>{g.itens.length}</span></summary>
              {g.itens.map((x) => item(x, false))}
            </details>
          ))}
        </>
      )}
    </div>
  );
}
