import ConfirmarBotao from '@/components/ConfirmarBotao';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import FamiliaAvatar from '@/components/FamiliaAvatar';
import { adminAtivarFamilia } from '@/app/acoes';
import { urlsAvatares } from '@/lib/avatar';

export const dynamic = 'force-dynamic';

export default async function Familias() {
  const { supabase, superAdmin, familia: minha } = await exigirGestor();
  if (!superAdmin) redirect('/config');
  const { data, error } = await supabase.rpc('ra_admin_familias');
  const lista = data || [];
  const urls = await urlsAvatares(supabase, lista.map((f) => f.avatar));
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' });
  const ativas = lista.filter((f) => f.ativa).length;
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Famílias e grupos" sub={`${lista.length} famílias · ${ativas} ativas · ${lista.reduce((a, f) => a + f.n_ativos, 0)} pessoas usando`} />
      {error && <div className="aviso erro" role="alert">{error.message}</div>}
      <Link prefetch={false} href="/config/familias/nova" className="btn bloco" style={{ marginBottom: 14 }}>+ Nova família</Link>
      {lista.map((f) => {
        const pct = f.oc_30d ? Math.round((100 * f.cumpridas_30d) / f.oc_30d) : null;
        return (
          <div key={f.id} className={`cartao-l ${f.ativa ? '' : 'apagado'}`} style={{ alignItems: 'flex-start' }}>
            <Link prefetch={false} href={`/config/familias/${f.id}`} style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
              <FamiliaAvatar url={urls[f.avatar]} tam={44} />
              <span className="corpo">
                <b>{f.nome}{f.id === minha.id && <span className="pilula" style={{ marginLeft: 8, fontSize: 11 }}>sua</span>}{!f.ativa && <span className="pilula" style={{ marginLeft: 8, fontSize: 11 }}>desativada</span>}</b>
                <small className="peq-cinza">{f.gestores || 'sem gestor'}</small>
                <small className="peq-cinza">{f.n_gestores} pais · {f.n_filhos} pessoas · {f.n_ativos} já entraram · {f.tarefas} tarefas · {pct == null ? 'sem tarefas em 30 dias' : `${pct}% cumprido em 30 dias`} · criada {fmt.format(new Date(f.criado_em))}{f.ultima_acao && ` · último uso ${fmt.format(new Date(f.ultima_acao))}`}</small>
              </span>
            </Link>
            {f.id !== minha.id && (
              f.ativa
                ? <ConfirmarBotao acao={adminAtivarFamilia} campos={{ id: f.id, ativa: '0' }} rotulo="Desativar" pergunta="Tem certeza? A família perde o acesso." sim="Sim, desativar" />
                : <form action={adminAtivarFamilia}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="ativa" value="1" /><button className="btn sec peq">Reativar</button></form>
            )}
          </div>
        );
      })}
    </main>
  );
}
