'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from '@/components/Icone';
import { estadoAvisos, ativarAvisos, motivoAvisos } from '@/components/AvisosCelular';

// Cartão que convida a ligar os avisos no celular. Aparece só enquanto eles estão desligados
// neste aparelho e some de vez quando a pessoa ativa ou toca em "Agora não".
const CHAVE = 'avisos-convite';
const ler = () => { try { return localStorage.getItem(CHAVE); } catch { return null; } };
const guardar = (v) => { try { localStorage.setItem(CHAVE, v); } catch {} };

export default function AvisosConvite({ chavePublica, texto }) {
  const [estado, setEstado] = useState(null); // null = escondido
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (ler()) return;
    estadoAvisos(chavePublica).then((e) => { if (e === 'desligado' || e === 'ios') setEstado(e); }).catch(() => {});
  }, [chavePublica]);

  if (!estado) return null;
  const fechar = () => { guardar('fechado'); setEstado(null); };

  async function ativar() {
    setOcupado(true); setMsg('');
    try {
      const r = await ativarAvisos(chavePublica);
      guardar('respondido');
      if (r === 'ligado') { setEstado('pronto'); setTimeout(() => setEstado(null), 4000); }
      else setEstado(null);
    } catch (e) { setMsg(motivoAvisos(e)); }
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
                ? <Link prefetch={false} className="btn peq" href="/perfil" onClick={() => guardar('respondido')}>Ver como instalar</Link>
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
