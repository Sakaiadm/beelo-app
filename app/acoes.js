'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { parseMin, hojeISO, addDias, CORES_CAT } from '@/lib/util';
import { validarEmail } from '@/lib/email';
import { funcaoDe, nomeFuncao } from '@/lib/papeis';
import { emailConfigurado, enviarEmailConvite } from '@/lib/convite';
import { esquecerSessoes } from '@/lib/sessao';

// Depois de qualquer alteração: limpa o que estava guardado e manda as telas buscarem de novo.
function revalidar() { esquecerSessoes(); revalidatePath('/', 'layout'); }

const txt = (fd, k, max = 500) => { const v = fd.get(k); return v == null ? null : String(v).trim().slice(0, max) || null; };
const uuid = (v) => (/^[0-9a-f-]{36}$/i.test(String(v || '')) ? String(v) : null);
const data = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null);
const hora = (v) => (/^\d{2}:\d{2}$/.test(String(v || '')) ? String(v) : null);
const caminhoFoto = (v) => (/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-zA-Z_.-]{1,80}$/.test(String(v || '')) ? String(v) : null);

async function rpc(nome, args) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc(nome, args);
  if (error) return { erro: error.message.replace(/^.*?:\s*/, '') };
  revalidar();
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

// Depois de salvar ou excluir, volta para o dia que estava aberto na Agenda.
const voltarAgenda = (fd) => (/^\d{4}-\d{2}-\d{2}$/.test(fd.get('voltar') || '') ? `/agenda?v=dia&d=${fd.get('voltar')}` : '/agenda?v=dia');

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
  if (eu.papel === 'gestor' && reg.responsavel_id === eu.id) { reg.permite_adiar = false; reg.exige_justificativa = false; }
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
  // Gera já as ocorrências dos próximos dias, para a tarefa aparecer na hora na Agenda.
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: addDias(hojeISO(), -7), p_ate: addDias(hojeISO(), 54) });
  revalidar();
  redirect(voltarAgenda(fd));
}

export async function excluirTarefa(_, fd) {
  const supabase = await supabaseServer();
  const id = uuid(fd.get('id'));
  // Mantém histórico: desativa a tarefa e cancela ocorrências futuras pendentes.
  await supabase.from('ra_tarefas').update({ ativa: false }).eq('id', id);
  await supabase.from('ra_ocorrencias').update({ status: 'cancelada' }).eq('tarefa_id', id).eq('status', 'pendente').gte('data', hojeISO());
  revalidar();
  redirect(voltarAgenda(fd));
}

export async function salvarPessoa(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const bruto = txt(fd, 'email', 120);
  const v = bruto ? validarEmail(bruto) : { ok: true, email: null };
  if (!v.ok) return { erro: v.msg || 'E-mail inválido' };
  const f = funcaoDe(fd.get('funcao'));
  if (!f) return { erro: 'Escolha o papel da pessoa' };
  const permissoes = {};
  f.chaves.forEach(([k]) => { permissoes[k] = fd.get(`perm_${k}`) === '1'; });
  const reg = {
    nome: txt(fd, 'nome', 60), email: v.email || null, papel: f.papel, funcao: f.id, permissoes,
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
  const { data: salvo, error } = id
    ? await supabase.from('ra_membros').update(reg).eq('id', id).select('id, nome, email, user_id, funcao, papel').maybeSingle()
    : await supabase.from('ra_membros').insert({ ...reg, familia_id: eu.familia_id }).select('id, nome, email, user_id, funcao, papel').maybeSingle();
  if (error) return { erro: error.message.includes('duplicate') ? 'Este e-mail já está cadastrado' : error.message };
  revalidar();
  let aviso = '';
  if (fd.get('enviar') === '1' && salvo) {
    const r = await mandarConvite(supabase, eu, salvo);
    aviso = r.ok ? 'convite' : 'semconvite:' + r.erro;
  }
  if (!id) redirect('/config/pessoas' + (aviso ? `?aviso=${encodeURIComponent(aviso)}` : ''));
  if (aviso.startsWith('semconvite:')) return { erro: 'Pessoa salva, mas ' + aviso.slice(11).replace(/^./, (c) => c.toLowerCase()) };
  return { ok: true, msg: aviso ? 'Salvo e convite enviado.' : undefined };
}

// Manda (ou manda de novo) o e-mail do convite.
async function mandarConvite(supabase, eu, m) {
  if (!m.email) return { erro: 'Esta pessoa não tem e-mail.' };
  if (!emailConfigurado()) return { erro: 'O e-mail de envio ainda não foi configurado no servidor.' };
  const { data: fam } = await supabase.from('ra_familias').select('nome').eq('id', eu.familia_id).maybeSingle();
  try {
    await enviarEmailConvite({ para: m.email, nomePessoa: m.nome, nomeFamilia: fam?.nome || 'do grupo', quemConvida: eu.nome, ja: !!m.user_id, papel: nomeFuncao(m) });
  } catch (e) {
    return { erro: 'Não foi possível enviar o e-mail (' + String(e.message || e).slice(0, 80) + ').' };
  }
  if (!m.user_id) await supabase.from('ra_membros').update({ convidado_em: new Date().toISOString() }).eq('id', m.id);
  revalidar();
  return { ok: true };
}

export async function reenviarConvite(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const { data: m } = await supabase.from('ra_membros').select('id, nome, email, user_id, funcao, papel').eq('id', uuid(fd.get('id'))).eq('familia_id', eu.familia_id).maybeSingle();
  if (!m) return { erro: 'Pessoa não encontrada' };
  const r = await mandarConvite(supabase, eu, m);
  return r.ok ? { ok: true, msg: m.user_id ? 'E-mail enviado.' : 'Convite enviado.' } : r;
}

export async function alternarPessoa(fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  const id = uuid(fd.get('id'));
  if (eu?.papel !== 'gestor' || !id || id === eu.id) return;
  await supabase.from('ra_membros').update({ ativo: fd.get('ativo') === '1' }).eq('id', id);
  revalidar();
}

export async function excluirPessoa(fd) {
  const supabase = await supabaseServer();
  await supabase.rpc('ra_excluir_membro', { p_id: uuid(fd.get('id')) });
  revalidar();
  redirect('/config/pessoas');
}

export async function editarFamilia(_, fd) {
  const id = uuid(fd.get('id'));
  const nome = txt(fd, 'nome', 60);
  if (!nome) return { erro: 'Informe o nome da família' };
  const mudar = fd.has('avatar');
  const a = mudar ? String(fd.get('avatar') || '') : '';
  if (mudar && a && !(caminhoAvatar(a) && (a.startsWith('preset:') || a.startsWith(`${id}/familia/`)))) return { erro: 'Imagem inválida' };
  return rpc('ra_editar_familia', { p_id: id, p_nome: nome, p_avatar: a || null, p_mudar_avatar: mudar });
}

export async function trocarResponsavel(_, fd) {
  const familia = uuid(fd.get('familia'));
  const membro = uuid(fd.get('membro'));
  if (membro) return rpc('ra_definir_responsavel', { p_familia: familia, p_membro: membro, p_nome: null, p_email: null });
  const v = validarEmail(txt(fd, 'email', 120));
  if (!v.ok) return { erro: v.msg || 'Informe o e-mail do novo responsável' };
  if (!txt(fd, 'nome', 60)) return { erro: 'Informe o nome do novo responsável' };
  return rpc('ra_definir_responsavel', { p_familia: familia, p_membro: null, p_nome: txt(fd, 'nome', 60), p_email: v.email });
}

export async function salvarCategoria(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  const nome = txt(fd, 'nome', 30);
  if (!nome) return { erro: 'Informe o nome' };
  const { error } = await supabase.from('ra_categorias').insert({ familia_id: eu.familia_id, nome, cor: txt(fd, 'cor', 20) || 'azul', ordem: 50 });
  if (error) return { erro: error.message };
  revalidar();
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
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const formato = fd.get('formato') === 'total' ? 'total' : 'aparelho';
  const m = lerMinutos(fd, formato); if (m.erro) return m;
  const modo = ['dia', 'dias', 'semana'].includes(fd.get('modo')) ? fd.get('modo') : 'dias';
  const hoje = hojeISO();
  const inicio = data(fd.get('inicio')) || hoje;
  let dias, ini, fim;
  if (modo === 'dia') {
    dias = [new Date(inicio + 'T12:00:00Z').getUTCDay()]; ini = inicio; fim = inicio;
  } else {
    dias = modo === 'semana' ? [0, 1, 2, 3, 4, 5, 6] : fd.getAll('dias').map(Number).filter((n) => n >= 0 && n <= 6);
    if (!dias.length) return { erro: 'Escolha os dias da semana' };
    ini = inicio; fim = data(fd.get('fim'));
    if (fim && fim < ini) return { erro: 'O fim deve ser depois do início' };
  }
  const { error } = await supabase.from('ra_tela_previsto').insert({
    familia_id: eu.familia_id, membro_id: uuid(fd.get('membro')), formato, dias_semana: dias, vigencia_inicio: ini, vigencia_fim: fim,
    fixado: modo !== 'dia' && !fim, ...m, criado_por: eu.id,
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
  revalidar();
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
  revalidar();
}


// ===== Cadastros =====
const caminhoAvatar = (v) => (/^([0-9a-f-]{36}\/[0-9a-z-]{6,36}\/avatar-\d+\.jpg|preset:[md]\d{1,2})$/.test(String(v || '')) ? String(v) : null);

export async function editarCategoria(_, fd) {
  const supabase = await supabaseServer();
  const nome = txt(fd, 'nome', 30);
  if (!nome) return { erro: 'Informe o nome' };
  const cor = CORES_CAT[fd.get('cor')] ? fd.get('cor') : 'azul';
  const { error } = await supabase.from('ra_categorias').update({ nome, cor }).eq('id', uuid(fd.get('id')));
  if (error) return { erro: error.message };
  revalidar();
  return { ok: true };
}

export async function excluirCategoria(fd) {
  const supabase = await supabaseServer();
  await supabase.from('ra_categorias').delete().eq('id', uuid(fd.get('id')));
  revalidar();
}

// ===== Perfil =====
export async function salvarPerfil(_, fd) {
  if (!fd.has('avatar')) return { ok: true };
  const a = String(fd.get('avatar') || '');
  if (a && !caminhoAvatar(a)) return { erro: 'Imagem inválida' };
  return rpc('ra_meu_avatar', { p_caminho: a || null });
}

export async function salvarAvisos(_, fd) {
  const concluir = fd.get('concluir') === '1';
  return rpc('ra_minhas_notif', { p_prefs: {
    concluida: !concluir ? 'nenhuma' : fd.get('so_foto') === '1' ? 'com_foto' : 'todas',
    justificativa: fd.get('justificativa') === '1', adiamento: fd.get('adiamento') === '1',
    tela: fd.get('tela') === '1', tarefa_filho: fd.get('tarefa_filho') === '1',
  } });
}

// ===== Avisos no celular =====
export async function salvarAparelho(sub, aparelho) {
  const chaves = sub?.keys || {};
  if (!sub?.endpoint || !chaves.p256dh || !chaves.auth) return { erro: 'Aparelho inválido' };
  return rpc('ra_push_inscrever', { p_endpoint: String(sub.endpoint), p_p256dh: String(chaves.p256dh), p_auth: String(chaves.auth), p_aparelho: String(aparelho || '').slice(0, 80) });
}
export async function removerAparelho(endpoint) { return rpc('ra_push_cancelar', { p_endpoint: String(endpoint || '') }); }
export async function enviarTeste() { return rpc('ra_push_teste', {}); }

// ===== Famílias =====
export async function criarFamilia(_, fd) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('ra_criar_familia', { p_nome: txt(fd, 'familia', 60), p_meu_nome: txt(fd, 'nome', 60) });
  if (error) return { erro: error.message.replace(/^.*?:\s*/, '') };
  revalidar();
  redirect('/config?nova=1');
}

export async function adminCriarFamilia(_, fd) {
  const v = validarEmail(txt(fd, 'email', 120));
  if (!v.ok) return { erro: v.msg || 'Informe o e-mail do responsável' };
  const r = await rpc('ra_admin_criar_familia', { p_nome: txt(fd, 'familia', 60), p_gestor_nome: txt(fd, 'nome', 60), p_gestor_email: v.email });
  if (r?.ok) redirect('/config/familias');
  return r;
}

export async function adminAtivarFamilia(fd) {
  const supabase = await supabaseServer();
  await supabase.rpc('ra_admin_ativar_familia', { p_id: uuid(fd.get('id')), p_ativa: fd.get('ativa') === '1' });
  revalidar();
}
