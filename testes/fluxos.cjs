// @arquivo  testes/fluxos.cjs: percorre os fluxos do dia a dia (cadastro, exclusão, tarefas, adiamento, prêmios, vitrine, desejos) e confere o que chega ao banco falso.
// @tipo     teste
// @usa      testes/mock-fluxos.mjs (porta 54321; use este e não o mock-supabase.mjs) e o app no ar em 127.0.0.1:3100
// @usado-por rodar à mão: NODE_PATH=<pasta do playwright> node testes/fluxos.cjs [trecho do nome]
// @cuidado  O app precisa ter sido compilado com NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321. Botões com desfazer de 5 s esperam 7 s.
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:3100';
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x' } })).toString('base64url');
const E = '00000000-0000-0000-0000-000000000003', A = '00000000-0000-0000-0000-000000000004';
const log = async () => (await (await fetch('http://127.0.0.1:54321/__log')).json()).filter((l) => !/^GET|^HEAD|rpc\/ra_(eu|vincular|gerar_ocorrencias|tela_previsto_dia|sou_super|emails_grupo|desafios_atualizar) /.test(l));
const B = (p, n, o = {}) => p.getByRole('button', { name: n, ...o });
const T = [
  ['pai', 'BALAO não esconde o botão Salvar da tarefa', '/tarefas/nova', async (p) => { await p.waitForTimeout(1500); await p.getByRole('button', { name: 'Salvar tarefa' }).scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(300); }, null, async (p) => { const bt = await p.getByRole('button', { name: 'Salvar tarefa' }).boundingBox(); const ba = await p.locator('.guia-balao').boundingBox(); if (ba && bt.y + bt.height > ba.y) throw new Error(`Salvar (fim ${Math.round(bt.y + bt.height)}) fica atrás do balão (começa ${Math.round(ba.y)})`); }],
  ['pai', 'Cadastrar pessoa nova', '/config/pessoas/nova', async (p) => { await p.locator('input[name=nome]').fill('Lia'); await p.locator('input[name=email]').fill('lia@gmail.com'); await p.locator('#p-papel').selectOption('filho'); await p.getByRole('checkbox').last().check().catch(() => {}); await B(p, /Adicionar/).click(); }, /ra_membros.*Lia/],
  ['pai', 'Cadastro exige papel', '/config/pessoas/nova', async (p) => { await p.locator('input[name=nome]').fill('Lia'); await p.waitForTimeout(300); }, null, async (p) => { if (await B(p, /Adicionar/).isEnabled()) throw new Error('botão ligado sem papel'); }],
  ['pai', 'Cadastro com e-mail inválido é recusado', '/config/pessoas/nova', async (p) => { await p.locator('input[name=nome]').fill('Lia'); await p.locator('input[name=email]').fill('lia@'); await p.locator('#p-papel').selectOption('filho'); await p.getByRole('checkbox').last().check().catch(() => {}); await p.waitForTimeout(300); }, null, async (p) => { if (await B(p, /Adicionar/).isEnabled()) throw new Error('botão ligado com e-mail inválido'); }],
  ['pai', 'Editar pessoa e salvar', `/config/pessoas/${E}`, async (p) => { await p.locator('input[name=nome]').fill('Eduardo S'); await B(p, /Salvar/).first().click(); }, /ra_membros/],
  ['pai', 'Excluir pessoa pede confirmação', `/config/pessoas/${E}`, async (p) => { await B(p, /Excluir/).first().click(); await p.waitForTimeout(400); if (!(await p.getByText(/Tem certeza|Excluir pessoa/).count())) throw new Error('sem confirmação'); await B(p, /Sim, excluir|Sim/).first().click(); }, /ra_excluir|DELETE.*ra_membros|rpc\/ra_/],
  ['pai', 'Criar tarefa simples', '/tarefas/nova', async (p) => { await p.locator('input[name=titulo]').fill('Lavar louça'); await B(p, 'Salvar tarefa').click(); }, /ra_tarefas|ra_criar_tarefa/],
  ['pai', 'Criar tarefa com Mais opções (foto, adiar, justificar)', '/tarefas/nova', async (p) => { await p.locator('input[name=titulo]').fill('Lavar louça'); await p.getByText('Mais opções').click(); await p.getByLabel(/Exige foto/).check(); await p.getByLabel(/Pode adiar/).check(); await B(p, 'Salvar tarefa').click(); }, /ra_tarefas|ra_criar_tarefa/],
  ['pai', 'Tarefa sem título é recusada', '/tarefas/nova', async (p) => { await B(p, 'Salvar tarefa').click(); await p.waitForTimeout(500); }, null, async (p, l) => { if (l.some((x) => /ra_tarefas/.test(x))) throw new Error('salvou sem título'); }],
  ['pai', 'Sugestão preenche a tarefa', '/tarefas/nova', async (p) => { await B(p, 'Sugestões', { exact: true }).click(); await p.waitForTimeout(400); await p.getByText('Arrumar o quarto').first().click(); await p.waitForTimeout(500); }, null, async (p) => { if (!(await p.locator('input[name=titulo]').inputValue())) throw new Error('não preencheu'); }],
  ['pai', 'Editar tarefa', '/tarefas/00000000-0000-0000-0000-000000000030/editar', async (p) => { await p.locator('input[name=titulo]').fill('Estudar 2h'); await B(p, 'Salvar tarefa').click(); }, /ra_tarefas|ra_/],
  ['pai', 'Excluir tarefa', '/tarefas/00000000-0000-0000-0000-000000000030/editar', async (p) => { await B(p, 'Excluir tarefa').click(); await p.waitForTimeout(400); await B(p, /Sim/).first().click(); }, /ra_excluir|DELETE|ra_tarefas/],
  ['pai', 'Aprovar adiamento (painel)', '/painel', async (p) => { await B(p, 'Aprovar').first().click(); }, /ra_responder_adiamento/],
  ['pai', 'Aceitar justificativa (painel)', '/painel', async (p) => { await p.locator('div:has(> .tt:has-text("justificou"))').getByRole('button', { name: 'Aprovar' }).click(); }, /ra_avaliar_justificativa/],
  ['pai', 'Conferir tarefa feita', `/hoje?m=${E}`, async (p) => { await B(p, 'Conferido').first().click(); }, /ra_conferir/],
  ['pai', 'Pedir para refazer', `/hoje?m=${E}`, async (p) => { await B(p, 'Refazer').first().click(); }, /ra_conferir/],
  ['pai', 'Desafios: aprovar desejo com preço', '/desafios', async (p) => { await B(p, /Aprovar com/).click(); }, /ra_desejo_aprovar|desejo/],
  ['pai', 'Desafios: agora não (desejo)', '/desafios', async (p) => { await B(p, 'Agora não').first().click(); await p.getByText('Que ideia legal').click(); await B(p, 'Enviar').click(); }, /ra_desejo|desejo/],
  ['pai', 'Desafios: marcar prêmio entregue', '/desafios', async (p) => { await B(p, 'Marcar como entregue').first().click(); }, /ra_premio_entregar|ra_premio|pedido/],
  ['pai', 'Desafios: desfazer troca', '/desafios', async (p) => { await B(p, 'Desfazer a troca').first().click(); await B(p, 'Sim, desfazer').click(); }, /ra_premio|ra_cofrinho|pedido/],
  ['pai', 'Desafios: encerrar desafio pede confirmação', '/desafios', async (p) => { await B(p, 'Encerrar').first().click(); await p.waitForTimeout(400); if (!(await p.getByText(/Encerrar desafio\?/).count())) throw new Error('sem confirmação'); await B(p, /Sim, encerrar/).click(); }, /ra_desafio|encerr/],
  ['pai', 'Desafios: ajustes do mural salvam', '/desafios/ajustes', async (p) => { await B(p, 'Salvar').click(); }, /ra_familias/],
  ['pai', 'Vitrine: abrir prêmio e editar', '/desafios/premios', async (p) => { await p.getByText('Escolher a sobremesa').first().click(); await p.waitForTimeout(500); }, null, async (p) => { if (!(await p.locator('input').count())) throw new Error('não abriu edição'); }],
  ['pai', 'Vitrine: criar meu prêmio', '/desafios/premios', async (p) => { await p.getByText('+ Criar meu prêmio').click(); await p.waitForTimeout(500); }, null, async (p) => { if (!(await p.locator('input').count())) throw new Error('não abriu formulário'); }],
  ['pai', 'Novo desafio: escolher e salvar', `/desafios/novo?m=${A}`, async (p) => { await p.getByText('Semana em dia').first().click(); await p.waitForTimeout(500); const b = p.getByRole('button', { name: /Criar|Salvar|Usar|Começar/ }); await b.first().click(); await p.waitForTimeout(800); }, /ra_desafio|ra_desafios/],
  ['filho', 'Concluir tarefa', '/hoje', async (p) => { await B(p, /^Concluir /).first().click(); }, /ra_concluir/],
  ['filho', 'Justificar atraso', '/hoje', async (p) => { await B(p, 'Justificar').first().click(); await p.getByText('Outro', { exact: true }).first().click(); await p.locator('textarea').first().fill('Estava doente'); await B(p, /Enviar|Salvar|Justificar/).last().click(); }, /ra_justificar|justific/],
  ['filho', 'Abrir tarefa mostra Adiar', '/hoje', async (p) => { await p.locator('.tarefa .tt, .tarefa-ir, main .tarefa').nth(1).click(); await p.waitForTimeout(500); }, null, async (p) => { if (!(await p.getByRole('button', { name: /Adiar/ }).count())) throw new Error('sem Adiar nos detalhes'); }],
  ['crianca', 'Criança: sugerir desejo', '/desafios/cofrinho', async (p) => { await B(p, 'Sugerir um desejo').click(); await p.waitForTimeout(500); await p.locator('input[type=text], input:not([type])').first().fill('Patins'); await B(p, /Enviar|Sugerir|Salvar/).last().click(); }, /ra_desejo_sugerir/],
  ['crianca', 'Criança: trocar estrelinhas por prêmio', '/desafios/cofrinho', async (p) => { await B(p, 'Trocar').first().click(); await p.waitForTimeout(600); await B(p, /Trocar agora|Sim/).first().click(); }, /ra_premio_trocar|ra_premio/],
  ['crianca', 'Criança: "Quero este" escolhe a meta', '/desafios/cofrinho', async (p) => { await p.getByText('Quero este').first().click(); }, /ra_cofrinho_meta|cofrinho_meta|ra_membros|ra_/],
];
const filtro = process.argv[2];
(async () => {
  const b = await chromium.launch(); const out = []; let f = 0;
  for (const [quem, nome, url, passo, esperado, extra] of T.filter((t) => !filtro || t[1].includes(filtro))) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-' + quem), url: BASE }]);
    const p = await ctx.newPage(); p.setDefaultTimeout(6000); const erros = [];
    p.on('pageerror', (e) => erros.push(e.message.slice(0, 120)));
    try {
      await p.goto(BASE + url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); if (!nome.startsWith('BALAO') && await p.locator('.guia-balao').count()) await p.getByText('Pular', { exact: true }).click(); await log();
      await passo(p); await p.waitForTimeout(/Aprovar adiamento|Aceitar|Conferir|refazer|Agora não|desfazer|Desfazer|Justificar/i.test(nome) ? 6800 : 1000);
      const l = await log();
      let ok = !erros.length && (!esperado || l.some((x) => esperado.test(x)));
      let motivo = ok ? '' : `chamadas: ${JSON.stringify(l).slice(0, 300)} erros: ${erros.join(';')}`;
      if (ok && extra) { try { await extra(p, l); } catch (e) { ok = false; motivo = e.message; } }
      if (!ok) f++; out.push(`${ok ? 'OK   ' : 'FALHA'} [${quem}] ${nome}${motivo ? ' | ' + motivo : ''}`);
    } catch (e) { f++; out.push('FALHA [' + quem + '] ' + nome + ' | ' + e.message.slice(0, 500)); }
    await ctx.close();
  }
  await b.close(); console.log(out.join('\n') + `\n\nFluxos: ${out.length} Falhas: ${f}`);
})();
