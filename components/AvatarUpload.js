'use client';
import { useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Avatar from './Avatar';

// Recorta no centro (quadrado), reduz para 400px e remove os metadados.
async function preparar(arquivo) {
  const img = await createImageBitmap(arquivo);
  const lado = Math.min(img.width, img.height), sx = (img.width - lado) / 2, sy = (img.height - lado) / 2;
  const c = document.createElement('canvas'); c.width = 400; c.height = 400;
  c.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, 400, 400);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}

export default function AvatarUpload({ nome = 'avatar', familia, pasta, atualUrl, rotulo, cor, quadrado }) {
  const ref = useRef(null);
  const [st, setSt] = useState({ caminho: undefined, previa: atualUrl || '', msg: '' });
  async function escolher(e) {
    const arq = e.target.files?.[0]; if (!arq) return;
    setSt((s) => ({ ...s, msg: 'Enviando…' }));
    try {
      const blob = await preparar(arq);
      const caminho = `${familia}/${pasta}/avatar-${Date.now()}.jpg`;
      const { error } = await supabaseBrowser().storage.from('rotina-avatares').upload(caminho, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      setSt({ caminho, previa: URL.createObjectURL(blob), msg: 'Imagem pronta. Clique em Salvar.' });
    } catch { setSt((s) => ({ ...s, msg: 'Não foi possível enviar a imagem.' })); }
    e.target.value = '';
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {st.caminho !== undefined && <input type="hidden" name={nome} value={st.caminho} />}
      <Avatar nome={rotulo} cor={cor} url={st.previa} tam={56} quadrado={quadrado} />
      <input ref={ref} type="file" accept="image/*" hidden onChange={escolher} />
      <button type="button" className="btn sec peq" onClick={() => ref.current.click()}>{st.previa ? 'Trocar imagem' : 'Escolher imagem'}</button>
      {st.previa && <button type="button" className="btn sec peq" onClick={() => setSt({ caminho: '', previa: '', msg: 'Imagem removida. Clique em Salvar.' })}>Remover</button>}
      {st.msg && <span style={{ fontSize: 13, color: 'var(--cinza)' }}>{st.msg}</span>}
    </div>
  );
}
