import { exigirMembro } from '@/lib/sessao';
import Form from '@/components/Form';
import AvatarUpload from '@/components/AvatarUpload';
import { salvarPerfil } from '@/app/acoes';
import AvisosGestor from '@/components/AvisosGestor';
import { urlsAvatares } from '@/lib/avatar';
import AvisosCelular from '@/components/AvisosCelular';
import DicasInterruptor from '@/components/DicasInterruptor';
import SomConcluir from '@/components/SomConcluir';
import TelaMinha from '@/components/TelaMinha';
import { hojeISO } from '@/lib/util';

export const dynamic = 'force-dynamic';

export default async function Perfil() {
  const { supabase, eu, gestor, familia, superAdmin } = await exigirMembro();
  const { data: telaTarefa } = gestor ? await supabase.from('ra_tarefas').select('*').eq('responsavel_id', eu.id).eq('especial', 'tela').eq('ativa', true).maybeSingle() : { data: null };
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const crianca = !gestor && !!eu.modo_crianca;
  const n = { concluida: 'todas', justificativa: true, adiamento: true, tela: true, tarefa_filho: true, ...(eu.notif || {}) };
  return (
    <main className="estreito perfil">
      <div className="cab"><div><h1 className="titulo">Meu perfil</h1><p className="sub">{eu.nome} · {familia.nome}</p></div></div>
      <div className="card"><h2>Minha foto</h2>
        <Form acao={salvarPerfil} okTxt="Foto salva.">
          <AvatarUpload familia={eu.familia_id} pasta={eu.id} atualUrl={urls[eu.avatar]} atualAvatar={eu.avatar} rotulo={eu.nome} cor={eu.cor} largo crianca={crianca} />
          <p className="ajuda">{crianca ? 'Escolha um avatar ou uma foto sua.' : 'Opcional. Escolha uma foto ou imagem do seu aparelho.'}</p>
          <button className="btn cheio">Salvar</button>
        </Form>
      </div>
      <div className="card"><h2>Som</h2>
        <SomConcluir />
      </div>
      <div className="card"><h2>Ideias</h2>
        <DicasInterruptor membro={eu.id} />
      </div>
      {gestor && (
        <div className="card" id="tela"><h2>Tempo de tela</h2>
          <TelaMinha ligado={eu.tela_ativo} telaTarefa={telaTarefa || null} hoje={hojeISO()} />
        </div>
      )}
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
