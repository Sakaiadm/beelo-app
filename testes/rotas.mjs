// @arquivo  rotas.mjs: percorre todas as telas como pai, filho e pessoa não convidada.
// @tipo     teste
// Percorre todas as telas como pai, filho e pessoa não convidada, usando o Supabase falso.
import { createRequire } from 'node:module'; const { chromium } = createRequire(process.env.PW_ROOT + '/')('playwright');
const BASE = 'http://127.0.0.1:3100';
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x', email: 'x', aud: 'authenticated' } })).toString('base64url');
const E = '00000000-0000-0000-0000-000000000003';
const T = '00000000-0000-0000-0000-000000000030';
const casos = {
  'tok-pai': ['/', '/painel', '/hoje', '/tarefas', '/tarefas?d=2026-11-19', '/tarefas/nova', `/tarefas/${T}`, `/tarefas/${T}/editar`, '/agenda', '/agenda?v=dia', '/agenda?v=semana', '/agenda?v=mes', `/agenda?v=semana&m=${E}`,
    '/notificacoes', '/tela', `/tela?m=${E}`, '/relatorios', '/relatorios?per=hoje', '/relatorios?per=semana', '/relatorios?per=30d', '/relatorios?per=livre&de=2026-10-01&ate=2026-11-30',
    `/relatorios?m=${E}&st=atrasada`, '/relatorios?st=cumprida&hor=com&origem=pais', '/relatorios?cat=00000000-0000-0000-0000-000000000020', '/config', '/config?nova=1', '/config/pessoas', '/config/pessoas/nova', `/config/pessoas/${E}`, '/config/categorias', '/config/ajustes', '/config/familias', '/config/familias/nova', '/config/familias/11111111-1111-1111-1111-111111111111', '/config/familias/00000000-0000-0000-0000-000000000700', '/perfil', '/admin', '/privacidade'],
  'tok-filho': ['/', '/hoje', '/tarefas', '/tarefas/nova', '/agenda', '/agenda?v=dia', '/agenda?v=mes', '/notificacoes', '/tela', '/relatorios', '/painel', '/config', '/config/pessoas', '/config/familias', '/perfil', '/admin', `/tarefas/${T}`, `/tarefas/${T}/editar`],
  'tok-estranho': ['/', '/hoje', '/sem-acesso'],
  '': ['/', '/painel', '/login', '/privacidade', '/manifest.json', '/sw.js', '/icone-192.png', '/apple-touch-icon.png'],
};
const browser = await chromium.launch();
const linhas = []; let falhas = 0;
for (const [tok, rotas] of Object.entries(casos)) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  if (tok) await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess(tok), url: BASE }]);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push('JS: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|Failed to load resource/.test(m.text())) erros.push('console: ' + m.text()); });
  for (const r of rotas) {
    erros.length = 0;
    let st, final, txt = '';
    try {
      const resp = r.includes('csv') ? await page.request.get(BASE + r) : await page.goto(BASE + r, { waitUntil: 'networkidle' });
      st = resp.status(); final = r.includes('csv') ? r.split('?')[0] : new URL(page.url()).pathname;
      txt = r.includes('csv') ? (await resp.text()).slice(0, 60).replace(/\n/g, ' | ') : (await page.locator('h1').first().textContent({ timeout: 2000 }).catch(() => ''));
    } catch (e) { st = 'ERRO'; erros.push(e.message); }
    const esperado404 = tok === 'tok-filho' && r.startsWith('/tarefas/0') && r.endsWith('/editar') && st === 404;
    if (esperado404) txt = 'bloqueado: filho não edita tarefa dos pais (esperado)';
    const ruim = !esperado404 && st >= 400 || st === 'ERRO' || erros.length || /Application error|Internal Server Error/.test(txt);
    if (ruim) falhas++;
    linhas.push(`${ruim ? 'FALHA' : 'OK   '} [${tok.replace('tok-', '') || 'sem login'}] ${r} -> ${st} ${final !== r.split('?')[0] ? '(foi para ' + final + ') ' : ''}"${(txt || '').trim().slice(0, 50)}" ${erros.join(' ; ')}`);
  }
  await ctx.close();
}
await browser.close();
console.log(linhas.join('\n'));
console.log(`\nTelas: ${linhas.length}  Falhas: ${falhas}`);
