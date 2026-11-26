'use client';
// @arquivo   ComoFunciona.js: balãozinho que explica os desafios; o botão "Como funciona" fica no pé da tela (ComoFuncionaBotao).
// @tipo      componente
// @usa       components/Icone.js; localStorage (chave ra_desafio_balao_<membro>)
// @usado-por app/(app)/desafios/page.js
// @cuidado   O botão tem o mesmo estilo e tamanho das pílulas Mural/Vitrine/Ajustes (classes "btn sec peq").
//            As pílulas dos gestores chegam como "children" para ficarem na mesma linha do botão.
import { useEffect, useState } from 'react';
import Icone from './Icone';

// Balãozinho que explica a dinâmica dos desafios na própria tela (além do manual).
// Fecha no X e não volta; "Como funciona?" abre de novo.
const TEXTOS = {
  gestor: ['Escolha um desafio para cada pessoa (o ideal é 1; no máximo 2) ou um da família toda. O app já sugere a meta e o prêmio.',
    'Desafios duram 4 semanas e recomeçam a cada segunda. Um dia difícil na semana vira dia coringa e não conta.',
    'No fim das 4 semanas vem um balanço: você escolhe Renovar, Subir um nível ou Trocar. Sem resposta, o desafio descansa e não renova sozinho.',
    'A criança ganha estrelinhas que não somem; o adolescente junta semanas conquistadas. Os adultos acompanham o percentual.',
    'Quando alguém troca por um prêmio, ele aparece aqui para você marcar "entregue".'],
  c: ['Faça as tarefas do seu desafio e veja as bolinhas ficarem verdes.',
    'Cada desafio dura 4 semanas. Cumpriu a meta da semana? Ganha estrelinhas no seu cofrinho.',
    'As estrelinhas não somem. Troque agora ou junte para um prêmio maior.',
    'Um dia difícil vira dia coringa e não estraga a semana.'],
  a: ['Você pode escolher o seu próprio desafio no banco de sugestões. Menos é mais: comece com 1.',
    'Ele dura 4 semanas. No fim, você escolhe renovar, subir um nível ou trocar.',
    'Cada semana em que você cumpre a meta vira uma semana conquistada.',
    'As semanas não vencem. Use quando quiser em combinados de autonomia.',
    'Um dia difícil vira dia coringa e não estraga a semana.'],
  j: ['Escolha um hábito e acompanhe o seu percentual da semana.', 'O desafio dura 4 semanas e recomeça a cada segunda. No fim, você renova ou troca.', 'Um dia difícil vira dia coringa e não conta.'],
};

export default function ComoFunciona({ perfil = 'gestor', membro, children, semLinha }) {
  const chave = `ra_desafio_balao_${membro}`;
  const [aberto, setAberto] = useState(false);
  // Aberta só na primeira visita; depois vira a linha "Como funciona?" (Raio-X U85).
  useEffect(() => {
    try { const visto = localStorage.getItem(chave); setAberto(visto == null); if (visto == null) localStorage.setItem(chave, '0'); } catch { setAberto(true); }
  }, [chave]);
  // @decisao 25/11 Thomas (opção A): o botão "Como funciona" fica no pé da tela (ver ComoFuncionaBotao); aqui só abre o balãozinho.
  useEffect(() => {
    const abrir = () => { setAberto((v) => !v); window.scrollTo?.(0, 0); };
    window.addEventListener('beelo-como-funciona', abrir);
    return () => window.removeEventListener('beelo-como-funciona', abrir);
  }, []);
  const fechar = () => { setAberto(false); try { localStorage.setItem(chave, '0'); } catch {} };
  // @decisao Thomas 25/11: "Como funciona" é um botão com ícone de livro, igual às outras pílulas (opção A).
  const botao = (
    <button type="button" className="btn sec peq" aria-expanded={aberto} onClick={() => (aberto ? fechar() : setAberto(true))}>
      <Icone nome="livro" tam={18} />Como funciona
    </button>
  );
  const linha = <div className="des-atalhos" aria-label="Mais telas dos desafios">{children}{botao}</div>;
  if (!aberto) return semLinha ? null : linha;
  return (<>
    {!semLinha && linha}
    <div className="aviso info dica como-funciona" role="status">
      <span className="dica-ic"><Icone nome="ideia" tam={20} /></span>
      <span className="dica-tx"><b>Como funcionam os desafios</b>
        <ul>{(TEXTOS[perfil] || TEXTOS.gestor).map((t) => <li key={t}>{t}</li>)}</ul>
      </span>
      <button type="button" className="dica-x" aria-label="Fechar a explicação" onClick={fechar}><Icone nome="x" tam={18} /></button>
    </div>
  </>);
}

// Botão discreto do pé da tela: abre (ou fecha) o balãozinho do ComoFunciona lá em cima.
export function ComoFuncionaBotao() {
  return (
    <button type="button" className="link-btn" onClick={() => window.dispatchEvent(new Event('beelo-como-funciona'))}>
      <Icone nome="livro" tam={18} />&nbsp;Como funciona
    </button>
  );
}
