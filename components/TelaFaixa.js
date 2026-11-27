'use client';
// @arquivo  TelaFaixa.js: faixa que abre e fecha na tela Tempo de tela ("Lançar meu tempo de ontem", "Lançar tempo previsto").
// @tipo     componente
// @usa      ./Icone
// @usado-por app/(app)/tela/page.js
import { useState } from 'react';
import Icone from './Icone';

// @decisao Thomas 27/11: tudo numa tela só, com o mínimo de cliques. Faixa azul para lançar o que aconteceu e faixa
// azul-claro para o previsto; ao tocar abre os campos, ao tocar de novo recolhe. Sem borda branca em volta.
// - selo: resumo mostrado só com a faixa fechada (ex.: "Cel 3h · PC 2h").  claro: faixa azul-claro.  aberto: começa aberta.
export default function TelaFaixa({ titulo, selo, claro, aberto: aberto0, id, children }) {
  const [aberto, setAberto] = useState(!!aberto0);
  return (
    <section className="tela-faixa" id={id}>
      <button type="button" className={`faixa-t${claro ? ' claro' : ''}`} aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span>{titulo}</span>
        <span className="faixa-v">{!aberto && selo ? <b>{selo}</b> : null}<span className={`faixa-seta${aberto ? ' on' : ''}`}><Icone nome="baixo" tam={22} /></span></span>
      </button>
      {aberto && <div className="faixa-c">{children}</div>}
    </section>
  );
}
