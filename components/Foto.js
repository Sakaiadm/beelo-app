'use client';
import { useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { MSG, semRede, falhaDeRede, comLimite, avisarFalhaDeRede } from '@/lib/rede';
import { dataDaFoto } from '@/lib/exif';
import Icone from './Icone';

async function comprimir(arquivo) {
  const img = await createImageBitmap(arquivo);
  const max = 1600, esc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.8));
}

const dia = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const horaBR = () => Number(new Date().toLocaleString('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }));
// Foto do dia: vale a de hoje (e, até 7h da manhã, a de ontem). Câmera ou galeria.
function fotoDeHoje(d) {
  if (d.getTime() > Date.now() + 15 * 60e3) return false;
  const hoje = dia(new Date()), ontem = dia(new Date(Date.now() - 86400e3));
  return dia(d) === hoje || (dia(d) === ontem && horaBR() < 7);
}
export default function Foto({ nome = 'foto', familia, membro, obrigatoria, soHoje }) {
  const cam = useRef(null), gal = useRef(null);
  const [estado, setEstado] = useState({ caminho: '', previa: '', msg: '', em: '' });

  async function escolher(e) {
    const arq = e.target.files?.[0];
    e.target.value = '';
    if (!arq) return;
    const { data } = await dataDaFoto(arq);
    if (soHoje && !fotoDeHoje(data)) {
      const quando = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      setEstado({ caminho: '', previa: '', em: '', msg: `Essa foto é de ${quando}. Use uma foto de hoje.` });
      return;
    }
    if (semRede()) { avisarFalhaDeRede(); setEstado({ caminho: '', previa: '', em: '', msg: MSG.semInternetFoto }); return; }
    setEstado({ caminho: '', previa: '', em: '', msg: 'Enviando foto…' });
    try {
      const blob = await comprimir(arq);
      const caminho = `${familia}/${membro}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const r = await comLimite(supabaseBrowser().storage.from('rotina-fotos').upload(caminho, blob, { contentType: 'image/jpeg' }), 60000);
      if (r.tempoEsgotado) { setEstado({ caminho: '', previa: '', msg: 'A internet está lenta e a foto não terminou de enviar. Tente de novo, de preferência no Wi-Fi.', em: '' }); return; }
      if (r.error) throw r.error;
      setEstado({ caminho, previa: URL.createObjectURL(blob), msg: '', em: data.toISOString() });
    } catch (err) {
      if (falhaDeRede(err)) avisarFalhaDeRede();
      setEstado({ caminho: '', previa: '', msg: falhaDeRede(err) ? MSG.semInternetFoto : 'Não foi possível enviar a foto. Tente de novo.', em: '' });
    }
  }

  return (
    <div>
      <input type="hidden" name={nome} value={estado.caminho} />
      <input type="hidden" name={`${nome}_em`} value={estado.em} />
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={escolher} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={escolher} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn sec peq icone" aria-label="Tirar foto" title="Tirar foto" onClick={() => cam.current.click()}><Icone nome="camera" tam={20} /></button>
        <button type="button" className="btn sec peq icone" aria-label="Escolher da galeria" title="Escolher da galeria" onClick={() => gal.current.click()}><Icone nome="galeria" tam={20} /></button>
        {estado.previa && <img src={estado.previa} alt="Prévia da foto" className="foto-mini" />}
        <span style={{ fontSize: 'var(--f-apoio)', color: estado.msg.startsWith('Essa foto') ? 'var(--erro)' : 'var(--cinza)' }}>
          {estado.msg || (obrigatoria ? 'Foto obrigatória' : 'Foto opcional') + (soHoje ? ' · de hoje' : '')}
        </span>
      </div>
    </div>
  );
}
