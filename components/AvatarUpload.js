'use client';
import { useEffect, useRef, useState } from 'react';
import { MSG, semRede, falhaDeRede, comLimite, avisarFalhaDeRede } from '@/lib/rede';
import { supabaseBrowser } from '@/lib/supabase/client';
import Avatar from './Avatar';
import Icone from './Icone';
import { CRIANCAS } from '@/lib/avatares';

// Recorta no centro (quadrado), reduz para 400px e remove os metadados.
export async function preparar(arquivo) {
  const img = await createImageBitmap(arquivo);
  const lado = Math.min(img.width, img.height), sx = (img.width - lado) / 2, sy = (img.height - lado) / 2;
  const c = document.createElement('canvas'); c.width = 400; c.height = 400;
  c.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, 400, 400);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}

// Foto redonda com X (remover) e lápis (trocar). crianca: o lápis oferece Foto ou Avatar. lado: o que fica ao lado da foto (ex.: campo Nome).
export default function AvatarUpload({ nome = 'avatar', familia, pasta, atualUrl, atualAvatar, rotulo, cor, quadrado, largo, crianca = false, lado }) {
  const ref = useRef(null), caixa = useRef(null);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!menu) return;
    const fora = (e) => { if (caixa.current && !caixa.current.contains(e.target) && !e.target.closest?.('.lapis-badge, .foto-btn')) setMenu(false); };
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, [menu]);
  const [st, setSt] = useState({ caminho: undefined, previa: atualUrl || '', preset: atualAvatar?.startsWith('preset:') ? atualAvatar : '', msg: '' });
  const [aberto, setAberto] = useState(false);
  async function escolher(e) {
    const arq = e.target.files?.[0]; if (!arq) return;
    if (semRede()) { avisarFalhaDeRede(); setSt((s) => ({ ...s, msg: MSG.semInternetFoto })); e.target.value = ''; return; }
    setSt((s) => ({ ...s, msg: 'Enviando…' }));
    try {
      const blob = await preparar(arq);
      const caminho = `${familia}/${pasta}/avatar-${Date.now()}.jpg`;
      const r = await comLimite(supabaseBrowser().storage.from('rotina-avatares').upload(caminho, blob, { contentType: 'image/jpeg' }), 60000);
      if (r.tempoEsgotado) throw new Error('timeout');
      if (r.error) throw r.error;
      setSt({ caminho, previa: URL.createObjectURL(blob), preset: '', msg: 'Imagem pronta. Clique em Salvar.' });
    } catch (err) { setSt((s) => ({ ...s, msg: falhaDeRede(err) ? MSG.semInternetFoto : 'Não foi possível enviar a imagem. Tente de novo.' })); }
    e.target.value = '';
  }
  // Tocar na foto ou no lápis: adulto abre direto a escolha do celular (câmera ou galeria); criança escolhe entre Foto e Avatar.
  const tocar = () => { if (crianca) setMenu((v) => !v); else ref.current.click(); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: largo ? 16 : 14, flexWrap: 'wrap' }}>
      {st.caminho !== undefined && <input type="hidden" name={nome} value={st.caminho} />}
      <span style={{ position: 'relative', flex: 'none', display: 'inline-flex' }}>
        <button type="button" className="foto-btn" aria-label="Trocar foto" onClick={tocar}>
          <Avatar nome={rotulo} cor={cor} url={st.previa} avatar={st.caminho === undefined ? st.preset : st.caminho?.startsWith('preset:') ? st.caminho : ''} tam={largo ? 64 : 56} quadrado={quadrado} />
        </button>
        {(st.previa || st.preset || st.caminho) && <button type="button" className="x-badge" aria-label="Remover foto" title="Remover foto" onClick={() => { setMenu(false); setAberto(false); setSt({ caminho: '', previa: '', preset: '', msg: 'Removido. Toque em Salvar.' }); }}><Icone nome="x" tam={13} /></button>}
        <button type="button" className="x-badge lapis-badge" aria-label="Trocar foto" title="Trocar foto" aria-expanded={crianca ? menu : undefined} onClick={tocar}><Icone nome="lapis" tam={13} /></button>
        {crianca && menu && (
          <div className="folha-lista foto-menu" role="menu" ref={caixa}>
            <button type="button" role="menuitem" onClick={() => { setMenu(false); setAberto(false); ref.current.click(); }}><span className="ic"><Icone nome="galeria" tam={20} /></span>Foto ou imagem</button>
            <button type="button" role="menuitem" onClick={() => { setMenu(false); setAberto(true); }}><Avatar avatar="preset:k01" tam={22} />Avatar</button>
          </div>
        )}
      </span>
      <input ref={ref} type="file" accept="image/*" hidden onChange={escolher} />
      {lado && <div style={{ flex: 1, minWidth: 0 }}>{lado}</div>}
      {st.msg && <span style={{ fontSize: 'var(--f-apoio)', color: 'var(--cinza)', flexBasis: '100%' }}>{st.msg}</span>}
      {crianca && aberto && (
        <div style={{ flexBasis: '100%' }}>
          <div className="avatares">{CRIANCAS.map(([id, desc]) => (
            <button type="button" key={id} aria-label={`Avatar ${Number(id.slice(1))}: ${desc}`} aria-pressed={(st.caminho ?? st.preset) === `preset:${id}`}
              onClick={() => { setAberto(false); setSt({ caminho: `preset:${id}`, previa: '', preset: '', msg: 'Avatar escolhido. Toque em Salvar.' }); }}>
              <Avatar avatar={`preset:${id}`} tam={48} quadrado={quadrado} />
            </button>))}</div>
        </div>
      )}
    </div>
  );
}
