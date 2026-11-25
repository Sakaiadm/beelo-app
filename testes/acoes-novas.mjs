// @arquivo  acoes-novas.mjs: testa botões e formulários das telas novas (Desafios, prêmios, desejos, pessoas, categorias).
// @tipo     teste (roda no navegador sem cabeça contra o Supabase falso)
// @usa      testes/mock-supabase.mjs (ligar com MOCK_DESAFIOS=1 MOCK_DESEJOS=1), app rodando em 127.0.0.1:3100
// @usado-por docs/00-LEIA-PRIMEIRO.md (seção Testes)
// @cuidado  só confere o que CHEGA ao banco falso (o log), porque o falso não guarda nada.
//           Uso: PW_ROOT=/opt/node-tools node testes/acoes-novas.mjs   (SO="texto" roda só os casos que contêm o texto)
import { createRequire } from 'node:module';
const { chromium } = createRequire(process.env.PW_ROOT + '/')('playwright');
const BASE = 'http://127.0.0.1:3100';
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x' } })).toString('base64url');
const lerLog = async () => (await (await fetch('http://127.0.0.1:54321/__log')).json()).filter((l) => !/^GET|^HEAD|rpc\/ra_(eu|vincular|gerar_ocorrencias|tela_previsto_dia|desafios_atualizar|sou_super) /.test(l));
const E = '00000000-0000-0000-0000-000000000003';
const casos = [
  // ===== Pai: desafios e desejos =====
  ['pai', 'Aprovar desejo da criança com 1 toque', '/desafios', async (p) => { await p.getByRole('button', { name: /Aprovar com 80 estrelinhas/ }).click(); }, /rpc\/ra_desejo_responder .*"p_aprovar":true.*"p_custo":80/],
  ['pai', 'Mudar o preço do desejo antes de aprovar', '/desafios', async (p) => { await p.getByRole('button', { name: '120', exact: true }).first().click(); await p.getByRole('button', { name: /Aprovar com 120/ }).click(); }, /rpc\/ra_desejo_responder .*"p_custo":120/],
  ['pai', 'Responder "Agora não" ao desejo', '/desafios', async (p) => { await p.getByRole('button', { name: 'Agora não' }).first().click(); await p.getByRole('button', { name: /Esse fica para uma data/ }).first().click(); await p.getByRole('button', { name: 'Enviar', exact: true }).click(); }, /rpc\/ra_desejo_responder .*"p_aprovar":false/],
  ['pai', 'Marcar prêmio como entregue', '/desafios', async (p) => { await p.getByRole('button', { name: 'Marcar como entregue' }).click(); }, /rpc\/ra_premio_entregar .*"p_entregue":true/],
  ['pai', 'Desfazer a troca do prêmio', '/desafios', async (p) => { await p.getByRole('button', { name: 'Desfazer a troca' }).click(); await p.getByRole('button', { name: /^Sim, desfazer/ }).click(); }, /rpc\/ra_premio_entregar .*"p_entregue":false/],
  ['pai', 'Encerrar desafio pede confirmação e encerra', '/desafios', async (p) => { await p.getByRole('button', { name: 'Encerrar' }).nth(1).click(); await p.getByRole('button', { name: /^Sim/ }).click(); }, /rpc\/ra_desafio_encerrar/],
  ['pai', 'Ajustes dos desafios: mural só para os pais', '/desafios/ajustes', async (p) => { await p.locator('input[name=mural][value=pais]').check(); await p.getByRole('button', { name: 'Salvar' }).click(); }, /PATCH \/rest\/v1\/ra_familias .*"pais"/],
  ['pai', 'Vitrine: criar prêmio próprio', '/desafios/premios', async (p) => { await p.getByText('Criar meu prêmio').click(); await p.locator('input[name=nome]').fill('Passeio de barco'); await p.locator('input[name=custo]').fill('150'); await p.getByRole('button', { name: 'Acrescentar', exact: true }).click(); }, /POST \/rest\/v1\/ra_premios .*Passeio de barco/],
  ['pai', 'Vitrine: acrescentar prêmio do banco', '/desafios/premios', async (p) => { await p.getByText('Até 20 estrelinhas').click(); await p.getByRole('button', { name: 'Acrescentar Figurinhas' }).click(); }, /POST \/rest\/v1\/ra_premios .*"s2"/],
  // ===== Filho =====
  ['filho', 'Criança/adolescente sugere um desejo', '/desafios/cofrinho', async (p) => { await p.getByRole('button', { name: 'Sugerir um desejo' }).click(); await p.locator('input[name=nome]').first().fill('Skate'); await p.getByRole('button', { name: /Enviar|Sugerir/ }).last().click(); }, /rpc\/ra_desejo_sugerir .*Skate/],
  ['filho', 'Definir a meta do cofrinho ("Quero este")', '/desafios/cofrinho', async (p) => { await p.getByRole('button', { name: /Quero juntar para/ }).first().click(); }, /rpc\/ra_cofrinho_meta/],
  // ===== Tarefas (fluxos principais, telas de hoje) =====
  ['pai', 'Criar tarefa diária para o filho', '/tarefas/nova', async (p) => { await p.waitForTimeout(600); await p.locator('input[name=titulo]').fill('Lavar louça'); await p.locator('select[name=responsavel]').selectOption(E); await p.getByRole('button', { name: 'Salvar tarefa' }).click(); await p.waitForURL(/agenda/, { timeout: 8000 }); }, /POST \/rest\/v1\/ra_tarefas .*Lavar lou.*"responsavel_id":"00000000-0000-0000-0000-000000000003"/],
  ['pai', 'Criar tarefa sem título não grava', '/tarefas/nova', async (p) => { await p.waitForTimeout(600); await p.getByRole('button', { name: 'Salvar tarefa' }).click(); }, null, /POST \/rest\/v1\/ra_tarefas/],
  ['pai', 'Editar tarefa', '/tarefas/00000000-0000-0000-0000-000000000030/editar', async (p) => { await p.waitForTimeout(600); await p.locator('input[name=titulo]').fill('Estudar 2h'); await p.getByRole('button', { name: 'Salvar tarefa' }).click(); await p.waitForURL(/agenda|tarefas/, { timeout: 8000 }); }, /PATCH \/rest\/v1\/ra_tarefas .*Estudar 2h/],
  ['pai', 'Excluir tarefa pede confirmação e exclui', '/tarefas/00000000-0000-0000-0000-000000000030/editar', async (p) => { await p.waitForTimeout(600); await p.getByRole('button', { name: 'Excluir tarefa' }).click(); await p.getByRole('button', { name: /^Sim, excluir/ }).click(); await p.waitForURL(/agenda/, { timeout: 8000 }); }, /PATCH \/rest\/v1\/ra_ocorrencias .*cancelada|rpc\/ra_excluir/],
  ['filho', 'Justificar atraso (toque no motivo e enviar)', '/hoje', async (p) => { await p.waitForTimeout(600); await p.getByRole('button', { name: 'Justificar' }).first().click(); await p.waitForTimeout(900); await p.getByRole('radio', { name: 'Tenho prova' }).click(); await p.getByRole('button', { name: 'Enviar justificativa' }).click(); }, /rpc\/ra_justificar .*Tenho prova/],
  ['filho', 'Concluir tarefa sem foto', '/hoje', async (p) => { await p.waitForTimeout(600); await p.getByRole('button', { name: 'Concluir Estudar 1h', exact: true }).first().click(); }, /rpc\/ra_concluir/],
  // ===== Cadastros =====
  ['pai', 'Cadastrar pessoa nova (Adulto que ajuda)', '/config/pessoas/nova', async (p) => { await p.waitForTimeout(600); await p.locator('input[name=nome]').fill('Tia Ana'); await p.locator('input[name=email]').fill('tia.ana@gmail.com'); await p.locator('select').nth(1).selectOption({ label: 'Adulto que ajuda' }); await p.getByRole('button', { name: /Adicionar/ }).click(); }, /POST \/rest\/v1\/ra_membros .*Tia Ana/],
  ['pai', 'Cadastrar pessoa sem nome não grava nada', '/config/pessoas/nova', async (p) => { await p.waitForTimeout(600); const b = p.getByRole('button', { name: /Adicionar/ }); if (!(await b.isDisabled())) await b.click(); }, null, /POST \/rest\/v1\/ra_membros/],
  ['pai', 'Criar categoria', '/config/categorias/nova', async (p) => { await p.locator('input[name=nome]').fill('Música'); await p.getByRole('button', { name: 'Criar categoria' }).click(); }, /POST \/rest\/v1\/ra_categorias .*Música/],
  ['pai', 'Grupo novo: formulário abre', '/config/familias/nova', async () => {}, null],
];
const browser = await chromium.launch();
const out = []; let falhas = 0;
for (const [quem, nome, url, passo, esperado, proibido] of casos.filter((c) => !process.env.SO || c[1].includes(process.env.SO))) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: 'sb-127-auth-token', value: sess('tok-' + quem), url: BASE }]);
  const p = await ctx.newPage(); p.setDefaultTimeout(8000); const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  try {
    await p.goto(BASE + url, { waitUntil: 'networkidle' }); await lerLog();
    await passo(p); await p.waitForTimeout(1500);
    const log = await lerLog();
    const ok = !erros.length && (!esperado || log.some((l) => esperado.test(l))) && !(proibido && log.some((l) => proibido.test(l)));
    const aviso = await p.locator('.aviso').allTextContents().catch(() => []);
    if (!ok) falhas++;
    out.push(`${ok ? 'OK   ' : 'FALHA'} [${quem}] ${nome}${ok ? '' : ' | enviado: ' + JSON.stringify(log).slice(0, 400) + ' | erros: ' + erros.join(';')}${aviso.length ? ' | tela: ' + aviso.join(' / ').slice(0, 160) : ''}`);
  } catch (e) { falhas++; out.push(`FALHA [${quem}] ${nome} | ${e.message.split('\n')[0]}`); }
  await ctx.close();
}
await browser.close();
console.log(out.join('\n') + `\n\nAções novas: ${out.length}  Falhas: ${falhas}`);
