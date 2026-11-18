// Supabase falso para testar as telas sem tocar no banco real.
import http from 'node:http';
const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const dia = (n) => { const d = new Date(hoje + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const FAM = '11111111-1111-1111-1111-111111111111';
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const G = id(1), M = id(2), E = id(3), A = id(4);
const membros = [
  { id: G, familia_id: FAM, nome: 'Thomas', papel: 'gestor', cor: '#0f4fae', email: 'pai@t.l', ativo: true, tela_ativo: true, user_id: id(91) },
  { id: M, familia_id: FAM, nome: 'Mãe', papel: 'gestor', cor: '#7a3fb0', email: null, ativo: true, tela_ativo: true, user_id: null },
  { id: E, familia_id: FAM, nome: 'Eduardo', papel: 'filho', cor: '#1a6fe0', email: 'edu@t.l', ativo: true, tela_ativo: true, user_id: id(92) },
  { id: A, familia_id: FAM, nome: 'Alice', papel: 'filho', cor: '#c2185b', email: null, ativo: true, tela_ativo: false, user_id: null },
];
const cats = [{ id: id(20), familia_id: FAM, nome: 'Estudo', cor: 'indigo', ordem: 1 }, { id: id(21), familia_id: FAM, nome: 'Casa', cor: 'laranja', ordem: 2 }];
const tarefas = [
  { id: id(30), familia_id: FAM, titulo: 'Estudar 1h', descricao: 'Matemática', categoria_id: id(20), responsavel_id: E, tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '19:00:00', hora_fim: '20:00:00', exige_foto: false, criada_por: G, ativa: true, categoria: cats[0] },
  { id: id(31), familia_id: FAM, titulo: 'Arrumar quarto', descricao: null, categoria_id: id(21), responsavel_id: E, tipo: 'pontual', recorrencia: null, dias_semana: [], data_inicio: hoje, data_fim: null, hora_inicio: null, hora_fim: null, exige_foto: true, criada_por: G, ativa: true, categoria: cats[1] },
  { id: id(32), familia_id: FAM, titulo: 'Violão', descricao: null, categoria_id: null, responsavel_id: A, tipo: 'recorrente', recorrencia: 'dias_semana', dias_semana: [1, 3], data_inicio: dia(-10), data_fim: dia(30), hora_inicio: '15:00:00', hora_fim: null, exige_foto: false, criada_por: A, ativa: true, categoria: null },
];
tarefas.push({ id: id(34), familia_id: FAM, titulo: 'Lavar a louça', descricao: null, categoria_id: id(21), responsavel_id: E, tipo: 'pontual', recorrencia: null, dias_semana: [], data_inicio: hoje, data_fim: null, hora_inicio: '23:30:00', hora_fim: null, exige_foto: true, criada_por: G, ativa: true, categoria: cats[1] });
const tRef = (t) => ({ id: t.id, titulo: t.titulo, descricao: t.descricao, exige_foto: t.exige_foto, criada_por: t.criada_por, tipo: t.tipo, categoria: t.categoria });
const oc = (n, t, d, extra = {}) => ({ id: id(100 + n), tarefa_id: t.id, familia_id: FAM, membro_id: t.responsavel_id, data: d, hora_inicio: t.hora_inicio, hora_fim: t.hora_fim, horario_travado: t.criada_por !== t.responsavel_id, status: 'pendente', concluida_em: null, foto_path: null, conferido: null, justificativa: null, justificativa_status: null, tarefa: tRef(t), ...extra });
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
const familias = [{ id: FAM, nome: 'Família Sakai', avatar: null, ativa: true, foto_max_horas: 2, criado_em: dia(-40) + 'T12:00:00Z' }];
const adminFamilias = [
  { ...familias[0], gestores: 'Thomas <pai@t.l>, Mãe', n_gestores: 2, n_filhos: 2, n_ativos: 2, tarefas: 3, oc_30d: 10, cumpridas_30d: 3, ultima_acao: new Date().toISOString() },
  { id: id(700), nome: 'Família Teste', avatar: `${id(700)}/familia/avatar-1.jpg`, ativa: false, criado_em: dia(-5) + 'T12:00:00Z', gestores: 'Ana <ana@t.l>', n_gestores: 1, n_filhos: 0, n_ativos: 0, tarefas: 0, oc_30d: 0, cumpridas_30d: 0, ultima_acao: null },
];
const tabelas = {
  ra_familias: familias, ra_membros: membros, ra_categorias: cats, ra_tarefas: tarefas, ra_ocorrencias: ocorr,
  ra_adiamentos: [{ id: id(200), ocorrencia_id: id(103), familia_id: FAM, membro_id: E, nova_data: dia(3), nova_hora: '15:00:00', motivo: 'Prova', status: 'pendente', criado_em: new Date().toISOString(), oc: { data: dia(-1), hora_inicio: '19:00:00', tarefa: { titulo: 'Estudar 1h' } } }],
  ra_notificacoes: [{ id: id(300), familia_id: FAM, para_membro: G, titulo: 'Eduardo pediu adiamento: Estudar 1h', link: '/painel', lida: false, criado_em: new Date().toISOString() }, { id: id(301), familia_id: FAM, para_membro: G, titulo: 'Eduardo justificou', link: '/painel', lida: true, criado_em: new Date(Date.now() - 86400e3).toISOString() }],
  ra_tela_previsto: [{ id: id(400), familia_id: FAM, membro_id: E, formato: 'aparelho', dias_semana: [0, 1, 2, 3, 4, 5, 6], vigencia_inicio: dia(-30), vigencia_fim: null, fixado: true, min_celular: 120, min_computador: 60, min_total: null, origem: 'pais', criado_por: G, criado_em: new Date().toISOString() }],
  ra_tela_proposta: [{ id: id(500), familia_id: FAM, membro_id: E, data: dia(1), min_celular: null, min_computador: 180, min_total: null, motivo: 'Trabalho da faculdade', status: 'pendente', criado_em: new Date().toISOString() }],
  ra_tela_real: [{ id: id(600), familia_id: FAM, membro_id: E, data: dia(-2), min_celular: 185, min_computador: 65, min_total: 250, foto_celular: `${FAM}/${E}/uso.jpg`, foto_computador: null, obs: null }],
};
export const usuarios = { 'tok-pai': { id: id(91), email: 'pai@t.l', eu: membros[0] }, 'tok-filho': { id: id(92), email: 'edu@t.l', eu: membros[2] }, 'tok-estranho': { id: id(93), email: 'x@t.l', eu: null } };
export const log = [];
function filtrar(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'or', 'on_conflict', 'columns'].includes(k)) continue;
    const [op, ...rest] = v.split('.'); const val = rest.join('.');
    const f = {
      eq: (x) => String(x[k]) === val, neq: (x) => String(x[k]) !== val, gte: (x) => String(x[k]) >= val, lte: (x) => String(x[k]) <= val,
      in: (x) => val.replace(/[()"]/g, '').split(',').includes(String(x[k])), is: (x) => x[k] == null,
    }[op];
    if (f) out = out.filter(f);
  }
  return out;
}
http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const u = new URL(req.url, 'http://x');
    const tok = (req.headers.authorization || '').replace('Bearer ', '');
    const usr = usuarios[tok];
    if (u.pathname === '/__log') { res.end(JSON.stringify(log.splice(0))); return; }
    log.push(`${req.method} ${u.pathname} ${body.slice(0, 300)}`);
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const send = (code, obj, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...cors, ...headers }); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
    if (req.method === 'OPTIONS') return send(204);
    if (u.pathname === '/auth/v1/user') return usr ? send(200, { id: usr.id, email: usr.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} }) : send(401, { message: 'invalid' });
    if (u.pathname === '/auth/v1/logout') return send(204);
    if (u.pathname.startsWith('/storage/v1/object/sign/')) { const b = JSON.parse(body || '{}'); return send(200, (b.paths || []).map((p) => ({ path: p, signedURL: '/object/sign/x?token=t', error: null }))); }
    if (u.pathname.startsWith('/storage/v1/object/') && req.method === 'POST') return send(200, { Key: u.pathname.slice(19), Id: 'x' });
    const m = u.pathname.match(/^\/rest\/v1\/(rpc\/)?([a-z_]+)$/);
    if (!m) return send(404, { message: 'nada' });
    if (m[1]) {
      if (m[2] === 'ra_eu' || m[2] === 'ra_vincular') return send(200, usr?.eu || null);
      if (m[2] === 'ra_sou_super') return send(200, tok === 'tok-pai');
      if (m[2] === 'ra_admin_familias') return tok === 'tok-pai' ? send(200, adminFamilias) : send(400, { message: 'Apenas o administrador geral' });
      if (m[2] === 'ra_tela_previsto_dia') return send(200, [{ formato: 'aparelho', min_celular: 120, min_computador: 60, min_total: 180, fixado: true }]);
      return send(200, null);
    }
    const rows = filtrar(tabelas[m[2]] || [], u.searchParams);
    if (req.method === 'HEAD' || (req.headers.prefer || '').includes('count=exact')) {
      return send(200, req.method === 'HEAD' ? undefined : rows, { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
    }
    if (req.method !== 'GET') return send(201, []);
    if ((req.headers.accept || '').includes('vnd.pgrst.object')) return rows[0] ? send(200, rows[0]) : send(406, { code: 'PGRST116', message: 'no rows' });
    return send(200, rows);
  });
}).listen(54321, () => console.log('mock pronto'));
