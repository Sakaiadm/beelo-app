'use client';
import { useEffect, useState } from 'react';
import Icone from './Icone';

// Balãozinho que explica a dinâmica dos desafios na própria tela (além do manual).
// Fecha no X e não volta; "Como funciona?" abre de novo.
const TEXTOS = {
  gestor: ['Escolha um desafio para cada pessoa (até 2) ou um da família toda. O app já sugere a meta e o prêmio.',
    'O desafio renova sozinho toda segunda. Um dia difícil na semana vira dia coringa e não conta.',
    'A criança ganha estrelinhas que não somem; o adolescente junta semanas conquistadas. Os adultos acompanham o percentual.',
    'Quando alguém troca por um prêmio, ele aparece aqui para você marcar "entregue".'],
  c: ['Faça as tarefas do seu desafio e veja as bolinhas ficarem verdes.',
    'Cumpriu a meta da semana? Ganha estrelinhas no seu cofrinho.',
    'As estrelinhas não somem. Troque agora ou junte para um prêmio maior.',
    'Um dia difícil vira dia coringa e não estraga a semana.'],
  a: ['Você pode escolher o seu próprio desafio no banco de sugestões.',
    'Cada semana em que você cumpre a meta vira uma semana conquistada.',
    'As semanas não vencem. Use quando quiser em combinados de autonomia.',
    'Um dia difícil vira dia coringa e não estraga a semana.'],
  j: ['Escolha um hábito e acompanhe o seu percentual da semana.', 'O desafio renova sozinho toda segunda.', 'Um dia difícil vira dia coringa e não conta.'],
};

export default function ComoFunciona({ perfil = 'gestor', membro }) {
  const chave = `ra_desafio_balao_${membro}`;
  const [aberto, setAberto] = useState(false);
  // Aberta só na primeira visita; depois vira a linha "Como funciona?" (Raio-X U85).
  useEffect(() => {
    try { const visto = localStorage.getItem(chave); setAberto(visto == null); if (visto == null) localStorage.setItem(chave, '0'); } catch { setAberto(true); }
  }, [chave]);
  const fechar = () => { setAberto(false); try { localStorage.setItem(chave, '0'); } catch {} };
  if (!aberto) return <button type="button" className="link-btn" style={{ marginBottom: 10 }} onClick={() => setAberto(true)}>Como funciona?</button>;
  return (
    <div className="aviso info dica como-funciona" role="status">
      <span className="dica-ic"><Icone nome="ideia" tam={20} /></span>
      <span className="dica-tx"><b>Como funcionam os desafios</b>
        <ul>{(TEXTOS[perfil] || TEXTOS.gestor).map((t) => <li key={t}>{t}</li>)}</ul>
      </span>
      <button type="button" className="dica-x" aria-label="Fechar a explicação" onClick={fechar}><Icone nome="x" tam={18} /></button>
    </div>
  );
}
