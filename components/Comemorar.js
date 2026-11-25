'use client';
// @arquivo  Comemorar.js: comemoração de desafio cumprido, uma vez por desafio.
// @tipo     componente
// @usa      app/acoes-desafios, ./Icone
// @usado-por app/(app)/desafios/page.js, app/(app)/hoje/page.js
import { useEffect, useRef, useState } from 'react';
import { desafioVisto } from '@/app/acoes-desafios';
import Icone from './Icone';

// Desafio cumprido: comemoração na hora em que a pessoa abre o app (uma vez só por desafio).
// Aprovado pelo Thomas em 25/11 (animações em lib/festaAnim.js):
// - criança com prêmio: presente surpresa com o selo e as moedas indo para o cofrinho;
// - criança sem prêmio: o selo Favo com faixa desce como um carimbo;
// - adulto: cartão discreto, o anel fecha e vira check, com o som Cristal.
// A criança toca para abrir: assim o som pode tocar (regra dos navegadores).
export default function Comemorar({ itens, nome, crianca }) {
  const [fila, setFila] = useState(itens || []);
  const ic = useRef(null), rodando = useRef(null);
  const x = fila[0];
  useEffect(() => {
    if (!x || rodando.current === x.id) return;
    rodando.current = x.id;
    (async () => {
      const A = await import('@/lib/festaAnim');
      const premio = x.d.recompensa === 'estrelas' ? `+${x.d.estrelas} estrelinhas no cofrinho` : x.d.recompensa === 'semanas' ? 'Mais uma semana conquistada' : null;
      const sub = `Você foi constante${nome ? `, ${nome}` : ''}! ${x.d.periodo === 'mes' ? 'No dia 1º começa um mês novo.' : 'Na segunda começa uma semana nova.'}`;
      const icone = ic.current?.querySelector('svg')?.innerHTML || '';
      if (!crianca) await A.conquistaAdulto({ titulo: x.titulo, sub, premio });
      else if (premio) await A.presenteCrianca({ nome: x.titulo, icone, titulo: x.titulo, sub, premio, n: x.d.recompensa === 'estrelas' ? x.d.estrelas || 0 : 0 });
      else await A.seloCrianca({ nome: x.titulo, icone, titulo: x.titulo, sub });
      desafioVisto(x.id);
      setFila((f) => f.slice(1));
    })();
  }, [x, crianca, nome]);
  if (!x) return null;
  // O desenho do desafio (o mesmo ícone da lista) vai para o meio do selo.
  return <span ref={ic} hidden aria-hidden="true"><Icone nome={x.d.icone || 'hoje'} tam={24} /></span>;
}
