'use client';
// @arquivo  ChegadaLembrete.js: cartão suave em Hoje: "Já chegou?", com o botão de chegada e "Ainda não".
// @tipo     componente
// @usa      ./Form, ./Icone, app/acoes (cheguei), lib/festa
// @usado-por app/(app)/hoje/page.js
// @regra    aparece só para a própria pessoa, 15 min depois do horário, se os pais ligaram o lembrete na tarefa.
// @cuidado  "Ainda não" só esconde o cartão neste aparelho (a tarefa continua pendente); sem culpa, sem alarme.
import { useState } from 'react';
import Form from './Form';
import Icone from './Icone';
import { cheguei } from '@/app/acoes';
import { prepararSom, comemorar } from '@/lib/festa';

export default function ChegadaLembrete({ oc, pergunta, botao }) {
  const [oculto, setOculto] = useState(false);
  if (oculto) return null;
  return (
    <div className="avisos-conv" role="status">
      <span className="ic"><Icone nome="relogio" tam={22} cor="#1a6fe0" /></span>
      <div>
        <h2>{pergunta}</h2>
        <p>Toque em {botao} quando chegar. Sem pressa.</p>
        <div className="acoes">
          <Form acao={cheguei} discreto rotulo={`${botao}: ${pergunta}`} aoConcluir={() => comemorar({})}>
            <input type="hidden" name="oc" value={oc} />
            <button className="btn peq" onPointerDown={prepararSom} onKeyDown={prepararSom}>{botao}</button>
          </Form>
          <button type="button" className="btn sec peq" onClick={() => setOculto(true)}>Ainda não</button>
        </div>
      </div>
    </div>
  );
}
