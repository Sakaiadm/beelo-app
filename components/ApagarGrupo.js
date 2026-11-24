'use client';
import { useState } from 'react';
import Form from './Form';
import { apagarGrupo } from '@/app/acoes';

// Apagar o grupo inteiro: abre a confirmação e pede para digitar o nome do grupo.
export default function ApagarGrupo({ nome }) {
  const [aberto, setAberto] = useState(false);
  const [txt, setTxt] = useState('');
  const confere = txt.trim().toLowerCase() === String(nome || '').trim().toLowerCase();
  if (!aberto) return <button type="button" className="btn perigo sec" onClick={() => setAberto(true)}>Apagar o grupo</button>;
  return (
    <Form acao={apagarGrupo}>
      <p style={{ margin: '0 0 10px', fontSize: 'var(--f-apoio)', lineHeight: 1.5 }}>
        Isto apaga <b>tudo</b> do grupo <b>{nome}</b>: pessoas, tarefas, fotos, tempo de tela, desafios e histórico. Não dá para desfazer.
        Se quiser guardar uma cópia, toque antes em Baixar meus dados.
      </p>
      <label htmlFor="ag-nome">Para confirmar, digite o nome do grupo: <b>{nome}</b></label>
      <input id="ag-nome" name="confirmar" value={txt} onChange={(e) => setTxt(e.target.value)} autoComplete="off" />
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="button" className="btn sec" onClick={() => { setAberto(false); setTxt(''); }}>Cancelar</button>
        <button className="btn perigo" disabled={!confere}>Apagar para sempre</button>
      </div>
    </Form>
  );
}
