'use client';
// @arquivo  CarimboDia.js: ao abrir o app depois da meia-noite, o dia que fechou como "bom" ganha o carimbo (uma vez só).
// @tipo     componente (cliente, não desenha nada)
// @usa      lib/festa (tocarSom), lib/festaAnim (só para criança), localStorage
// @usado-por components/DesafioCartao.js
// @decisao  28/11 Thomas: o resultado do dia sai só no dia seguinte, com animação por perfil. Criança: a Mel leva a estrela até a bolinha;
//           adolescente e adulto: a bolinha "bate" com um brilho curto (versão calma).
// @cuidado  o último dia visto fica no aparelho (localStorage). Se falhar, não anima. "Reduzir movimento": só o som baixo (nenhum voo).
import { useEffect } from 'react';
import { tocarSom } from '@/lib/festa';

export default function CarimboDia({ desafio, dias = [], hoje, crianca = false }) {
  useEffect(() => {
    const chave = `beelo.diabom.${desafio}`;
    const ok = dias.filter((x) => x.s === 'ok' && x.d < hoje).map((x) => x.d).sort();
    if (!ok.length) return;
    let visto = '';
    try { visto = localStorage.getItem(chave) || ''; } catch { return; }
    const novos = visto ? ok.filter((d) => d > visto) : [];
    try { localStorage.setItem(chave, ok[ok.length - 1]); } catch { /* sem localStorage: sem animação */ }
    if (!novos.length) return;
    const calmo = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.querySelector(`[data-dia="${novos[novos.length - 1]}"][data-desafio="${desafio}"] i`);
    if (!el) return;
    tocarSom(crianca ? 'ding' : 'plim');
    if (calmo) return;
    el.animate([{ transform: 'scale(.3) rotate(-40deg)', boxShadow: '0 0 0 0 rgba(245,184,46,.7)' }, { transform: 'scale(1.25) rotate(0)', boxShadow: '0 0 0 10px rgba(245,184,46,0)' }, { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(245,184,46,0)' }], { duration: 750, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
    if (crianca) {
      const r = el.getBoundingClientRect();
      import('@/lib/festaAnim').then((A) => A.marcarCrianca({ x: r.left + r.width / 2, y: r.top + r.height / 2 })).catch(() => {});
    }
  }, [desafio, dias, hoje, crianca]);
  return null;
}
