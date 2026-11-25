// Supabase falso para testar as telas sem tocar no banco real.
import http from 'node:http';
const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const dia = (n) => { const d = new Date(hoje + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const FAM = '11111111-1111-1111-1111-111111111111';
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const G = id(1), M = id(2), E = id(3), A = id(4);
const TV = '2026-11-24';
const membros = [
  { id: G, familia_id: FAM, nome: 'Thomas', papel: 'gestor', cor: '#0f4fae', email: 'pai@t.com', ativo: true, tela_ativo: true, user_id: id(91), termos_versao: TV },
  { id: M, familia_id: FAM, nome: 'Mãe', papel: 'gestor', cor: '#7a3fb0', email: null, ativo: true, tela_ativo: true, user_id: null },
  { id: E, familia_id: FAM, nome: 'Eduardo', papel: 'filho', jeito_livre: true, modo_crianca: process.env.MOCK_CRIANCA === '1', cor: '#1a6fe0', email: 'edu@t.com', ativo: true, tela_ativo: true, user_id: id(92) },
  { id: A, familia_id: FAM, nome: 'Alice', papel: 'filho', cor: '#c2185b', email: 'alice@t.com', ativo: true, tela_ativo: false, user_id: null },
];
if (process.env.MOCK_CHEGADA === '1') membros.forEach((m) => { m.termos_versao = '2026-11-24'; });
const cats = [{ id: id(20), familia_id: FAM, nome: 'Estudo', cor: 'indigo', ordem: 1 }, { id: id(21), familia_id: FAM, nome: 'Casa', cor: 'laranja', ordem: 2 }];
const tarefas = [
  { id: id(30), familia_id: FAM, titulo: 'Estudar 1h', descricao: 'Matemática', categoria_id: id(20), responsavel_id: E, tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '19:00:00', hora_fim: '20:00:00', exige_foto: false, permite_adiar: true, exige_justificativa: false, criada_por: G, ativa: true, prioritaria: true, lembrete_min: 15, categoria: cats[0] },
  { id: id(31), familia_id: FAM, titulo: 'Arrumar quarto', descricao: null, categoria_id: id(21), responsavel_id: E, tipo: 'pontual', recorrencia: null, dias_semana: [], data_inicio: hoje, data_fim: null, hora_inicio: null, hora_fim: null, exige_foto: true, permite_adiar: true, exige_justificativa: false, criada_por: G, ativa: true, categoria: cats[1] },
  { id: id(32), familia_id: FAM, titulo: 'Violão', descricao: null, categoria_id: null, responsavel_id: A, tipo: 'recorrente', recorrencia: 'dias_semana', dias_semana: [1, 3], data_inicio: dia(-10), data_fim: dia(30), hora_inicio: '15:00:00', hora_fim: null, exige_foto: false, permite_adiar: true, exige_justificativa: false, criada_por: A, ativa: true, categoria: null },
];
tarefas.push({ id: id(35), familia_id: FAM, titulo: 'Lançar tempo de tela', descricao: null, categoria_id: null, responsavel_id: E, especial: 'tela', tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '08:00:00', hora_fim: null, exige_foto: false, permite_adiar: false, exige_justificativa: false, criada_por: G, ativa: true, categoria: null });
tarefas.push({ id: id(34), familia_id: FAM, titulo: 'Lavar a louça', descricao: null, categoria_id: id(21), responsavel_id: E, tipo: 'pontual', recorrencia: null, dias_semana: [], data_inicio: hoje, data_fim: null, hora_inicio: '23:30:00', hora_fim: null, exige_foto: true, permite_adiar: true, exige_justificativa: false, criada_por: G, ativa: true, categoria: cats[1] });
const tRef = (t) => ({ id: t.id, prioritaria: !!t.prioritaria, titulo: t.titulo, descricao: t.descricao, exige_foto: t.exige_foto, permite_adiar: t.permite_adiar, exige_justificativa: t.exige_justificativa, criada_por: t.criada_por, tipo: t.tipo, categoria: t.categoria, ...(t.especial === 'chegada' ? { especial: 'chegada', chegada_lembrar: t.chegada_lembrar, chegada_avisar_pais: t.chegada_avisar_pais } : {}) });
const oc = (n, t, d, extra = {}) => ({ id: id(100 + n), tarefa_id: t.id, familia_id: FAM, membro_id: t.responsavel_id, data: d, hora_inicio: t.hora_inicio, hora_fim: t.hora_fim, horario_travado: t.criada_por !== t.responsavel_id, status: 'pendente', concluida_em: null, foto_path: null, conferido: null, justificativa: null, justificativa_status: null, tarefa: tRef(t), ...extra });
// MOCK_CHEGADA=1: duas chegadas de hoje do Eduardo (uma pendente, uma já avisada), para as telas do aviso de chegada.
if (process.env.MOCK_CHEGADA === '1') {
  const base = { familia_id: FAM, descricao: null, categoria_id: null, responsavel_id: E, especial: 'chegada', tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_fim: null, exige_foto: false, permite_adiar: false, exige_justificativa: false, criada_por: G, ativa: true, categoria: null, chegada_lembrar: true, chegada_avisar_pais: true };
  tarefas.push({ ...base, id: id(36), titulo: 'Chegar na escola', hora_inicio: '00:10:00' }, { ...base, id: id(37), titulo: 'Chegar em casa', hora_inicio: '23:00:00' });
}
const ocorr = [
  oc(1, tarefas[0], dia(-3), { status: 'cumprida', concluida_em: dia(-3) + 'T22:00:00Z' }),
  oc(2, tarefas[0], dia(-2), { justificativa: 'Estava doente', justificativa_status: 'pendente' }),
  oc(3, tarefas[0], dia(-1), { status: 'adiamento_pedido' }),
  oc(4, tarefas[0], hoje),
  oc(5, tarefas[1], hoje, { status: 'cumprida', concluida_em: new Date().toISOString(), foto_path: `${FAM}/${E}/foto.jpg` }),
  oc(6, tarefas[0], dia(1)), oc(7, tarefas[0], dia(2)),
  oc(8, tarefas[2], dia(-1), { status: 'cumprida', concluida_em: dia(-1) + 'T18:00:00Z', conferido: 'conferido' }),
  oc(12, tarefas[3], hoje),
  oc(9, tarefas[2], hoje), oc(10, tarefas[2], dia(2)),
];
if (process.env.MOCK_CHEGADA === '1') {
  ocorr.push(oc(13, tarefas.find((t) => t.id === id(36)), hoje), oc(14, tarefas.find((t) => t.id === id(37)), hoje, { status: 'cumprida', concluida_em: new Date().toISOString(), conferido: 'conferido' }));
}
const familias = [{ id: FAM, nome: 'Família Sakai', avatar: null, ativa: true, foto_max_horas: 2, criado_em: dia(-40) + 'T12:00:00Z' }];
const adminFamilias = [
  { ...familias[0], gestores: 'Thomas <pai@t.com>, Mãe', n_gestores: 2, n_filhos: 2, n_ativos: 2, tarefas: 3, oc_30d: 10, cumpridas_30d: 3, ultima_acao: new Date().toISOString() },
  { id: id(700), nome: 'Família Teste', avatar: `${id(700)}/familia/avatar-1.jpg`, ativa: false, criado_em: dia(-5) + 'T12:00:00Z', gestores: 'Ana <ana@t.com>', n_gestores: 1, n_filhos: 0, n_ativos: 0, tarefas: 0, oc_30d: 0, cumpridas_30d: 0, ultima_acao: null },
];
const tabelas = {
  ra_familias: familias, ra_membros: membros, ra_categorias: cats, ra_tarefas: tarefas, ra_ocorrencias: ocorr,
  ra_adiamentos: [{ id: id(200), ocorrencia_id: id(103), familia_id: FAM, membro_id: E, nova_data: dia(3), nova_hora: '15:00:00', motivo: 'Prova', status: 'pendente', criado_em: new Date().toISOString(), oc: { data: dia(-1), hora_inicio: '19:00:00', tarefa: { titulo: 'Estudar 1h' } } }],
  ra_notificacoes: [{ id: id(300), familia_id: FAM, para_membro: G, titulo: 'Eduardo pediu adiamento: Estudar 1h', link: '/painel', lida: false, criado_em: new Date().toISOString() }, { id: id(301), familia_id: FAM, para_membro: G, titulo: 'Eduardo justificou', link: '/painel', lida: true, criado_em: new Date(Date.now() - 86400e3).toISOString() }],
  ra_tela_previsto: [{ id: id(400), familia_id: FAM, membro_id: E, formato: 'aparelho', dias_semana: [0, 1, 2, 3, 4, 5, 6], vigencia_inicio: dia(-30), vigencia_fim: null, fixado: true, min_celular: 120, min_computador: 60, min_total: null, origem: 'pais', criado_por: G, criado_em: new Date().toISOString() }],
  ra_tela_proposta: [{ id: id(500), familia_id: FAM, membro_id: E, data: dia(1), min_celular: null, min_computador: 180, min_total: null, motivo: 'Trabalho da faculdade', status: 'pendente', criado_em: new Date().toISOString() }],
  ra_tela_real: [{ id: id(600), familia_id: FAM, membro_id: E, data: dia(-2), min_celular: 185, min_computador: 65, min_total: 250, foto_celular: `${FAM}/${E}/uso.jpg`, foto_computador: null, obs: null }, { id: id(601), familia_id: FAM, membro_id: E, data: dia(-1), min_celular: 100, min_computador: 50, min_total: 150, foto_celular: null, foto_computador: null, obs: null }, { id: id(602), familia_id: FAM, membro_id: E, data: dia(-4), min_celular: 120, min_computador: 60, min_total: 180, foto_celular: null, foto_computador: null, obs: null }],
};
// Desafios (beta, SQL 0016): MOCK_DESAFIOS=1 liga os desafios com dados de exemplo.
if (process.env.MOCK_DESAFIOS === '1') {
  familias[0].desafios_beta = true; familias[0].mural_visivel = 'todos';
  const seg = dia(-((new Date(hoje + 'T12:00:00Z').getUTCDay() + 6) % 7));
  const dd = (i) => { const d = new Date(seg + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); };
  const est = (i) => (dd(i) < hoje ? (i === 2 ? 'cor' : 'ok') : dd(i) === hoje ? 'hoje' : 'futuro');
  const agora = new Date().toISOString();
  tabelas.ra_desafios = [
    { id: id(800), familia_id: FAM, membro_id: E, catalogo: 'e1', titulo: 'Foco no Estudo', descricao: 'Tarefas de Estudo feitas.', icone: 'cEstudo', tipo: 'dias', alvo: 'categoria', categorias: [id(20)], meta: 5, periodo: 'semana', coringa: true, recompensa: 'estrelas', estrelas: 10, premio: null, ativo: true, criado_por: G, criado_em: dia(-20) + 'T12:00:00Z' },
    { id: id(801), familia_id: FAM, membro_id: null, catalogo: 'j1', titulo: 'Família em dia', descricao: '', icone: 'familia', tipo: 'pct', alvo: 'todas', categorias: [], meta: 80, periodo: 'semana', coringa: true, recompensa: 'premio', estrelas: 10, premio: 'Pizza no sábado', ativo: true, criado_por: G, criado_em: dia(-20) + 'T12:00:00Z' },
    { id: id(802), familia_id: FAM, membro_id: A, catalogo: 'e4', titulo: 'Revisão do dia', descricao: '', icone: 'cEstudo', tipo: 'dias', alvo: 'tarefa', categorias: [], meta: 4, periodo: 'semana', coringa: true, recompensa: 'semanas', estrelas: 10, premio: null, ativo: true, criado_por: A, criado_em: dia(-20) + 'T12:00:00Z' },
  ];
  tabelas.ra_desafio_periodos = [
    { id: id(810), desafio_id: id(800), familia_id: FAM, membro_id: E, inicio: seg, fim: dd(6), progresso: 3, meta: 5, possivel: 7, status: 'andamento', visto: false, detalhe: { coringa: dd(2) < hoje ? dd(2) : null, dias: [0, 1, 2, 3, 4, 5, 6].map((i) => ({ d: dd(i), s: est(i) })) } },
    { id: id(811), desafio_id: id(801), familia_id: FAM, membro_id: null, inicio: seg, fim: dd(6), progresso: 76, meta: 80, possivel: 7, status: 'andamento', visto: false, detalhe: { feitas: 19, total: 25, dias: [] } },
    { id: id(812), desafio_id: id(802), familia_id: FAM, membro_id: A, inicio: seg, fim: dd(6), progresso: 3, meta: 4, possivel: 5, status: 'andamento', visto: false, detalhe: { dias: [0, 1, 2, 3, 4, 5, 6].map((i) => ({ d: dd(i), s: i > 4 ? 'livre' : est(i) === 'cor' ? 'ok' : est(i) })) } },
    { id: id(813), desafio_id: id(800), familia_id: FAM, membro_id: E, inicio: dia(-14), fim: dia(-8), progresso: 6, meta: 5, possivel: 7, status: 'cumprido', visto: process.env.MOCK_FESTA !== '1', cumprido_em: dia(-9) + 'T20:00:00Z', detalhe: {} },
  ];
  tabelas.ra_cofrinho = [
    { id: id(820), familia_id: FAM, membro_id: E, moeda: 'estrelas', valor: 10, motivo: 'Foco no Estudo', criado_em: dia(-9) + 'T20:00:00Z' },
    { id: id(821), familia_id: FAM, membro_id: E, moeda: 'estrelas', valor: 24, motivo: 'Semana em dia', criado_em: dia(-16) + 'T20:00:00Z' },
    { id: id(822), familia_id: FAM, membro_id: A, moeda: 'semanas', valor: 3, motivo: 'Revisão do dia', criado_em: dia(-9) + 'T20:00:00Z' },
  ];
  tabelas.ra_premios = [
    { id: id(830), familia_id: FAM, catalogo: 's1', nome: 'Escolher a sobremesa', custo: 10, moeda: 'estrelas', faixa: 'todos', ativo: true },
    { id: id(831), familia_id: FAM, catalogo: 's16', nome: 'Açaí', custo: 25, moeda: 'estrelas', faixa: 'mais8', ativo: true },
    { id: id(832), familia_id: FAM, catalogo: 'v4', nome: 'Cinema', custo: 60, moeda: 'estrelas', faixa: 'todos', ativo: true },
    { id: id(833), familia_id: FAM, catalogo: 'v21', nome: 'Parque aquático', custo: 120, moeda: 'estrelas', faixa: 'todos', ativo: true },
    { id: id(834), familia_id: FAM, catalogo: 'u2', nome: 'Escolher o passeio do fim de semana', custo: 2, moeda: 'semanas', faixa: 'teen', ativo: true },
    { id: id(835), familia_id: FAM, catalogo: 'u10', nome: 'Voltar 1 hora mais tarde no sábado', custo: 4, moeda: 'semanas', faixa: 'teen', ativo: true },
  ];
  // Lista de desejos (SQL 0017): MOCK_DESEJOS=1 (esperando e "agora não"); MOCK_DESEJO_OK=1 (um aprovado, meta do cofrinho).
  if (process.env.MOCK_DESEJOS === '1') tabelas.ra_premios.push(
    { id: id(850), familia_id: FAM, nome: 'Patins', sugerido: 'Patins', custo: 1, moeda: 'estrelas', faixa: 'todos', ativo: false, membro_id: E, desejo: 'esperando', criado_em: agora },
    { id: id(851), familia_id: FAM, nome: 'Celular', sugerido: 'Celular', custo: 1, moeda: 'estrelas', faixa: 'todos', ativo: false, membro_id: E, desejo: 'agora_nao', resposta: 'Esse fica para uma data especial, combinado?', criado_em: dia(-3) + 'T20:00:00Z', respondido_em: agora },
    { id: id(852), familia_id: FAM, nome: 'Show com amigos', sugerido: 'Show com amigos', custo: 1, moeda: 'semanas', faixa: 'teen', ativo: false, membro_id: A, desejo: 'esperando', criado_em: dia(-1) + 'T19:05:00Z' });
  if (process.env.MOCK_DESEJO_OK === '1') {
    tabelas.ra_premios.push({ id: id(853), familia_id: FAM, nome: 'Bicicleta nova', sugerido: 'Bicicleta', custo: 80, moeda: 'estrelas', faixa: 'todos', ativo: true, membro_id: E, desejo: 'aprovado', regra: 'Usar capacete', criado_em: dia(-2) + 'T19:05:00Z', respondido_em: agora });
    const e = membros.find((x) => x.id === E); if (e) e.cofrinho_meta = id(853);
  }
  tabelas.ra_premio_pedidos = [{ id: id(840), familia_id: FAM, membro_id: E, premio_id: id(831), nome: 'Açaí', custo: 25, moeda: 'estrelas', status: 'pedido', criado_em: agora }];
}
export const usuarios = { 'tok-pai': { id: id(91), email: 'pai@t.com', eu: membros[0] }, 'tok-filho': { id: id(92), email: 'edu@t.com', eu: membros[2] }, 'tok-ado': { id: id(94), email: 'alice@t.com', eu: membros[3] }, 'tok-estranho': { id: id(93), email: 'x@t.com', eu: null } };
export const log = [];
function filtrar(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'or', 'on_conflict', 'columns'].includes(k)) continue;
    const [op, ...rest] = v.split('.'); const val = rest.join('.');
    const f = {
      eq: (x) => String(x[k]) === val, neq: (x) => String(x[k]) !== val, gte: (x) => String(x[k]) >= val, lte: (x) => String(x[k]) <= val,
      in: (x) => val.replace(/[()"]/g, '').split(',').includes(String(x[k])), is: (x) => x[k] == null, not: (x) => (val === 'is.null' ? x[k] != null : true),
    }[op];
    if (f) out = out.filter(f);
  }
  return out;
}
// Atraso opcional em cada resposta (simula o banco lento): GET /__atraso?ms=10000
let atraso = 0;
// Falhas simuladas: GET /__falha?rpc=ra_concluir2&code=401&msg=JWT%20expired (só essa função)
// ou /__falha?tudo=500 (todo o banco fora). /__falha sem nada limpa.
let falha = {};
http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const u0 = new URL(req.url, 'http://x');
    if (u0.pathname === '/__atraso') { atraso = Number(u0.searchParams.get('ms')) || 0; res.end('ok'); return; }
    if (u0.pathname === '/__falha') { falha = Object.fromEntries(u0.searchParams); res.end('ok'); return; }
    setTimeout(tratar, u0.pathname === '/__log' ? 0 : atraso);
  });
  function tratar() {
    const u = new URL(req.url, 'http://x');
    const tok = (req.headers.authorization || '').replace('Bearer ', '');
    const usr = usuarios[tok];
    if (u.pathname === '/__log') { res.end(JSON.stringify(log.splice(0))); return; }
    log.push(`${req.method} ${u.pathname} ${body.slice(0, 700)}`);
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const send = (code, obj, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...cors, ...headers }); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
    if (req.method === 'OPTIONS') return send(204);
    if (falha.tudo && u.pathname.startsWith('/rest/')) return send(Number(falha.tudo), { message: 'upstream connect error or disconnect/reset before headers' });
    if (falha.rpc && u.pathname === '/rest/v1/rpc/' + falha.rpc) return send(Number(falha.code) || 400, { code: falha.code === '401' ? 'PGRST301' : 'P0001', message: falha.msg || 'erro' });
    if (u.pathname === '/auth/v1/user') return usr ? send(200, { id: usr.id, email: usr.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} }) : send(401, { message: 'invalid' });
    if (u.pathname === '/auth/v1/verify') { const b = JSON.parse(body || '{}'); return b.token_hash === 'ok-hash' ? send(200, { access_token: 'tok-pai', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x', email: 'pai@t.com', aud: 'authenticated', role: 'authenticated' } }) : send(403, { code: 403, error_code: 'otp_expired', msg: 'expired' }); }
    if (u.pathname === '/auth/v1/logout') return send(204);
    if (u.pathname.startsWith('/storage/v1/object/sign/')) { const b = JSON.parse(body || '{}'); return send(200, (b.paths || []).map((p) => ({ path: p, signedURL: '/object/sign/x?token=t', error: null }))); }
    if (u.pathname.startsWith('/storage/v1/object/') && req.method === 'POST') return send(200, { Key: u.pathname.slice(19), Id: 'x' });
    const m = u.pathname.match(/^\/rest\/v1\/(rpc\/)?([a-z0-9_]+)$/);
    if (!m) return send(404, { message: 'nada' });
    if (m[1]) {
      if (m[2] === 'ra_eu' || m[2] === 'ra_vincular') return send(200, usr?.eu || null);
      if (m[2] === 'ra_sou_super') return send(200, tok === 'tok-pai');
      if (m[2] === 'ra_admin_familias') return tok === 'tok-pai' ? send(200, adminFamilias) : send(400, { message: 'Apenas o administrador geral' });
      if (m[2] === 'ra_admin_membros') return tok === 'tok-pai' ? send(200, [{ id: id(701), nome: 'Ana', email: 'ana@t.com', funcao: 'mae', papel: 'gestor', ativo: true, entrou: false, responsavel: true }]) : send(400, { message: 'Apenas o administrador geral' });
      if (m[2] === 'ra_tela_previsto_dia') return send(200, [{ formato: 'aparelho', min_celular: 120, min_computador: 60, min_total: 180, fixado: true }]);
      return send(200, null);
    }
    const rows = filtrar(tabelas[m[2]] || [], u.searchParams);
    if (req.method === 'HEAD' || (req.headers.prefer || '').includes('count=exact')) {
      return send(200, req.method === 'HEAD' ? undefined : rows, { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
    }
    if (req.method !== 'GET' && m[2] === 'ra_membros' && u.searchParams.get('select')) {
      const b = JSON.parse(body || '{}');
      const achados = req.method === 'PATCH' ? rows : [{ id: id(999), nome: b.nome, email: b.email, user_id: null }];
      return (req.headers.accept || '').includes('vnd.pgrst.object') ? send(200, achados[0]) : send(200, achados);
    }
    if (req.method !== 'GET') return send(201, []);
    if ((req.headers.accept || '').includes('vnd.pgrst.object')) return rows[0] ? send(200, rows[0]) : send(406, { code: 'PGRST116', message: 'no rows' });
    return send(200, rows);
  }
}).listen(54321, () => console.log('mock pronto'));
