'use client';
// @arquivo   SugerirDesafio.js: a criança sugere um desafio para os pais aprovarem.
// @tipo      componente
// @usa       app/acoes-desafios (sugerirDesafio), components/Form
// @usado-por app/(app)/desafios/page.js (criança sem desafio)
// @banco     ra_desafio_sugestoes (SQL 0028, pela função ra_desafio_sugerir)
// @decisao   25/11 Thomas: criança PODE sugerir; quem cria o desafio continua sendo Pai ou Mãe.
import { useState } from 'react';
import Form from './Form';
import Icone from './Icone';
import { sugerirDesafio } from '@/app/acoes-desafios';

// itens: [{ id, t, d }] até 3 desafios do catálogo próprios para criança; esperando: títulos já sugeridos.
export default function SugerirDesafio({ itens, esperando = [] }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" className="btn sec bloco" style={{ borderStyle: 'dashed', marginBottom: 12 }} aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <Icone nome="mais" tam={18} />Sugerir um desafio
      </button>
      {esperando.length > 0 && <div className="aviso info">Esperando seus responsáveis: {esperando.join(', ')}.</div>}
      {aberto && (
        <div className="card" style={{ padding: '12px 18px' }}>
          <small className="peq-cinza" style={{ fontWeight: 700 }}>Qual você quer tentar? Seus responsáveis respondem.</small>
          {itens.map((c) => (
            <Form key={c.id} acao={sugerirDesafio} aoConcluir={() => setAberto(false)}>
              <input type="hidden" name="catalogo" value={c.id} />
              <div className="vit">
                <span className="corpo"><b>{c.t}</b><small>{c.d}</small></span>
                <button className="btn sec peq" disabled={esperando.includes(c.t)}>Sugerir</button>
              </div>
            </Form>
          ))}
        </div>
      )}
    </>
  );
}
