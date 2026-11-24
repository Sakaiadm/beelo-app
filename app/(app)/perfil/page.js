import { exigirMembro } from '@/lib/sessao';
import Form from '@/components/Form';
import AvatarUpload from '@/components/AvatarUpload';
import { salvarPerfil } from '@/app/acoes';
import AvisosGestor from '@/components/AvisosGestor';
import { urlsAvatares } from '@/lib/avatar';
import AvisosCelular from '@/components/AvisosCelular';
import DicasInterruptor from '@/components/DicasInterruptor';
import SomConcluir from '@/components/SomConcluir';
import MeusDados from '@/components/MeusDados';
import { nomeFuncao } from '@/lib/papeis';

export const dynamic = 'force-dynamic';

export default async function Perfil() {
  const { supabase, eu, gestor, familia, superAdmin } = await exigirMembro();
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const crianca = !gestor && !!eu.modo_crianca;
  const n = { concluida: 'todas', justificativa: true, adiamento: true, tela: true, tarefa_filho: true, ...(eu.notif || {}) };
  return (
    <main className="estreito perfil">
      <div className="cab"><div><h1 className="titulo">Meu perfil</h1><p className="sub">{eu.nome} · {familia.nome}</p></div></div>
      {gestor ? (
        <div className="card"><h2>Minha foto</h2>
          <Form acao={salvarPerfil} okTxt="Foto salva.">
            <AvatarUpload familia={eu.familia_id} pasta={eu.id} atualUrl={urls[eu.avatar]} atualAvatar={eu.avatar} rotulo={eu.nome} cor={eu.cor} largo crianca={crianca} />
            <p className="ajuda">Opcional. Escolha uma foto ou imagem do seu aparelho.</p>
            <button className="btn cheio">Salvar</button>
          </Form>
        </div>
      ) : (
        <div className="card"><h2>Meus dados</h2>
          <MeusDados eu={eu} papel={nomeFuncao(eu)} url={urls[eu.avatar]} crianca={crianca} />
        </div>
      )}
      <div className="card"><h2>Som</h2>
        <SomConcluir />
      </div>
      <div className="card"><h2>Ideias</h2>
        <DicasInterruptor membro={eu.id} />
      </div>
      <div className="card"><h2>Avisos neste aparelho</h2>
        <AvisosCelular chavePublica={process.env.VAPID_PUBLIC_KEY || ''} teste={superAdmin} />
      </div>
      {gestor && (
        <div className="card"><h2>Avisos que eu quero receber</h2>
          <AvisosGestor inicial={n} />
        </div>
      )}
    </main>
  );
}
