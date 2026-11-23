'use client';
import { useState } from 'react';
import Form from './Form';
import AvatarUpload from './AvatarUpload';
import Avatar from './Avatar';
import Icone from './Icone';
import CorFolha, { CorBotao } from './CorFolha';
import { salvarPerfil } from '@/app/acoes';

// Meu perfil de quem é acompanhado: foto ou avatar e cor a pessoa troca; nome e papel ficam fixos.
export default function MeusDados({ eu, papel, url, crianca }) {
  const [cor, setCor] = useState(eu.cor || '#1a6fe0');
  const [folha, setFolha] = useState(false);
  const fixo = (txt, id) => <div className="campo-fixo" id={id}>{txt}<Icone nome="cadeado" tam={16} rotulo="Fixo" /></div>;
  return (
    <Form acao={salvarPerfil} okTxt="Salvo.">
      {cor !== (eu.cor || '#1a6fe0') && <input type="hidden" name="cor" value={cor} />}
      <AvatarUpload familia={eu.familia_id} pasta={eu.id} atualUrl={url} atualAvatar={eu.avatar} rotulo={eu.nome} cor={cor} largo crianca={crianca}
        lado={<><label style={{ marginTop: 0 }}>Nome</label>{fixo(eu.nome)}</>} />
      <label>Papel</label>
      {fixo(papel)}
      <CorBotao cor={cor} rotulo="Minha cor" style={{ marginTop: 14 }} onClick={() => setFolha(true)} />
      <button className="btn cheio" style={{ marginTop: 16 }}>Salvar</button>
      {folha && (
        <CorFolha cor={cor} setCor={setCor} fechar={() => setFolha(false)} titulo="Minha cor"
          topo={<div className="cartao-l"><Avatar nome={eu.nome} cor={cor} tam={42} /><span><b>{eu.nome}</b><small className="peq-cinza">{papel}</small></span></div>} />
      )}
    </Form>
  );
}
