import { exigirMembro } from '@/lib/sessao';
import Form from '@/components/Form';
import AvatarUpload from '@/components/AvatarUpload';
import { salvarPerfil, salvarAvisos } from '@/app/acoes';
import { urlsAvatares } from '@/lib/avatar';
import AvisosCelular from '@/components/AvisosCelular';

export const dynamic = 'force-dynamic';

const AVISOS = [
  ['justificativa', 'Quando um filho justificar uma tarefa não feita'],
  ['adiamento', 'Quando um filho pedir para adiar uma tarefa'],
  ['tela', 'Quando um filho propuser o próprio tempo de tela'],
  ['tarefa_filho', 'Quando um filho criar uma tarefa para si'],
];

export default async function Perfil() {
  const { supabase, eu, gestor, familia } = await exigirMembro();
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const n = { concluida: 'todas', justificativa: true, adiamento: true, tela: true, tarefa_filho: true, ...(eu.notif || {}) };
  return (
    <main className="estreito">
      <div className="cab"><div><h1 className="titulo">Meu perfil</h1><p className="sub">{eu.nome} · {familia.nome}</p></div></div>
      <div className="card"><h2>Minha foto</h2>
        <Form acao={salvarPerfil} okTxt="Foto salva.">
          <AvatarUpload familia={eu.familia_id} pasta={eu.id} atualUrl={urls[eu.avatar]} atualAvatar={eu.avatar} rotulo={eu.nome} cor={eu.cor} />
          <p style={{ fontSize: 13, color: 'var(--cinza)' }}>Opcional. Escolha uma foto sua ou um avatar.</p>
          <button className="btn sec">Salvar</button>
        </Form>
      </div>
      <div className="card"><h2>Avisos no celular</h2>
        <AvisosCelular chavePublica={process.env.VAPID_PUBLIC_KEY || ''} />
      </div>
      {gestor && (
        <div className="card"><h2>Avisos que eu quero receber</h2>
          <Form acao={salvarAvisos} okTxt="Preferências salvas.">
            <label htmlFor="av-c">Quando um filho concluir uma tarefa</label>
            <select id="av-c" name="concluida" defaultValue={n.concluida}>
              <option value="todas">Avisar sempre</option>
              <option value="com_foto">Avisar só quando vier com foto</option>
              <option value="nenhuma">Não avisar</option>
            </select>
            <div style={{ marginTop: 12 }}>
              {AVISOS.map(([k, t]) => <label key={k} className="check"><input type="checkbox" name={k} value="1" defaultChecked={n[k] !== false} />{t}</label>)}
            </div>
            <p style={{ fontSize: 13, color: 'var(--cinza)' }}>Cada pai ou mãe escolhe os próprios avisos. Os avisos aparecem no sino do app.</p>
            <button className="btn sec">Salvar avisos</button>
          </Form>
        </div>
      )}
    </main>
  );
}
