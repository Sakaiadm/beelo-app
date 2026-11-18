'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { parseMin, hojeISO, CORES_CAT } from '@/lib/util';

const txt = (fd, k, max = 500) => { const v = fd.get(k); return v == null ? null : String(v).trim().slice(0, max) || null; };
const uuid = (v) => (/^[0-9a-f-]{36}$/i.test(String(v || '')) ? String(v) : null);
const data = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null);
const hora = (v) => (/^\d{2}:\d{2}$/.test(String(v || '')) ? String(v) : null);
const caminhoFoto = (v) => (/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-zA-Z_.-]{1,80}$/.test(String(v || '')) ? String(v) : null);

async function rpc(nome, args) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc(nome, args);
  if (error) return { erro: error.message.replace(/^.*?:\s*/, '') };
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ===== Filho =====
export async function concluir(_, fd) {
  const foto = caminhoFoto(fd.get('foto'));
  const em = foto && !Number.isNaN(Date.parse(fd.get('foto_em'))) ? new Date(fd.get('foto_em')).toISOString() : null;
  return rpc('ra_concluir2', { p_oc: uuid(fd.get('oc')), p_foto: foto, p_foto_em: em });
}
export async function desfazer(_, fd) { return rpc('ra_desfazer', { p_oc: uuid(fd.get('oc')) }); }
export async function justificar(_, fd) { return rpc('ra_justificar', { p_oc: uuid(fd.get('oc')), p_texto: txt(fd, 'texto') }); }
export async function pedirAdiamento(_, fd) {
  const d = data(fd.get('data'));
  if (!d) return { erro: 'Escolha a nova data' };
  return rpc('ra_pedir_adiamento', { p_oc: uuid(fd.get('oc')), p_data: d, p_hora: hora(fd.get('hora')), p_motivo: txt(fd, 'motivo') });
}
export async function definirHorario(_, fd) {
  return rpc('ra_definir_horario', { p_oc: uuid(fd.get('oc')), p_inicio: hora(fd.get('inicio')), p_fim: hora(fd.get('fim')) });
}

// ===== Pais =====
export async function responderAdiamento(_, fd) {
  return rpc('ra_responder_adiamento', { p_id: uuid(fd.get('id')), p_aprovar: fd.get('aprovar') === '1', p_resposta: txt(fd, 'resposta') });
}
export async function avaliarJustificativa(_, fd) { return rpc('ra_avaliar_justificativa', { p_oc: uuid(fd.get('oc')), p_aceitar: fd.get('aceitar') === '1' }); }
export async function conferir(_, fd) {
  const v = fd.get('valor'); if (!['conferido', 'refazer'].includes(v)) return { erro: 'Valor inválido' };
  return rpc('ra_conferir', { p_oc: uuid(fd.get('oc')), p_valor: v });
}

export async function salvarTarefa(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (!eu?.id) return { erro: 'Sem acesso' };
  const tipo = fd.get('tipo') === 'recorrente' ? 'recorrente' : 'pontual';
  const recorrencia = tipo === 'recorrente' ? (['diaria', 'dias_semana', 'semanal', 'mensal'].includes(fd.get('recorrencia')) ? fd.get('recorrencia') : 'diaria') : null;
  const dias = fd.getAll('dias').map(Number).filter((n) => n >= 0 && n <= 6);
  const comHorario = fd.get('com_horario') === '1';
  const reg = {
    titulo: txt(fd, 'titulo', 100), descricao: txt(fd, 'descricao', 1000), categoria_id: uuid(fd.get('categoria')),
    responsavel_id: eu.papel === 'gestor' ? uuid(fd.get('responsavel')) : eu.id,
    tipo, recorrencia, dias_semana: recorrencia === 'dias_semana' ? dias : [],
    data_inicio: data(fd.get('data_inicio')) || hojeISO(), data_fim: tipo === 'recorrente' ? data(fd.get('data_fim')) : null,
    hora_inicio: comHorario ? hora(fd.get('hora_inicio')) : null, hora_fim: comHorario ? hora(fd.get('hora_fim')) : null,
    exige_foto: fd.get('exige_foto') === '1',
    permite_adiar: eu.papel === 'gestor' ? fd.get('permite_adiar') === '1' : true,
    exige_justificativa: eu.papel === 'gestor' ? fd.get('exige_justificativa') === '1' : false,
  };
  if (!reg.titulo) return { erro: 'Dê um nome para a tarefa' };
  if (!reg.responsavel_id) return { erro: 'Escolha para quem é a tarefa' };
  if (recorrencia === 'dias_semana' && dias.length === 0) return { erro: 'Escolha pelo menos um dia da semana' };
  if (reg.hora_inicio && reg.hora_fim && reg.hora_fim <= reg.hora_inicio) return { erro: 'O fim deve ser depois do início' };
  const id = uuid(fd.get('id'));
  let error;
  if (id) {
    ({ error } = await supabase.from('ra_tarefas').update(reg).eq('id', id));
    if (!error) {
      // Atualiza ocorrências futuras ainda pendentes com o novo horário.
      await supabase.from('ra_ocorrencias').update({ hora_inicio: reg.hora_inicio, hora_fim: reg.hora_fim, membro_id: reg.responsavel_id })
        .eq('tarefa_id', id).eq('status', 'pendente').gte('data', hojeISO());
    }
  } else {
    ({ error } = await supabase.from('ra_tarefas').insert({ ...reg, familia_id: eu.familia_id, criada_por: eu.id }));
  }
  if (error) return { erro: 'Não foi possível salvar: ' + error.message };
  revalidatePath('/', 'layout');
  redirect('/tarefas?ok=1');
}

export async function excluirTarefa(fd) {
  const supabase = await supabaseServer();
  const id = uuid(fd.get('id'));
  // Mantém histórico: desativa a tarefa e cancela ocorrências futuras pendentes.
  await supabase.from('ra_tarefas').update({ ativa: false }).eq('id', id);
  await supabase.from('ra_ocorrencias').update({ status: 'cancelada' }).eq('tarefa_id', id).eq('status', 'pendente').gte('data', hojeISO());
  revalidatePath('/', 'layout');
  redirect('/tarefas');
}

export async function salvarMembro(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Apenas pais' };
  const email = txt(fd, 'email', 120)?.toLowerCase() || null;
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { erro: 'E-mail inválido' };
  const reg = {
    nome: txt(fd, 'nome', 60), email, papel: fd.get('papel') === 'gestor' ? 'gestor' : 'filho',
    ativo: fd.get('ativo') === '1', tela_ativo: fd.get('tela_ativo') === '1',
    cor: /^#[0-9a-f]{6}$/i.test(fd.get('cor') || '') ? fd.get('cor') : '#1a6fe0',
  };
  if (!reg.nome) return { erro: 'Informe o nome' };
  const id = uuid(fd.get('id'));
  if (id && fd.has('avatar')) {
    const a = String(fd.get('avatar') || '');
    if (a && !a.startsWith('preset:') && !a.startsWith(`${eu.familia_id}/${id}/avatar-`)) return { erro: 'Imagem inválida' };
    if (a && !caminhoAvatar(a)) return { erro: 'Imagem inválida' };
    reg.avatar = a || null;
  }
  if (id === eu.id && (!reg.ativo || reg.papel !== 'gestor')) return { erro: 'Você não pode tirar o seu próprio acesso de pai/mãe' };
  const { error } = id
    ? await supabase.from('ra_membros').update(reg).eq('id', id)
    : await supabase.from('ra_membros').insert({ ...reg, familia_id: eu.familia_id });
  if (error) return { erro: error.message.includes('duplicate') ? 'Este e-mail já está cadastrado' : error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function salvarCategoria(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  const nome = txt(fd, 'nome', 30);
  if (!nome) return { erro: 'Informe o nome' };
  const { error } = await supabase.from('ra_categorias').insert({ familia_id: eu.familia_id, nome, cor: txt(fd, 'cor', 20) || 'azul', ordem: 50 });
  if (error) return { erro: error.message };
  revalidatePath('/config');
  return { ok: true };
}

// ===== Tempo de tela =====
function lerMinutos(fd, formato, prefixo = '') {
  if (formato === 'total') {
    const t = parseMin(fd.get(prefixo + 'total'));
    return Number.isNaN(t) ? { erro: 'Tempo inválido. Use por exemplo 2h30, 2:30 ou 90min' } : { min_total: t, min_celular: null, min_computador: null };
  }
  const c = parseMin(fd.get(prefixo + 'celular')), p = parseMin(fd.get(prefixo + 'computador'));
  if (Number.isNaN(c) || Number.isNaN(p)) return { erro: 'Tempo inválido. Use por exemplo 2h30, 2:30 ou 90min' };
  return { min_celular: c, min_computador: p, min_total: null };
}

export async function salvarPrevisto(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Apenas pais' };
  const formato = fd.get('formato') === 'total' ? 'total' : 'aparelho';
  const m = lerMinutos(fd, formato); if (m.erro) return m;
  const modo = fd.get('modo');
  const hoje = hojeISO();
  let dias, ini, fim;
  if (modo === 'dia') {
    const d = data(fd.get('data')); if (!d) return { erro: 'Escolha o dia' };
    dias = [new Date(d + 'T12:00:00Z').getUTCDay()]; ini = d; fim = d;
  } else {
    dias = modo === 'semana' ? [0, 1, 2, 3, 4, 5, 6] : fd.getAll('dias').map(Number).filter((n) => n >= 0 && n <= 6);
    if (!dias.length) return { erro: 'Escolha os dias da semana' };
    ini = hoje; fim = fd.get('fixado') === '1' ? null : (() => { const d = new Date(hoje + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + (6 - d.getUTCDay())); return d.toISOString().slice(0, 10); })();
  }
  const { error } = await supabase.from('ra_tela_previsto').insert({
    familia_id: eu.familia_id, membro_id: uuid(fd.get('membro')), formato, dias_semana: dias, vigencia_inicio: ini, vigencia_fim: fim,
    fixado: modo !== 'dia' && fd.get('fixado') === '1', ...m, criado_por: eu.id,
  });
  if (error) return { erro: error.message };
  revalidatePath('/tela');
  return { ok: true };
}

export async function encerrarPrevisto(fd) {
  const supabase = await supabaseServer();
  const ontem = new Date(Date.now() - 86400000 - 3 * 3600000).toISOString().slice(0, 10);
  await supabase.from('ra_tela_previsto').update({ vigencia_fim: ontem }).eq('id', uuid(fd.get('id')));
  revalidatePath('/tela');
}

export async function salvarTelaReal(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  const formato = fd.get('formato') === 'total' ? 'total' : 'aparelho';
  const m = lerMinutos(fd, formato); if (m.erro) return m;
  if (formato === 'aparelho') m.min_total = (m.min_celular || 0) + (m.min_computador || 0);
  const d = data(fd.get('data')); if (!d) return { erro: 'Data inválida' };
  const membro = eu.papel === 'gestor' ? uuid(fd.get('membro')) : eu.id;
  const { error } = await supabase.from('ra_tela_real').upsert({
    familia_id: eu.familia_id, membro_id: membro, data: d, ...m,
    foto_celular: caminhoFoto(fd.get('foto_celular')), foto_computador: caminhoFoto(fd.get('foto_computador')), obs: txt(fd, 'obs', 300),
  }, { onConflict: 'membro_id,data' });
  if (error) return { erro: error.message.replace(/^.*?:\s*/, '') };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function proporTela(_, fd) {
  const formato = fd.get('formato') === 'total' ? 'total' : 'aparelho';
  const m = lerMinutos(fd, formato); if (m.erro) return m;
  const d = data(fd.get('data')); if (!d) return { erro: 'Escolha o dia' };
  return rpc('ra_propor_tela', { p_data: d, p_cel: m.min_celular, p_pc: m.min_computador, p_total: m.min_total, p_motivo: txt(fd, 'motivo') });
}
export async function responderTela(_, fd) { return rpc('ra_responder_tela', { p_id: uuid(fd.get('id')), p_aprovar: fd.get('aprovar') === '1' }); }

export async function marcarLidas() {
  const supabase = await supabaseServer();
  await supabase.from('ra_notificacoes').update({ lida: true }).eq('lida', false);
  revalidatePath('/', 'layout');
}


// ===== Cadastros =====
const caminhoAvatar = (v) => (/^([0-9a-f-]{36}\/[0-9a-z-]{6,36}\/avatar-\d+\.jpg|preset:[md]\d{1,2})$/.test(String(v || '')) ? String(v) : null);

export async function salvarFamilia(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Apenas pais' };
  const reg = { nome: txt(fd, 'nome', 60) };
  if (!reg.nome) return { erro: 'Informe o nome da família' };
  if (fd.has('avatar')) {
    const a = String(fd.get('avatar') || '');
    if (a && !(caminhoAvatar(a) && (a.startsWith('preset:') || a.startsWith(`${eu.familia_id}/familia/`)))) return { erro: 'Imagem inválida' };
    reg.avatar = a || null;
  }
  const { error } = await supabase.from('ra_familias').update(reg).eq('id', eu.familia_id);
  if (error) return { erro: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function editarCategoria(_, fd) {
  const supabase = await supabaseServer();
  const nome = txt(fd, 'nome', 30);
  if (!nome) return { erro: 'Informe o nome' };
  const cor = CORES_CAT[fd.get('cor')] ? fd.get('cor') : 'azul';
  const { error } = await supabase.from('ra_categorias').update({ nome, cor }).eq('id', uuid(fd.get('id')));
  if (error) return { erro: error.message };
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function excluirCategoria(fd) {
  const supabase = await supabaseServer();
  await supabase.from('ra_categorias').delete().eq('id', uuid(fd.get('id')));
  revalidatePath('/', 'layout');
}

// ===== Perfil =====
export async function salvarPerfil(_, fd) {
  if (!fd.has('avatar')) return { ok: true };
  const a = String(fd.get('avatar') || '');
  if (a && !caminhoAvatar(a)) return { erro: 'Imagem inválida' };
  return rpc('ra_meu_avatar', { p_caminho: a || null });
}

export async function salvarAvisos(_, fd) {
  const c = fd.get('concluida');
  return rpc('ra_minhas_notif', { p_prefs: {
    concluida: ['todas', 'com_foto', 'nenhuma'].includes(c) ? c : 'todas',
    justificativa: fd.get('justificativa') === '1', adiamento: fd.get('adiamento') === '1',
    tela: fd.get('tela') === '1', tarefa_filho: fd.get('tarefa_filho') === '1',
  } });
}

// ===== Famílias =====
export async function criarFamilia(_, fd) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('ra_criar_familia', { p_nome: txt(fd, 'familia', 60), p_meu_nome: txt(fd, 'nome', 60) });
  if (error) return { erro: error.message.replace(/^.*?:\s*/, '') };
  revalidatePath('/', 'layout');
  redirect('/config?nova=1');
}

export async function adminCriarFamilia(_, fd) {
  return rpc('ra_admin_criar_familia', { p_nome: txt(fd, 'familia', 60), p_gestor_nome: txt(fd, 'nome', 60), p_gestor_email: txt(fd, 'email', 120) });
}

export async function adminAtivarFamilia(fd) {
  const supabase = await supabaseServer();
  await supabase.rpc('ra_admin_ativar_familia', { p_id: uuid(fd.get('id')), p_ativa: fd.get('ativa') === '1' });
  revalidatePath('/admin');
}
