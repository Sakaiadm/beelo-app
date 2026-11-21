'use client';
import { useRef, useState } from 'react';
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

// crianca: mostra o botão Avatar com os desenhos de criança. Para os demais, só foto ou imagem.
export default function AvatarUpload({ nome = 'avatar', familia, pasta, atualUrl, atualAvatar, rotulo, cor, quadrado, largo, crianca = false }) {
  const ref = useRef(null), cam = useRef(null);
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
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: largo ? 14 : 12, flexWrap: 'wrap' }}>
      {st.caminho !== undefined && <input type="hidden" name={nome} value={st.caminho} />}
      <span style={{ position: 'relative', flex: 'none', display: 'inline-flex' }}>
        <Avatar nome={rotulo} cor={cor} url={st.previa} avatar={st.caminho === undefined ? st.preset : st.caminho?.startsWith('preset:') ? st.caminho : ''} tam={largo ? 64 : 56} quadrado={quadrado} />
        {(st.previa || st.preset || st.caminho) && <button type="button" className="x-badge" aria-label="Remover foto" title="Remover foto" onClick={() => setSt({ caminho: '', previa: '', preset: '', msg: 'Removido. Toque em Salvar.' })}><Icone nome="x" tam={13} /></button>}
      </span>
      <input ref={cam} type="file" accept="image/*" capture={largo ? 'user' : 'environment'} hidden onChange={escolher} />
      <input ref={ref} type="file" accept="image/*" hidden onChange={escolher} />
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn peq icone" aria-label="Tirar foto" title="Tirar foto" onClick={() => cam.current.click()}><Icone nome="camera" tam={20} /></button>
        <button type="button" className="btn peq icone" aria-label="Escolher imagem" title="Escolher imagem" onClick={() => ref.current.click()}><Icone nome="galeria" tam={20} /></button>
        {crianca && <button type="button" className="btn peq" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>Avatar</button>}
      </span>
      {st.msg && <span style={{ fontSize: 13, color: 'var(--cinza)', flexBasis: '100%' }}>{st.msg}</span>}
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
