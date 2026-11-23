'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from '@/components/Icone';
import { estadoAvisos, ativarAvisos, motivoAvisos } from '@/components/AvisosCelular';

// Cartão que convida a ligar os avisos no celular. Aparece só enquanto eles estão desligados
// neste aparelho. "Agora não" dá uma pausa de 14 dias; se der erro ao ativar, pausa de 3 dias
// (dá para tentar a qualquer hora em Meu perfil). A pausa fica guardada no aparelho e no cookie,
// então não volta a cada atualização do app.
const CHAVE = 'avisos-convite';
const DIA = 86400000;
function pausadoAte() {
  let v = null;
  try { v = localStorage.getItem(CHAVE); } catch {}
  if (!v) { const m = document.cookie.match(/(?:^|; )avisos_convite=(\d+)/); v = m ? m[1] : null; }
  if (!v) return 0;
  if (!/^\d+$/.test(v)) { const ate = Date.now() + 14 * DIA; pausar(14); return ate; } // escolha antiga: vira pausa de 14 dias
  return Number(v);
}
function pausar(dias) {
  const ate = String(Date.now() + dias * DIA);
  try { localStorage.setItem(CHAVE, ate); } catch {}
  try { document.cookie = `avisos_convite=${ate}; path=/; max-age=${dias * 86400}; samesite=lax`; } catch {}
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
  const fechar = () => { pausar(14); setEstado(null); };

  async function ativar() {
    setOcupado(true); setMsg('');
    try {
      const r = await ativarAvisos(chavePublica);
      pausar(r === 'ligado' ? 365 : 14);
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
                ? <Link prefetch={false} className="btn peq" href="/perfil" onClick={() => pausar(14)}>Ver como instalar</Link>
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
