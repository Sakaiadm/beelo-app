import { redirect } from 'next/navigation';
import { exigirMembro } from '@/lib/sessao';
import Form from '@/components/Form';
import Avatar from '@/components/Avatar';
import { adminCriarFamilia, adminAtivarFamilia } from '@/app/acoes';
import { urlsAvatares } from '@/lib/avatar';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  const { supabase, superAdmin, familia: minha } = await exigirMembro();
  if (!superAdmin) redirect('/');
  const { data, error } = await supabase.rpc('ra_admin_familias');
  const lista = data || [];
  const urls = await urlsAvatares(supabase, lista.map((f) => f.avatar));
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' });
  const ativas = lista.filter((f) => f.ativa).length;
  return (
    <main className="estreito" style={{ maxWidth: 960 }}>
      <div className="cab"><div><h1 className="titulo">Administração</h1><p className="sub">{lista.length} famílias · {ativas} ativas · {lista.reduce((a, f) => a + f.n_ativos, 0)} pessoas usando</p></div></div>
      {error && <div className="aviso erro" role="alert">{error.message}</div>}
      <div className="card"><h2>Famílias e grupos</h2>
        {lista.map((f) => {
          const pct = f.oc_30d ? Math.round((100 * f.cumpridas_30d) / f.oc_30d) : null;
          return (
            <div key={f.id} className="tarefa" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', opacity: f.ativa ? 1 : 0.6 }}>
              <Avatar nome={f.nome} url={urls[f.avatar]} tam={44} quadrado />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700 }}>{f.nome}{f.id === minha.id && <span className="pilula" style={{ marginLeft: 8, fontSize: 12 }}>sua</span>}{!f.ativa && <span className="pilula" style={{ marginLeft: 8, fontSize: 12 }}>desativada</span>}</div>
                <div style={{ fontSize: 13, color: 'var(--cinza)' }}>{f.gestores || 'sem gestor'}</div>
                <div style={{ fontSize: 13, color: 'var(--cinza)' }}>
                  {f.n_gestores} pais · {f.n_filhos} filhos · {f.n_ativos} já entraram · {f.tarefas} tarefas · {pct == null ? 'sem tarefas em 30 dias' : `${pct}% cumprido em 30 dias`} · criada {fmt.format(new Date(f.criado_em))}
                  {f.ultima_acao && ` · último uso ${fmt.format(new Date(f.ultima_acao))}`}
                </div>
              </div>
              {f.id !== minha.id && (
                <form action={adminAtivarFamilia}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="ativa" value={f.ativa ? '0' : '1'} />
                  <button className="btn sec peq">{f.ativa ? 'Desativar' : 'Reativar'}</button></form>
              )}
            </div>
          );
        })}
      </div>
      <div className="card"><h2>Criar família para outra pessoa</h2>
        <Form acao={adminCriarFamilia} okTxt="Família criada. Avise a pessoa para entrar com esse e-mail Google." limpar>
          <div className="linha">
            <div><label htmlFor="af">Nome da família ou grupo</label><input id="af" name="familia" required maxLength={60} /></div>
            <div><label htmlFor="an">Nome do responsável</label><input id="an" name="nome" required maxLength={60} /></div>
            <div><label htmlFor="ae">E-mail Google do responsável</label><input id="ae" type="email" name="email" required /></div>
          </div>
          <button className="btn" style={{ marginTop: 10 }}>Criar família</button>
        </Form>
        <p style={{ fontSize: 13, color: 'var(--cinza)' }}>O responsável entra como pai/mãe da nova família e cadastra o resto. Desativar uma família bloqueia o acesso dela sem apagar nada.</p>
      </div>
    </main>
  );
}
