import Icone from '@/components/Icone';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import FamiliaAvatar from '@/components/FamiliaAvatar';
import { urlsAvatares } from '@/lib/avatar';

export const dynamic = 'force-dynamic';

const qtd = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export default async function Familias() {
  const { supabase, superAdmin, familia: minha } = await exigirGestor();
  if (!superAdmin) redirect('/config');
  const [{ data, error }, { data: cores }] = await Promise.all([supabase.rpc('ra_admin_familias'), supabase.rpc('ra_admin_cores')]);
  // Cor de cada grupo (SQL 0014). Sem o SQL, volta vazio e fica o azul padrão.
  const corDe = Object.fromEntries((cores || []).map((c) => [c.id, c.cor]));
  const lista = data || [];
  const urls = await urlsAvatares(supabase, lista.map((f) => f.avatar));
  const ativas = lista.filter((f) => f.ativa).length;
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Grupos" sub={`${lista.length} grupos · ${ativas} ${ativas === 1 ? 'ativo' : 'ativos'} · ${lista.reduce((a, f) => a + f.n_ativos, 0)} pessoas usando`} />
      {error && <div className="aviso erro" role="alert">{error.message}</div>}
      <Link prefetch={false} href="/config/familias/nova" className="btn" style={{ marginBottom: 14 }}><Icone nome="mais" tam={18} cor="#fff" />Grupo</Link>
      {lista.map((f) => {
        const pct = f.oc_30d ? Math.round((100 * f.cumpridas_30d) / f.oc_30d) : null;
        const av = (tam) => <FamiliaAvatar url={urls[f.avatar]} nome={f.nome} tam={tam} cor={corDe[f.id] || undefined} />;
        return (
          // U63 e U73: cartão leve; a linha inteira abre o grupo. Ativar e desativar ficam dentro do grupo.
          <Link prefetch={false} key={f.id} href={`/config/familias/${f.id}`} className={`cartao-l ${f.ativa ? '' : 'apagado'}`} title={`${qtd(f.tarefas, 'tarefa', 'tarefas')} · ${pct == null ? 'sem tarefas em 30 dias' : `${pct}% cumprido em 30 dias`}`}>
            {av(42)}
            <span className="corpo">
              <b>{f.nome}{f.id === minha.id && <span className="tg cz" style={{ marginLeft: 8 }}>sua</span>}{!f.ativa && <span className="tg cz" style={{ marginLeft: 8 }}>desativado</span>}</b>
              <small className="peq-cinza">{f.gestores || 'sem responsável'}</small>
              <small className="peq-cinza">{qtd(f.n_gestores + f.n_filhos, 'pessoa', 'pessoas')} · {f.n_ativos} já {f.n_ativos === 1 ? 'entrou' : 'entraram'}</small>
            </span>
            <Icone nome="dir" tam={20} />
          </Link>
        );
      })}
    </main>
  );
}
