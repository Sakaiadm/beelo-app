'use client';
// @arquivo  RolagemSemana.js: faixa rolável da Semana da Agenda que deixa o dia escolhido no meio da tela.
// @tipo     componente
// @usa      react
// @usado-por app/(app)/agenda/page.js
// @decisao  26/11: o dia escolhido (contorno bem leve) fica sempre centralizado na rolagem: ao abrir, ao mudar de dia ou de semana e ao tocar em "Hoje". Thomas aprovou as telas.
// @cuidado  o dia do meio é o elemento com data-sel="1". As pontas (segunda e domingo) só centralizam porque o CSS (.semana.centra) põe espaço vazio nas laterais no celular.
import { useEffect, useRef } from 'react';

// chave: muda quando o dia, a semana ou a pessoa mudam, para centralizar de novo.
export default function RolagemSemana({ chave, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const faixa = ref.current;
    const dia = faixa?.querySelector('[data-sel="1"]');
    if (!faixa || !dia) return;
    // posição do dia dentro da faixa, menos a metade da folga em volta dele
    const x = dia.getBoundingClientRect().left - faixa.getBoundingClientRect().left + faixa.scrollLeft;
    faixa.scrollLeft = x - (faixa.clientWidth - dia.offsetWidth) / 2;
  }, [chave]);
  return <div className="rolavel" ref={ref}><div className="semana centra">{children}</div></div>;
}
