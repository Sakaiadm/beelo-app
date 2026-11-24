import ConfirmarBotao from '@/components/ConfirmarBotao';
import Form from '@/components/Form';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import Voltar from '@/components/Voltar';
import FamiliaAvatar from '@/components/FamiliaAvatar';
import { adminAtivarFamilia } from '@/app/acoes';
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
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' });
  const ativas = lista.filter((f) => f.ativa).length;
  return (
    <main className="estreito">
      <Voltar href="/config" titulo="Grupos" sub={`${lista.length} grupos · ${ativas} ${ativas === 1 ? 'ativo' : 'ativos'} · ${lista.reduce((a, f) => a + f.n_ativos, 0)} pessoas usando`} />
      {error && <div className="aviso erro" role="alert">{error.message}</div>}
      <Link prefetch={false} href="/config/familias/nova" className="btn bloco" style={{ marginBottom: 14 }}>+ Novo grupo</Link>
      {lista.map((f) => {
        const pct = f.oc_30d ? Math.round((100 * f.cumpridas_30d) / f.oc_30d) : null;
        const av = (tam) => <FamiliaAvatar url={urls[f.avatar]} nome={f.nome} tam={tam} cor={corDe[f.id] || undefined} />;
        return (
          <div key={f.id} className={`cartao-l ${f.ativa ? '' : 'apagado'}`} style={{ flexWrap: 'wrap' }}>
            <Link prefetch={false} href={`/config/familias/${f.id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
              {av(42)}
              <span className="corpo">
                <b>{f.nome}{f.id === minha.id && <span className="pilula" style={{ marginLeft: 8, fontSize: 'var(--f-etq)' }}>sua</span>}{!f.ativa && <span className="pilula" style={{ marginLeft: 8, fontSize: 'var(--f-etq)' }}>desativado</span>}</b>
                <small className="peq-cinza">{f.gestores || 'sem responsável'}</small>
              </span>
            </Link>
            <Link prefetch={false} href={`/config/familias/${f.id}`} className="link-btn">Editar</Link>
            {f.id !== minha.id && (f.ativa ? (
              <ConfirmarBotao acao={adminAtivarFamilia} campos={{ id: f.id, ativa: '0' }} rotulo={null} classe="chave on"
                gatilho={{ role: 'switch', 'aria-checked': true, 'aria-label': `Desativar ${f.nome}` }}
                titulo="Desativar grupo?" nome={f.nome} detalhe={f.gestores || undefined} avatar={av(40)} icone="bloquear"
                pergunta="Tem certeza? O grupo perde o acesso. Nada é apagado: dá para reativar depois." sim="Sim, desativar" nao="Não" />
            ) : (
              <Form simples acao={adminAtivarFamilia}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="ativa" value="1" />
                <button className="chave" role="switch" aria-checked={false} aria-label={`Ativar ${f.nome}`} /></Form>
            ))}
            <div style={{ flexBasis: '100%', paddingLeft: 54, marginTop: -4 }}>
              <small className="peq-cinza">{qtd(f.n_gestores, 'responsável', 'responsáveis')} · {qtd(f.n_filhos, 'pessoa', 'pessoas')} · {f.n_ativos} já {f.n_ativos === 1 ? 'entrou' : 'entraram'}</small>
              <small className="peq-cinza">{qtd(f.tarefas, 'tarefa', 'tarefas')} · {pct == null ? 'sem tarefas em 30 dias' : `${pct}% cumprido em 30 dias`}</small>
              <small className="peq-cinza">criado em {fmt.format(new Date(f.criado_em))}{f.ultima_acao && ` · último uso ${fmt.format(new Date(f.ultima_acao))}`}</small>
            </div>
          </div>
        );
      })}
    </main>
  );
}
