'use client';
import { useState } from 'react';
import Form from './Form';

// Botão que pergunta "Tem certeza?" antes de enviar (usado em excluir e desativar).
export default function ConfirmarBotao({ acao, campos, rotulo, pergunta, sim = 'Sim', titulo, classe = 'btn sec peq' }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Form acao={acao} simples>
      {Object.entries(campos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {!aberto ? (
        <button type="button" className={classe} title={titulo} onClick={() => setAberto(true)}>{rotulo}</button>
      ) : (
        <div role="alertdialog" aria-label={pergunta} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <b style={{ fontSize: 13 }}>{pergunta}</b>
          <button className="btn perigo peq">{sim}</button>
          <button type="button" className="btn sec peq" onClick={() => setAberto(false)}>Não</button>
        </div>
      )}
    </Form>
  );
}
