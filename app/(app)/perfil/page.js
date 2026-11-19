import { exigirMembro } from '@/lib/sessao';
import Form from '@/components/Form';
import AvatarUpload from '@/components/AvatarUpload';
import { salvarPerfil } from '@/app/acoes';
import AvisosGestor from '@/components/AvisosGestor';
import { urlsAvatares } from '@/lib/avatar';
import AvisosCelular from '@/components/AvisosCelular';

export const dynamic = 'force-dynamic';

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
          <AvisosGestor inicial={n} />
        </div>
      )}
    </main>
  );
}
