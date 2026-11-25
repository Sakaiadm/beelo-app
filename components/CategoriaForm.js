'use client';
// @arquivo  CategoriaForm.js: formulário de categoria.
// @tipo     componente
// @usa      components/Form, components/ConfirmarBotao, app/acoes, lib/util
// @usado-por app/(app)/config/categorias/[id]/page.js, app/(app)/config/categorias/nova/page.js
import { useState } from 'react';
import Form from '@/components/Form';
import ConfirmarBotao from '@/components/ConfirmarBotao';
import { salvarCategoria, editarCategoria, excluirCategoria } from '@/app/acoes';
import { CORES_CAT, CORES_VIVAS, NOMES_CORES } from '@/lib/util';

// Edição (ou criação) de uma categoria: nome, paleta de bolinhas e prévia da etiqueta.
export default function CategoriaForm({ c }) {
  const [nome, setNome] = useState(c?.nome || '');
  const [cor, setCor] = useState(CORES_CAT[c?.cor] ? c.cor : 'azul');
  const [f, l] = CORES_CAT[cor];
  return (
    <div className="card cat-ed">
      <Form acao={c ? editarCategoria : salvarCategoria}>
        {c && <input type="hidden" name="id" value={c.id} />}
        <input type="hidden" name="cor" value={cor} />
        <p className="cat-previa">Como aparece nas tarefas: <span className="pilula" style={{ background: f, color: l }}>{nome.trim() || 'Nome'}</span></p>
        <label htmlFor="cat-nome">Nome</label>
        <input id="cat-nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={30} required autoFocus={!c} />
        <label>Cor <span className="cat-cor-nome">{NOMES_CORES[cor]}</span></label>
        <div className="cat-paleta" role="radiogroup" aria-label="Cor">
          {Object.keys(CORES_CAT).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={k === cor} aria-label={NOMES_CORES[k] || k} title={NOMES_CORES[k] || k}
              className={k === cor ? 'sel' : ''} style={{ background: CORES_VIVAS[k], color: CORES_VIVAS[k] }} onClick={() => setCor(k)} />
          ))}
        </div>
        <button className="btn bloco cat-bt">{c ? 'Salvar' : 'Criar categoria'}</button>
      </Form>
      {c && (
        <div className="cat-excluir">
          <ConfirmarBotao acao={excluirCategoria} campos={{ id: c.id }} rotulo="Excluir categoria" classe="btn perigo bloco cat-bt"
            titulo="Excluir categoria?" nome={c.nome} pergunta="Tem certeza? As tarefas desta categoria ficam sem categoria." sim="Sim, excluir" nao="Cancelar" />
        </div>
      )}
    </div>
  );
}
