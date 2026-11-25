'use client';
// @arquivo  SomConcluir.js: chave de ligar/desligar o "plim" ao concluir (guardada neste aparelho).
// @tipo     componente
// @usa      lib/festa
// @usado-por app/(app)/perfil/page.js
import { useEffect, useState } from 'react';
import { somLigado, ligarSom, prepararSom, tocarSom } from '@/lib/festa';

// Chave em Meu perfil: liga/desliga o "plim" ao concluir. Fica guardado neste aparelho.
export default function SomConcluir() {
  const [on, setOn] = useState(true);
  useEffect(() => { setOn(somLigado()); }, []);
  const mudar = () => {
    const novo = !on; ligarSom(novo); setOn(novo);
    if (novo) { prepararSom(); tocarSom(); }
  };
  return (
    <div className="lin-chave" style={{ borderTop: 0 }}>
      <span>Som ao concluir uma tarefa<small>Um som curtinho (no modo criança, o da comemoração). Vale para este aparelho. No iPhone, não toca no modo silencioso.</small></span>
      <button type="button" role="switch" aria-checked={on} aria-label="Som ao concluir uma tarefa" className={`chave ${on ? 'on' : ''}`} onClick={mudar} />
    </div>
  );
}
