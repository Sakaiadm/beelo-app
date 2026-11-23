'use client';
import { useState } from 'react';
import Form from './Form';
import RepetirCampo, { opcaoDaTarefa } from './RepetirCampo';
import { salvarMinhaTela } from '@/app/acoes';

// Meu perfil: o responsável liga o tempo de tela para si. Vem desligado.
// Ligado, aparece o ícone "Tela" na barra e entra a tarefa "Lançar tempo de tela".
export default function TelaMinha({ ligado, telaTarefa, hoje }) {
  const [on, setOn] = useState(!!ligado);
  return (
    <Form acao={salvarMinhaTela} okTxt="Tempo de tela salvo.">
      {on && <input type="hidden" name="tela_ativo" value="1" />}
      <div className="lin-chave" style={{ borderTop: 0 }}>
        <span>Tempo de tela para mim<small>Vem desligado. Ao ligar, entra a tarefa “Lançar tempo de tela” e o ícone Tela aparece na barra.</small></span>
        <button type="button" role="switch" aria-checked={on} aria-label="Tempo de tela para mim" className={`chave ${on ? 'on' : ''}`} onClick={() => setOn(!on)} />
      </div>
      {on && (
        <div style={{ marginBottom: 12 }}>
          <RepetirCampo nome="tela" rotulo="Lançar tempo de tela · Repetir" inicial={opcaoDaTarefa(telaTarefa)} dataInicial={telaTarefa?.tipo === 'pontual' ? telaTarefa.data_inicio : null} hoje={hoje} />
        </div>
      )}
      <p className="peq-cinza" style={{ marginTop: 0 }}>Para as outras pessoas, ligue no cadastro de cada uma, em Cadastros &gt; Pessoas.</p>
      <button className="btn cheio">Salvar</button>
    </Form>
  );
}
