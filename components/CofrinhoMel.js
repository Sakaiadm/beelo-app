'use client';
// @arquivo  CofrinhoMel.js: cartão azul do saldo do Cofrinho, com a arte animada (Mel na pilha para a criança, Anel da meta para adolescente e adulto).
// @tipo     componente (cliente)
// @usa      public/cofrinho-mel.js (motor das animações, carregado só aqui)
// @usado-por app/(app)/desafios/cofrinho/page.js
// @regra    o saldo "visto" na última visita fica no aparelho (localStorage); ao abrir, o número conta dele até o saldo de agora.
// @cuidado  se o localStorage falhar, abre sem contagem (saldo direto). "Reduzir movimento": o script mostra a arte parada.
import { useEffect, useRef } from 'react';

// Carrega o script uma vez só e devolve a promessa.
let carga = null;
const carregar = () => (carga ||= new Promise((ok, erro) => {
  if (window.CofrinhoMel) return ok();
  const s = document.createElement('script'); s.src = '/cofrinho-mel.js'; s.async = true;
  s.onload = () => ok(); s.onerror = () => { carga = null; erro(); };
  document.head.appendChild(s);
}));

// tipo: 'A' (criança) | 'T3' (adolescente e adulto). meta: custo do desejo (0 = sem meta).
export default function CofrinhoMel({ tipo, quem, saldo, meta = 0, unidade = '', unidade1 = '', linha, children }) {
  const arte = useRef(null), num = useRef(null);
  useEffect(() => {
    let cena = null, vivo = true;
    const chave = `beelo.cofre.visto.${quem}`;
    let antes = saldo;
    try { const v = parseInt(localStorage.getItem(chave) || '', 10); if (Number.isFinite(v) && v >= 0 && v <= saldo) antes = v; } catch { /* sem localStorage: sem contagem */ }
    carregar().then(() => {
      if (!vivo || !arte.current || !window.CofrinhoMel) return;
      const g = saldo - antes;
      cena = window.CofrinhoMel.montar(arte.current, tipo, { numero: num.current, saldo, antes, unidade: g > 0 ? (g === 1 ? unidade1 : unidade) : '', meta: meta || undefined, tamanho: 120 });
      try { localStorage.setItem(chave, String(saldo)); } catch { /* ok */ }
    }).catch(() => { if (num.current) num.current.textContent = saldo; });
    return () => { vivo = false; cena?.parar?.(); };
  }, [tipo, quem, saldo, meta, unidade, unidade1]);
  return (
    <div className="kpi destaque" style={{ marginBottom: 14, position: 'relative', minHeight: 142 }}>
      <div ref={arte} style={{ position: 'absolute', right: 14, top: 10, width: 120, height: 120 }} aria-hidden="true" />
      <small>Guardadas</small>
      <div className="cofre-n">{children}<strong ref={num}>{saldo}</strong></div>
      <em>{linha}</em>
    </div>
  );
}
