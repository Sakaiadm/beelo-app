'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from '@/components/Icone';
import { estadoAvisos, ativarAvisos, motivoAvisos } from '@/components/AvisosCelular';

// Cartão que convida a ligar os avisos no celular. Aparece só enquanto eles estão desligados
// neste aparelho, e no máximo 3 vezes: depois do 1º "Agora não" volta em 14 dias, depois do 2º
// em 30 dias, e depois do 3º não pergunta mais (dá para ativar a qualquer hora em Meu perfil).
// Erro ao ativar: pausa de 3 dias, sem contar como recusa. Fica guardado no aparelho e no cookie.
const CHAVE = 'avisos-convite';
const VEZES = 'avisos-convite-n';
const DIA = 86400000;
function lerCookie(nome) { const m = document.cookie.match(new RegExp('(?:^|; )' + nome + '=(\\d+)')); return m ? m[1] : null; }
function gravar(chave, cookie, valor, dias) {
  try { localStorage.setItem(chave, valor); } catch {}
  try { document.cookie = `${cookie}=${valor}; path=/; max-age=${Math.round(dias * 86400)}; samesite=lax`; } catch {}
}
function recusas() {
  let v = null;
  try { v = localStorage.getItem(VEZES); } catch {}
  return Number(v || lerCookie('avisos_convite_n') || 0);
}
function pausadoAte() {
  if (recusas() >= 3) return Infinity;
  let v = null;
  try { v = localStorage.getItem(CHAVE); } catch {}
  if (!v) v = lerCookie('avisos_convite');
  if (!v) return 0;
  if (!/^\d+$/.test(v)) { const ate = Date.now() + 14 * DIA; gravar(VEZES, 'avisos_convite_n', '1', 400); pausar(14); return ate; } // escolha antiga: conta como 1ª recusa
  return Number(v);
}
function pausar(dias) { gravar(CHAVE, 'avisos_convite', String(Date.now() + dias * DIA), dias); }
function recusar() {
  const n = recusas() + 1;
  gravar(VEZES, 'avisos_convite_n', String(n), 400);
  if (n < 3) pausar(n === 1 ? 14 : 30);
}

export default function AvisosConvite({ chavePublica, texto }) {
  const [estado, setEstado] = useState(null); // null = escondido
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (pausadoAte() > Date.now()) return;
    estadoAvisos(chavePublica).then((e) => { if (e === 'desligado' || e === 'ios') setEstado(e); }).catch(() => {});
  }, [chavePublica]);

  if (!estado) return null;
  const fechar = () => { recusar(); setEstado(null); };

  async function ativar() {
    setOcupado(true); setMsg('');
    try {
      const r = await ativarAvisos(chavePublica);
      if (r === 'ligado') pausar(365); else recusar();
      if (r === 'ligado') { setEstado('pronto'); setTimeout(() => setEstado(null), 4000); }
      else setEstado(null);
    } catch (e) { pausar(3); setMsg(motivoAvisos(e)); }
    finally { setOcupado(false); }
  }

  return (
    <div className="avisos-conv" role="region" aria-label="Avisos no celular">
      <span className="ic"><Icone nome="sino" tam={22} cor="var(--azul)" /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {estado === 'pronto' ? (
          <><h2>Avisos ativados</h2><p style={{ marginBottom: 0 }}>Pronto! Os avisos vão chegar neste celular.</p></>
        ) : (
          <>
            <h2>Quer receber os avisos também com o app fechado?</h2>
            <p>{texto} Você continua vendo tudo no sino.</p>
            <div className="acoes">
              {estado === 'ios'
                ? <Link prefetch={false} className="btn peq" href="/perfil" onClick={() => recusar()}>Ver como instalar</Link>
                : <button type="button" className="btn peq" disabled={ocupado} onClick={ativar}>Ativar avisos</button>}
              <button type="button" className="btn sec peq" disabled={ocupado} onClick={fechar}>Agora não</button>
            </div>
            {msg && <p role="status" style={{ margin: '10px 0 0' }}>{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
}
