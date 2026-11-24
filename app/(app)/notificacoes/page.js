import { exigirMembro } from '@/lib/sessao';
import Form from '@/components/Form';
import { marcarLidas } from '@/app/acoes';

export const dynamic = 'force-dynamic';

export default async function Notificacoes() {
  const { supabase } = await exigirMembro();
  const { data } = await supabase.from('ra_notificacoes').select('*').order('criado_em', { ascending: false }).limit(60);
  const lista = data || [];
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return (
    <main className="estreito">
      <div className="cab"><h1 className="titulo">Notificações</h1>
        {lista.some((n) => !n.lida) && <Form acao={marcarLidas} simples><button className="btn sec peq">Marcar todas como lidas</button></Form>}</div>
      <div className="card">
        {lista.length === 0 && <div className="vazio">Nada por aqui ainda.</div>}
        {lista.map((n) => (
          <a key={n.id} href={`/notificacoes/abrir?id=${n.id}`} style={{ display: 'flex', gap: 10, padding: '12px 4px', borderBottom: '1px solid var(--borda)', textDecoration: 'none', color: 'var(--texto)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, marginTop: 6, background: n.lida ? 'transparent' : '#1a6fe0', flexShrink: 0 }} />
            <span style={{ flex: 1 }}><span style={{ fontWeight: n.lida ? 500 : 700 }}>{n.titulo}</span>
              <span style={{ display: 'block', fontSize: 'var(--f-etq)', color: 'var(--cinza)' }}>{fmt.format(new Date(n.criado_em))}</span></span>
          </a>
        ))}
      </div>
    </main>
  );
}
