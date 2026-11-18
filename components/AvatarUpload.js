'use client';
import { useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Avatar from './Avatar';
import { MODERNOS, DIVERTIDOS } from '@/lib/avatares';

// Recorta no centro (quadrado), reduz para 400px e remove os metadados.
async function preparar(arquivo) {
  const img = await createImageBitmap(arquivo);
  const lado = Math.min(img.width, img.height), sx = (img.width - lado) / 2, sy = (img.height - lado) / 2;
  const c = document.createElement('canvas'); c.width = 400; c.height = 400;
  c.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, 400, 400);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}

export default function AvatarUpload({ nome = 'avatar', familia, pasta, atualUrl, atualAvatar, rotulo, cor, quadrado }) {
  const ref = useRef(null);
  const [st, setSt] = useState({ caminho: undefined, previa: atualUrl || '', preset: atualAvatar?.startsWith('preset:') ? atualAvatar : '', msg: '' });
  const [aberto, setAberto] = useState(false);
  async function escolher(e) {
    const arq = e.target.files?.[0]; if (!arq) return;
    setSt((s) => ({ ...s, msg: 'Enviando…' }));
    try {
      const blob = await preparar(arq);
      const caminho = `${familia}/${pasta}/avatar-${Date.now()}.jpg`;
      const { error } = await supabaseBrowser().storage.from('rotina-avatares').upload(caminho, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      setSt({ caminho, previa: URL.createObjectURL(blob), preset: '', msg: 'Imagem pronta. Clique em Salvar.' });
    } catch { setSt((s) => ({ ...s, msg: 'Não foi possível enviar a imagem.' })); }
    e.target.value = '';
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {st.caminho !== undefined && <input type="hidden" name={nome} value={st.caminho} />}
      <Avatar nome={rotulo} cor={cor} url={st.previa} avatar={st.caminho === undefined ? st.preset : st.caminho?.startsWith('preset:') ? st.caminho : ''} tam={56} quadrado={quadrado} />
      <input ref={ref} type="file" accept="image/*" hidden onChange={escolher} />
      <button type="button" className="btn sec peq" onClick={() => ref.current.click()}>Foto</button>
      <button type="button" className="btn sec peq" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>Avatar</button>
      {(st.previa || st.preset || st.caminho) && <button type="button" className="btn sec peq" onClick={() => setSt({ caminho: '', previa: '', preset: '', msg: 'Removido. Toque em Salvar.' })}>Remover</button>}
      {st.msg && <span style={{ fontSize: 13, color: 'var(--cinza)' }}>{st.msg}</span>}
      {aberto && (
        <div style={{ flexBasis: '100%' }}>
          {[['Moderno', MODERNOS.map((m) => m[0])], ['Divertido', DIVERTIDOS.map((d) => d[0])]].map(([titulo, ids]) => (
            <div key={titulo}><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cinza)', marginTop: 8 }}>{titulo}</div>
              <div className="avatares">{ids.map((id) => (
                <button type="button" key={id} aria-label={`Avatar ${titulo} ${id}`} aria-pressed={st.caminho === `preset:${id}`}
                  onClick={() => setSt({ caminho: `preset:${id}`, previa: '', preset: '', msg: 'Avatar escolhido. Toque em Salvar.' })}>
                  <Avatar avatar={`preset:${id}`} tam={44} quadrado={quadrado} />
                </button>))}</div></div>
          ))}
        </div>
      )}
    </div>
  );
}
