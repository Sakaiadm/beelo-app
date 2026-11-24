'use client';
import { useState } from 'react';
import AvatarUpload from './AvatarUpload';
import Avatar from './Avatar';
import CorFolha, { CorBotao } from './CorFolha';
import { salvarPerfil } from '@/app/acoes';

// Meu perfil: foto (ou avatar) e cor valem na hora, sem botão Salvar (Raio-X U64).
// Nome e papel aparecem como texto, sem cara de campo travado (U66). Pai e Mãe só trocam a foto aqui.
export default function MeusDados({ eu, papel, url, crianca, comCor = true }) {
  const [cor, setCor] = useState(eu.cor || '#1a6fe0');
  const [folha, setFolha] = useState(false);
  const [msg, setMsg] = useState('');
  const [salva, setSalva] = useState(eu.cor || '#1a6fe0');
  // A cor é guardada quando a folha fecha (a paleta completa muda a cada movimento do dedo).
  const fechar = () => {
    setFolha(false);
    if (cor === salva) return;
    const fd = new FormData(); fd.set('cor', cor);
    setMsg('Salvando…');
    salvarPerfil(null, fd).then((r) => { if (r?.erro) setMsg(r.erro); else { setSalva(cor); setMsg('Cor salva.'); } }).catch(() => setMsg('Sem internet. Tente de novo.'));
  };
  return (
    <div>
      <AvatarUpload familia={eu.familia_id} pasta={eu.id} atualUrl={url} atualAvatar={eu.avatar} rotulo={eu.nome} cor={cor} largo crianca={crianca} autoSalvar={salvarPerfil}
        lado={<div className="meu-nome"><b>{eu.nome}</b><small>{papel}</small></div>} />
      {comCor && <CorBotao cor={cor} rotulo="Minha cor" style={{ marginTop: 14 }} onClick={() => setFolha(true)} />}
      {msg && <p className="salvo-msg" role="status">{msg}</p>}
      {folha && (
        <CorFolha cor={cor} setCor={setCor} fechar={fechar} titulo="Minha cor"
          topo={<div className="cartao-l"><Avatar nome={eu.nome} cor={cor} tam={42} /><span><b>{eu.nome}</b><small className="peq-cinza">{papel}</small></span></div>} />
      )}
    </div>
  );
}
