// Testa formulários e botões: confere se cada ação chega ao banco (Supabase falso) com os dados certos.
import { createRequire } from 'node:module';
const { chromium } = createRequire(process.env.PW_ROOT + '/')('playwright');
const BASE = 'http://127.0.0.1:3100';
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x' } })).toString('base64url');
const lerLog = async () => (await (await fetch('http://127.0.0.1:54321/__log')).json()).filter((l) => !/^GET|^HEAD|rpc\/ra_(eu|vincular|gerar_ocorrencias|tela_previsto_dia) /.test(l));
const amanha = new Date(Date.now() + 21 * 3600e3).toISOString().slice(0, 10);
const E = '00000000-0000-0000-0000-000000000003';
const casos = [
  ['filho', 'Concluir tarefa sem foto (toque no círculo)', '/hoje', async (p) => { await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click(); }, /rpc\/ra_concluir .*"p_foto":null/],
  ['filho', 'Justificar atraso', '/hoje', async (p) => { await p.getByRole('button', { name: 'Justificar' }).first().click(); await p.locator('textarea[name=texto]').fill('Estava doente'); await p.getByRole('button', { name: 'Enviar justificativa' }).click(); }, /rpc\/ra_justificar .*Estava doente/],
  ['filho', 'Pedir adiamento', '/hoje', async (p) => { await p.getByRole('button', { name: 'Pedir adiamento' }).first().click(); await p.locator('input[name=data]').fill(amanha); await p.locator('textarea[name=motivo]').fill('Prova amanhã'); await p.locator('.painel-acao').getByRole('button', { name: 'Pedir adiamento' }).click(); }, /rpc\/ra_pedir_adiamento .*Prova amanh/],
  ['filho', 'Desfazer conclusão', '/hoje', async (p) => { await p.getByRole('button', { name: 'Desfazer' }).first().click(); }, /rpc\/ra_desfazer /],
  ['filho', 'Criar a própria tarefa com horário', '/tarefas/nova', async (p) => { await p.locator('input[name=titulo]').fill('Ler 20 páginas'); await p.getByLabel('Tem horário definido').check(); const hi = p.locator('input[name=hora_inicio]'); if (await hi.count()) await hi.fill('21:00'); await p.getByRole('button', { name: 'Salvar tarefa' }).click(); await p.waitForURL(/tarefas\?ok=1/, { timeout: 8000 }); }, /POST \/rest\/v1\/ra_tarefas .*Ler 20 p.*"responsavel_id":"00000000-0000-0000-0000-000000000003"/],
  ['filho', 'Lançar tempo de tela de ontem', '/tela', async (p) => { const c = p.locator('input[name=celular]'); if (await c.count()) { await c.first().fill('3h05'); await p.locator('input[name=computador]').first().fill('1h05'); } else await p.locator('input[name=total]').first().fill('4h10'); await p.getByRole('button', { name: 'Salvar realizado' }).click(); }, /POST \/rest\/v1\/ra_tela_real .*"min_total":250/],
  ['filho', 'Propor outro previsto', '/tela', async (p) => { await p.getByText('Precisa de outro previsto?').click(); const f = p.locator('form:has(button:has-text("Propor outro previsto"))'); const c = f.locator('input[name=computador]'); if (await c.count()) { await f.locator('input[name=celular]').fill('2h'); await c.fill('3h'); } else await f.locator('input[name=total]').fill('5h'); const d = f.locator('input[name=data]'); if (await d.count()) await d.fill(amanha); await f.locator('[name=motivo]').fill('Trabalho da faculdade'); await f.getByRole('button').last().click(); }, /rpc\/ra_propor_tela .*Trabalho da faculdade/],
  ['filho', 'Marcar avisos como lidos', '/notificacoes', async (p) => { await p.getByRole('button', { name: 'Marcar todas como lidas' }).click(); }, /PATCH \/rest\/v1\/ra_notificacoes .*"lida":true/],
  ['pai', 'Criar tarefa diária para o filho', '/tarefas/nova', async (p) => { await p.locator('input[name=titulo]').fill('Lavar louça'); await p.locator('select[name=responsavel]').selectOption(E); const tipo = p.locator('[name=tipo]'); if (await tipo.evaluate((e) => e.tagName) === 'SELECT') await tipo.selectOption('recorrente'); else await p.locator('input[name=tipo][value=recorrente]').check(); await p.getByRole('button', { name: 'Salvar tarefa' }).click(); await p.waitForURL(/tarefas\?ok=1/, { timeout: 8000 }); }, /POST \/rest\/v1\/ra_tarefas .*Lavar lou.*"tipo":"recorrente"/],
  ['pai', 'Editar tarefa', '/tarefas/00000000-0000-0000-0000-000000000030', async (p) => { await p.locator('input[name=titulo]').fill('Estudar 2h'); await p.getByRole('button', { name: 'Salvar tarefa' }).click(); await p.waitForURL(/tarefas\?ok=1/, { timeout: 8000 }); }, /PATCH \/rest\/v1\/ra_tarefas .*Estudar 2h/],
  ['pai', 'Excluir tarefa', '/tarefas/00000000-0000-0000-0000-000000000030', async (p) => { await p.getByRole('button', { name: 'Excluir tarefa' }).click(); await p.waitForURL(/\/tarefas$/, { timeout: 8000 }); }, /PATCH \/rest\/v1\/ra_ocorrencias .*cancelada/],
  ['pai', 'Aprovar adiamento no painel', '/painel', async (p) => { await p.getByRole('button', { name: 'Aprovar' }).first().click(); }, /rpc\/ra_responder_adiamento .*"p_aprovar":true/],
  ['pai', 'Aceitar justificativa no painel', '/painel', async (p) => { await p.getByRole('button', { name: 'Aceitar' }).first().click(); }, /rpc\/ra_avaliar_justificativa .*"p_aceitar":true/],
  ['pai', 'Validar proposta de tela no painel', '/painel', async (p) => { await p.getByRole('button', { name: 'Validar' }).first().click(); }, /rpc\/ra_responder_tela .*"p_aprovar":true/],
  ['pai', 'Conferir tarefa feita', '/hoje', async (p) => { await p.getByRole('button', { name: 'Conferido' }).first().click(); }, /rpc\/ra_conferir .*"p_valor":"conferido"/],
  ['pai', 'Pedir para refazer', '/hoje', async (p) => { await p.getByRole('button', { name: 'Pedir para refazer' }).first().click(); }, /rpc\/ra_conferir .*"p_valor":"refazer"/],
  ['pai', 'Definir previsto de tela fixo', `/tela?m=${E}`, async (p) => { const f = p.locator('form:has(button:has-text("Salvar previsto"))'); const c = f.locator('input[name=celular]'); if (await c.count()) { await c.fill('2h'); await f.locator('input[name=computador]').fill('1h'); } else await f.locator('input[name=total]').fill('3h'); const modo = f.locator('[name=modo]'); if (await modo.count() && await modo.first().evaluate((e) => e.tagName) === 'SELECT') await modo.selectOption('semana'); else if (await f.locator('input[name=modo][value=semana]').count()) await f.locator('input[name=modo][value=semana]').check(); const fx = f.locator('input[name=fixado]'); if (await fx.count()) await fx.check(); await f.getByRole('button', { name: 'Salvar previsto' }).click(); }, /POST \/rest\/v1\/ra_tela_previsto .*"dias_semana":\[0,1,2,3,4,5,6\]/],
  ['pai', 'Cadastrar membro (convite)', '/config', async (p) => { const f = p.locator('form:has(input[name=email])').last(); await f.locator('input[name=nome]').fill('Avó'); await f.locator('input[name=email]').fill('avo@exemplo.com'); await f.getByRole('button').last().click(); }, /POST \/rest\/v1\/ra_membros .*avo@exemplo.com/],
  ['pai', 'Criar categoria', '/config', async (p) => { const f = p.locator('form:has(button:has-text("Criar categoria"))'); await f.locator('input[name=nome]').fill('Igreja'); await f.getByRole('button', { name: 'Criar categoria' }).click(); }, /POST \/rest\/v1\/ra_categorias .*Igreja/],
  ['pai', 'Filtros do relatório', '/relatorios', async (p) => { await p.locator('select[name=per]').selectOption('30d'); await p.getByRole('button', { name: 'Filtrar' }).click(); await p.waitForURL(/per=30d/, { timeout: 8000 }); }, null],
  ['pai', 'Tema escuro', '/painel', async (p) => { await p.locator('.tema-btn').click(); await p.waitForTimeout(500); if ((await p.locator('html').getAttribute('data-theme')) !== 'escuro') throw new Error('tema não mudou'); }, null],
];
const browser = await chromium.launch();
const out = []; let falhas = 0;
for (const [quem, nome, url, passo, esperado] of casos) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-' + quem), url: BASE }]);
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  try {
    await p.goto(BASE + url, { waitUntil: 'networkidle' }); await lerLog();
    await passo(p); await p.waitForTimeout(1200);
    const log = await lerLog();
    const ok = !erros.length && (!esperado || log.some((l) => esperado.test(l)));
    const aviso = await p.locator('.aviso').allTextContents().catch(() => []);
    if (!ok) falhas++;
    out.push(`${ok ? 'OK   ' : 'FALHA'} [${quem}] ${nome}${ok ? '' : ' | enviado: ' + JSON.stringify(log).slice(0, 400) + ' | erros: ' + erros.join(';')}${aviso.length ? ' | tela: ' + aviso.join(' / ').slice(0, 80) : ''}`);
  } catch (e) { falhas++; out.push(`FALHA [${quem}] ${nome} | ${e.message.split('\n')[0]}`); }
  await ctx.close();
}
await browser.close();
console.log(out.join('\n') + `\n\nAções: ${casos.length}  Falhas: ${falhas}`);
