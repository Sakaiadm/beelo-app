'use client';
import { useState } from 'react';
import Form from './Form';
import { excluirTarefa } from '@/app/acoes';

// Excluir pede confirmação antes de apagar.
export default function ExcluirTarefa({ id, voltar }) {
  const [pergunta, setPergunta] = useState(false);
  return (
    <Form acao={excluirTarefa} className="card">
      <input type="hidden" name="id" value={id} />
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--cinza)' }}>Excluir para de gerar a tarefa daqui para frente. O histórico já feito continua nos relatórios.</p>
      {!pergunta ? (
        <button type="button" className="btn perigo" onClick={() => setPergunta(true)}>Excluir tarefa</button>
      ) : (
        <div>
          <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Tem certeza que quer excluir esta tarefa?</p>
          <div className="acoes">
            <button className="btn perigo">Sim, excluir</button>
            <button type="button" className="btn sec" onClick={() => setPergunta(false)}>Não, voltar</button>
          </div>
        </div>
      )}
    </Form>
  );
}
