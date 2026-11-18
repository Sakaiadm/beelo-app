'use client';
import { useEffect, useState } from 'react';
import { salvarAparelho, removerAparelho, enviarTeste } from '@/app/acoes';

function chaveBinaria(b64) {
  const p = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
const nomeAparelho = () => {
  const u = navigator.userAgent;
  const so = /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac/.test(u) ? 'Mac' : 'Aparelho';
  return `${so} · ${/Edg/.test(u) ? 'Edge' : /Chrome/.test(u) ? 'Chrome' : /Safari/.test(u) ? 'Safari' : /Firefox/.test(u) ? 'Firefox' : 'navegador'}`;
};

export default function AvisosCelular({ chavePublica }) {
  const [estado, setEstado] = useState('carregando'); // carregando | semchave | nosuporte | ios | negado | desligado | ligado
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function ler() {
    if (!chavePublica) return setEstado('semchave');
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const instalado = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (ios && !instalado) return setEstado('ios');
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setEstado('nosuporte');
    if (Notification.permission === 'denied') return setEstado('negado');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setEstado(sub && Notification.permission === 'granted' ? 'ligado' : 'desligado');
    } catch { setEstado('desligado'); }
  }
  useEffect(() => { ler(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function ativar() {
    setOcupado(true); setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setEstado(perm === 'denied' ? 'negado' : 'desligado'); return; }
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBinaria(chavePublica) });
      const r = await salvarAparelho(sub.toJSON(), nomeAparelho());
      if (r?.erro) throw new Error(r.erro);
      setEstado('ligado'); setMsg('Pronto! Toque em "Enviar um teste" para ver chegar.');
    } catch (e) { setMsg('Não deu certo: ' + (e.message || 'tente de novo') + '.'); }
    finally { setOcupado(false); }
  }
  async function desativar() {
    setOcupado(true); setMsg('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) { await removerAparelho(sub.endpoint); await sub.unsubscribe(); }
      setEstado('desligado'); setMsg('Avisos desligados neste aparelho.');
    } catch { setMsg('Não foi possível desligar agora.'); }
    finally { setOcupado(false); }
  }
  async function testar() {
    setOcupado(true);
    const r = await enviarTeste();
    setMsg(r?.erro ? r.erro : 'Teste enviado. Chega em até 15 segundos, mesmo com o app fechado.');
    setOcupado(false);
  }

  const txt = { fontSize: 14, color: 'var(--cinza)', margin: '4px 0 12px' };
  return (
    <div>
      {estado === 'carregando' && <p style={txt}>Verificando este aparelho…</p>}
      {estado === 'semchave' && <p style={txt}>Os avisos no celular ainda não foram ligados no servidor.</p>}
      {estado === 'nosuporte' && <p style={txt}>Este navegador não recebe avisos no celular. No Android use o Chrome; no iPhone, instale o app na tela inicial.</p>}
      {estado === 'ios' && (
        <div style={txt}>
          <p style={{ margin: '0 0 8px' }}>No iPhone, primeiro coloque o app na tela inicial:</p>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
            <li>Abra este site no <strong>Safari</strong>.</li><li>Toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
            <li>Escolha <strong>Adicionar à Tela de Início</strong> e toque em Adicionar.</li><li>Abra o app pelo <strong>novo ícone</strong> e volte nesta tela.</li>
          </ol>
        </div>
      )}
      {estado === 'negado' && <p style={txt}>Os avisos estão bloqueados neste aparelho. Libere nas configurações do navegador (ou do app), em Notificações, e volte aqui.</p>}
      {estado === 'desligado' && <><p style={txt}>Receba um aviso no celular quando algo acontecer, mesmo com o app fechado.</p><button type="button" className="btn" disabled={ocupado} onClick={ativar}>Ativar avisos neste aparelho</button></>}
      {estado === 'ligado' && (
        <>
          <p style={{ ...txt, color: 'var(--ok)', fontWeight: 600 }}>Avisos ativados neste aparelho.</p>
          <div className="acoes"><button type="button" className="btn sec" disabled={ocupado} onClick={testar}>Enviar um teste</button>
            <button type="button" className="btn sec" disabled={ocupado} onClick={desativar}>Desligar</button></div>
        </>
      )}
      {msg && <p style={{ ...txt, marginTop: 10 }} role="status">{msg}</p>}
    </div>
  );
}
