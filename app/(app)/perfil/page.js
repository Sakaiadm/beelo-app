// @arquivo  page.js: Meu perfil: foto, cor, jeito de ver, avisos no celular, tempo de tela próprio.
// @tipo     tela
// @usa      lib/sessao, components/VoltarHistorico, components/AvisosGestor, components/AutomacoesGestor, lib/avatar, components/AvisosCelular, components/DicasInterruptor, components/SomConcluir, components/MeusDados, lib/papeis, components/ApagarGrupo, components/JeitoEscolha, lib/jeito
// @usado-por Next.js (rota /perfil)
import { exigirMembro } from '@/lib/sessao';
import VoltarHistorico from '@/components/VoltarHistorico';
import AvisosGestor from '@/components/AvisosGestor';
import AutomacoesGestor from '@/components/AutomacoesGestor';
import { urlsAvatares } from '@/lib/avatar';
import AvisosCelular from '@/components/AvisosCelular';
import DicasInterruptor from '@/components/DicasInterruptor';
import SomConcluir from '@/components/SomConcluir';
import MeusDados from '@/components/MeusDados';
import { nomeFuncao } from '@/lib/papeis';
import ApagarGrupo from '@/components/ApagarGrupo';
import JeitoEscolha from '@/components/JeitoEscolha';
import { temJeito, jeitoDe, visaoCrianca } from '@/lib/jeito';

export const dynamic = 'force-dynamic';

export default async function Perfil() {
  const { supabase, eu, gestor, familia, superAdmin } = await exigirMembro();
  const urls = await urlsAvatares(supabase, [eu.avatar]);
  const crianca = !gestor && !!eu.modo_crianca;
  // Jeito de ver o beelo: só aparece depois do SQL 0022 (com ele, a coluna jeito_livre vem preenchida).
  const comJeito = !gestor && temJeito(eu) && eu.jeito_livre !== undefined;
  const visao = !gestor && visaoCrianca(eu);
  const n = { concluida: 'todas', justificativa: true, adiamento: true, tela: true, tarefa_filho: true, ...(eu.notif || {}) };
  return (
    <main className="estreito perfil">
      <VoltarHistorico href="/" titulo="Meu perfil" />
      {/* U64 e U66: foto e cor valem na hora; nome e papel aparecem como texto. */}
      <div className="card">
        <MeusDados eu={eu} papel={`${nomeFuncao(eu)} · ${familia.nome}`} url={urls[eu.avatar]} crianca={crianca} comCor={!gestor} />
      </div>
      {comJeito && (
        <div className="card"><h2>Como eu quero ver o beelo</h2>
          <JeitoEscolha inicial={jeitoDe(eu)} livre={eu.jeito_livre !== false} />
        </div>
      )}
      <div className="card"><h2>Som</h2>
        <SomConcluir />
      </div>
      {!visao && (
        <div className="card"><h2>Ideias</h2>
          <DicasInterruptor membro={eu.id} />
        </div>
      )}
      {/* U65: um cartão só de avisos: este aparelho em cima; o que avisar embaixo. */}
      <div className="card"><h2>Avisos</h2>
        <AvisosCelular chavePublica={process.env.VAPID_PUBLIC_KEY || ''} teste={superAdmin} />
        {gestor && <div className="av-gestor"><AvisosGestor inicial={n} /></div>}
        {gestor && <div className="av-gestor"><AutomacoesGestor resumo={n.resumo_hora || ''} conferirAuto={!!familia.conferir_auto} /></div>}
      </div>
      {!visao && <div className="card"><h2>Privacidade e seus dados</h2>
        <p style={{ margin: '0 0 10px', fontSize: 'var(--f-apoio)', lineHeight: 1.5 }}>
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
      </div>}
    </main>
  );
}
