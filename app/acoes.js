'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { parseMin, hojeISO, addDias, agoraHHMM, CORES_CAT } from '@/lib/util';
import { validarEmail } from '@/lib/email';
import { funcaoDe, nomeFuncao, temModoCrianca } from '@/lib/papeis';
import { emailConfigurado, enviarEmailConvite } from '@/lib/convite';
import { esquecerSessoes } from '@/lib/sessao';
import { traduzirErro } from '@/lib/rede';

// Depois de qualquer alteração: limpa o que estava guardado e manda as telas buscarem de novo.
function revalidar() { esquecerSessoes(); revalidatePath('/', 'layout'); }

const txt = (fd, k, max = 500) => { const v = fd.get(k); return v == null ? null : String(v).trim().slice(0, max) || null; };
// Compara nomes sem diferença de maiúsculas, acentos e espaços (para avisar de nome repetido).
const mesmoNome = (a, b) => { const n = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); return n(a) === n(b); };
async function nomeRepetido(supabase, tabela, familia, nome, exceto) {
  const { data } = await supabase.from(tabela).select('id, nome').eq('familia_id', familia);
  return (data || []).some((x) => x.id !== exceto && mesmoNome(x.nome, nome));
}
const uuid = (v) => (/^[0-9a-f-]{36}$/i.test(String(v || '')) ? String(v) : null);
const data = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null);
const hora = (v) => (/^\d{2}:\d{2}$/.test(String(v || '')) ? String(v) : null);
const caminhoFoto = (v) => (/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-zA-Z_.-]{1,80}$/.test(String(v || '')) ? String(v) : null);

async function rpc(nome, args) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc(nome, args);
  if (error) return traduzirErro(error);
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

// Enquanto o banco ainda não recebeu a 0009 (prioritária e modo criança), salva sem esses campos em vez de dar erro.
const NOVAS = ['prioritaria', 'lembrete_min', 'modo_crianca'];
const semColuna = (e) => !!e && NOVAS.some((c) => String(e.message || '').includes(c));
const semNovas = (reg) => Object.fromEntries(Object.entries(reg).filter(([k]) => !NOVAS.includes(k)));

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
    prioritaria: fd.get('prioritaria') === '1',
  };
  reg.lembrete_min = reg.prioritaria && reg.hora_inicio && [15, 30, 60].includes(Number(fd.get('lembrete_min'))) ? Number(fd.get('lembrete_min')) : null;
  if (eu.papel === 'gestor' && reg.responsavel_id === eu.id) { reg.permite_adiar = false; reg.exige_justificativa = false; }
  if (!reg.titulo) return { erro: 'Dê um nome para a tarefa' };
  if (!reg.responsavel_id) return { erro: 'Escolha para quem é a tarefa' };
  if (recorrencia === 'dias_semana' && dias.length === 0) return { erro: 'Escolha pelo menos um dia da semana' };
  if (reg.hora_inicio && reg.hora_fim && reg.hora_fim <= reg.hora_inicio) return { erro: 'O fim deve ser depois do início' };
  const id = uuid(fd.get('id'));
  // Tarefa nova que se repete, criada hoje depois do horário: começa amanhã, para não nascer atrasada
  // (sem alerta no Painel nem cobrança de justificativa por algo que nem existia na hora).
  const limite = reg.hora_fim || reg.hora_inicio;
  const comecaAmanha = !id && tipo === 'recorrente' && reg.data_inicio === hojeISO() && limite && limite < agoraHHMM();
  if (comecaAmanha) reg.data_inicio = addDias(hojeISO(), 1);
  let error;
  if (id) {
    ({ error } = await supabase.from('ra_tarefas').update(reg).eq('id', id));
    if (semColuna(error)) ({ error } = await supabase.from('ra_tarefas').update(semNovas(reg)).eq('id', id));
    if (!error) {
      // Atualiza ocorrências futuras ainda pendentes com o novo horário.
      await supabase.from('ra_ocorrencias').update({ hora_inicio: reg.hora_inicio, hora_fim: reg.hora_fim, membro_id: reg.responsavel_id })
        .eq('tarefa_id', id).eq('status', 'pendente').gte('data', hojeISO());
    }
  } else {
    ({ error } = await supabase.from('ra_tarefas').insert({ ...reg, familia_id: eu.familia_id, criada_por: eu.id }));
    if (semColuna(error)) ({ error } = await supabase.from('ra_tarefas').insert({ ...semNovas(reg), familia_id: eu.familia_id, criada_por: eu.id }));
  }
  if (error) return traduzirErro(error);
  // Gera já as ocorrências dos próximos dias, para a tarefa aparecer na hora na Agenda.
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: addDias(hojeISO(), -7), p_ate: addDias(hojeISO(), 54) });
  revalidar();
  redirect(comecaAmanha ? `/agenda?v=dia&d=${reg.data_inicio}&aviso=amanha` : voltarAgenda(fd));
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
  // "Adicionar pessoa" com o e-mail de alguém que já está neste grupo: não cria outra pessoa,
  // só manda o convite (ou o e-mail de acesso) para quem já está cadastrado.
  if (!fd.get('id') && v.email) {
    const ja = await pessoaDoGrupo(supabase, eu.familia_id, v.email);
    if (ja) return convidarExistente(supabase, eu, ja);
  }
  const f = funcaoDe(fd.get('funcao'));
  if (!f) return { erro: 'Escolha o papel da pessoa' };
  const permissoes = {};
  f.chaves.forEach(([k]) => { permissoes[k] = fd.get(`perm_${k}`) === '1'; });
  const reg = {
    nome: txt(fd, 'nome', 60), email: v.email || null, papel: f.papel, funcao: f.id, permissoes,
    ativo: fd.get('ativo') === '1', tela_ativo: fd.get('tela_ativo') === '1',
    modo_crianca: temModoCrianca(f.id) && fd.get('modo_crianca') === '1',
    cor: /^#[0-9a-f]{6}$/i.test(fd.get('cor') || '') ? fd.get('cor') : '#1a6fe0',
  };
  if (!reg.nome) return { erro: 'Informe o nome' };
  const id = uuid(fd.get('id'));
  if (await nomeRepetido(supabase, 'ra_membros', eu.familia_id, reg.nome, id)) return { erro: 'Já existe uma pessoa com esse nome neste grupo. Use outro nome, por exemplo com o sobrenome.' };
  if (id && fd.has('avatar')) {
    const a = String(fd.get('avatar') || '');
    if (a && !a.startsWith('preset:') && !a.startsWith(`${eu.familia_id}/${id}/avatar-`)) return { erro: 'Imagem inválida' };
    if (a && !caminhoAvatar(a)) return { erro: 'Imagem inválida' };
    // Modo criança desligado: avatar de criança não vale mais, então fica sem avatar (letra com a cor).
    reg.avatar = a.startsWith('preset:') && !reg.modo_crianca ? null : a || null;
  } else if (id && !reg.modo_crianca) {
    const { data: atual } = await supabase.from('ra_membros').select('avatar').eq('id', id).maybeSingle();
    if (atual?.avatar?.startsWith('preset:')) reg.avatar = null;
  }
  if (id === eu.id && (!reg.ativo || reg.papel !== 'gestor')) return { erro: 'Você não pode tirar o seu próprio acesso de pai/mãe' };
  const gravar = (r) => (id
    ? supabase.from('ra_membros').update(r).eq('id', id).select('id, nome, email, user_id, funcao, papel').maybeSingle()
    : supabase.from('ra_membros').insert({ ...r, familia_id: eu.familia_id }).select('id, nome, email, user_id, funcao, papel').maybeSingle());
  let { data: salvo, error } = await gravar(reg);
  if (semColuna(error)) ({ data: salvo, error } = await gravar(semNovas(reg)));
  if (error) {
    if (!error.message.includes('duplicate')) return traduzirErro(error);
    // O e-mail é de alguém deste grupo (ex.: cadastrado entre a abertura da tela e o toque no botão).
    const ja = !id && reg.email ? await pessoaDoGrupo(supabase, eu.familia_id, reg.email) : null;
    if (ja) return convidarExistente(supabase, eu, ja);
    return { erro: 'Este e-mail já está cadastrado em outro grupo' };
  }
  const erroTela = salvo ? await sincronizarTarefaTela(supabase, eu, salvo.id, reg.tela_ativo, fd) : '';
  revalidar();
  if (erroTela) return { erro: erroTela };
  let aviso = '';
  if (fd.get('enviar') === '1' && salvo) {
    const r = await mandarConvite(supabase, eu, salvo);
    aviso = r.ok ? 'convite' : 'semconvite:' + r.erro;
  }
  if (!id) redirect('/config/pessoas' + (aviso ? `?aviso=${encodeURIComponent(aviso)}` : ''));
  if (aviso.startsWith('semconvite:')) return { erro: 'Pessoa salva, mas ' + aviso.slice(11).replace(/^./, (c) => c.toLowerCase()) };
  return { ok: true, msg: aviso ? 'Salvo e convite enviado.' : undefined };
}

// Meu perfil: Pai ou Mãe liga ou desliga o tempo de tela para si.
export async function salvarMinhaTela(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const ligado = fd.get('tela_ativo') === '1';
  const { error } = await supabase.from('ra_membros').update({ tela_ativo: ligado }).eq('id', eu.id);
  if (error) return traduzirErro(error);
  const erroTela = await sincronizarTarefaTela(supabase, eu, eu.id, ligado, fd);
  revalidar();
  return erroTela ? { erro: erroTela } : { ok: true };
}

// Tarefa "Lançar tempo de tela" (seção 64): existe enquanto o tempo de tela da pessoa está ligado,
// com os dias e o horário escolhidos no cadastro. Desligando, para de ser gerada e o histórico fica.
async function sincronizarTarefaTela(supabase, eu, membroId, ligado, fd) {
  const { data: atual, error: e1 } = await supabase.from('ra_tarefas').select('id, hora_inicio').eq('responsavel_id', membroId).eq('especial', 'tela').eq('ativa', true).maybeSingle();
  if (e1) return String(e1.message || '').includes('especial') ? 'Pessoa salva. Para a tarefa “Lançar tempo de tela” aparecer, rode o SQL 0011 no Supabase.' : traduzirErro(e1).erro;
  const hoje = hojeISO();
  if (!ligado) {
    if (atual) {
      await supabase.from('ra_tarefas').update({ ativa: false }).eq('id', atual.id);
      await supabase.from('ra_ocorrencias').update({ status: 'cancelada' }).eq('tarefa_id', atual.id).eq('status', 'pendente').gte('data', hoje);
    }
    return '';
  }
  if (!fd.has('tela_opcao')) return '';
  const opcao = ['uma', 'diaria', 'semana', 'pers'].includes(fd.get('tela_opcao')) ? fd.get('tela_opcao') : 'diaria';
  const dias = fd.getAll('tela_dias').map(Number).filter((n) => n >= 0 && n <= 6);
  // O horário de lançar fica na aba Tela ("Lançar sempre às"); aqui mantém o que já tem (ou 08:00).
  const h = hora(fd.get('tela_hora')) || atual?.hora_inicio?.slice(0, 5) || '08:00';
  if (opcao === 'pers' && !dias.length) return 'Escolha pelo menos um dia para lançar o tempo de tela';
  const uma = opcao === 'uma';
  const reg = {
    titulo: 'Lançar tempo de tela', categoria_id: null, responsavel_id: membroId, especial: 'tela',
    tipo: uma ? 'pontual' : 'recorrente', recorrencia: uma ? null : opcao === 'diaria' ? 'diaria' : 'dias_semana',
    dias_semana: uma || opcao === 'diaria' ? [] : opcao === 'semana' ? [1, 2, 3, 4, 5] : dias,
    // Ligando agora: o primeiro lançamento é amanhã (hoje ainda não há "tempo de ontem" combinado para lançar).
    data_inicio: uma ? (data(fd.get('tela_data')) || hoje) : atual ? hoje : addDias(hoje, 1), data_fim: null,
    hora_inicio: h, hora_fim: null, exige_foto: false, permite_adiar: false, exige_justificativa: false,
  };
  let error;
  if (atual) {
    ({ error } = await supabase.from('ra_tarefas').update(reg).eq('id', atual.id));
    // Mudou dias ou horário: as próximas pendentes saem e voltam só nos dias escolhidos, com o novo horário.
    if (!error) await supabase.from('ra_ocorrencias').update({ status: 'cancelada' }).eq('tarefa_id', atual.id).eq('status', 'pendente').gte('data', hoje);
  } else {
    ({ error } = await supabase.from('ra_tarefas').insert({ ...reg, familia_id: eu.familia_id, criada_por: eu.id }));
  }
  if (error) return traduzirErro(error).erro;
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: hoje, p_ate: addDias(hoje, 54) });
  if (atual) {
    const datas = [];
    for (let i = 0; i <= 54; i++) {
      const d = addDias(hoje, i), dow = new Date(d + 'T12:00:00Z').getUTCDay();
      if (uma ? d === reg.data_inicio : reg.recorrencia === 'diaria' || reg.dias_semana.includes(dow)) datas.push(d);
    }
    if (datas.length) await supabase.from('ra_ocorrencias').update({ status: 'pendente', hora_inicio: h, hora_fim: null, horario_travado: membroId !== eu.id })
      .eq('tarefa_id', atual.id).eq('status', 'cancelada').in('data', datas);
  }
  return '';
}

// Pessoa deste grupo que já usa o e-mail informado.
async function pessoaDoGrupo(supabase, familia, email) {
  const { data } = await supabase.from('ra_membros').select('id, nome, email, user_id, funcao, papel').eq('familia_id', familia).eq('email', email).limit(1);
  return data?.[0] || null;
}

async function convidarExistente(supabase, eu, ja) {
  const r = await mandarConvite(supabase, eu, ja);
  if (!r.ok) return { erro: `${ja.nome} já está neste grupo, mas ` + r.erro.replace(/^./, (c) => c.toLowerCase()) };
  redirect('/config/pessoas?aviso=' + encodeURIComponent((ja.user_id ? 'acesso:' : 'reconvite:') + ja.nome));
}

// Manda (ou manda de novo) o e-mail do convite.
async function mandarConvite(supabase, eu, m) {
  if (!m.email) return { erro: 'Esta pessoa não tem e-mail.' };
  if (!emailConfigurado()) return { erro: 'O e-mail de envio ainda não foi configurado no servidor.' };
  const { data: fam } = await supabase.from('ra_familias').select('nome').eq('id', eu.familia_id).maybeSingle();
  try {
    await enviarEmailConvite({ para: m.email, nomePessoa: m.nome, nomeFamilia: fam?.nome || 'do grupo', quemConvida: eu.nome, ja: !!m.user_id, papel: nomeFuncao(m) });
  } catch (e) {
    console.error('convite: falha ao enviar e-mail', e);
    const m = String(e?.message || e);
    if (/auth|login|credential|535|534/i.test(m)) return { erro: 'O servidor de e-mail recusou o envio (usuário ou senha do e-mail de envio). Confira a configuração do e-mail no servidor.' };
    if (/ECONN|ETIMEDOUT|ENOTFOUND|timeout|socket/i.test(m)) return { erro: 'O servidor de e-mail não respondeu. Tente de novo em alguns minutos.' };
    if (/recipient|address|550|553/i.test(m)) return { erro: 'O e-mail desta pessoa foi recusado. Confira se ele está escrito certo.' };
    return { erro: 'Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos.' };
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
  const r = await rpc('ra_editar_familia', { p_id: id, p_nome: nome, p_avatar: a || null, p_mudar_avatar: mudar });
  if (r.erro || !fd.has('cor')) return r;
  // Cor do grupo (SQL 0014).
  const cor = String(fd.get('cor') || '');
  if (!/^#[0-9a-f]{6}$/i.test(cor)) return { erro: 'Cor inválida' };
  return rpc('ra_cor_familia', { p_id: id, p_cor: cor });
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
  if (await nomeRepetido(supabase, 'ra_categorias', eu.familia_id, nome)) return { erro: 'Já existe uma categoria com esse nome.' };
  const cor = CORES_CAT[fd.get('cor')] ? fd.get('cor') : 'azul';
  const { error } = await supabase.from('ra_categorias').insert({ familia_id: eu.familia_id, nome, cor, ordem: 50 });
  if (error) return traduzirErro(error);
  revalidar();
  redirect('/config/categorias?aviso=criada');
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
  // Celular e Computador: o total é a soma; o aparelho em 0h00 não conta (fica vazio no previsto).
  const formato = 'aparelho';
  const m = lerMinutos(fd, formato); if (m.erro) return m;
  if (!m.min_celular) m.min_celular = null;
  if (!m.min_computador) m.min_computador = null;
  if (m.min_celular == null && m.min_computador == null) return { erro: 'Coloque o tempo do celular ou do computador.' };
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
  if (error) return traduzirErro(error);
  const h = hora(fd.get('tela_hora'));
  if (h) {
    const erroHora = await mudarHoraTela(supabase, uuid(fd.get('membro')), h);
    if (erroHora) return { erro: erroHora };
  }
  revalidar();
  return { ok: true };
}

// "Lançar sempre às" (aba Tela): muda o horário da tarefa "Lançar tempo de tela" e das próximas pendentes.
async function mudarHoraTela(supabase, membroId, h) {
  const { data: t, error } = await supabase.from('ra_tarefas').select('id, hora_inicio').eq('responsavel_id', membroId).eq('especial', 'tela').eq('ativa', true).maybeSingle();
  if (error) return traduzirErro(error).erro;
  if (!t || t.hora_inicio?.slice(0, 5) === h) return '';
  const { error: e2 } = await supabase.from('ra_tarefas').update({ hora_inicio: h }).eq('id', t.id);
  if (e2) return traduzirErro(e2).erro;
  await supabase.from('ra_ocorrencias').update({ hora_inicio: h }).eq('tarefa_id', t.id).eq('status', 'pendente').gte('data', hojeISO());
  return '';
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
  if (error) return traduzirErro(error);
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
const caminhoAvatar = (v) => (/^([0-9a-f-]{36}\/[0-9a-z-]{6,36}\/avatar-\d+\.jpg|preset:k\d{2})$/.test(String(v || '')) ? String(v) : null);

export async function editarCategoria(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  const nome = txt(fd, 'nome', 30);
  if (!nome) return { erro: 'Informe o nome' };
  if (eu && await nomeRepetido(supabase, 'ra_categorias', eu.familia_id, nome, uuid(fd.get('id')))) return { erro: 'Já existe uma categoria com esse nome.' };
  const cor = CORES_CAT[fd.get('cor')] ? fd.get('cor') : 'azul';
  const { error } = await supabase.from('ra_categorias').update({ nome, cor }).eq('id', uuid(fd.get('id')));
  if (error) return traduzirErro(error);
  revalidar();
  redirect('/config/categorias?aviso=salva');
}

export async function excluirCategoria(fd) {
  const supabase = await supabaseServer();
  await supabase.from('ra_categorias').delete().eq('id', uuid(fd.get('id')));
  revalidar();
  redirect('/config/categorias?aviso=excluida');
}

// ===== Perfil =====
export async function salvarPerfil(_, fd) {
  // Quem é acompanhado escolhe a própria cor em Meu perfil (SQL 0014).
  if (fd.has('cor')) {
    const cor = String(fd.get('cor') || '');
    if (!/^#[0-9a-f]{6}$/i.test(cor)) return { erro: 'Cor inválida' };
    const r = await rpc('ra_minha_cor', { p_cor: cor });
    if (r.erro) return r;
  }
  if (!fd.has('avatar')) return { ok: true };
  const a = String(fd.get('avatar') || '');
  if (a && !caminhoAvatar(a)) return { erro: 'Imagem inválida' };
  const r = await rpc('ra_meu_avatar', { p_caminho: a || null });
  // Avatar de criança: "Avatar salvo."; foto ou imagem: "Foto salva." (texto padrão do formulário).
  return r?.ok && a.startsWith('preset:') ? { ok: true, msg: 'Avatar salvo.' } : r;
}

export async function salvarAvisos(_, fd) {
  const concluir = fd.get('concluir') === '1';
  return rpc('ra_minhas_notif', { p_prefs: {
    concluida: !concluir ? 'nenhuma' : fd.get('sem_foto') === '1' ? 'todas' : 'com_foto',
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
  // Versão beta: grupos novos só pelo administrador (Cadastros > Famílias e grupos), salvo se CADASTRO_ABERTO=1.
  if (process.env.CADASTRO_ABERTO !== '1') return { erro: 'Na versão beta, os grupos novos são criados pela equipe do beelo. Fale com a gente para participar.' };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('ra_criar_familia', { p_nome: txt(fd, 'familia', 60), p_meu_nome: txt(fd, 'nome', 60) });
  if (error) return traduzirErro(error);
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
