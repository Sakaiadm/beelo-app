'use client';
import { useState } from 'react';
import Form from './Form';
import Icone from './Icone';
import { editarPremio } from '@/app/acoes-desafios';

// Vitrine: ajustar o nome e o preço de um prêmio (as estrelinhas já guardadas não mudam).
export default function EditarPremio({ premio, un }) {
  const [aberto, setAberto] = useState(false);
  if (!aberto) return <button type="button" className="btn sec peq icone" aria-label={`Editar ${premio.nome}`} title="Editar" onClick={() => setAberto(true)}><Icone nome="lapis" tam={18} /></button>;
  return (
    <Form acao={editarPremio} aoConcluir={() => setTimeout(() => setAberto(false), 900)} style={{ flexBasis: '100%' }}>
      <input type="hidden" name="id" value={premio.id} />
      <div className="dupla">
        <div><label htmlFor={`en-${premio.id}`} style={{ marginTop: 0 }}>Nome</label><input id={`en-${premio.id}`} name="nome" maxLength={80} defaultValue={premio.nome} /></div>
        <div><label htmlFor={`ec-${premio.id}`} style={{ marginTop: 0 }}>{un[0].toUpperCase() + un.slice(1)}</label><input id={`ec-${premio.id}`} name="custo" type="number" min="1" max="1000" inputMode="numeric" defaultValue={premio.custo} /></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn peq">Salvar</button>
        <button type="button" className="btn sec peq" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </Form>
  );
}
