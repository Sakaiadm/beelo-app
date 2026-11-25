// @arquivo  bateria-comunicacao.mjs: testa e-mails (convite, reenvio), entrada por link/convite e as rotas de entrada.
// @tipo     teste (navegador sem cabeça + servidor de e-mail falso; NENHUM e-mail real é enviado)
// @usa      testes/smtp-falso.mjs (porta 2525, grava /tmp/emails-teste.json), testes/mock-supabase.mjs, lib/convite.js, public/marca/*
// @usado-por docs/00-LEIA-PRIMEIRO.md (seção Testes)
// @cuidado  o app precisa estar no ar com SMTP_HOST=127.0.0.1 SMTP_PORT=2525 SMTP_USER=x SMTP_PASS=x SMTP_DE='beelo <contato@beeloapp.com>' APP_URL=http://127.0.0.1:3100
//           Uso: PW_ROOT=/opt/node-tools node testes/bateria-comunicacao.mjs   (SO="texto" filtra pelo nome)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(process.env.PW_ROOT + '/')('playwright');
const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:3100', ARQ = '/tmp/emails-teste.json';
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x' } })).toString('base64url');
const out = []; const cont = {};
const filtro = (n) => !process.env.SO || n.includes(process.env.SO);
const reg = (cat, ok, nome, det = '') => { if (!filtro(nome)) return; cont[cat] ||= { ok: 0, falha: 0 }; cont[cat][ok ? 'ok' : 'falha']++; out.push(`${ok ? 'OK   ' : 'FALHA'} [${cat}] ${nome}${ok ? '' : ' | ' + String(det).slice(0, 300)}`); };

// ═══ SEÇÃO: leitura dos e-mails guardados pelo servidor falso ═══
function decodificar(corpo) {
  // separa as partes (texto e html) e desfaz quoted-printable/base64
  const m = corpo.match(/boundary="?([^"\r\n;]+)"?/i);
  const partes = m ? corpo.split('--' + m[1]) : [corpo];
  const r = { texto: '', html: '', cab: corpo.split(/\n\n/)[0] };
  for (const parte of partes) {
    const [cab, ...resto] = parte.split(/\n\n/); let b = resto.join('\n\n');
    if (/base64/i.test(cab)) b = Buffer.from(b.replace(/\s+/g, ''), 'base64').toString('utf8');
    else if (/quoted-printable/i.test(cab)) b = Buffer.from(b.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8');
    if (/text\/html/i.test(cab)) r.html = b; else if (/text\/plain/i.test(cab)) r.texto = b;
  }
  const assunto = corpo.match(/^Subject: (.*(?:\n[ \t].*)*)/mi)?.[1] || '';
  r.assunto = assunto.replace(/=\?UTF-8\?([QB])\?([^?]*)\?=/gi, (_, t, x) => (t.toUpperCase() === 'B' ? Buffer.from(x, 'base64').toString('utf8') : Buffer.from(x.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (__, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8'))).replace(/\n\s+/g, '');
  r.de = corpo.match(/^From: (.*)/mi)?.[1] || '';
  return r;
}
const emails = () => JSON.parse(fs.readFileSync(ARQ, 'utf8')).map((x) => ({ ...x, ...decodificar(x.corpo) }));

const browser = await chromium.launch();
const ctxPub = await browser.newContext({ viewport: { width: 390, height: 844 } });

// ═══ SEÇÃO: o e-mail de convite (função real, servidor falso) ═══
process.env.SMTP_HOST = '127.0.0.1'; process.env.SMTP_PORT = '2525'; process.env.SMTP_USER = 'teste'; process.env.SMTP_PASS = 'teste';
process.env.SMTP_DE = 'beelo <contato@beeloapp.com>';
const { enviarEmailConvite } = await import(path.join(RAIZ, 'lib/convite.js'));
fs.writeFileSync(ARQ, '[]');
const casos = [
  { id: 'novo', args: { para: 'maria@gmail.com', nomePessoa: 'Maria', nomeFamilia: 'Família Silva', quemConvida: 'Thomas', ja: false, papel: 'Filha' } },
  { id: 'ja', args: { para: 'maria@gmail.com', nomePessoa: 'Maria', nomeFamilia: 'Família Silva', quemConvida: 'Thomas', ja: true, papel: 'Filha' } },
  { id: 'semPapel', args: { para: 'joao+teste@outlook.com', nomePessoa: 'João', nomeFamilia: 'Os Souza', quemConvida: 'Ana', ja: false } },
  { id: 'perigo', args: { para: 'x@t.com', nomePessoa: '<script>alert(1)</script>', nomeFamilia: 'A&B "casa"', quemConvida: '<b>Eu</b>', ja: false, papel: '<i>x</i>' } },
];
for (const c of casos) { process.env.APP_URL = BASE; c.link = await enviarEmailConvite(c.args); }
const recebidos = emails();
for (let i = 0; i < casos.length; i++) {
  const c = casos[i], m = recebidos[i], n = c.id;
  reg('e-mail', !!m, `convite "${n}": o e-mail chegou ao servidor de e-mail`, 'não chegou'); if (!m) continue;
  reg('e-mail', m.para.join().includes(c.args.para), `convite "${n}": vai para o endereço certo`, m.para.join());
  reg('e-mail', /beelo/.test(m.de) && m.de.includes('contato@beeloapp.com'), `convite "${n}": remetente é "beelo" <contato@beeloapp.com>`, m.de);
  const esperado = c.args.ja ? 'Entre no beelo' : `${c.args.quemConvida} convidou você para o beelo`;
  reg('e-mail', m.assunto === esperado, `convite "${n}": assunto em português ("${esperado.slice(0, 30)}")`, m.assunto);
  reg('e-mail', m.texto.includes(c.link) && m.texto.length > 40, `convite "${n}": versão em texto puro traz o link`, m.texto.slice(0, 120));
  reg('e-mail', m.html.includes(`href="${c.link.replace(/&/g, '&amp;')}"`) || m.html.includes(`href="${c.link}"`), `convite "${n}": botão do e-mail abre o link certo`, '');
  const params = new URL(c.link).searchParams;
  reg('e-mail', params.get('email') === c.args.para && params.has(c.args.ja ? 'ja' : 'convite'), `convite "${n}": link leva o e-mail e o tipo (${c.args.ja ? 'ja=1' : 'convite=1'})`, c.link);
  reg('e-mail', !/Rotina Ativa/i.test(m.html + m.texto), `convite "${n}": nenhuma menção a "Rotina Ativa"`, '');
  reg('e-mail', /lang="pt-BR"/.test(m.html) && !/\b(Click|Welcome|Hello|Your)\b/.test(m.html.replace(/<[^>]+>/g, ' ')), `convite "${n}": tudo em português`, '');
  reg('e-mail', /Olá, /.test(m.html) && m.html.includes(c.args.ja ? 'Você já tem cadastro' : 'convidou você'), `convite "${n}": saudação e frase certas`, '');
  if (n === 'perigo') {
    reg('e-mail', !m.html.includes('<script>') && !m.html.includes('<b>Eu</b>') && m.html.includes('&lt;script&gt;'), 'convite "perigo": nomes com HTML são escapados (sem injeção)', m.html.slice(0, 80));
    reg('e-mail', m.html.includes('A&amp;B &quot;casa&quot;'), 'convite "perigo": & e aspas no nome do grupo ficam corretos', '');
  }
  if (n === 'semPapel') reg('e-mail', !m.html.includes('Seu papel no grupo'), 'convite "semPapel": sem papel, a linha de papel some', '');
  else reg('e-mail', m.html.includes('Seu papel no grupo'), `convite "${n}": mostra o papel`, '');
  reg('e-mail', c.args.ja ? !m.html.includes('Como entrar') : true, `convite "${n}": quem já tem cadastro não recebe os passos de primeiro acesso`, '');
}

// ═══ SEÇÃO: logomarca e links do HTML do e-mail (sem imagem quebrada) ═══
{
  const html = recebidos[0].html;
  const imgs = [...html.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/g)].map((x) => ({ tag: x[0], src: x[1].replace(/&amp;/g, '&') }));
  reg('logo', imgs.length >= 2, 'o e-mail tem as duas logomarcas (topo e rodapé)', `achou ${imgs.length}`);
  for (const im of imgs) {
    const nomeArq = im.src.split('/').pop();
    const r = await ctxPub.request.get(im.src);
    reg('logo', r.status() === 200 && /image\/png/.test(r.headers()['content-type'] || ''), `imagem ${nomeArq} abre (HTTP 200, PNG)`, `${r.status()} ${r.headers()['content-type']}`);
    const corpo = await r.body(); const w = corpo.readUInt32BE(16), h = corpo.readUInt32BE(20);
    reg('logo', w >= 200 && h >= 60, `imagem ${nomeArq} tem tamanho de sobra para telas de alta resolução (${w}x${h})`, `${w}x${h}`);
    reg('logo', /alt="beelo"/.test(im.tag) && /width="\d+"/.test(im.tag) && /height="\d+"/.test(im.tag), `imagem ${nomeArq} tem texto alternativo "beelo" e tamanho fixo (se bloquear a imagem, ainda aparece o nome)`, im.tag);
    reg('logo', fs.existsSync(path.join(RAIZ, 'public/marca', nomeArq)), `imagem ${nomeArq} existe no repositório (public/marca)`, '');
    reg('logo', /@2x|horizontal/.test(nomeArq) && !/app/i.test(nomeArq.replace('negativa', '').replace('positiva', '')), `imagem ${nomeArq} é a logomarca horizontal "beelo" (sem "app")`, nomeArq);
  }
  // com o endereço de produção (sem APP_URL) as imagens apontam para beeloapp.com e existem em public/marca
  delete process.env.APP_URL; fs.writeFileSync(ARQ, '[]');
  const linkProd = await enviarEmailConvite(casos[0].args); const mp = emails()[0];
  reg('logo', linkProd.startsWith('https://beeloapp.com/login?'), 'em produção o link do e-mail começa com https://beeloapp.com/login', linkProd);
  const srcsProd = [...mp.html.matchAll(/<img[^>]*src="([^"]+)"/g)].map((x) => x[1]);
  reg('logo', srcsProd.length >= 2 && srcsProd.every((u) => u.startsWith('https://beeloapp.com/marca/') && fs.existsSync(path.join(RAIZ, 'public', u.replace('https://beeloapp.com/', '')))), 'em produção as imagens são https://beeloapp.com/marca/... e os arquivos existem', srcsProd.join(' '));
  const hrefs = [...mp.html.matchAll(/href="([^"]+)"/g)].map((x) => x[1].replace(/&amp;/g, '&')).filter((u) => !u.startsWith('https://fonts.'));
  reg('logo', hrefs.every((u) => u.startsWith('https://beeloapp.com') || u.startsWith('mailto:') || u.startsWith('https://wa.me')), 'todos os links do e-mail apontam para beeloapp.com, e-mail de contato ou WhatsApp', hrefs.join(' '));
  reg('logo', !/(localhost|127\.0\.0\.1)/.test(mp.html + mp.texto), 'o e-mail de produção não tem endereço de teste (localhost)', '');
}

// ═══ SEÇÃO: aparência do e-mail (claro, escuro, celular) ═══
{
  for (const [esquema, largura] of [['light', 390], ['dark', 390], ['light', 320], ['dark', 320], ['light', 700]]) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: 900 }, colorScheme: esquema });
    const p = await ctx.newPage(); await p.setContent(recebidos[0].html, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const info = await p.evaluate(() => ({ w: document.documentElement.scrollWidth, quebradas: [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src), btn: !!document.querySelector('a[href*="/login"]') }));
    reg('aparência', info.w <= largura + 1, `e-mail em ${esquema === 'dark' ? 'modo escuro' : 'modo claro'} com ${largura}px não rola para o lado`, `largura ${info.w}`);
    reg('aparência', !info.quebradas.length, `e-mail em ${esquema === 'dark' ? 'modo escuro' : 'modo claro'} com ${largura}px: nenhuma imagem quebrada`, info.quebradas.join(' '));
    if (largura === 390) await p.screenshot({ path: `/tmp/email-${esquema}.png`, fullPage: true });
    await ctx.close();
  }
}

// ═══ SEÇÃO: o link do e-mail abre a tela de entrada certa ═══
{
  const p = await ctxPub.newPage(); p.setDefaultTimeout(6000);
  for (const c of casos.slice(0, 3)) {
    const nome = `link do e-mail "${c.id}" abre o login com o e-mail preenchido e o aviso certo`;
    await p.goto(c.link, { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
    const v = await p.locator('#email').inputValue().catch(() => ''); const t = await p.evaluate(() => document.body.innerText);
    const aviso = c.args.ja ? `Você já tem cadastro com ${c.args.para}` : `Seu convite é para ${c.args.para}`;
    reg('entrada', v === c.args.para && t.includes(aviso), nome, `campo=${v} texto=${t.slice(0, 160)}`);
  }
  await p.close();
}

// ═══ SEÇÃO: entrada por convite, por e-mail e rotas de entrada (tela de login) ═══
const ent = async (nome, url, fn, { cookies = [] } = {}) => {
  if (!filtro(nome)) return;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); if (cookies.length) await ctx.addCookies(cookies);
  const p = await ctx.newPage(); p.setDefaultTimeout(6000); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  try { await fetch('http://127.0.0.1:54321/__falha'); await p.goto(BASE + url, { waitUntil: 'networkidle' }); await p.waitForTimeout(400); const r = await fn(p, ctx); reg('entrada', r === undefined ? !erros.length : r && !erros.length, nome, erros.join(';')); }
  catch (e) { reg('entrada', false, nome, e.message.split('\n')[0]); }
  await ctx.close();
};
const txt = (p) => p.evaluate(() => document.body.innerText);
const otps = async () => (await (await fetch('http://127.0.0.1:54321/__log')).json()).filter((l) => /^POST .*auth\/v1\/otp/.test(l));
await ent('login: mostra Google, link por e-mail, WhatsApp e contato', '/login', async (p) => { const t = await txt(p); const h = await p.content(); return ['Entrar com Google', 'Enviar link de acesso', 'Só entra quem foi convidado pelos pais', 'Pais presentes, filhos protagonistas'].every((x) => t.includes(x)) && h.includes('wa.me/5563981113466') && h.includes('contato@beeloapp.com'); });
await ent('login: logo é o beelo branco sobre o azul e carrega', '/login', async (p) => p.evaluate(() => { const i = document.querySelector('h1 img'); return !!i && i.complete && i.naturalWidth > 0 && /beelo/.test(i.alt); }));
await ent('login: e-mail inválido não pede o link', '/login', async (p) => { await p.locator('#email').fill('maria-sem-arroba'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.waitForTimeout(600); return (await otps()).length === 0; });
await ent('login: pedir o link por e-mail mostra "Abra seu e-mail"', '/login', async (p) => { await otps(); await p.locator('#email').fill('Maria@Gmail.com'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.getByText('Abra seu e-mail').waitFor(); const o = await otps(); return o.length === 1 && /maria@gmail\.com/.test(o[0]); });
await ent('login: depois de pedir, "Abrir meu e-mail" leva ao Gmail', '/login', async (p) => { await p.locator('#email').fill('maria@gmail.com'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.getByText('Abra seu e-mail').waitFor(); return (await p.getByRole('link', { name: 'Abrir meu e-mail' }).getAttribute('href')).includes('mail.google.com'); });
await ent('login: e-mail de domínio raro não mostra "Abrir meu e-mail"', '/login', async (p) => { await p.locator('#email').fill('maria@empresa.com.br'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.getByText('Abra seu e-mail').waitFor(); return (await p.getByRole('link', { name: 'Abrir meu e-mail' }).count()) === 0; });
await ent('login: "Não chegou? Enviar de novo" pede outro link e avisa', '/login', async (p) => { await otps(); await p.locator('#email').fill('maria@gmail.com'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.getByText('Abra seu e-mail').waitFor(); await p.getByRole('button', { name: 'Não chegou? Enviar de novo' }).click(); await p.getByText('Enviamos de novo').waitFor(); return (await otps()).length === 2; });
await ent('login: "Usar outro e-mail" volta ao formulário', '/login', async (p) => { await p.locator('#email').fill('maria@gmail.com'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.getByText('Abra seu e-mail').waitFor(); await p.getByRole('button', { name: 'Usar outro e-mail' }).click(); return (await p.locator('#email').count()) === 1; });
await ent('login: muitos pedidos seguidos mostram "Espere 1 minuto"', '/login', async (p) => { await fetch('http://127.0.0.1:54321/__falha?otp=429'); await p.locator('#email').fill('maria@gmail.com'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.getByText('Espere 1 minuto').waitFor(); await fetch('http://127.0.0.1:54321/__falha'); });
await ent('login: erro do servidor de e-mail dá mensagem em português', '/login', async (p) => { await fetch('http://127.0.0.1:54321/__falha?otp=500'); await p.locator('#email').fill('maria@gmail.com'); await p.getByRole('button', { name: /link de acesso/i }).click(); await p.getByText(/Não foi possível enviar/).waitFor(); await fetch('http://127.0.0.1:54321/__falha'); });
await ent('login: link vencido (?erro=link) explica e oferece novo link', '/login?erro=link', async (p) => (await txt(p)).includes('Esse link não vale mais'));
await ent('login: sessão expirada (?expirou=1) avisa', '/login?expirou=1', async (p) => (await txt(p)).includes('Sua sessão expirou'));
await ent('login: grupo apagado (?apagado=1) agradece', '/login?apagado=1', async (p) => (await txt(p)).includes('Obrigado por usar o beelo'));
await ent('login: convite com Gmail sugere também Entrar com Google', '/login?email=ana%40gmail.com&convite=1', async (p) => (await txt(p)).includes('ou em Entrar com Google'));
await ent('login: convite com outro provedor não cita o Google no aviso', '/login?email=ana%40empresa.com&convite=1', async (p) => !(await txt(p)).includes('ou em Entrar com Google'));
await ent('login: convite guarda o e-mail do convite (cookie)', '/login?email=ana%40gmail.com&convite=1', async (p, ctx) => (await ctx.cookies()).some((c) => c.name === 'convite_email' && decodeURIComponent(c.value) === 'ana@gmail.com'));
await ent('login: "já tem cadastro" mostra o e-mail certo', '/login?email=ana%40gmail.com&ja=1', async (p) => (await txt(p)).includes('Você já tem cadastro com ana@gmail.com'));
await ent('login: o app lembra o último e-mail neste aparelho', '/login', async (p) => { await p.evaluate(() => localStorage.setItem('beelo_email', 'lembrado@t.com')); await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(300); return (await p.locator('#email').inputValue()) === 'lembrado@t.com'; });
await ent('login: pessoa sem convite (estranho) vê a explicação em /sem-acesso', '/sem-acesso', async (p) => (await txt(p)).length > 60, { cookies: [{ name: 'sb-127-auth-token', value: sess('tok-estranho'), url: BASE }] });
await ent('login: entrou com outra conta que não a do convite: oferece voltar', '/sem-acesso', async (p) => (await txt(p)).includes('ana@gmail.com'), { cookies: [{ name: 'sb-127-auth-token', value: sess('tok-estranho'), url: BASE }, { name: 'convite_email', value: encodeURIComponent('ana@gmail.com'), url: BASE }] });
// rotas de entrada
for (const [nome, url, esperado] of [
  ['/auth/confirm com link bom entra no app', '/auth/confirm?token_hash=ok-hash&type=email', (u) => u.pathname !== '/login'],
  ['/auth/confirm com link ruim volta ao login com aviso', '/auth/confirm?token_hash=ruim&type=email', (u) => u.pathname === '/login' && u.searchParams.get('erro') === 'link'],
  ['/auth/confirm sem código volta ao login com aviso', '/auth/confirm', (u) => u.pathname === '/login' && u.searchParams.get('erro') === 'link'],
  ['/auth/callback sem código não quebra (volta para o início)', '/auth/callback', (u) => u.pathname !== '/auth/callback'],
]) {
  if (!filtro(nome)) continue;
  try { const p = await ctxPub.newPage(); await p.goto(BASE + url, { waitUntil: 'networkidle' }); const u = new URL(p.url()); reg('entrada', esperado(u), nome, p.url()); await p.close(); } catch (e) { reg('entrada', false, nome, e.message.split('\n')[0]); }
}
{
  const nome = 'sair: volta ao login e o e-mail do convite vem preenchido';
  if (filtro(nome)) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-estranho'), url: BASE }]);
    const p = await ctx.newPage(); await p.goto(BASE + '/sem-acesso', { waitUntil: 'networkidle' });
    const r = await ctx.request.post(BASE + '/auth/sair', { form: { email: 'ana@gmail.com' }, maxRedirects: 0 });
    reg('entrada', r.status() === 303 && /\/login\?email=ana%40gmail\.com&convite=1/.test(r.headers().location || ''), nome, `${r.status()} ${r.headers().location}`); await ctx.close();
  }
  const nome2 = 'sair com e-mail estranho (não é e-mail) ignora e vai ao login limpo';
  if (filtro(nome2)) { const r = await ctxPub.request.post(BASE + '/auth/sair', { form: { email: 'isto não é e-mail' }, maxRedirects: 0 }); reg('entrada', r.status() === 303 && !/email=/.test(r.headers().location || ''), nome2, r.headers().location); }
}

// ═══ SEÇÃO: envio e reenvio de convite pelo app (Pai cadastra, reenvia, manda acesso) ═══
const comPai = async (nome, url, fn) => {
  if (!filtro(nome)) return;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-pai'), url: BASE }]);
  const p = await ctx.newPage(); p.setDefaultTimeout(12000); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  try { fs.writeFileSync(ARQ, '[]'); await p.goto(BASE + url, { waitUntil: 'networkidle' }); await p.waitForTimeout(700); const r = await fn(p); reg('convite', r === undefined ? !erros.length : r && !erros.length, nome, erros.join(';')); }
  catch (e) { reg('convite', false, nome, e.message.split('\n')[0]); }
  await ctx.close();
};
await comPai('cadastrar pessoa com e-mail e enviar convite manda o e-mail e avisa', '/config/pessoas/nova', async (p) => { await p.locator('#p-nome').fill('Tio Beto'); await p.locator('#p-email').fill('beto@t.com'); await p.locator('select').nth(1).selectOption({ label: 'Adulto que ajuda' }); await p.getByRole('button', { name: /Adicionar e enviar convite/ }).click(); await p.waitForURL(/aviso=convite/, { timeout: 20000 }); const m = emails().find((x) => x.para.join().includes('beto@t.com')); return !!m && m.html.includes('convite=1') && m.html.includes('Tio Beto'); });
await comPai('o e-mail do convite pelo app diz o grupo e quem convidou', '/config/pessoas/nova', async (p) => { await p.locator('#p-nome').fill('Tia Lu'); await p.locator('#p-email').fill('lu@t.com'); await p.locator('select').nth(1).selectOption({ label: 'Adulto que ajuda' }); await p.getByRole('button', { name: /enviar convite/i }).click(); await p.waitForURL(/aviso=convite/, { timeout: 20000 }); const m = emails().find((x) => x.para.join().includes('lu@t.com')); return !!m && m.html.includes('Família Sakai') && m.assunto.includes('Thomas'); });
await comPai('lista: pessoa que ainda não entrou mostra "Ainda sem convite" e "Convidar" manda o e-mail', '/config/pessoas', async (p) => { await p.getByText('Ainda sem convite').waitFor(); await p.getByRole('button', { name: 'Convidar' }).first().click(); await p.getByText('Convite enviado.').waitFor(); const m = emails().find((x) => x.para.join().includes('bia@t.com')); return !!m && m.html.includes('convite=1'); });
await comPai('perfil da pessoa que não entrou: "Enviar convite" manda o e-mail', '/config/pessoas/00000000-0000-0000-0000-000000000005', async (p) => { await p.getByRole('button', { name: /(Reenviar|Enviar) convite/ }).click(); await p.getByText('Convite enviado.').waitFor(); return emails().some((x) => x.para.join().includes('bia@t.com')); });
await comPai('reenviar convite não cria pessoa nova no cadastro', '/config/pessoas/00000000-0000-0000-0000-000000000005', async (p) => { await fetch('http://127.0.0.1:54321/__log'); await p.getByRole('button', { name: /(Reenviar|Enviar) convite/ }).click(); await p.getByText('Convite enviado.').waitFor(); const log = (await (await fetch('http://127.0.0.1:54321/__log')).json()); return !log.some((l) => /POST \/rest\/v1\/ra_membros/.test(l)); });
await comPai('quem já entrou: "Enviar e-mail de acesso" manda aviso com ja=1', `/config/pessoas/00000000-0000-0000-0000-000000000003`, async (p) => { await p.getByRole('button', { name: 'Enviar e-mail de acesso' }).click(); await p.getByText('E-mail enviado.').waitFor(); const m = emails().find((x) => x.para.join().includes('edu@t.com')); return !!m && m.html.includes('ja=1') && m.html.includes('Você já tem cadastro') && m.assunto === 'Entre no beelo'; });
await comPai('e-mail de quem já está no grupo vira "Enviar convite" sem erro', '/config/pessoas/nova', async (p) => { await p.locator('#p-email').fill('alice@t.com'); await p.getByText('já está neste grupo com este e-mail').waitFor(); return (await p.getByText('Este e-mail já está cadastrado').count()) === 0; });
await comPai('e-mail com erro de digitação (gmial.com) sugere a correção', '/config/pessoas/nova', async (p) => { await p.locator('#p-email').fill('ana@gmial.com'); await p.getByText(/gmail\.com/).first().waitFor(); return true; });
await comPai('e-mail sem @ mostra aviso em português', '/config/pessoas/nova', async (p) => { await p.locator('#p-email').fill('anagmail.com'); await p.locator('#p-email').blur(); await p.getByText('Falta o @ no e-mail.').waitFor(); return true; });
await comPai('pessoa sem e-mail: o cadastro mostra que não recebe convite', '/config/pessoas/nova', async (p) => { await p.locator('#p-nome').fill('Vovó'); return (await p.getByRole('button', { name: /enviar convite/i }).count()) === 0; });
await comPai('lista de pessoas avisa quem não tem e-mail (não entra no app)', '/config/pessoas', async (p) => (await p.evaluate(() => document.body.innerText)).includes('Sem e-mail: não entra no app'));

await browser.close();
console.log(out.join('\n'));
const tot = Object.values(cont).reduce((a, c) => a + c.ok + c.falha, 0), bad = Object.values(cont).reduce((a, c) => a + c.falha, 0);
console.log('\n' + Object.entries(cont).map(([k, c]) => `${k}: ${c.ok}/${c.ok + c.falha}`).join('  ') + `\nTotal: ${tot}  Falhas: ${bad}`);
