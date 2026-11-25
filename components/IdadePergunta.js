'use client';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { salvarIdade } from '@/app/acoes';

// Painel (Pai e Mãe): "Quantos anos a Alice tem?", uma semana depois do cadastro, uma pessoa por vez.
// "Agora não" volta em 14 dias, depois em 30, e depois da 3ª vez não pergunta mais (igual ao convite dos avisos).
// Fica guardado neste aparelho. O app guarda só o ano aproximado, nunca a data de nascimento.
const DIA = 86400000;
const ler = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export default function IdadePergunta({ pessoas }) {
  const [p, setP] = useState(null);
  const [idade, setIdade] = useState('');
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    setP(pessoas.find((x) => Number(ler(`idade-n-${x.id}`) || 0) < 3 && Number(ler(`idade-ate-${x.id}`) || 0) < Date.now()) || null);
  }, [pessoas]);
  if (!p) return null;
  const primeiro = p.nome.split(' ')[0];
  const fechar = () => {
    const n = Number(ler(`idade-n-${p.id}`) || 0) + 1;
    gravar(`idade-n-${p.id}`, String(n));
    gravar(`idade-ate-${p.id}`, String(Date.now() + (n === 1 ? 14 : 30) * DIA));
    setP(null);
  };
  async function salvar() {
    setOcupado(true); setMsg('');
    const fd = new FormData(); fd.set('membro', p.id); fd.set('idade', idade);
    try {
      const r = await salvarIdade(null, fd);
      if (r?.erro) setMsg(r.erro); else { setMsg(''); setP(null); }
    } catch { setMsg('Sem internet. Tente de novo.'); }
    finally { setOcupado(false); }
  }
  return (
    <div className="avisos-conv" role="region" aria-label={`Idade de ${primeiro}`}>
      <span className="ic" style={{ background: 'none' }}><Avatar nome={p.nome} cor={p.cor} avatar={p.avatar} tam={36} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2>Quantos anos {p.sexo === 'm' ? 'o ' : p.sexo === 'f' ? 'a ' : ''}{primeiro} tem?</h2>
        <p>Assim o beelo sugere o jeito certo de ver, conforme {p.sexo === 'm' ? 'ele' : p.sexo === 'f' ? 'ela' : 'a pessoa'} cresce.</p>
        <select aria-label="Idade" value={idade} onChange={(e) => setIdade(e.target.value)} style={{ marginBottom: 10 }}>
          <option value="" disabled>Escolha a idade</option>
          {Array.from({ length: 15 }, (_, i) => i + 3).map((n) => <option key={n} value={n}>{n} anos</option>)}
        </select>
        <div className="acoes">
          <button type="button" className="btn peq" disabled={ocupado || !idade} onClick={salvar}>Salvar</button>
          <button type="button" className="btn sec peq" disabled={ocupado} onClick={fechar}>Agora não</button>
        </div>
        {msg && <p role="status" style={{ margin: '10px 0 0' }}>{msg}</p>}
      </div>
    </div>
  );
}
