// Testa o app sem internet, com internet lenta e com erros do servidor (Supabase falso + app em 127.0.0.1:3100).
// Rodar: node testes/mock-supabase.mjs & (app no ar) PW_ROOT=<pasta com playwright> node testes/offline.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire((process.env.PW_ROOT || process.cwd()) + '/')('playwright');
const BASE = 'http://127.0.0.1:3100', MOCK = 'http://127.0.0.1:54321';
const SHOTS = process.env.SHOTS || '';
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x' } })).toString('base64url');
const lerLog = async () => (await (await fetch(MOCK + '/__log')).json()).filter((l) => /rpc\/ra_(concluir2|desfazer|justificar|conferir) /.test(l));
const falha = (q = '') => fetch(MOCK + '/__falha' + q);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const INGLES = /Application error|client-side exception|Failed to fetch|This site can|ERR_|Internal Server Error|An error occurred/i;

const browser = await chromium.launch();
const SO = (process.env.SO || '').split(',').filter(Boolean);
const out = []; let falhas = 0;
async function caso(nome, fn) {
  if (SO.length && !SO.some((x) => nome.includes(x))) return;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-filho'), url: BASE }]);
  const erros = [];
  try {
    await falha(); await lerLog();
    await Promise.race([fn(ctx, erros), espera(120000).then(() => { throw new Error('caso passou de 2 minutos'); })]);
    if (erros.length) throw new Error('erro na página: ' + erros.join(' | ').slice(0, 200));
    out.push(`OK    ${nome}`);
  } catch (e) {
    falhas++;
    const ult = ctx.pages().at(-1);
    out.push(`FALHA ${nome} | ${e.message.split('\n')[0]}${ult ? ' | tela: ' + ult.url() + ' ' + (await texto(ult)).slice(0, 300) : ''}`);
  }
  console.log(out.at(-1));
  await ctx.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
  await ctx.close().catch(() => {});
}
async function nova(ctx, erros) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(e.message));
  return p;
}
// Abre o app com internet para o aparelho guardar as telas (como no uso normal).
async function preparar(ctx, erros, telas = ['/hoje']) {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await navigator.serviceWorker.ready; });
  for (const t of telas) { await p.goto(BASE + t, { waitUntil: 'networkidle' }); await p.waitForTimeout(700); }
  await p.close();
  await espera(16000); // passa a janela de 15 s em que a cópia não é mostrada de novo
}
const texto = async (p) => (await p.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
const tela = async (p, nome) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${nome}.png` }); };
const semIngles = async (p) => { const t = await texto(p); if (INGLES.test(t) || p.url().startsWith('chrome-error')) throw new Error('tela de erro em inglês: ' + p.url() + ' ' + t.slice(0, 120)); };

await caso('Abrir pelo ícone sem internet mostra a última tela e a faixa "Sem internet"', async (ctx, erros) => {
  await preparar(ctx, erros);
  await ctx.setOffline(true);
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(5000);
  await semIngles(p);
  await p.getByText('Sem internet', { exact: true }).first().waitFor({ timeout: 3000 });
  if (!(await p.getByText('Estudar 1h').count())) throw new Error('não mostrou as tarefas');
  await tela(p, '1-abrir-sem-internet');
});

await caso('Concluir sem internet guarda no aparelho e envia quando volta', async (ctx, erros) => {
  await preparar(ctx, erros);
  await ctx.setOffline(true);
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click();
  await p.getByText('Aguardando internet').first().waitFor({ timeout: 4000 });
  await p.getByText('1 ação está guardada no aparelho').waitFor({ timeout: 4000 });
  await semIngles(p);
  await tela(p, '2-concluir-sem-internet');
  if ((await lerLog()).length) throw new Error('enviou sem internet?');
  await ctx.setOffline(false);
  await p.getByText('Pronto! O que ficou guardado foi enviado').waitFor({ timeout: 15000 });
  await tela(p, '3-enviado-ao-voltar');
  const log = await lerLog();
  if (!log.some((l) => /ra_concluir2 .*"p_foto":null/.test(l))) throw new Error('não enviou: ' + JSON.stringify(log));
});

await caso('Concluir e desfazer sem internet se anulam (nada é enviado)', async (ctx, erros) => {
  await preparar(ctx, erros);
  await ctx.setOffline(true);
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click();
  await p.getByText('Aguardando internet').first().waitFor({ timeout: 4000 });
  await p.getByRole('button', { name: 'Desfazer' }).first().click();
  await p.waitForTimeout(800);
  if (await p.getByText('Aguardando internet').count()) throw new Error('selo continuou');
  await ctx.setOffline(false); await p.waitForTimeout(6000);
  if ((await lerLog()).length) throw new Error('enviou algo');
});

await caso('Justificativa digitada sem internet não se perde e é enviada depois', async (ctx, erros) => {
  await preparar(ctx, erros);
  await ctx.setOffline(true);
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: 'Justificar' }).first().click();
  await p.locator('textarea[name=texto]').fill('Estava sem internet');
  await p.getByRole('button', { name: 'Enviar justificativa' }).click();
  await p.getByText('Salvo no aparelho. Enviaremos quando a internet voltar.').waitFor({ timeout: 4000 });
  await ctx.setOffline(false);
  await p.getByText(/Pronto!/).waitFor({ timeout: 15000 });
  if (!(await lerLog()).some((l) => /ra_justificar .*Estava sem internet/.test(l))) throw new Error('não enviou');
});

await caso('Tela nunca aberta, sem internet: página própria em português', async (ctx, erros) => {
  await preparar(ctx, erros);
  await ctx.setOffline(true);
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/perfil', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(1500);
  await semIngles(p);
  await p.getByRole('heading', { name: 'Sem internet' }).waitFor({ timeout: 3000 });
  await tela(p, '4-pagina-sem-internet');
});

await caso('Trocar de tela sem internet (Agenda já aberta antes) mostra a cópia', async (ctx, erros) => {
  await preparar(ctx, erros, ['/hoje', '/agenda']);
  await ctx.setOffline(true);
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2000);
  await p.getByRole('link', { name: /Agenda/ }).first().click();
  await p.waitForTimeout(4000);
  await semIngles(p);
  if (!/\/agenda/.test(p.url())) throw new Error('não abriu a agenda: ' + p.url());
  await p.getByText('Sem internet', { exact: true }).first().waitFor({ timeout: 3000 });
});

await caso('Internet cai com o app aberto (falha de rede no envio): guarda e não quebra a tela', async (ctx, erros) => {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'networkidle' });
  await ctx.route('**/*', (r) => (r.request().method() === 'POST' ? r.abort('internetdisconnected') : r.continue()));
  await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click();
  await p.getByText('Aguardando internet').first().waitFor({ timeout: 6000 });
  await semIngles(p);
  await ctx.unroute('**/*');
  await p.evaluate(() => window.dispatchEvent(new Event('online')));
  await p.getByText(/Pronto!/).waitFor({ timeout: 15000 });
  if (!(await lerLog()).some((l) => /ra_concluir2/.test(l))) throw new Error('não enviou');
});

await caso('Internet muito lenta: o botão para de girar e explica', async (ctx, erros) => {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'networkidle' });
  await ctx.route('**/*', async (r) => { if (r.request().method() === 'POST') { await espera(32000); return r.abort().catch(() => {}); } return r.continue(); });
  await p.getByRole('button', { name: 'Justificar' }).first().click();
  await p.locator('textarea[name=texto]').fill('Teste lento');
  await p.getByRole('button', { name: 'Enviar justificativa' }).click();
  await p.getByText('A internet está lenta').waitFor({ timeout: 30000 });
  if ((await p.locator('textarea[name=texto]').inputValue()) !== 'Teste lento') throw new Error('apagou o texto');
  if (await p.locator('form[aria-busy=true]').count()) throw new Error('continuou girando');
  await tela(p, '5-internet-lenta');
  await ctx.unroute('**/*');
});

await caso('Erro 500 no servidor ao concluir: mensagem em português, sem tela branca', async (ctx, erros) => {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'networkidle' });
  await ctx.route('**/*', (r) => (r.request().method() === 'POST' ? r.fulfill({ status: 500, body: 'Internal Server Error' }) : r.continue()));
  await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click();
  await p.getByText('O app não conseguiu falar com o servidor agora').waitFor({ timeout: 6000 });
  await semIngles(p);
  await tela(p, '6-erro-500');
  await ctx.unroute('**/*');
});

await caso('Sessão expirada (401) ao concluir: pede para entrar de novo', async (ctx, erros) => {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'networkidle' });
  await falha('?rpc=ra_concluir2&code=401&msg=JWT%20expired');
  await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click();
  await p.getByText('Sua sessão expirou. Saia e entre de novo para continuar.').waitFor({ timeout: 6000 });
  await semIngles(p);
});

await caso('Erro do banco em inglês nunca aparece', async (ctx, erros) => {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'networkidle' });
  await falha('?rpc=ra_concluir2&code=400&msg=column%20%22x%22%20does%20not%20exist');
  await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click();
  await p.getByText('Não foi possível salvar agora. Tente de novo em instantes.').waitFor({ timeout: 6000 });
  if (/does not exist/.test(await texto(p))) throw new Error('mostrou inglês');
});

await caso('Mensagem do próprio app (conflito) aparece clara ao enviar o que estava guardado', async (ctx, erros) => {
  await preparar(ctx, erros);
  await ctx.setOffline(true);
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click();
  await p.getByText('Aguardando internet').first().waitFor({ timeout: 4000 });
  await falha('?rpc=ra_concluir2&code=400&msg=Justifique%20o%20atraso%20antes%20de%20concluir');
  await ctx.setOffline(false);
  await p.getByText('Não deu para enviar Concluir “Estudar 1h”: Justifique o atraso antes de concluir.').waitFor({ timeout: 15000 });
  await tela(p, '7-conflito-ao-enviar');
});

await caso('Banco fora do ar ao abrir uma tela: página "Algo não deu certo" (não "sem acesso")', async (ctx, erros) => {
  await espera(31000); // o topo das telas fica guardado 30 s no servidor; depois disso precisa do banco
  await falha('?tudo=503');
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/agenda', { waitUntil: 'load' }).catch(() => {});
  await p.waitForTimeout(1500);
  await falha();
  erros.length = 0; // o próprio erro do servidor é esperado aqui
  if (/sem-acesso/.test(p.url())) throw new Error('mandou para sem acesso');
  await semIngles(p);
  await p.getByText(/Algo não deu certo|Sem internet/).first().waitFor({ timeout: 3000 });
  await tela(p, '8-servidor-fora');
});

await caso('Foto sem internet: avisa antes de tentar enviar', async (ctx, erros) => {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/hoje', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Concluir Lavar a louça com foto' }).click();
  await ctx.setOffline(true);
  await p.locator('.painel-acao input[type=file]:not([capture])').setInputFiles({ name: 'f.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('x') });
  await p.getByText('A foto só pode ser enviada com internet').waitFor({ timeout: 4000 });
  await p.getByRole('button', { name: 'Concluir', exact: true }).click();
  await p.getByText('Tarefas com foto só podem ser concluídas com internet').waitFor({ timeout: 4000 });
  await tela(p, '9-foto-sem-internet');
  await ctx.setOffline(false);
});

await caso('Página que não existe: mensagem em português', async (ctx, erros) => {
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/nao-existe', { waitUntil: 'load' });
  await p.getByText('Página não encontrada').first().waitFor({ timeout: 3000 });
});

await caso('Entrar sem internet: explica em vez de "Google não ativado"', async (ctx, erros) => {
  await ctx.clearCookies();
  const p = await nova(ctx, erros);
  await p.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await ctx.setOffline(true);
  await p.locator('#email').fill('a@b.com');
  await p.getByRole('button', { name: /Receber link/ }).click();
  await p.getByText('Sem internet. Para entrar, conecte-se').waitFor({ timeout: 4000 });
});

await browser.close();
console.log(out.join('\n') + `\n\nCasos: ${out.length}  Falhas: ${falhas}`);
process.exit(falhas ? 1 : 0);
