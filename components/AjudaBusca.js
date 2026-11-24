'use client';
import { useState } from 'react';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Ajuda com busca no alto, as mais procuradas abertas à vista e o resto em blocos por assunto (Raio-X U69).
export default function AjudaBusca({ top, grupos }) {
  const [q, setQ] = useState('');
  const termo = norm(q.trim());
  const todas = grupos.flatMap((g) => g.itens);
  const achadas = termo ? todas.filter(([t, d]) => norm(t + ' ' + d).includes(termo)) : [];
  const item = ([t, d], aberto) => <details key={t} className="ajuda-item" open={aberto}><summary>{t}</summary><p>{d}</p></details>;
  return (
    <div id="perguntas">
      <label htmlFor="ajuda-q" className="so-leitor">Buscar na ajuda</label>
      <input id="ajuda-q" type="search" className="ajuda-busca" placeholder="Buscar: adiar, foto, convite…" value={q} onChange={(e) => setQ(e.target.value)} />
      {termo ? (
        <div className="card">
          <div className="ajuda-sec">{achadas.length ? (achadas.length === 1 ? '1 resposta' : `${achadas.length} respostas`) : 'Nada encontrado'}</div>
          {achadas.map((x) => item(x, achadas.length <= 2))}
          {!achadas.length && <p className="peq-cinza">Tente outra palavra ou fale com a gente pelo WhatsApp, no alto desta tela.</p>}
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
