'use client';
import { useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icone from './Icone';

// Comprime no aparelho (o canvas descarta EXIF/GPS) e envia ao bucket privado.
async function comprimir(arquivo) {
  const img = await createImageBitmap(arquivo);
  const max = 1600, esc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.8));
}

export default function Foto({ nome = 'foto', familia, membro, obrigatoria }) {
  const cam = useRef(null), gal = useRef(null);
  const [estado, setEstado] = useState({ caminho: '', previa: '', msg: '' });

  async function escolher(e) {
    const arq = e.target.files?.[0];
    if (!arq) return;
    setEstado({ caminho: '', previa: '', msg: 'Enviando foto…' });
    try {
      const blob = await comprimir(arq);
      const caminho = `${familia}/${membro}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error } = await supabaseBrowser().storage.from('rotina-fotos').upload(caminho, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      setEstado({ caminho, previa: URL.createObjectURL(blob), msg: '' });
    } catch {
      setEstado({ caminho: '', previa: '', msg: 'Não foi possível enviar a foto. Tente de novo.' });
    }
    e.target.value = '';
  }

  return (
    <div>
      <input type="hidden" name={nome} value={estado.caminho} />
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={escolher} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={escolher} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn sec peq" onClick={() => cam.current.click()}><Icone nome="camera" tam={18} />Câmera</button>
        <button type="button" className="btn sec peq" onClick={() => gal.current.click()}><Icone nome="galeria" tam={18} />Galeria</button>
        {estado.previa && <img src={estado.previa} alt="Prévia da foto" className="foto-mini" />}
        <span style={{ fontSize: 13, color: 'var(--cinza)' }}>{estado.msg || (obrigatoria ? 'Foto obrigatória' : 'Foto opcional')}</span>
      </div>
    </div>
  );
}
