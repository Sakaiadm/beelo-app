// @arquivo  bateria-telas.mjs: casos de VISÃO (o que cada papel vê ou não vê), REDIRECIONAMENTO, NAVEGAÇÃO e LINKS.
// @tipo     teste (navegador sem cabeça contra o Supabase falso)
// @usa      testes/mock-supabase.mjs (MOCK_DESAFIOS=1 MOCK_DESEJOS=1), app em 127.0.0.1:3100
// @usado-por docs/00-LEIA-PRIMEIRO.md (seção Testes)
// @cuidado  cada linha das tabelas é UM caso. Papéis do falso: pai (Thomas), filho (Eduardo, sem Modo criança), ado (Alice), estranho (sem acesso).
//           Uso: PW_ROOT=/opt/node-tools node testes/bateria-telas.mjs   (SO="texto" filtra pelo nome do caso)
import { createRequire } from 'node:module';
const { chromium } = createRequire(process.env.PW_ROOT + '/')('playwright');
const BASE = 'http://127.0.0.1:3100';
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x' } })).toString('base64url');
const E = '00000000-0000-0000-0000-000000000003', T30 = '00000000-0000-0000-0000-000000000030', T31 = '00000000-0000-0000-0000-000000000031';

// ═══ SEÇÃO: Visão por papel [papel, rota, deve conter, não deve conter] ═══
const VISAO = [
  // Pai
  ['pai', '/painel', ['Precisa da sua atenção', 'Aprovar', 'Conferido', 'Refazer', 'CUMPRIDAS HOJE', 'ATRASADAS'], ['Justificar']],
  ['pai', '/painel', ['Painel', 'Agenda', 'Relatórios', 'Desafios', 'Tela', 'Cadastros'], []],
  ['pai', '/hoje', ['Dia de Eduardo', 'Eduardo', 'Alice', 'DESAFIOS E CONQUISTAS'], []],
  ['pai', '/hoje', ['Conferido', 'Refazer'], ['Justificar']],
  ['pai', '/agenda', ['Dia', 'Semana', 'Mês', 'Todos', 'Eduardo', 'Alice'], []],
  ['pai', '/agenda?v=dia', ['Agenda'], ['Erro']],
  ['pai', '/agenda?v=mes', ['Agenda', 'Mês', 'Eduardo'], []],
  ['pai', '/tarefas/nova', ['Sugestões', 'Repetir', 'Horário', 'Salvar tarefa'], []],
  ['pai', `/tarefas/${T30}`, ['Excluir tarefa'], []], // @decisao o pai que abre a tarefa cai direto na edição
  ['pai', `/tarefas/${T30}/editar`, ['Excluir tarefa', 'Salvar tarefa'], []],
  ['pai', '/relatorios', ['Relatórios'], []],
  ['pai', '/tela', ['Tempo de tela'], []],
  ['pai', `/tela?m=${E}`, ['Tempo de tela', 'Eduardo'], []],
  ['pai', '/config', ['Grupos', 'Pessoas', 'Categorias', 'Guia da Mel (beta)'], []],
  ['pai', '/config/pessoas', ['Eduardo', 'Alice', 'Thomas'], []],
  ['pai', '/config/pessoas/nova', ['Adicionar'], []],
  ['pai', `/config/pessoas/${E}`, ['Eduardo', 'Excluir pessoa', 'Parentesco', 'Papel', 'Modo criança'], []],
  ['pai', '/config/categorias', ['Estudo', 'Casa'], []],
  ['pai', '/config/familias', ['Família Sakai'], []],
  ['pai', '/desafios', ['Desejos para aprovar', 'Prêmio para entregar', 'Encerrar', 'Vitrine', 'Mural', 'Ajustes', 'Como funciona'], []],
  ['pai', '/desafios', ['Eduardo sugeriu: Patins', 'Alice sugeriu: Show com amigos', 'Marcar como entregue'], []],
  ['pai', '/desafios/ajustes', ['Desligar os desafios', 'Salvar'], []],
  ['pai', '/desafios/premios', ['Vitrine de prêmios', 'Criar meu prêmio', 'Adolescente (semanas)'], []],
  ['pai', '/desafios/mural', ['Mural de conquistas'], []],
  ['pai', '/desafios/novo', ['Novo desafio'], []],
  ['pai', '/perfil', ['Meu perfil', 'Baixar meus dados', 'Privacidade e seus dados', 'Resumo do dia'], []],
  ['pai', '/ideias', ['Ideias'], []],
  ['pai', '/ajuda', ['Ajuda'], ['Rotina Ativa']],
  ['pai', '/notificacoes', ['Notificações', 'Marcar todas como lidas'], []],
  ['pai', '/seguranca', ['Segurança'], []],
  // Filho (Eduardo, sem Modo criança)
  ['filho', '/hoje', ['Olá, Eduardo', 'Justificar', 'Adicionar minha tarefa', 'Estudar 1h'], ['Aprovar', 'Conferido', 'Cadastros']],
  ['filho', '/hoje', ['Hoje', 'Agenda', 'Tela', 'Evolução'], ['Cadastros', 'Painel']],
  ['filho', '/desafios', ['Meus desafios', 'Foco no Estudo', 'Como funciona'], ['Desejos para aprovar', 'Prêmio para entregar', 'Encerrar', 'Ajustes']],
  ['filho', '/desafios/cofrinho', ['Semanas conquistadas', 'MEUS DESEJOS', 'Patins', 'Sugerir um desejo', 'Quero este'], ['Show com amigos']],
  ['filho', '/desafios/mural', ['Mural de conquistas'], []],
  ['filho', '/desafios/novo', ['Novo desafio', 'PENSADOS PARA EDUARDO'], []],
  ['filho', '/relatorios', ['Minha evolução'], ['Aprovar']],
  ['filho', '/tela', ['Tempo de tela', 'Celular', 'Computador', 'Previsto de hoje'], []],
  ['filho', '/ideias', ['Ideias', 'IDEIA DA SEMANA'], []],
  ['filho', '/tarefas/nova', ['Nova tarefa', 'Salvar tarefa'], []],
  ['filho', '/perfil', ['Meu perfil'], ['Resumo do dia']],
  ['filho', '/notificacoes', ['Notificações'], []],
  // Adolescente (Alice, sem tempo de tela)
  ['ado', '/hoje', ['Olá, Alice', 'Violão', 'Justificar', 'Adicionar minha tarefa'], ['Estudar 1h', 'Aprovar']],
  ['ado', '/desafios/cofrinho', ['Semanas conquistadas'], ['Patins', 'Celular', 'Eduardo sugeriu']],
  ['ado', '/desafios', ['Meus desafios', 'Revisão do dia'], ['Foco no Estudo', 'Desejos para aprovar']],
  ['ado', '/relatorios', ['Minha evolução'], ['Tempo de tela']],
  ['ado', '/ideias', ['Ideias'], []],
  ['ado', '/hoje', ['Hoje', 'Agenda', 'Evolução'], ['Tela', 'Cadastros']],
];

// ═══ SEÇÃO: Redirecionamentos e bloqueios [papel, rota, caminho final esperado] ═══
const REDIR = [
  ['filho', '/painel', '/hoje'], ['filho', '/config', '/hoje'], ['filho', '/config/pessoas', '/hoje'], ['filho', '/config/categorias', '/hoje'],
  ['filho', '/config/familias', '/hoje'], ['filho', '/desafios/premios', '/hoje'], ['filho', '/desafios/ajustes', '/hoje'], ['filho', '/admin', '/hoje'],
  ['filho', '/config/pessoas/nova', '/hoje'], ['filho', '/config/ajustes', '/seguranca'],
  ['ado', '/painel', '/hoje'], ['ado', '/config', '/hoje'], ['ado', '/tela', '/hoje'], ['ado', '/desafios/premios', '/hoje'], ['ado', '/desafios/ajustes', '/hoje'],
  ['pai', '/', '/painel'], ['pai', '/admin', '/config/familias'], ['pai', '/config/ajustes', '/seguranca'], ['pai', '/tarefas', '/agenda'],
  ['pai', '/desafios/cofrinho', '/desafios'],
  ['estranho', '/', '/sem-acesso'], ['estranho', '/hoje', '/sem-acesso'], ['estranho', '/painel', '/sem-acesso'], ['estranho', '/desafios', '/sem-acesso'],
  ['estranho', '/config', '/sem-acesso'],
  ['anon', '/painel', '/login'], ['anon', '/hoje', '/login'], ['anon', '/config', '/login'], ['anon', '/desafios', '/login'], ['anon', '/perfil', '/login'],
  ['anon', '/agenda', '/login'], ['anon', '/relatorios', '/login'],
];

// ═══ SEÇÃO: Navegação por toque [papel, rota inicial, texto do link, caminho esperado] ═══
const NAV = [
  ['pai', '/painel', 'Agenda', '/agenda'], ['pai', '/painel', 'Relatórios', '/relatorios'], ['pai', '/painel', 'Desafios', '/desafios'],
  ['pai', '/painel', 'Tela', '/tela'], ['pai', '/painel', 'Cadastros', '/config'], ['pai', '/agenda', 'Painel', '/painel'],
  ['pai', '/config', /^Pessoas/, '/config/pessoas'], ['pai', '/config', /^Categorias/, '/config/categorias'], ['pai', '/config', /^Grupos/, '/config/familias'],
  ['pai', '/desafios', 'Vitrine', '/desafios/premios'], ['pai', '/desafios', 'Mural', '/desafios/mural'], ['pai', '/desafios', 'Ajustes', '/desafios/ajustes'],
  ['pai', '/desafios', 'Mais um desafio', '/desafios/novo'],
  ['filho', '/hoje', 'Agenda', '/agenda'], ['filho', '/hoje', 'Tela', '/tela'], ['filho', '/hoje', 'Evolução', '/relatorios'],
  ['filho', '/hoje', 'Adicionar minha tarefa', '/tarefas/nova'], ['filho', '/desafios/cofrinho', 'Hoje', '/hoje'], ['filho', '/agenda', 'Hoje', '/hoje'],
  ['ado', '/hoje', 'Agenda', '/agenda'], ['ado', '/hoje', 'Evolução', '/relatorios'],
];

// ═══ SEÇÃO: Links e páginas públicas [rota, deve conter, não deve conter] ═══
const PUBLICAS = [
  ['/manual', ['beelo'], ['Rotina Ativa']], ['/manual/pessoa', ['beelo'], ['Rotina Ativa']], ['/manual/crianca', ['beelo'], ['Rotina Ativa']],
  ['/termos', ['Termos'], ['Rotina Ativa']], ['/privacidade', ['rivacidade'], ['Rotina Ativa']], ['/consentimento', ['onsentimento'], ['Rotina Ativa']],
  ['/login', ['beelo', 'WhatsApp'], ['Rotina Ativa']], ['/offline.html', ['beelo'], ['Rotina Ativa']],
];

const browser = await chromium.launch();
const filtro = (n) => !process.env.SO || n.includes(process.env.SO);
const out = []; const cont = {};
const reg = (cat, ok, nome, det = '') => { cont[cat] ||= { ok: 0, falha: 0 }; cont[cat][ok ? 'ok' : 'falha']++; out.push(`${ok ? 'OK   ' : 'FALHA'} [${cat}] ${nome}${ok ? '' : ' | ' + det}`); };
const novoCtx = async (quem, largura = 390) => {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 844 } });
  if (quem !== 'anon') await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-' + quem), url: BASE }]);
  const p = await ctx.newPage(); p.setDefaultTimeout(8000); return { ctx, p };
};
const texto = (p) => p.evaluate(() => document.body.innerText);

for (const quem of ['pai', 'filho', 'ado', 'estranho', 'anon']) {
  const { ctx, p } = await novoCtx(quem); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  for (const [q, rota, deve, nao] of VISAO.filter((c) => c[0] === quem)) {
    const nome = `${q} vê ${rota.split('?')[0]}: ${deve.slice(0, 3).join(', ')}${nao.length ? ' (e não vê ' + nao.join(', ') + ')' : ''}`;
    if (!filtro(nome)) continue; erros.length = 0;
    try {
      await p.goto(BASE + rota, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
      const t = await texto(p); const falta = deve.filter((x) => !t.includes(x)); const sobra = nao.filter((x) => t.includes(x));
      reg('visão', !falta.length && !sobra.length && !erros.length, nome, `falta: ${falta.join(' | ')} sobra: ${sobra.join(' | ')} ${erros.join(';')} (caminho ${new URL(p.url()).pathname})`);
    } catch (e) { reg('visão', false, nome, e.message.split('\n')[0]); }
  }
  for (const [q, rota, fim] of REDIR.filter((c) => c[0] === quem)) {
    const nome = `${q} abre ${rota} e vai para ${fim}`;
    if (!filtro(nome)) continue;
    try { await p.goto(BASE + rota, { waitUntil: 'networkidle' }); const f = new URL(p.url()).pathname; reg('acesso', f === fim, nome, `foi para ${f}`); }
    catch (e) { reg('acesso', false, nome, e.message.split('\n')[0]); }
  }
  for (const [q, rota, link, fim] of NAV.filter((c) => c[0] === quem)) {
    const nome = `${q} em ${rota} toca em "${String(link).replace(/[\/^]/g, '')}" e abre ${fim}`;
    if (!filtro(nome)) continue;
    try {
      await p.goto(BASE + rota, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
      await p.getByRole('link', { name: link, exact: typeof link === 'string' }).first().click(); await p.waitForURL((u) => u.pathname === fim, { timeout: 15000 });
      reg('navegação', true, nome);
    } catch (e) { reg('navegação', false, nome, `${e.message.split('\n')[0]} (em ${new URL(p.url()).pathname})`); }
  }
  await ctx.close();
}

// Tarefa dos pais: o filho não edita (404) e tarefa de outra pessoa não abre para outro filho
{
  const { ctx, p } = await novoCtx('filho');
  const nomeE = 'filho não edita tarefa criada pelos pais (mostra "Página não encontrada")';
  if (filtro(nomeE)) { await p.goto(BASE + `/tarefas/${T30}/editar`, { waitUntil: 'networkidle' }); reg('acesso', (await texto(p)).includes('Página não encontrada'), nomeE); }
  await ctx.close();
}

// Páginas públicas, links internos e fonte local
{
  const { ctx, p } = await novoCtx('anon'); const pedidos = []; p.on('request', (r) => pedidos.push(r.url()));
  for (const [rota, deve, nao] of PUBLICAS) {
    const nome = `página pública ${rota} abre e tem ${deve.join(', ')}`;
    if (!filtro(nome)) continue;
    try {
      const r = await p.goto(BASE + rota, { waitUntil: 'networkidle' }); const t = await texto(p) + (await p.content());
      reg('links', r.status() === 200 && deve.every((x) => t.includes(x)) && nao.every((x) => !t.includes(x)), nome, `status ${r.status()}`);
      const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && h.startsWith('/') && !h.startsWith('//')));
      const ruins = [];
      for (const h of [...new Set(hrefs)]) { const rr = await ctx.request.get(BASE + h, { maxRedirects: 3 }); if (rr.status() >= 400) ruins.push(h + ' ' + rr.status()); }
      if (filtro('links internos')) reg('links', !ruins.length, `links internos de ${rota} (${new Set(hrefs).size}) respondem`, ruins.join(', '));
    } catch (e) { reg('links', false, nome, e.message.split('\n')[0]); }
  }
  if (filtro('fonte')) {
    // @cuidado os manuais estáticos (/manual*) ainda chamam o Google Fonts; o app em si não. Por isso este teste usa só as telas do app.
    const nomes = []; const q = await ctx.newPage(); q.on('request', (r) => nomes.push(r.url()));
    for (const r of ['/login', '/termos', '/privacidade', '/consentimento']) await q.goto(BASE + r, { waitUntil: 'networkidle' });
    reg('fonte', !nomes.some((u) => /fonts\.(googleapis|gstatic)/.test(u)), 'telas do app não chamam o Google Fonts', nomes.filter((u) => /fonts\./.test(u)).join(','));
    reg('fonte', nomes.some((u) => /_next\/static\/media\/.*\.woff2/.test(u)), 'a letra do app é um arquivo do próprio app (woff2)', nomes.filter((u) => /woff/.test(u)).join(','));
    const fam = await q.evaluate(() => getComputedStyle(document.body).fontFamily);
    reg('fonte', /fonte/i.test(fam), 'o corpo usa a letra embutida (next/font/local)', fam);
  }
  for (const [rota, tipo] of [['/manifest.json', 'json'], ['/sw.js', 'javascript'], ['/icone-192.png', 'png'], ['/icone-512.png', 'png'], ['/apple-touch-icon.png', 'png']]) {
    const nome = `arquivo do app ${rota} existe`; if (!filtro(nome)) continue;
    const r = await ctx.request.get(BASE + rota); reg('links', r.status() === 200 && (r.headers()['content-type'] || '').includes(tipo), nome, `${r.status()} ${r.headers()['content-type']}`);
  }
  await ctx.close();
}
await browser.close();
console.log(out.join('\n'));
const tot = Object.values(cont).reduce((a, c) => a + c.ok + c.falha, 0), bad = Object.values(cont).reduce((a, c) => a + c.falha, 0);
console.log('\n' + Object.entries(cont).map(([k, c]) => `${k}: ${c.ok}/${c.ok + c.falha}`).join('  ') + `\nTotal: ${tot}  Falhas: ${bad}`);
