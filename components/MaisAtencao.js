'use client';
// @arquivo  MaisAtencao.js: lista do cartão "Precisa da sua atenção": mostra os 2 primeiros itens e o resto atrás de um botão.
// @tipo     componente
// @usa      react
// @usado-por app/(app)/painel/page.js
// @decisao  26/11: Thomas aprovou (prévia): 2 itens à vista, botão vermelhinho "Ver mais precisa de atenção (N)" com seta para baixo e, aberto, "Ver menos" com seta para cima. O "Ver mais atrasadas" separado saiu: é uma regra só para tudo.
// @cuidado  os itens de baixo ficam na página (só escondidos), para links como /painel#j-123 e #atrasadas abrirem a lista e rolarem até o item.
import { useEffect, useState, Children } from 'react';
import Icone from './Icone';

export default function MaisAtencao({ visiveis = 2, children }) {
  const itens = Children.toArray(children);
  const [aberto, setAberto] = useState(false);
  const resto = itens.length - visiveis;

  // Se a pessoa chegou por um link para um item escondido (ou para "atrasadas"), abre a lista e rola até ele.
  useEffect(() => {
    const ir = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (id === 'atrasadas' || el?.closest('[data-resto]')) {
        setAberto(true);
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50);
      }
    };
    ir();
    window.addEventListener('hashchange', ir);
    return () => window.removeEventListener('hashchange', ir);
  }, []);

  if (resto <= 0) return <>{itens}</>;
  return (
    <>
      {itens.slice(0, visiveis)}
      <div data-resto hidden={!aberto}>{itens.slice(visiveis)}</div>
      <button type="button" className="ver-mais-aten" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        {aberto ? 'Ver menos' : `Ver mais precisa de atenção (${resto})`}
        <span style={{ display: 'inline-flex', transform: aberto ? 'rotate(180deg)' : 'none' }}><Icone nome="baixo" tam={20} /></span>
      </button>
    </>
  );
}
