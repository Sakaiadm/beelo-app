// Testa o envio de avisos no celular: (A) fila e envio com criptografia real; (B) serviço de fundo no navegador.
import http from 'node:http'; import crypto from 'node:crypto'; import { createRequire } from 'node:module';
import webpush from 'web-push';
import { processarFila } from '../lib/despachante.js';
const { chromium } = createRequire(process.env.PW_ROOT + '/')('playwright');
let falhas = 0; const linhas = [];
const ok = (c, nome, extra = '') => { if (!c) falhas++; linhas.push(`${c ? 'OK   ' : 'FALHA'} ${nome}${c ? '' : ' | ' + extra}`); };

// ---------- A. fila + envio ----------
const vapid = webpush.generateVAPIDKeys();
webpush.setVapidDetails('https://rotina.sakaiadm.tech', vapid.publicKey, vapid.privateKey);
const aparelho = () => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); return { p256dh: e.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') }; };
const A = aparelho(), B = aparelho(), C = aparelho();
const pendentes = [
  { notif_id: '00000000-0000-0000-0000-0000000000a1', titulo: 'Eduardo concluiu: Arrumar quarto (com foto)', link: '/painel', endpoint: 'https://push.exemplo/ok', ...A, nao_lidas: 3 },
  { notif_id: '00000000-0000-0000-0000-0000000000a2', titulo: 'Aviso para aparelho morto', link: '/painel', endpoint: 'https://push.exemplo/morto', ...B, nao_lidas: 1 },
  { notif_id: '00000000-0000-0000-0000-0000000000a3', titulo: 'Falha passageira', link: '/painel', endpoint: 'https://push.exemplo/instavel', ...C, nao_lidas: 2 },
];
const chamadas = [];
const srv = http.createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
  const nome = req.url.split('/').pop(); chamadas.push({ nome, corpo: JSON.parse(b || '{}'), apikey: req.headers.apikey });
  res.writeHead(200, { 'content-type': 'application/json' }); res.end(nome === 'ra_push_pendentes' ? JSON.stringify(pendentes) : '');
}); }).listen(54399);
const detalhes = [];
const enviar = async (sub, texto, opcoes) => {
  if (sub.endpoint.endsWith('/morto')) throw Object.assign(new Error('gone'), { statusCode: 410 });
  if (sub.endpoint.endsWith('/instavel')) throw Object.assign(new Error('x'), { statusCode: 503 });
  const d = await webpush.generateRequestDetails(sub, texto, opcoes);   // criptografa de verdade
  detalhes.push({ d, texto });
};
const r = await processarFila({ url: 'http://127.0.0.1:54399', chave: 'anon', segredo: 'segredo-de-teste', enviar, log: { warn() {} } });
const concl = chamadas.find((c) => c.nome === 'ra_push_concluir')?.corpo;
ok(chamadas[0]?.nome === 'ra_push_pendentes' && chamadas[0].corpo.p_segredo === 'segredo-de-teste' && chamadas[0].apikey === 'anon', 'A1 Pede a fila ao banco com o segredo e a chave pública');
ok(r.enviados === 1 && detalhes.length === 1, 'A2 Envia o aviso para o aparelho bom', JSON.stringify(r));
const texto = JSON.parse(detalhes[0]?.texto || '{}');
ok(texto.corpo === pendentes[0].titulo && texto.badge === 3 && texto.url === '/notificacoes/abrir?id=' + pendentes[0].notif_id, 'A3 Mensagem leva o texto, o número do ícone e o link que marca como lida', detalhes[0]?.texto);
ok(/^vapid /i.test(detalhes[0]?.d.headers.Authorization || '') && Buffer.isBuffer(detalhes[0]?.d.body) && detalhes[0].d.headers['Content-Encoding'] === 'aes128gcm', 'A4 Mensagem sai assinada (VAPID) e criptografada', JSON.stringify(detalhes[0]?.d.headers));
ok(concl && concl.p_mortos.length === 1 && concl.p_mortos[0].endsWith('/morto'), 'A5 Aparelho que não existe mais (410) é mandado remover', JSON.stringify(concl));
ok(concl && concl.p_notif_ids.includes(pendentes[0].notif_id) && concl.p_notif_ids.includes(pendentes[1].notif_id) && !concl.p_notif_ids.includes(pendentes[2].notif_id), 'A6 Falha passageira (503) fica na fila para tentar de novo; o resto é dado como enviado', JSON.stringify(concl));
srv.close();

// ---------- B. serviço de fundo no navegador ----------
const BASE = 'http://127.0.0.1:3100';
const sess = (t) => 'base64-' + Buffer.from(JSON.stringify({ access_token: t, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x' } })).toString('base64url');
const browser = await chromium.launch({ channel: 'chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.grantPermissions(['notifications'], { origin: BASE });
await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-pai'), url: BASE }]);
const page = await ctx.newPage();
const erros = []; page.on('pageerror', (e) => erros.push(e.message));
await page.goto(BASE + '/perfil', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Ativar avisos neste aparelho' }).waitFor({ timeout: 4000 }).catch(() => {});
ok(await page.getByText('Avisos no celular').count() > 0, 'B1 Tela "Avisos no celular" aparece no perfil');
ok(await page.getByRole('button', { name: 'Ativar avisos neste aparelho' }).count() === 1 || await page.getByText('ainda não foram ligados no servidor').count() === 1, 'B2 Mostra o botão de ativar (ou avisa que o servidor ainda não tem as chaves)');
const man = await (await page.request.get(BASE + '/manifest.json')).json();
const imgs = await Promise.all(['/icone-192.png', '/icone-512.png', '/apple-touch-icon.png'].map(async (u) => (await page.request.get(BASE + u)).status()));
ok(man.display === 'standalone' && man.icons.some((i) => i.sizes === '512x512' && i.type === 'image/png') && imgs.every((s) => s === 200), 'B3 App instalável: manifesto e ícones PNG no ar', JSON.stringify(imgs));
const swResp = await page.request.get(BASE + '/sw.js');
ok(swResp.status() === 200 && /javascript/.test(swResp.headers()['content-type'] || ''), 'B4 Serviço de fundo (sw.js) é servido');
const cdp = await ctx.newCDPSession(page);
await cdp.send('ServiceWorker.enable');
let regId; cdp.on('ServiceWorker.workerRegistrationUpdated', (e) => { if (e.registrations?.[0]) regId = e.registrations[0].registrationId; });
await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.js', { scope: '/' }); await navigator.serviceWorker.ready; });
await page.waitForTimeout(1500);
await cdp.send('ServiceWorker.deliverPushMessage', { origin: BASE, registrationId: regId, data: JSON.stringify({ titulo: 'beelo', corpo: 'Eduardo concluiu: Arrumar quarto', url: '/notificacoes/abrir?id=x', badge: 4, tag: 't1' }) });
const p2 = await ctx.newPage(); await p2.goto(BASE + '/privacidade', { waitUntil: 'networkidle' });
let notifs = [];
for (let i = 0; i < 10 && !notifs.length; i++) {
  await p2.waitForTimeout(500);
  notifs = await p2.evaluate(async () => (await (await navigator.serviceWorker.getRegistration('/'))?.getNotifications() || []).map((n) => ({ t: n.title, b: n.body, tag: n.tag, url: n.data?.url })));
}
ok(notifs.length === 1 && notifs[0].b === 'Eduardo concluiu: Arrumar quarto' && notifs[0].url === '/notificacoes/abrir?id=x', 'B5 Chegou o push: o celular mostra o aviso com título e texto', JSON.stringify(notifs));
ok(erros.length === 0, 'B6 Sem erros na tela', erros.join(';'));
await browser.close();
console.log(linhas.join('\n') + `\n\nPush: ${linhas.length}  Falhas: ${falhas}`);
process.exit(0);
