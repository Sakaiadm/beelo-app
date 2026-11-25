'use client';
// @arquivo  Foto.js: foto do dia da tarefa (câmera ou galeria), com data da foto.
// @tipo     componente
// @usa      lib/supabase/client, lib/rede, lib/exif, ./Icone
// @usado-por components/SugerirDesejo.js, components/Tarefa.js, components/TelaForms.js
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
// grande: prévia grande com "Tirar outra" / "Da galeria" (seção 42). aoMudar(caminho): avisa quando a foto fica pronta ou é refeita.
export default function Foto({ nome = 'foto', familia, membro, obrigatoria, soHoje, grande, aoMudar }) {
  const cam = useRef(null), gal = useRef(null);
  const [estado, setEstado] = useState({ caminho: '', previa: '', msg: '', em: '' });

  // @decisao a foto que foi trocada antes de concluir é apagada do armazenamento (a política 0029 só deixa apagar foto sem uso).
  function descartar(caminho) {
    if (caminho) supabaseBrowser().storage.from('rotina-fotos').remove([caminho]).catch(() => {});
  }
  async function escolher(e) {
    const arq = e.target.files?.[0];
    e.target.value = '';
    if (!arq) return;
    descartar(estado.caminho); aoMudar?.('');
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
      aoMudar?.(caminho);
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
      {grande ? (
        <div>
          {estado.previa && <img src={estado.previa} alt="Prévia da foto" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 14, border: '1px solid var(--borda)', display: 'block' }} />}
          <div style={{ display: 'flex', gap: 8, marginTop: estado.previa ? 8 : 0 }}>
            <button type="button" className="btn sec peq" style={{ flex: 1 }} onClick={() => cam.current.click()}><Icone nome="camera" tam={18} />{estado.previa ? 'Tirar outra' : 'Tirar foto'}</button>
            <button type="button" className="btn sec peq" style={{ flex: 1 }} onClick={() => gal.current.click()}><Icone nome="galeria" tam={18} />Da galeria</button>
          </div>
          <div style={{ fontSize: 'var(--f-apoio)', marginTop: 6, color: estado.msg.startsWith('Essa foto') ? 'var(--erro)' : 'var(--cinza)' }}>
            {estado.msg || (estado.previa ? 'Confira se a foto ficou boa. Se não, toque em Tirar outra.' : (obrigatoria ? 'Foto obrigatória' : 'Foto opcional') + (soHoje ? ' · de hoje' : ''))}
          </div>
        </div>
      ) : (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn sec peq icone" aria-label="Tirar foto" title="Tirar foto" onClick={() => cam.current.click()}><Icone nome="camera" tam={20} /></button>
        <button type="button" className="btn sec peq icone" aria-label="Escolher da galeria" title="Escolher da galeria" onClick={() => gal.current.click()}><Icone nome="galeria" tam={20} /></button>
        {estado.previa && <img src={estado.previa} alt="Prévia da foto" className="foto-mini" />}
        <span style={{ fontSize: 'var(--f-apoio)', color: estado.msg.startsWith('Essa foto') ? 'var(--erro)' : 'var(--cinza)' }}>
          {estado.msg || (obrigatoria ? 'Foto obrigatória' : 'Foto opcional') + (soHoje ? ' · de hoje' : '')}
        </span>
        </div>
      )}
    </div>
  );
}
