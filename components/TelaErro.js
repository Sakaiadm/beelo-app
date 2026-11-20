'use client';
import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Tela de erro do app, em português, no lugar da tela branca ou de mensagens em inglês.
// Sem internet: explica e tenta de novo sozinha quando a conexão volta.
export default function TelaErro({ reset, tipo }) {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const tentar = () => startTransition(() => { router.refresh(); reset?.(); });
  useEffect(() => {
    const ver = () => setOffline(navigator.onLine === false);
    ver();
    const voltou = () => { ver(); tentar(); };
    window.addEventListener('online', voltou);
    window.addEventListener('offline', ver);
    return () => { window.removeEventListener('online', voltou); window.removeEventListener('offline', ver); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [titulo, texto] = tipo === 'naoEncontrada'
    ? ['Página não encontrada', 'Este endereço não existe ou o item foi apagado. Volte para o início e continue de lá.']
    : offline
      ? ['Sem internet', 'O aparelho está sem conexão, então esta tela não pôde ser aberta. Confira o Wi-Fi ou os dados móveis. Quando a internet voltar, a tela abre sozinha.']
      : ['Algo não deu certo', 'Não foi possível abrir esta tela agora. Isso costuma ser passageiro. Toque em Tentar de novo. Se continuar, feche o app e abra de novo daqui a alguns minutos.'];
  return (
    <main className="estreito" style={{ paddingTop: 60 }}>
      <div className="card" role="alert">
        <h1 className="titulo">{titulo}</h1>
        <p className="sub">{texto}</p>
        <div className="acoes" style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tipo !== 'naoEncontrada' && <button type="button" className="btn" onClick={tentar}>Tentar de novo</button>}
          <a className="btn sec" href="/">Ir para o início</a>
        </div>
      </div>
    </main>
  );
}
