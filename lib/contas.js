// @arquivo  contas.js: guarda até 3 contas já entradas neste aparelho para o administrador geral alternar entre elas (só para teste).
// @tipo     regra
// @usa      lib/supabase/client, app/auth/trocar/route.js
// @usado-por components/MenuUsuario.js, components/ContasGancho.js, components/ContasAlternar.js
// @decisao  27/11 Thomas: duplo toque no ícone gira entre as contas; o menu de um toque lista as mesmas contas.
// @cuidado  as contas ficam só no localStorage DESTE aparelho (nunca no banco). Só entram na lista pela tela /config/contas, que só o administrador geral abre. Quem não guardou nada não vê seletor nenhum. "Sair" por completo apaga tudo (limparContas).
// @cuidado  NÃO usar signOut() para trocar: ele revoga o login no Supabase e a conta guardada deixaria de valer. A troca só troca os cookies (rota /auth/trocar).
import { supabaseBrowser } from '@/lib/supabase/client';

const CHAVE = 'beelo_contas';
const LIGADA = 'beelo_troca_ligada';
const ADICIONANDO = 'beelo_adicionando';
const AVISO = 'beelo_trocou';
export const MAX_CONTAS = 3;

export function lerContas() {
  try { const l = JSON.parse(localStorage.getItem(CHAVE) || '[]'); return Array.isArray(l) ? l.slice(0, MAX_CONTAS) : []; } catch { return []; }
}
function gravar(l) { try { localStorage.setItem(CHAVE, JSON.stringify(l.slice(0, MAX_CONTAS))); } catch {} }
export function trocaLigada() { try { return localStorage.getItem(LIGADA) !== '0'; } catch { return true; } }
export function ligarTroca(v) { try { localStorage.setItem(LIGADA, v ? '1' : '0'); } catch {} }
export function limparContas() { try { [CHAVE, LIGADA, ADICIONANDO, AVISO].forEach((k) => localStorage.removeItem(k)); } catch {} }
export function marcarAdicionando(v) { try { v ? localStorage.setItem(ADICIONANDO, '1') : localStorage.removeItem(ADICIONANDO); } catch {} }
export function estaAdicionando() { try { return localStorage.getItem(ADICIONANDO) === '1'; } catch { return false; } }
export function lerAviso() { try { const v = sessionStorage.getItem(AVISO); sessionStorage.removeItem(AVISO); return v; } catch { return null; } }
export function remover(id) { gravar(lerContas().filter((c) => c.id !== id)); }

// Guarda (ou atualiza) a conta que está entrada agora. eu = { id, nome, papel, cor }. Devolve false se a lista já está cheia.
export async function guardarAtual(eu) {
  const { data: { session } } = await supabaseBrowser().auth.getSession();
  if (!session?.refresh_token) return false;
  const lista = lerContas();
  const i = lista.findIndex((c) => c.id === eu.id);
  const conta = { id: eu.id, nome: eu.nome, papel: eu.papel, cor: eu.cor, rotulo: eu.rotulo || '', access_token: session.access_token, refresh_token: session.refresh_token };
  if (i >= 0) lista[i] = { ...lista[i], ...conta, rotulo: eu.rotulo || lista[i].rotulo };
  else if (lista.length >= MAX_CONTAS) return false;
  else lista.push(conta);
  gravar(lista);
  return true;
}

// Guarda os tokens novos sempre que o Supabase girar o login da conta que está entrada.
// @cuidado  é isto que evita a conta guardada ficar velha: o token antigo, depois de girado, não serve mais.
export function acompanharRenovacao(euId) {
  const { data } = supabaseBrowser().auth.onAuthStateChange((evento, session) => {
    if ((evento !== 'TOKEN_REFRESHED' && evento !== 'SIGNED_IN') || !session?.refresh_token) return;
    const lista = lerContas();
    const i = lista.findIndex((c) => c.id === euId);
    if (i < 0) return;
    lista[i] = { ...lista[i], access_token: session.access_token, refresh_token: session.refresh_token };
    gravar(lista);
  });
  return () => data.subscription.unsubscribe();
}

// Só renova os tokens de uma conta que já está na lista (o Supabase gira o token de tempos em tempos).
export async function renovarAtual(euId) {
  const lista = lerContas();
  const i = lista.findIndex((c) => c.id === euId);
  if (i < 0) return;
  const { data: { session } } = await supabaseBrowser().auth.getSession();
  if (!session?.refresh_token) return;
  lista[i] = { ...lista[i], access_token: session.access_token, refresh_token: session.refresh_token };
  gravar(lista);
}

async function chamar(corpo) {
  const r = await fetch('/auth/trocar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
  return r.ok ? r.json() : null;
}

// Passa para outra conta guardada. Primeiro guarda os tokens frescos de quem está saindo.
export async function trocarPara(destino, euAtual) {
  if (euAtual) await renovarAtual(euAtual.id);
  const r = await chamar({ access_token: destino.access_token, refresh_token: destino.refresh_token });
  if (!r?.ok) {
    // A conta guardada venceu (o Supabase já girou o token dela). Leva ao login para entrar de novo; ao entrar, a conta é guardada outra vez no mesmo lugar.
    marcarAdicionando(true);
    await sairSemRevogar();
    return false;
  }
  // O servidor pode ter renovado o login: guarda os tokens novos dessa conta.
  if (r.access_token) {
    const l = lerContas().map((c) => (c.id === destino.id ? { ...c, access_token: r.access_token, refresh_token: r.refresh_token } : c));
    gravar(l);
  }
  try { sessionStorage.setItem(AVISO, destino.nome); } catch {}
  window.location.href = '/';
  return true;
}

// Sai da conta SEM revogar o login (para entrar com outro e-mail e guardar como nova conta).
export async function sairSemRevogar() {
  const r = await chamar({ sair: true });
  if (r?.ok) window.location.href = '/login';
  return !!r?.ok;
}

// Próxima conta da lista, girando (Thomas → Alice → Eduardo → Thomas).
export function proxima(euId) {
  const l = lerContas();
  if (l.length < 2) return null;
  const i = l.findIndex((c) => c.id === euId);
  return l[(i + 1) % l.length];
}
