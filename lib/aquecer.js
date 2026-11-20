// Mantém o banco "acordado" para quem abre o app.
// Medido nos registros do Supabase (19 e 20/11): depois de uns 50 minutos sem ninguém usar o app,
// as primeiras consultas que chegam juntas (o topo de toda tela faz 5 ao mesmo tempo) demoravam
// de 5 a 10 segundos; as seguintes, 0,1 a 0,3 s. Aqui, a cada 4 minutos, o servidor do app faz
// 5 consultas leves ao mesmo tempo (sem login, então o banco não devolve dados de ninguém),
// para as conexões do banco não esfriarem.
const TABELAS = ['ra_membros', 'ra_familias', 'ra_ocorrencias', 'ra_notificacoes', 'ra_tarefas'];
let ligado = false;

export async function aquecerUmaVez(url, chave) {
  await Promise.all(TABELAS.map((t) =>
    fetch(`${url}/rest/v1/${t}?select=id&limit=1`, { headers: { apikey: chave } }).then((r) => r.arrayBuffer()).catch(() => {})));
}

export function iniciarAquecimento(env = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL, chave = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (ligado || !url || !chave || env.AQUECER_BANCO === '0') return false;
  ligado = true;
  setInterval(() => aquecerUmaVez(url, chave), 4 * 60 * 1000).unref?.();
  return true;
}
