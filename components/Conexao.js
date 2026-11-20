'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFila, enviarFila } from '@/lib/fila';

// Faixa discreta abaixo do topo: avisa quando está sem internet, mostra quantas ações estão guardadas
// no aparelho, envia tudo sozinha quando a conexão volta e conta o resultado (inclusive o que não deu).
export default function Conexao() {
  const router = useRouter();
  const fila = useFila();
  const [semRede, setSemRede] = useState(false);
  const [copia, setCopia] = useState(0); // quando a cópia mostrada foi guardada (0 = tela atual)
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState('');
  const [problemas, setProblemas] = useState([]);
  const [sessao, setSessao] = useState(false);
  const ocupado = useRef(false);

  // Confere de verdade se a internet voltou (o "online" do celular às vezes engana).
  const temInternet = useCallback(async () => {
    if (navigator.onLine === false) return false;
    try { const r = await fetch('/manifest.json?ping=' + Date.now(), { cache: 'no-store' }); return r.ok; } catch { return false; }
  }, []);

  const sincronizar = useCallback(async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    try {
      if (!(await temInternet())) { setSemRede(true); return; }
      setSemRede(false);
      const eraCopia = !!self.__raCopia;
      self.__raCopia = 0; setCopia(0);
      let res = null;
      const tinha = JSON.parse(localStorage.getItem('ra_fila_v1') || '[]').length > 0;
      if (tinha) {
        setEnviando(true);
        res = await enviarFila();
        setEnviando(false);
        if (res.parou === 'rede') setSemRede(true);
        setSessao(res.parou === 'sessao');
        if (res.recusados.length) setProblemas((p) => [...p, ...res.recusados]);
        if (res.enviados.length) {
          setPronto(res.enviados.length === 1 ? `Pronto! O que ficou guardado foi enviado: ${res.enviados[0]}.` : `Pronto! ${res.enviados.length} ações guardadas no aparelho foram enviadas.`);
          setTimeout(() => setPronto(''), 8000);
        }
      }
      if (eraCopia || res?.enviados.length || res?.recusados.length) router.refresh();
    } catch {
      setEnviando(false);
    } finally { ocupado.current = false; }
  }, [router, temInternet]);

  useEffect(() => {
    if (self.__raCopia) { setCopia(self.__raCopia); setSemRede(true); }
    if (navigator.onLine === false) setSemRede(true);
    const caiu = () => setSemRede(true);
    window.addEventListener('offline', caiu);
    window.addEventListener('ra-sem-rede', caiu);
    window.addEventListener('online', sincronizar);
    // Ao abrir, envia o que ficou guardado de antes (se houver e se tiver internet).
    sincronizar();
    return () => {
      window.removeEventListener('offline', caiu);
      window.removeEventListener('ra-sem-rede', caiu);
      window.removeEventListener('online', sincronizar);
    };
  }, [sincronizar]);

  // Enquanto estiver sem rede (ou com algo guardado), confere de tempos em tempos se a conexão voltou.
  useEffect(() => {
    if (!semRede && !fila.length) return;
    const t = setInterval(() => { if (navigator.onLine !== false) sincronizar(); }, 20000);
    return () => clearInterval(t);
  }, [semRede, fila.length, sincronizar]);

  const n = fila.length;
  const guardadas = n ? ` ${n === 1 ? '1 ação está guardada' : `${n} ações estão guardadas`} no aparelho e ${n === 1 ? 'será enviada' : 'serão enviadas'} quando a internet voltar.` : '';
  const quando = copia ? horaDaCopia(copia) : '';

  if (!semRede && !enviando && !pronto && !problemas.length && !sessao && !n) return null;
  return (
    <div className="faixa-rede">
      {semRede && (
        <div className="aviso info" role="status">
          Sem internet.{quando ? ` Você está vendo a tela salva ${quando}.` : ''}
          {guardadas || ' O que você marcar fica guardado no aparelho sempre que possível.'}
        </div>
      )}
      {!semRede && enviando && <div className="aviso info" role="status">Internet de volta. Enviando o que ficou guardado no aparelho…</div>}
      {!semRede && !enviando && n > 0 && !sessao && <div className="aviso info" role="status">{guardadas.trim().replace(/^./, (c) => c.toUpperCase())}</div>}
      {sessao && (
        <div className="aviso erro" role="alert">
          Sua sessão expirou e {n === 1 ? '1 ação guardada ainda não foi enviada' : `${n} ações guardadas ainda não foram enviadas`}. <a href="/login?expirou=1">Entre de novo</a> neste aparelho para enviar.
        </div>
      )}
      {pronto && <div className="aviso ok" role="status">{pronto}</div>}
      {problemas.length > 0 && (
        <div className="aviso erro" role="alert">
          {problemas.map((p, i) => <div key={i}>Não deu para enviar {p.rotulo || 'uma ação guardada'}: {p.erro.replace(/\.?$/, '.')}</div>)}
          <div style={{ fontWeight: 500, marginTop: 6 }}>Confira na tela e faça de novo, se precisar.</div>
          <button type="button" className="btn sec peq" style={{ marginTop: 8 }} onClick={() => setProblemas([])}>Entendi</button>
        </div>
      )}
    </div>
  );
}

function horaDaCopia(ts) {
  const d = new Date(ts), hoje = new Date();
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === hoje.toDateString()) return `às ${hora}`;
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return `ontem às ${hora}`;
  return `em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`;
}
