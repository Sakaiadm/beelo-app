'use client';
import { useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Avatar from './Avatar';
import { CRIANCAS } from '@/lib/avatares';

// Recorta no centro (quadrado), reduz para 400px e remove os metadados.
export async function preparar(arquivo) {
  const img = await createImageBitmap(arquivo);
  const lado = Math.min(img.width, img.height), sx = (img.width - lado) / 2, sy = (img.height - lado) / 2;
  const c = document.createElement('canvas'); c.width = 400; c.height = 400;
  c.getContext('2d').drawImage(img, sx, sy, lado, lado, 0, 0, 400, 400);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}

// crianca: mostra o botão Avatar com os desenhos de criança. Para os demais, só foto ou imagem.
export default function AvatarUpload({ nome = 'avatar', familia, pasta, atualUrl, atualAvatar, rotulo, cor, quadrado, largo, crianca = false }) {
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
    <div className={largo ? 'foto-lin' : undefined} style={largo ? undefined : { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {st.caminho !== undefined && <input type="hidden" name={nome} value={st.caminho} />}
      <Avatar nome={rotulo} cor={cor} url={st.previa} avatar={st.caminho === undefined ? st.preset : st.caminho?.startsWith('preset:') ? st.caminho : ''} tam={largo ? 64 : 56} quadrado={quadrado} />
      <input ref={ref} type="file" accept="image/*" hidden onChange={escolher} />
      {(() => {
        const bc = largo ? 'btn sec' : 'btn sec peq';
        const botoes = <>
          <button type="button" className={bc} onClick={() => ref.current.click()}>{crianca ? 'Foto' : 'Foto ou imagem'}</button>
          {crianca && <button type="button" className={bc} aria-expanded={aberto} onClick={() => setAberto(!aberto)}>Avatar</button>}
          {(st.previa || st.preset || st.caminho) && <button type="button" className={bc} onClick={() => setSt({ caminho: '', previa: '', preset: '', msg: 'Removido. Toque em Salvar.' })}>Remover</button>}
        </>;
        return largo ? <div className="dupla">{botoes}</div> : botoes;
      })()}
      {st.msg && <span style={{ fontSize: 13, color: 'var(--cinza)', flexBasis: largo ? '100%' : undefined }}>{st.msg}</span>}
      {crianca && aberto && (
        <div style={{ flexBasis: '100%' }}>
          <div className="avatares">{CRIANCAS.map(([id, desc]) => (
            <button type="button" key={id} aria-label={`Avatar ${Number(id.slice(1))}: ${desc}`} aria-pressed={(st.caminho ?? st.preset) === `preset:${id}`}
              onClick={() => setSt({ caminho: `preset:${id}`, previa: '', preset: '', msg: 'Avatar escolhido. Toque em Salvar.' })}>
              <Avatar avatar={`preset:${id}`} tam={48} quadrado={quadrado} />
            </button>))}</div>
        </div>
      )}
    </div>
  );
}
