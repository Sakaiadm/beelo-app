import { exigirGestor } from '@/lib/sessao';
import Form from '@/components/Form';
import AvatarUpload from '@/components/AvatarUpload';
import { salvarMembro, salvarCategoria, editarCategoria, excluirCategoria, salvarFamilia } from '@/app/acoes';
import { CORES_CAT, NOMES_CORES } from '@/lib/util';
import { urlsAvatares } from '@/lib/avatar';

export const dynamic = 'force-dynamic';

const opcoesCor = Object.keys(CORES_CAT).map((k) => <option key={k} value={k}>{NOMES_CORES[k] || k}</option>);

function MembroForm({ m, familia, url }) {
  const k = m?.id || 'novo';
  return (
    <Form acao={salvarMembro} okTxt="Salvo." className="tarefa" limpar={!m}>
      {m && <input type="hidden" name="id" value={m.id} />}
      {m && <div style={{ marginBottom: 10 }}><AvatarUpload familia={familia} pasta={m.id} atualUrl={url} rotulo={m.nome} cor={m.cor} /></div>}
      <div className="linha">
        <div><label htmlFor={`n-${k}`}>Nome</label><input id={`n-${k}`} name="nome" defaultValue={m?.nome} required maxLength={60} /></div>
        <div><label htmlFor={`e-${k}`}>E-mail Google</label><input id={`e-${k}`} type="email" name="email" defaultValue={m?.email || ''} placeholder="nome@gmail.com" /></div>
        <div><label htmlFor={`p-${k}`}>Perfil</label><select id={`p-${k}`} name="papel" defaultValue={m?.papel || 'filho'}><option value="filho">Filho(a)</option><option value="gestor">Pai/Mãe (gestor)</option></select></div>
        <div><label htmlFor={`c-${k}`}>Cor</label><input id={`c-${k}`} type="color" name="cor" defaultValue={m?.cor || '#1a6fe0'} style={{ padding: 4 }} /></div>
      </div>
      <div className="acoes" style={{ marginTop: 10, alignItems: 'center' }}>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" name="ativo" value="1" defaultChecked={m ? m.ativo : true} />Acesso ativo</label>
        <label className="check" style={{ margin: 0 }}><input type="checkbox" name="tela_ativo" value="1" defaultChecked={m ? m.tela_ativo : true} />Tempo de tela ligado</label>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--cinza)' }}>{m ? (m.user_id ? 'Já entrou no app' : m.email ? 'Convite pendente' : 'Sem e-mail: não consegue entrar') : 'A foto pode ser colocada depois de salvar.'}</span>
        <button className="btn peq">{m ? 'Salvar' : 'Adicionar'}</button>
      </div>
    </Form>
  );
}

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
      <form action={excluirCategoria}><input type="hidden" name="id" value={c.id} /><button className="btn sec peq" title="As tarefas desta categoria ficam sem categoria">Excluir</button></form>
    </div>
  );
}

export default async function Config({ searchParams }) {
  const { supabase, membros, familia } = await exigirGestor();
  const sp = await searchParams;
  const { data: categorias } = await supabase.from('ra_categorias').select('*').order('ordem').order('nome');
  const urls = await urlsAvatares(supabase, [familia.avatar, ...membros.map((m) => m.avatar)]);
  return (
    <main className="estreito" style={{ maxWidth: 860 }}>
      <div className="cab"><div><h1 className="titulo">Cadastros</h1><p className="sub">Família, pessoas e categorias.</p></div></div>
      {sp?.nova && <div className="aviso ok" role="status">Família criada. Agora cadastre as pessoas pelo e-mail Google.</div>}

      <div className="card"><h2>Família</h2>
        <Form acao={salvarFamilia} okTxt="Família salva.">
          <div style={{ marginBottom: 10 }}><AvatarUpload familia={familia.id} pasta="familia" atualUrl={urls[familia.avatar]} rotulo={familia.nome} cor="#1a6fe0" quadrado /></div>
          <div className="linha">
            <div><label htmlFor="fn">Nome da família ou grupo</label><input id="fn" name="nome" defaultValue={familia.nome} maxLength={60} required /></div>
            <div><label htmlFor="fh">Foto vale por quantas horas</label><input id="fh" type="number" name="foto_max_horas" min={1} max={48} defaultValue={familia.foto_max_horas || 2} /></div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--cinza)' }}>A foto de comprovação precisa ter sido tirada dentro desse prazo. Fotos antigas da galeria são recusadas.</p>
          <button className="btn sec">Salvar família</button>
        </Form>
      </div>

      <div className="card"><h2>Pessoas</h2>
        <p className="sub" style={{ marginTop: 0 }}>Convide pelo e-mail Google. A pessoa entra com esse e-mail e o app reconhece o perfil.</p>
        {membros.map((m) => <MembroForm key={m.id} m={m} familia={familia.id} url={urls[m.avatar]} />)}
        <div className="grupo-titulo">Adicionar pessoa</div>
        <MembroForm familia={familia.id} />
        <p style={{ fontSize: 13, color: 'var(--cinza)' }}>Desativar tira o acesso sem apagar o histórico. “Tempo de tela ligado” mostra ou esconde o módulo para aquele filho.</p>
      </div>

      <div className="card"><h2>Categorias</h2>
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
