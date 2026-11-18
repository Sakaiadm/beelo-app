import { exigirGestor } from '@/lib/sessao';
import Form from '@/components/Form';
import { salvarMembro, salvarCategoria } from '@/app/acoes';
import { CORES_CAT } from '@/lib/util';

export const dynamic = 'force-dynamic';

function MembroForm({ m }) {
  return (
    <Form acao={salvarMembro} okTxt="Salvo." className="tarefa" limpar={!m}>
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="linha">
        <div><label htmlFor={`n-${m?.id || 'novo'}`}>Nome</label><input id={`n-${m?.id || 'novo'}`} name="nome" defaultValue={m?.nome} required maxLength={60} /></div>
        <div><label htmlFor={`e-${m?.id || 'novo'}`}>E-mail Google</label><input id={`e-${m?.id || 'novo'}`} type="email" name="email" defaultValue={m?.email || ''} placeholder="nome@gmail.com" /></div>
        <div><label htmlFor={`p-${m?.id || 'novo'}`}>Perfil</label><select id={`p-${m?.id || 'novo'}`} name="papel" defaultValue={m?.papel || 'filho'}><option value="filho">Filho(a)</option><option value="gestor">Pai/Mãe (gestor)</option></select></div>
        <div><label htmlFor={`c-${m?.id || 'novo'}`}>Cor</label><input id={`c-${m?.id || 'novo'}`} type="color" name="cor" defaultValue={m?.cor || '#1a6fe0'} style={{ padding: 4 }} /></div>
      </div>
      <div className="acoes" style={{ marginTop: 10, alignItems: 'center' }}>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" name="ativo" value="1" defaultChecked={m ? m.ativo : true} />Acesso ativo</label>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" name="tela_ativo" value="1" defaultChecked={m ? m.tela_ativo : true} />Tempo de tela ligado</label>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--cinza)' }}>{m ? (m.user_id ? 'Já entrou no app' : m.email ? 'Convite pendente' : 'Sem e-mail: não consegue entrar') : ''}</span>
        <button className="btn peq">{m ? 'Salvar' : 'Adicionar'}</button>
      </div>
    </Form>
  );
}

export default async function Config() {
  const { supabase, membros } = await exigirGestor();
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem');
  return (
    <main className="estreito" style={{ maxWidth: 860 }}>
      <div className="cab"><div><h1 className="titulo">Família</h1><p className="sub">Convide pelo e-mail Google. A pessoa entra com esse e-mail e o app reconhece o perfil.</p></div></div>
      <div className="card"><h2>Membros</h2>
        {membros.map((m) => <MembroForm key={m.id} m={m} />)}
        <div className="grupo-titulo">Adicionar pessoa</div>
        <MembroForm />
        <p style={{ fontSize: 13, color: 'var(--cinza)' }}>Desativar tira o acesso sem apagar o histórico. “Tempo de tela ligado” mostra ou esconde o módulo para aquele filho.</p>
      </div>
      <div className="card"><h2>Categorias</h2>
        <div className="acoes" style={{ marginBottom: 12 }}>
          {(categorias || []).map((c) => { const [f, l] = CORES_CAT[c.cor] || CORES_CAT.cinza; return <span key={c.id} className="pilula" style={{ background: f, color: l, fontSize: 13 }}>{c.nome}</span>; })}
        </div>
        <Form acao={salvarCategoria} okTxt="Categoria criada." limpar>
          <div className="linha">
            <div><label htmlFor="cn">Nova categoria</label><input id="cn" name="nome" maxLength={30} required /></div>
            <div><label htmlFor="cc">Cor</label><select id="cc" name="cor">{Object.keys(CORES_CAT).map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
          </div>
          <button className="btn sec" style={{ marginTop: 10 }}>Criar categoria</button>
        </Form>
      </div>
      <div className="card"><h2>Segurança e privacidade</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>
          <li>Só entra quem está nesta lista, com o e-mail cadastrado.</li>
          <li>As permissões são conferidas no banco: filho só vê e altera o que é dele.</li>
          <li>Fotos ficam em pasta privada e abrem só por link temporário. A localização é removida no envio.</li>
          <li>Toda ação importante fica registrada no histórico.</li>
        </ul>
        <p style={{ fontSize: 13 }}><a href="/privacidade">Aviso de privacidade</a></p>
      </div>
    </main>
  );
}
