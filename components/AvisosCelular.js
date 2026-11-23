'use client';
import { useEffect, useState } from 'react';
import { salvarAparelho, removerAparelho, enviarTeste } from '@/app/acoes';
import { falhaDeRede, mensagemDeErro, semRede, MSG } from '@/lib/rede';

// Explica em português por que não deu para ligar os avisos.
export function motivoAvisos(e) {
  if (falhaDeRede(e)) return 'Sem internet. Os avisos só podem ser ligados com internet. Tente de novo quando a conexão voltar.';
  const m = String(e?.message || '');
  if (/permission|denied|NotAllowed/i.test(m)) return 'O celular não deu permissão para avisos. Libere as notificações do app nas configurações do celular e tente de novo.';
  if (/push service|AbortError|registration/i.test(m)) return 'O serviço de avisos do celular não respondeu. Confira se o Chrome está atualizado e se a economia de bateria não bloqueia o Chrome, e tente de novo em Meu perfil.';
  return mensagemDeErro(e);
}


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

// Como estão os avisos no celular neste aparelho: semchave | nosuporte | ios | negado | desligado | ligado
export async function estadoAvisos(chavePublica) {
  if (!chavePublica) return 'semchave';
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const instalado = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (ios && !instalado) return 'ios';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'nosuporte';
  if (Notification.permission === 'denied') return 'negado';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    return sub && Notification.permission === 'granted' ? 'ligado' : 'desligado';
  } catch { return 'desligado'; }
}

// Pede a permissão (abre a janela do sistema) e registra este aparelho. Devolve 'ligado', 'negado' ou 'desligado'.
export async function ativarAvisos(chavePublica) {
  if (semRede()) throw new TypeError('Failed to fetch');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'negado' : 'desligado';
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  const opcoes = { userVisibleOnly: true, applicationServerKey: chaveBinaria(chavePublica) };
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try { sub = await reg.pushManager.subscribe(opcoes); }
    catch (e) {
      // O serviço de avisos do Android às vezes falha na primeira tentativa: espera um pouco e tenta mais uma vez.
      if (!/push service|AbortError|registration/i.test(String(e?.message || e?.name || ''))) throw e;
      await new Promise((r) => setTimeout(r, 2000));
      await (await reg.pushManager.getSubscription())?.unsubscribe().catch(() => {});
      sub = await reg.pushManager.subscribe(opcoes);
    }
  }
  const r = await salvarAparelho(sub.toJSON(), nomeAparelho());
  if (r?.erro) throw new Error(r.erro);
  return 'ligado';
}

export default function AvisosCelular({ chavePublica, teste = false }) {
  const [estado, setEstado] = useState('carregando'); // carregando | semchave | nosuporte | ios | negado | desligado | ligado
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function ler() { setEstado(await estadoAvisos(chavePublica)); }
  useEffect(() => { ler(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function ativar() {
    setOcupado(true); setMsg('');
    try {
      const r = await ativarAvisos(chavePublica);
      if (r !== 'ligado') { setEstado(r); return; }
      setEstado('ligado'); setMsg(teste ? 'Pronto! Toque em "Enviar um teste" para ver chegar.' : 'Pronto! Os avisos vão chegar neste aparelho.');
    } catch (e) { setMsg(motivoAvisos(e)); }
    finally { setOcupado(false); }
  }
  async function desativar() {
    setOcupado(true); setMsg('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) { await removerAparelho(sub.endpoint); await sub.unsubscribe(); }
      setEstado('desligado'); setMsg('Avisos desligados neste aparelho.');
    } catch (e) { setMsg(falhaDeRede(e) ? 'Sem internet. Para desligar os avisos, conecte-se e tente de novo.' : 'Não foi possível desligar agora. Tente de novo em instantes.'); }
    finally { setOcupado(false); }
  }
  async function testar() {
    setOcupado(true);
    try {
      if (semRede()) throw new TypeError('Failed to fetch');
      const r = await enviarTeste();
      setMsg(r?.erro ? r.erro : 'Teste enviado. Chega em até 15 segundos, mesmo com o app fechado.');
    } catch (e) { setMsg(falhaDeRede(e) ? MSG.semInternet : mensagemDeErro(e)); }
    finally { setOcupado(false); }
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
      {(estado === 'desligado' || estado === 'ligado') && (
        <div className="lin-chave" style={{ borderTop: 0 }}>
          <span>Receber avisos neste aparelho<small>{estado === 'ligado' ? 'Ligado: os avisos chegam aqui mesmo com o app fechado.' : 'Vale só para este celular ou computador. Em outro aparelho, ligue lá também.'}</small></span>
          <button type="button" role="switch" aria-checked={estado === 'ligado'} aria-label="Receber avisos neste aparelho" disabled={ocupado} className={`chave ${estado === 'ligado' ? 'on' : ''}`} onClick={estado === 'ligado' ? desativar : ativar} />
        </div>
      )}
      {estado === 'ligado' && teste && <button type="button" className="link-teste" disabled={ocupado} onClick={testar}>Enviar um teste</button>}
      {msg && <p style={{ ...txt, marginTop: 10 }} role="status">{msg}</p>}
    </div>
  );
}
