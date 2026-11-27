// @arquivo  testes/mock-fluxos.mjs: Supabase falso (porta 54321) com família, pessoas, tarefas, desafios, prêmios e desejos de exemplo.
// @tipo     teste
// @usa      nada (servidor http de Node)
// @usado-por testes/fluxos.cjs
// @cuidado  Env: VAZIO=1 (grupo sem ninguém), GUIA=0 (Guia da Mel desligado), DESAFIOS=0 (desafios desligados), JEITO=calmo (Alice no jeito Calmo).
// Supabase falso para testar as telas sem tocar no banco real.
import http from 'node:http';
const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const dia = (n) => { const d = new Date(hoje + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const FAM = '11111111-1111-1111-1111-111111111111';
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const G = id(1), M = id(2), E = id(3), A = id(4), B = id(5);
const membros = [
  { id: G, familia_id: FAM, nome: 'Thomas', papel: 'gestor', cor: '#0f4fae', email: 'pai@t.com', ativo: true, tela_ativo: true, user_id: id(91) },
  { id: M, familia_id: FAM, nome: 'Mãe', papel: 'gestor', cor: '#7a3fb0', email: null, ativo: true, tela_ativo: true, user_id: null },
  { id: E, familia_id: FAM, nome: 'Eduardo', papel: 'filho', funcao: 'filho', sexo: 'm', modo_crianca: false, cor: '#1a6fe0', email: 'edu@t.com', ativo: true, tela_ativo: true, user_id: id(92) },
  { id: A, familia_id: FAM, nome: 'Alice', papel: 'filho', funcao: 'filho', sexo: 'f', modo_crianca: true, cor: '#c2185b', email: 'alice@t.com', ativo: true, tela_ativo: true, user_id: id(94) },
  { id: B, familia_id: FAM, nome: 'Bruno', papel: 'filho', funcao: 'outro', cor: '#2e7d32', email: 'bruno@t.com', ativo: true, tela_ativo: true, user_id: id(95) },
];
membros.forEach((m) => { m.termos_versao = '2026-11-24'; m.termos_aceitos_em = '2026-11-01T12:00:00Z'; m.autorizado_em = '2026-11-01T12:00:00Z'; if (process.env.JEITO && m.nome === 'Alice') m.jeito = process.env.JEITO; });
const cats = [{ id: id(20), familia_id: FAM, nome: 'Estudo', cor: 'indigo', ordem: 1 }, { id: id(21), familia_id: FAM, nome: 'Casa', cor: 'laranja', ordem: 2 }];
const tarefas = [
  { id: id(30), familia_id: FAM, titulo: 'Estudar 1h', descricao: 'Matemática', categoria_id: id(20), responsavel_id: E, tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '19:00:00', hora_fim: '20:00:00', exige_foto: false, permite_adiar: true, exige_justificativa: false, criada_por: G, ativa: true, prioritaria: true, lembrete_min: 15, categoria: cats[0] },
  { id: id(31), familia_id: FAM, titulo: 'Arrumar quarto', descricao: null, categoria_id: id(21), responsavel_id: E, tipo: 'pontual', recorrencia: null, dias_semana: [], data_inicio: hoje, data_fim: null, hora_inicio: null, hora_fim: null, exige_foto: true, permite_adiar: true, exige_justificativa: false, criada_por: G, ativa: true, categoria: cats[1] },
  { id: id(32), familia_id: FAM, titulo: 'Violão', descricao: null, categoria_id: null, responsavel_id: A, tipo: 'recorrente', recorrencia: 'dias_semana', dias_semana: [1, 3], data_inicio: dia(-10), data_fim: dia(30), hora_inicio: '15:00:00', hora_fim: null, exige_foto: false, permite_adiar: true, exige_justificativa: false, criada_por: A, ativa: true, categoria: null },
];
tarefas.push({ id: id(35), familia_id: FAM, titulo: 'Lançar tempo de tela', descricao: null, categoria_id: null, responsavel_id: E, especial: 'tela', tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '08:00:00', hora_fim: null, exige_foto: false, permite_adiar: false, exige_justificativa: false, criada_por: G, ativa: true, categoria: null });
tarefas.push({ id: id(34), familia_id: FAM, titulo: 'Lavar a louça', descricao: null, categoria_id: id(21), responsavel_id: E, tipo: 'pontual', recorrencia: null, dias_semana: [], data_inicio: hoje, data_fim: null, hora_inicio: '23:30:00', hora_fim: null, exige_foto: true, permite_adiar: true, exige_justificativa: false, criada_por: G, ativa: true, categoria: cats[1] });
tarefas.push({ id: id(36), familia_id: FAM, titulo: 'Lançar tempo de tela', descricao: null, categoria_id: null, responsavel_id: A, especial: 'tela', tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '08:00:00', hora_fim: null, exige_foto: false, permite_adiar: false, exige_justificativa: false, criada_por: G, ativa: true, categoria: null });
tarefas.push({ id: id(37), familia_id: FAM, titulo: 'Lançar tempo de tela', descricao: null, categoria_id: null, responsavel_id: B, especial: 'tela', tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '09:00:00', hora_fim: null, exige_foto: false, permite_adiar: true, exige_justificativa: false, criada_por: G, ativa: true, categoria: null });
tarefas.push({ id: id(38), familia_id: FAM, titulo: 'Lançar tempo de tela', descricao: null, categoria_id: null, responsavel_id: G, especial: 'tela', tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [], data_inicio: dia(-10), data_fim: null, hora_inicio: '21:00:00', hora_fim: null, exige_foto: false, permite_adiar: false, exige_justificativa: false, criada_por: G, ativa: true, categoria: null });
const tRef = (t) => ({ id: t.id, prioritaria: !!t.prioritaria, titulo: t.titulo, descricao: t.descricao, exige_foto: t.exige_foto, permite_adiar: t.permite_adiar, exige_justificativa: t.exige_justificativa, criada_por: t.criada_por, tipo: t.tipo, categoria: t.categoria });
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
  oc(9, tarefas[2], hoje), oc(13, tarefas[5], hoje), oc(14, tarefas[6], hoje), oc(15, tarefas[7], hoje), oc(16, tarefas[4], hoje), oc(17, tarefas[0].responsavel_id===E?{...tarefas[2],responsavel_id:A,titulo:'Escovar os dentes',id:id(39)}:tarefas[2], hoje), oc(10, tarefas[2], dia(2)),
];
const familias = [{ id: FAM, guia_mel: process.env.GUIA !== '0', desafios_beta: process.env.DESAFIOS !== '0', mural_visivel: 'todos', nome: 'Família Sakai', avatar: null, ativa: true, foto_max_horas: 2, criado_em: dia(-40) + 'T12:00:00Z' }];
const adminFamilias = [
  { ...familias[0], gestores: 'Thomas <pai@t.com>, Mãe', n_gestores: 2, n_filhos: 2, n_ativos: 2, tarefas: 3, oc_30d: 10, cumpridas_30d: 3, ultima_acao: new Date().toISOString() },
  { id: id(700), nome: 'Família Teste', avatar: `${id(700)}/familia/avatar-1.jpg`, ativa: false, criado_em: dia(-5) + 'T12:00:00Z', gestores: 'Ana <ana@t.com>', n_gestores: 1, n_filhos: 0, n_ativos: 0, tarefas: 0, oc_30d: 0, cumpridas_30d: 0, ultima_acao: null },
];
const tabelas = {
  ra_familias: familias, ra_membros: membros, ra_categorias: cats, ra_tarefas: tarefas, ra_ocorrencias: ocorr,
  ra_adiamentos: [{ id: id(200), ocorrencia_id: id(103), familia_id: FAM, membro_id: E, nova_data: dia(3), nova_hora: '15:00:00', motivo: 'Prova', status: 'pendente', criado_em: new Date().toISOString(), oc: { data: dia(-1), hora_inicio: '19:00:00', tarefa: { titulo: 'Estudar 1h' } } }],
  ra_notificacoes: [{ id: id(300), familia_id: FAM, para_membro: G, titulo: 'Eduardo pediu adiamento: Estudar 1h', link: '/painel', lida: false, criado_em: new Date().toISOString() }, { id: id(301), familia_id: FAM, para_membro: G, titulo: 'Eduardo justificou', link: '/painel', lida: true, criado_em: new Date(Date.now() - 86400e3).toISOString() }],
  ra_tela_previsto: [{ id: id(401), familia_id: FAM, membro_id: A, formato: 'aparelho', dias_semana: [0,1,2,3,4,5,6], vigencia_inicio: dia(-30), vigencia_fim: null, fixado: false, min_celular: 60, min_computador: null, min_total: null, origem: 'pais', criado_por: G, criado_em: new Date().toISOString() }, { id: id(402), familia_id: FAM, membro_id: B, formato: 'aparelho', dias_semana: [1,2,3,4,5], vigencia_inicio: dia(-30), vigencia_fim: null, fixado: false, min_celular: 150, min_computador: 240, min_total: null, origem: 'pais', criado_por: G, criado_em: new Date().toISOString() }, { id: id(400), familia_id: FAM, membro_id: E, formato: 'aparelho', dias_semana: [0, 1, 2, 3, 4, 5, 6], vigencia_inicio: dia(-30), vigencia_fim: null, fixado: true, min_celular: 120, min_computador: 60, min_total: null, origem: 'pais', criado_por: G, criado_em: new Date().toISOString() }],
  ra_tela_proposta: [{ id: id(500), familia_id: FAM, membro_id: E, data: dia(1), min_celular: null, min_computador: 180, min_total: null, motivo: 'Trabalho da faculdade', status: 'pendente', criado_em: new Date().toISOString() }],
  ra_tela_real: [{ id: id(600), familia_id: FAM, membro_id: E, data: dia(-2), min_celular: 185, min_computador: 65, min_total: 250, foto_celular: `${FAM}/${E}/uso.jpg`, foto_computador: null, obs: null }, { id: id(601), familia_id: FAM, membro_id: E, data: dia(-1), min_celular: 100, min_computador: 50, min_total: 150, foto_celular: null, foto_computador: null, obs: null }, { id: id(602), familia_id: FAM, membro_id: E, data: dia(-4), min_celular: 120, min_computador: 60, min_total: 180, foto_celular: null, foto_computador: null, obs: null }, { id: id(610), familia_id: FAM, membro_id: A, data: dia(-1), min_celular: 60, min_computador: null, min_total: 60, foto_celular: null, foto_computador: null, obs: null }, { id: id(611), familia_id: FAM, membro_id: A, data: dia(-2), min_celular: 75, min_computador: null, min_total: 75, foto_celular: null, foto_computador: null, obs: null }, { id: id(612), familia_id: FAM, membro_id: A, data: dia(-3), min_celular: 50, min_computador: null, min_total: 50, foto_celular: null, foto_computador: null, obs: null }, { id: id(613), familia_id: FAM, membro_id: A, data: dia(-4), min_celular: 90, min_computador: null, min_total: 90, foto_celular: null, foto_computador: null, obs: null }, { id: id(614), familia_id: FAM, membro_id: A, data: dia(-5), min_celular: 45, min_computador: null, min_total: 45, foto_celular: null, foto_computador: null, obs: null }, { id: id(615), familia_id: FAM, membro_id: A, data: dia(-6), min_celular: 70, min_computador: null, min_total: 70, foto_celular: null, foto_computador: null, obs: null }, { id: id(616), familia_id: FAM, membro_id: B, data: dia(-1), min_celular: 150, min_computador: 200, min_total: 350, foto_celular: null, foto_computador: null, obs: null }, { id: id(617), familia_id: FAM, membro_id: B, data: dia(-2), min_celular: 130, min_computador: 240, min_total: 370, foto_celular: null, foto_computador: null, obs: null }, { id: id(618), familia_id: FAM, membro_id: B, data: dia(-3), min_celular: 170, min_computador: 180, min_total: 350, foto_celular: null, foto_computador: null, obs: null }, { id: id(619), familia_id: FAM, membro_id: B, data: dia(-4), min_celular: 110, min_computador: 210, min_total: 320, foto_celular: null, foto_computador: null, obs: null }, { id: id(620), familia_id: FAM, membro_id: B, data: dia(-5), min_celular: 140, min_computador: 260, min_total: 400, foto_celular: null, foto_computador: null, obs: null }, { id: id(621), familia_id: FAM, membro_id: B, data: dia(-6), min_celular: 120, min_computador: 190, min_total: 310, foto_celular: null, foto_computador: null, obs: null }, { id: id(622), familia_id: FAM, membro_id: G, data: dia(-1), min_celular: 100, min_computador: null, min_total: 100, foto_celular: null, foto_computador: null, obs: null }, { id: id(623), familia_id: FAM, membro_id: G, data: dia(-2), min_celular: 130, min_computador: null, min_total: 130, foto_celular: null, foto_computador: null, obs: null }, { id: id(624), familia_id: FAM, membro_id: G, data: dia(-3), min_celular: 90, min_computador: null, min_total: 90, foto_celular: null, foto_computador: null, obs: null }, { id: id(625), familia_id: FAM, membro_id: E, data: dia(-3), min_celular: 140, min_computador: 70, min_total: 210, foto_celular: null, foto_computador: null, obs: null }, { id: id(626), familia_id: FAM, membro_id: E, data: dia(-5), min_celular: 110, min_computador: 40, min_total: 150, foto_celular: null, foto_computador: null, obs: null }],
};

const PREM = [['s1','Escolher a sobremesa',10,'todos'],['s2','Figurinhas',10,'ate8'],['s6','Escolher o jantar',15,'todos'],['v1','Cinema com amigos',3,'teen']].map(([c,n,k,f],i)=>({id:id(800+i),familia_id:FAM,catalogo:c,nome:n,custo:k,moeda:f==='teen'?'semanas':'estrelas',faixa:f,ativo:true,criado_em:new Date().toISOString(),membro_id:null,desejo:null}));
PREM.push({id:id(820),familia_id:FAM,catalogo:null,nome:'Bicicleta nova',custo:200,moeda:'estrelas',faixa:'todos',ativo:true,criado_em:new Date().toISOString(),membro_id:A,desejo:'esperando',sugerido:'Bicicleta nova'});
const DES = [{id:id(900),familia_id:FAM,membro_id:A,catalogo:'c1',titulo:'Semana em dia',descricao:'80% das tarefas da semana feitas.',icone:'hoje',tipo:'pct',alvo:'todas',categorias:[],criterio:'feita',meta:80,periodo:'semana',coringa:true,recompensa:'estrelas',estrelas:10,ativo:true,criado_por:G,criado_em:new Date().toISOString()},{id:id(901),familia_id:FAM,membro_id:E,catalogo:'c4',titulo:'Cinco dias bons',descricao:'Dias com tudo feito.',tipo:'dias',alvo:'todas',categorias:[],criterio:'feita',meta:5,periodo:'semana',coringa:true,recompensa:'semanas',estrelas:10,ativo:true,criado_por:G,criado_em:new Date().toISOString()}];
const seg = dia(-((new Date(hoje+'T12:00:00Z').getUTCDay()+6)%7));
const PER = DES.map((d,i)=>({id:id(950+i),desafio_id:d.id,familia_id:FAM,membro_id:d.membro_id,inicio:seg,fim:dia(6-((new Date(hoje+'T12:00:00Z').getUTCDay()+6)%7)),progresso:60,meta:80,possivel:5,detalhe:{},status:'andamento',visto:false}));
tabelas.ra_premios = PREM; tabelas.ra_desafios = process.env.DESAFIOS==='0'?[]:DES; tabelas.ra_desafio_periodos = PER; tabelas.ra_cofrinho=[{id:id(970),familia_id:FAM,membro_id:A,moeda:'estrelas',valor:30,motivo:'x',criado_em:new Date().toISOString()}]; tabelas.ra_premio_pedidos=[{id:id(980),familia_id:FAM,membro_id:A,premio_id:PREM[0].id,nome:'Escolher a sobremesa',custo:10,moeda:'estrelas',status:'pedido',criado_em:new Date().toISOString()}];
if (process.env.VAZIO === '1') { membros.splice(1, 4); tarefas.length = 0; ocorr.length = 0; }
export const usuarios = { 'tok-pai': { id: id(91), email: 'pai@t.com', eu: membros[0] }, 'tok-filho': { id: id(92), email: 'edu@t.com', eu: membros[2] }, 'tok-estranho': { id: id(93), email: 'x@t.com', eu: null }, 'tok-crianca': { id: id(94), email: 'alice@t.com', eu: membros[3] }, 'tok-adulto': { id: id(95), email: 'bruno@t.com', eu: membros[4] } };
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
      if (m[2] === 'ra_guia_mel_estado') return send(200, true);
      if (m[2] === 'ra_sou_super') return send(200, tok === 'tok-pai');
      if (m[2] === 'ra_admin_familias') return tok === 'tok-pai' ? send(200, adminFamilias) : send(400, { message: 'Apenas o administrador geral' });
      if (m[2] === 'ra_admin_membros') return tok === 'tok-pai' ? send(200, [{ id: id(701), nome: 'Ana', email: 'ana@t.com', funcao: 'mae', papel: 'gestor', ativo: true, entrou: false, responsavel: true }]) : send(400, { message: 'Apenas o administrador geral' });
      if (m[2] === 'ra_tela_previsto_dia') { const b = JSON.parse(body || '{}'); const pm = { [A]: [60, null], [B]: [150, 240], [G]: [120, null] }[b.p_membro] || [120, 60]; return send(200, [{ formato: 'aparelho', min_celular: pm[0], min_computador: pm[1], min_total: (pm[0]||0)+(pm[1]||0), fixado: true }]); }
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
