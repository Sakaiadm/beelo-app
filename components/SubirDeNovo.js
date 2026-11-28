'use client';
// @arquivo  SubirDeNovo.js: faixa "voltar à meta normal" na semana depois de pegar mais leve (um toque).
// @tipo     componente (cliente)
// @usa      ./Form, app/acoes-desafios (subirDeNovo), lib/desafios (termoDia)
// @usado-por app/(app)/desafios/page.js
// @decisao  28/11 Thomas: "Subir de novo" depois de pegar mais leve. Faixa de uma linha + botão padrão (sem caixa grande).
import Form from './Form';
import { subirDeNovo } from '@/app/acoes-desafios';
import { termoDia } from '@/lib/desafios';

export default function SubirDeNovo({ d, pf = 'j' }) {
  const T = termoDia(pf);
  return (
    <div className="aviso info" style={{ margin: '10px 0 0', padding: '8px 12px', fontSize: 'var(--f-apoio)' }}>
      <span>Esta semana a meta está mais leve ({d.meta} {d.meta === 1 ? T.um : T.varios}). Quer voltar para {d.meta_normal}?</span>
      <Form acao={subirDeNovo}>
        <input type="hidden" name="id" value={d.id} />
        <button className="btn peq" style={{ marginTop: 8 }}>Subir de novo</button>
      </Form>
    </div>
  );
}
