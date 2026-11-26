// @arquivo  despachante.js: envia o push no celular: a cada 60 s pede ao banco os avisos novos, envia a cada aparelho e informa o que já foi.
// @tipo     aviso
// @cuidado  roda dentro do app na VPS (instrumentation.js); precisa de VAPID_* e PUSH_SEGREDO.
// Envia os avisos no celular (push). Roda dentro do app na VPS, a cada 60 segundos:
// pede ao banco os avisos novos, manda para cada aparelho e avisa o banco o que já foi.
import webpush from 'web-push';

async function chamar(url, chave, nome, corpo) {
  const r = await fetch(`${url}/rest/v1/rpc/${nome}`, {
    method: 'POST', headers: { apikey: chave, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(`${nome}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// Uma volta da fila. `enviar(assinatura, texto, opcoes)` é injetável para testes.
export async function processarFila({ url, chave, segredo, enviar, log = console }) {
  const linhas = (await chamar(url, chave, 'ra_push_pendentes', { p_segredo: segredo, p_limite: 40 })) || [];
  if (!linhas.length) return { enviados: 0, mortos: 0 };
  const mortos = new Set(); const adiar = new Set(); const vistos = new Set(); let enviados = 0;
  for (const l of linhas) {
    vistos.add(l.notif_id);
    const texto = JSON.stringify({ titulo: 'beelo', corpo: l.titulo, url: `/notificacoes/abrir?id=${l.notif_id}`, badge: l.nao_lidas, tag: l.notif_id });
    try {
      await enviar({ endpoint: l.endpoint, keys: { p256dh: l.p256dh, auth: l.auth } }, texto, { TTL: 86400, urgency: 'normal' });
      enviados++;
    } catch (e) {
      const st = e?.statusCode;
      if (st === 404 || st === 410) mortos.add(l.endpoint);                 // aparelho não existe mais
      else if (!st || st === 429 || st >= 500) adiar.add(l.notif_id);       // falha passageira: tenta de novo
      else log.warn?.(`push recusado (${st}) para ${l.endpoint.slice(0, 40)}…`);
    }
  }
  const prontos = [...vistos].filter((id) => !adiar.has(id));
  await chamar(url, chave, 'ra_push_concluir', { p_segredo: segredo, p_notif_ids: prontos, p_mortos: [...mortos] });
  return { enviados, mortos: mortos.size };
}

let ligado = false;
export function iniciarDespachante(env = process.env) {
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, PUSH_SEGREDO: segredo, VAPID_ASSUNTO: assunto } = env;
  const url = env.NEXT_PUBLIC_SUPABASE_URL, chave = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (ligado) return false;
  if (!pub || !priv || !segredo || !url || !chave) {
    console.warn('[push] envio desligado, falta: ' + Object.entries({ VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, PUSH_SEGREDO: segredo, NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: chave }).filter(([, v]) => !v).map(([k]) => k).join(', '));
    return false;
  }
  webpush.setVapidDetails(assunto || 'https://beeloapp.com', pub, priv);
  ligado = true;
  let ocupado = false, erros = 0;
  const volta = async () => {
    if (ocupado) return; ocupado = true;
    try { await processarFila({ url, chave, segredo, enviar: (a, t, o) => webpush.sendNotification(a, t, o) }); erros = 0; }
    catch (e) { if (erros++ % 20 === 0) console.warn('[push] ' + e.message); }
    finally { ocupado = false; }
  };
  // A cada 60 s (era 15 s): cada volta faz o banco varrer tarefas e avisos, então são 4x menos consultas.
  // O aviso no celular chega até 1 minuto depois do fato (os lembretes de tarefa são marcados em minutos).
  // Dá para mudar sem mexer no código: PUSH_INTERVALO_S no .env (mínimo 10).
  const seg = Math.max(10, Number(env.PUSH_INTERVALO_S) || 60);
  setInterval(volta, seg * 1000).unref?.();
  console.log(`[push] envio de avisos ligado (a cada ${seg} s)`);
  return true;
}
