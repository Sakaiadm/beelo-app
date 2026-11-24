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
import ApagarGrupo from '@/components/ApagarGrupo';

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
      <div className="card"><h2>Privacidade e seus dados</h2>
        <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.5 }}>
          <a href="/termos">Termos de uso</a> · <a href="/privacidade">Privacidade</a> · <a href="/consentimento">Termo de consentimento</a>
        </p>
        {eu.termos_aceitos_em && <p className="peq-cinza" style={{ margin: '0 0 12px' }}>Você aceitou em {new Date(eu.termos_aceitos_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (versão {eu.termos_versao}).</p>}
        <a className="btn sec" href="/perfil/dados" download>Baixar meus dados</a>
        <p className="peq-cinza" style={{ margin: '8px 0 0' }}>{gestor ? 'Um arquivo com os dados do grupo.' : 'Um arquivo com os seus dados.'} Para corrigir ou apagar algo, fale com {gestor ? 'a gente pelo e-mail contato@beeloapp.com' : 'quem cuida do grupo ou com a gente pelo e-mail contato@beeloapp.com'}.</p>
        {gestor && (
          <div style={{ borderTop: '1px solid var(--borda)', marginTop: 16, paddingTop: 16 }}>
            <ApagarGrupo nome={familia.nome} />
          </div>
        )}
      </div>
    </main>
  );
}
