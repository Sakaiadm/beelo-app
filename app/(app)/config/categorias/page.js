import { exigirGestor } from '@/lib/sessao';
import Form from '@/components/Form';
import Voltar from '@/components/Voltar';
import ConfirmarBotao from '@/components/ConfirmarBotao';
import { salvarCategoria, editarCategoria, excluirCategoria } from '@/app/acoes';
import { CORES_CAT, NOMES_CORES } from '@/lib/util';

export const dynamic = 'force-dynamic';

const opcoesCor = Object.keys(CORES_CAT).map((k) => <option key={k} value={k}>{NOMES_CORES[k] || k}</option>);

function CategoriaForm({ c }) {
  const [f, l] = CORES_CAT[c.cor] || CORES_CAT.cinza;
  return (
    <div className="tarefa" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <Form acao={editarCategoria} okTxt="Salvo." style={{ flex: 1, minWidth: 260 }}>
        <input type="hidden" name="id" value={c.id} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <span className="pilula" style={{ background: f, color: l, fontSize: 13, marginBottom: 8 }}>{c.nome}</span>
          <div style={{ flex: 1, minWidth: 120 }}><label htmlFor={`cn-${c.id}`}>Nome</label><input id={`cn-${c.id}`} name="nome" defaultValue={c.nome} maxLength={30} required /></div>
          <div><label htmlFor={`cc-${c.id}`}>Cor</label><select id={`cc-${c.id}`} name="cor" defaultValue={c.cor}>{opcoesCor}</select></div>
          <button className="btn sec peq">Salvar</button>
        </div>
      </Form>
      <ConfirmarBotao acao={excluirCategoria} campos={{ id: c.id }} rotulo="Excluir" titulo="As tarefas desta categoria ficam sem categoria" pergunta="Tem certeza? As tarefas ficam sem categoria." sim="Sim, excluir" />
    </div>
  );
}

export default async function Categorias() {
  const { supabase } = await exigirGestor();
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem').order('nome');
  return (
    <main className="estreito" style={{ maxWidth: 860 }}>
      <Voltar href="/config" titulo="Categorias" />
      <div className="card">
        {(categorias || []).map((c) => <CategoriaForm key={c.id} c={c} />)}
        <div className="grupo-titulo">Nova categoria</div>
        <Form acao={salvarCategoria} okTxt="Categoria criada." limpar>
          <div className="linha">
            <div><label htmlFor="cn">Nome</label><input id="cn" name="nome" maxLength={30} required /></div>
            <div><label htmlFor="cc">Cor</label><select id="cc" name="cor">{opcoesCor}</select></div>
          </div>
          <button className="btn sec" style={{ marginTop: 10 }}>Criar categoria</button>
        </Form>
      </div>
    </main>
  );
}
