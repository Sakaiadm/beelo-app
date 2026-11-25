// @arquivo  route.js: rota que entrega ao usuário uma cópia dos próprios dados (LGPD).
// @tipo     tela
// @usa      banco ra_membros, rpc ra_eu, rpc ra_emails_grupo, lib/supabase/server, lib/membros
// @usado-por Next.js (rota /perfil/dados)
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { COLS_MEMBRO, COLS_JEITO, juntarEmails, juntarJeito } from '@/lib/membros';

// "Baixar meus dados" (LGPD art. 18): um arquivo com tudo o que esta pessoa pode ver no beelo.
// Pai e Mãe recebem os dados do grupo; as outras pessoas, os próprios. Quem decide é o banco (RLS).
const TABELAS = ['ra_familias', 'ra_categorias', 'ra_tarefas', 'ra_ocorrencias', 'ra_adiamentos', 'ra_tela_previsto', 'ra_tela_proposta',
  'ra_tela_real', 'ra_notificacoes', 'ra_desafios', 'ra_desafio_periodos', 'ra_premios', 'ra_premio_pedidos', 'ra_cofrinho', 'ra_historico', 'ra_aceites'];

export async function GET() {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (!eu?.id) return NextResponse.json({ erro: 'Entre no beelo para baixar os seus dados.' }, { status: 401 });
  const [{ data: membros }, { data: emails }, { data: jeitos }] = await Promise.all([
    supabase.from('ra_membros').select(COLS_MEMBRO).eq('familia_id', eu.familia_id),
    supabase.rpc('ra_emails_grupo'),
    supabase.from('ra_membros').select(COLS_JEITO).eq('familia_id', eu.familia_id),
  ]);
  const saida = {
    sobre: 'Cópia dos dados do beelo. Fotos não vão no arquivo: elas aparecem pelo caminho (foto_path) e podem ser pedidas pelo e-mail contato@beeloapp.com.',
    gerado_em: new Date().toISOString(),
    quem_pediu: { id: eu.id, nome: eu.nome, email: eu.email },
    pessoas: juntarJeito(juntarEmails(membros, emails), jeitos).map((m) => (m.id === eu.id ? { ...m, email: eu.email } : m)),
  };
  for (const t of TABELAS) {
    const { data, error } = await supabase.from(t).select('*').limit(20000);
    saida[t.replace(/^ra_/, '')] = error ? [] : data;
  }
  const nome = `beelo-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(saida, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${nome}"`, 'Cache-Control': 'no-store' },
  });
}
