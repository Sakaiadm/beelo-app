'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { parseMin, hojeISO, addDias, agoraHHMM, CORES_CAT } from '@/lib/util';
import { validarEmail } from '@/lib/email';
import { funcaoDe, nomeFuncao, temModoCrianca, parentescoValido } from '@/lib/papeis';
import { emailConfigurado, enviarEmailConvite } from '@/lib/convite';
import { esquecerSessoes } from '@/lib/sessao';
import { traduzirErro } from '@/lib/rede';
import { emailsDoGrupo } from '@/lib/membros';
import { VERSAO_TERMOS } from '@/lib/contato';
import { jeitoValido, jeitoPorIdade, anoAgora } from '@/lib/jeito';

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
// Trocar a foto de uma tarefa já concluída (migração 0029): a foto antiga é apagada do armazenamento.
export async function trocarFoto(_, fd) {
  const foto = caminhoFoto(fd.get('foto'));
  if (!foto) return { erro: 'Tire ou escolha a foto nova' };
  const em = !Number.isNaN(Date.parse(fd.get('foto_em'))) ? new Date(fd.get('foto_em')).toISOString() : null;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc('ra_trocar_foto', { p_oc: uuid(fd.get('oc')), p_foto: foto, p_foto_em: em });
  if (error) return traduzirErro(error);
  if (data) await supabase.storage.from('rotina-fotos').remove([data]); // se falhar, só sobra uma foto sem uso
  revalidar();
  return { ok: true };
}
// Aviso de chegada: um toque marca como feita, grava a hora e avisa os responsáveis (migração 0027). Sem localização.
export async function cheguei(_, fd) { return rpc('ra_cheguei', { p_oc: uuid(fd.get('oc')) }); }
export async function desfazer(_, fd) { return rpc('ra_desfazer', { p_oc: uuid(fd.get('oc')) }); }
export async function justificar(_, fd) { return rpc('ra_justificar', { p_oc: uuid(fd.get('oc')), p_texto: txt(fd, 'texto') }); }
export async function pedirAdiamento(_, fd) {
  const d = data(fd.get('data'));
  if (!d) return { erro: 'Escolha a nova data' };
  return rpc('ra_pedir_adiamento', { p_oc: uuid(fd.get('oc')), p_data: d, p_hora: hora(fd.get('hora')), p_motivo: txt(fd, 'motivo') });
}
// U54: adiar 1 dia sem pedir (uma vez por semana, nas tarefas em que os pais ativaram).
export async function adiarLivre(_, fd) { return rpc('ra_adiar_livre', { p_oc: uuid(fd.get('oc')) }); }
export async function definirHorario(_, fd) {
  return rpc('ra_definir_horario', { p_oc: uuid(fd.get('oc')), p_inicio: hora(fd.get('inicio')), p_fim: hora(fd.get('fim')) });
}

// ===== Pais =====
export async function responderAdiamento(_, fd) {
  return rpc('ra_responder_adiamento', { p_id: uuid(fd.get('id')), p_aprovar: fd.get('aprovar') === '1', p_resposta: txt(fd, 'resposta') });
}
// U35: lembrete no celular da pessoa, a partir de uma tarefa atrasada no Painel.
export async function lembrarTarefa(_, fd) {
  const r = await rpc('ra_lembrar_tarefa', { p_oc: uuid(fd.get('oc')) });
  return r?.ok ? { ok: true, msg: 'Lembrete enviado.' } : r;
}
// U52 e U53: resumo do dia (hora ou vazio) e conferir sozinho, em Meu perfil.
export async function salvarResumo(_, fd) { const h = String(fd.get('hora') || ''); return rpc('ra_meu_resumo', { p_hora: /^\d{2}:\d{2}$/.test(h) ? h : '' }); }
export async function salvarConferirAuto(_, fd) { return rpc('ra_conferir_auto', { p_ligar: fd.get('ligar') === '1' }); }
export async function avaliarJustificativa(_, fd) { return rpc('ra_avaliar_justificativa', { p_oc: uuid(fd.get('oc')), p_aceitar: fd.get('aceitar') === '1' }); }
export async function conferir(_, fd) {
  const v = fd.get('valor'); if (!['conferido', 'refazer'].includes(v)) return { erro: 'Valor inválido' };
  return rpc('ra_conferir', { p_oc: uuid(fd.get('oc')), p_valor: v });
}
// "Conferir todas" de uma pessoa pelo Painel (Raio-X U34): marca como conferidas, uma a uma.
export async function conferirTodas(_, fd) {
  const ocs = fd.getAll('oc').map(uuid).filter(Boolean).slice(0, 60);
  for (const oc of ocs) { const r = await rpc('ra_conferir', { p_oc: oc, p_valor: 'conferido' }); if (r?.erro) return r; }
  return { ok: true, msg: ocs.length === 1 ? 'Tarefa conferida.' : `${ocs.length} tarefas conferidas.` };
}

// Enquanto o banco ainda não recebeu a 0009 (prioritária e modo criança), salva sem esses campos em vez de dar erro.
const NOVAS = ['prioritaria', 'lembrete_min', 'modo_crianca', 'adiar_livre', 'jeito', 'jeito_livre'];
const semColuna = (e) => !!e && NOVAS.some((c) => String(e.message || '').includes(c));
const semNovas = (reg) => Object.fromEntries(Object.entries(reg).filter(([k]) => !NOVAS.includes(k)));

// Depois de salvar ou excluir, volta para o dia que estava aberto na Agenda.
// Depois de salvar, volta para onde a pessoa estava (Raio-X U22): Hoje, Painel ou Agenda. Só caminhos do próprio app.
const VOLTAS = /^\/(hoje|painel|agenda)(\?[\w=&%.-]*)?$/;
const voltarAgenda = (fd) => {
  const v = String(fd.get('voltar') || '');
  if (VOLTAS.test(v)) return v;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? `/agenda?d=${v}` : '/agenda';
};

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
  // @regra chegada: só Pai e Mãe criam. Lembrar a pessoa (padrão ligado) e avisar os pais (padrão desligado) são por tarefa.
  if (eu.papel === 'gestor' && fd.get('chegada') === '1') {
    reg.especial = 'chegada'; reg.chegada_lembrar = fd.get('chegada_lembrar') === '1'; reg.chegada_avisar_pais = fd.get('chegada_avisar_pais') === '1';
    reg.prioritaria = false; reg.exige_foto = false; reg.exige_justificativa = false; reg.permite_adiar = false;
  } else if (eu.papel === 'gestor' && fd.get('era_chegada') === '1') {
    reg.especial = null; reg.chegada_lembrar = true; reg.chegada_avisar_pais = false;
  }
  // U54: adiar 1 dia sem pedir, uma vez por semana (só com "Pode adiar" ligado).
  reg.adiar_livre = eu.papel === 'gestor' && reg.permite_adiar && fd.get('adiar_livre') === '1';
  reg.lembrete_min = reg.prioritaria && reg.hora_inicio && [15, 30, 60].includes(Number(fd.get('lembrete_min'))) ? Number(fd.get('lembrete_min')) : null;
  if (fd.get('id') && eu.papel === 'gestor' && reg.responsavel_id === eu.id) { reg.permite_adiar = false; reg.adiar_livre = false; reg.exige_justificativa = false; }
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
    // "Para quem" com várias pessoas (U21): uma tarefa igual para cada pessoa marcada.
    const quem = eu.papel === 'gestor' ? [...new Set(fd.getAll('responsavel').map(uuid).filter(Boolean))] : [eu.id];
    const regs = (quem.length ? quem : [reg.responsavel_id]).map((r) => ({ ...reg, responsavel_id: r, familia_id: eu.familia_id, criada_por: eu.id }));
    regs.forEach((r) => { if (eu.papel === 'gestor' && r.responsavel_id === eu.id) { r.permite_adiar = false; r.adiar_livre = false; r.exige_justificativa = false; } });
    ({ error } = await supabase.from('ra_tarefas').insert(regs));
    if (semColuna(error)) ({ error } = await supabase.from('ra_tarefas').insert(regs.map(semNovas)));
  }
  if (error) return traduzirErro(error);
  // Gera já as ocorrências dos próximos dias, para a tarefa aparecer na hora na Agenda.
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: addDias(hojeISO(), -7), p_ate: addDias(hojeISO(), 54) });
  revalidar();
  redirect(comecaAmanha ? `/agenda?d=${reg.data_inicio}&aviso=amanha` : voltarAgenda(fd));
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
    parentesco: parentescoValido(fd.get('parentesco')) ? fd.get('parentesco') : null,
    ativo: fd.get('ativo') === '1',
    modo_crianca: temModoCrianca(f.id) && fd.get('modo_crianca') === '1',
    cor: /^#[0-9a-f]{6}$/i.test(fd.get('cor') || '') ? fd.get('cor') : '#1a6fe0',
  };
  // Jeito de ver o beelo (SQL 0022): só no modo criança. O jeito vai só quando Pai ou Mãe mexeram na lista.
  if (reg.modo_crianca) {
    reg.jeito_livre = fd.get('jeito_livre') === '1';
    if (jeitoValido(fd.get('jeito'))) reg.jeito = fd.get('jeito');
  }
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
  // Criança ou adolescente: o responsável precisa autorizar o uso dos dados (LGPD art. 14, §1º).
  const menor = temModoCrianca(f.id);
  const { data: atualAut } = id ? await supabase.from('ra_membros').select('autorizado_em').eq('id', id).maybeSingle() : { data: null };
  const autorizar = menor && fd.get('autorizo') === '1';
  if (menor && !atualAut?.autorizado_em && !autorizar) return { erro: 'Marque a autorização do responsável para continuar.' };
  const gravar = (r) => (id
    ? supabase.from('ra_membros').update(r).eq('id', id).select('id, nome, user_id, funcao, papel').maybeSingle()
    : supabase.from('ra_membros').insert({ ...r, familia_id: eu.familia_id }).select('id, nome, user_id, funcao, papel').maybeSingle());
  let { data: salvo, error } = await gravar(reg);
  if (salvo) salvo = { ...salvo, email: reg.email };
  if (salvo && autorizar && !atualAut?.autorizado_em) {
    const { error: eAut } = await supabase.rpc('ra_autorizar', { p_membro: salvo.id, p_versao: VERSAO_TERMOS });
    if (eAut) return traduzirErro(eAut);
  }
  if (semColuna(error)) ({ data: salvo, error } = await gravar(semNovas(reg)));
  if (error) {
    if (!error.message.includes('duplicate')) return traduzirErro(error);
    // O e-mail é de alguém deste grupo (ex.: cadastrado entre a abertura da tela e o toque no botão).
    const ja = !id && reg.email ? await pessoaDoGrupo(supabase, eu.familia_id, reg.email) : null;
    if (ja) return convidarExistente(supabase, eu, ja);
    return { erro: 'Este e-mail já está cadastrado em outro grupo' };
  }
  revalidar();
  let aviso = '';
  if (fd.get('enviar') === '1' && salvo) {
    const r = await mandarConvite(supabase, eu, salvo);
    aviso = r.ok ? 'convite:' + salvo.id : 'semconvite:' + r.erro; // U61: a lista mostra "Avisar pelo WhatsApp" para essa pessoa
  }
  if (!id) redirect('/config/pessoas' + (aviso ? `?aviso=${encodeURIComponent(aviso)}` : ''));
  if (aviso.startsWith('semconvite:')) return { erro: 'Pessoa salva, mas ' + aviso.slice(11).replace(/^./, (c) => c.toLowerCase()) };
  return { ok: true, msg: aviso ? 'Salvo e convite enviado.' : undefined };
}

// Aba Tela › "Quem lança tempo de tela": Pai ou Mãe liga ou desliga para cada pessoa e para si (Raio-X S3, S5).
// Ligando, abre a aba dessa pessoa com o previsto sugerido para conferir e salvar (S1, S30).
export async function ligarTela(fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const membro = uuid(fd.get('membro'));
  const ligado = fd.get('ligar') === '1';
  const { error } = await supabase.from('ra_membros').update({ tela_ativo: ligado }).eq('id', membro).eq('familia_id', eu.familia_id);
  if (error) return traduzirErro(error);
  const erroTela = await sincronizarTarefaTela(supabase, eu, membro, ligado);
  revalidar();
  if (erroTela) return { erro: erroTela };
  if (ligado) redirect(`/tela?m=${membro}`);
  return { ok: true };
}

// Tarefa "Lançar tempo de tela": existe enquanto o tempo de tela da pessoa está ligado.
// Os dias seguem o previsto (lança no dia seguinte a cada dia com previsto, SQL 0016); o horário e
// "Pode adiar" ficam no cartão "Lançamento" da aba Tela. Desligando, para de ser gerada e o histórico fica.
async function sincronizarTarefaTela(supabase, eu, membroId, ligado) {
  const { data: atual, error: e1 } = await supabase.from('ra_tarefas').select('id').eq('responsavel_id', membroId).eq('especial', 'tela').eq('ativa', true).maybeSingle();
  if (e1) return traduzirErro(e1).erro;
  const hoje = hojeISO();
  if (!ligado) {
    if (atual) {
      await supabase.from('ra_tarefas').update({ ativa: false }).eq('id', atual.id);
      await supabase.from('ra_ocorrencias').update({ status: 'cancelada' }).eq('tarefa_id', atual.id).eq('status', 'pendente').gte('data', hoje);
    }
    return '';
  }
  if (!atual) {
    const { data: velha } = await supabase.from('ra_tarefas').select('hora_inicio').eq('responsavel_id', membroId).eq('especial', 'tela').order('criado_em', { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from('ra_tarefas').insert({
      familia_id: eu.familia_id, criada_por: eu.id, titulo: 'Lançar tempo de tela', categoria_id: null, responsavel_id: membroId, especial: 'tela',
      tipo: 'recorrente', recorrencia: 'diaria', dias_semana: [],
      // Ligando agora: o primeiro lançamento é amanhã (hoje ainda não há "tempo de ontem" combinado para lançar).
      data_inicio: addDias(hoje, 1), data_fim: null, hora_inicio: velha?.hora_inicio?.slice(0, 5) || '08:00', hora_fim: null,
      exige_foto: false, permite_adiar: false, exige_justificativa: false,
    });
    if (error) return traduzirErro(error).erro;
  }
  await ajustarDiasTela(supabase, membroId);
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: hoje, p_ate: addDias(hoje, 54) });
  return '';
}

// Dias de lançar = dia seguinte aos dias do previsto (função do SQL 0016; sem ela, fica todo dia).
async function ajustarDiasTela(supabase, membroId) {
  try { await supabase.rpc('ra_tela_ajustar_tarefa', { p_membro: membroId }); } catch { /* SQL 0018 ainda não rodou */ }
}

// Painel › "Lembrar": aviso no celular da pessoa para lançar o tempo de ontem (Raio-X S17, SQL 0016).
export async function lembrarTela(_, fd) {
  const r = await rpc('ra_lembrar_tela', { p_membro: uuid(fd.get('membro')) });
  return r?.erro ? r : { ok: true, msg: 'Lembrete enviado.' };
}

// Pessoa deste grupo que já usa o e-mail informado.
async function pessoaDoGrupo(supabase, familia, email) {
  const achado = (await emailsDoGrupo(supabase)).find((x) => (x.email || '').toLowerCase() === String(email).toLowerCase());
  if (!achado) return null;
  const { data } = await supabase.from('ra_membros').select('id, nome, user_id, funcao, papel').eq('familia_id', familia).eq('id', achado.id).maybeSingle();
  return data ? { ...data, email: achado.email } : null;
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
  const { data: p } = await supabase.from('ra_membros').select('id, nome, user_id, funcao, papel').eq('id', uuid(fd.get('id'))).eq('familia_id', eu.familia_id).maybeSingle();
  if (!p) return { erro: 'Pessoa não encontrada' };
  const m = { ...p, email: (await emailsDoGrupo(supabase)).find((x) => x.id === p.id)?.email || null };
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

// Apaga todos os arquivos (fotos e avatares) de uma pasta do grupo, inclusive subpastas.
async function apagarPasta(supabase, prefixo, nivel = 0) {
  for (const bucket of ['rotina-fotos', 'rotina-avatares']) {
    for (let volta = 0; volta < 50; volta++) {
      const { data, error } = await supabase.storage.from(bucket).list(prefixo, { limit: 1000 });
      if (error || !data?.length) break;
      const arquivos = data.filter((x) => x.id).map((x) => `${prefixo}/${x.name}`);
      const pastas = data.filter((x) => !x.id).map((x) => `${prefixo}/${x.name}`);
      if (nivel < 2) for (const p of pastas) await apagarPasta(supabase, p, nivel + 1);
      if (!arquivos.length) break;
      const { error: e2 } = await supabase.storage.from(bucket).remove(arquivos);
      if (e2) { console.error('apagar arquivos', e2.message); break; }
      if (data.length < 1000) break;
    }
  }
}

export async function excluirPessoa(fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  const id = uuid(fd.get('id'));
  const { error } = await supabase.rpc('ra_excluir_membro', { p_id: id });
  // A pessoa saiu: as fotos e o avatar dela saem também (varredura, item M3).
  if (!error && eu?.familia_id && id) await apagarPasta(supabase, `${eu.familia_id}/${id}`);
  revalidar();
  redirect('/config/pessoas');
}

// Aceite dos Termos de uso e da Privacidade (e, para Pai e Mãe, a autorização das crianças do grupo).
export async function aceitarTermos(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (!eu?.id) return { erro: 'Entre de novo para continuar.' };
  const crianca = eu.papel !== 'gestor' && temModoCrianca(eu.funcao);
  const docs = crianca ? ['aviso_crianca'] : ['termos', 'privacidade'];
  if (eu.termos_versao !== VERSAO_TERMOS) {
    if (docs.some((d) => fd.get(d) !== '1')) return { erro: crianca ? 'Marque a caixa para continuar.' : 'Marque as duas caixas para continuar.' };
    const { error } = await supabase.rpc('ra_aceitar', { p_versao: VERSAO_TERMOS, p_docs: docs });
    if (error) return traduzirErro(error);
  }
  if (eu.papel === 'gestor') {
    const ids = fd.getAll('menor').map(uuid).filter(Boolean);
    for (const id of ids) {
      if (fd.get(`autorizo_${id}`) !== '1') return { erro: 'Marque a autorização de cada criança ou adolescente para continuar.' };
      const { error } = await supabase.rpc('ra_autorizar', { p_membro: id, p_versao: VERSAO_TERMOS });
      if (error) return traduzirErro(error);
    }
  }
  revalidar();
  redirect('/');
}

// Apagar o grupo inteiro (Pai ou Mãe). Primeiro as fotos e avatares, depois os dados.
export async function apagarGrupo(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Só Pai ou Mãe pode apagar o grupo.' };
  const { data: fam } = await supabase.from('ra_familias').select('nome').eq('id', eu.familia_id).maybeSingle();
  const confirmar = txt(fd, 'confirmar', 80);
  if (!fam || (confirmar || '').toLowerCase() !== fam.nome.trim().toLowerCase()) return { erro: 'Digite o nome do grupo exatamente como aparece.' };
  await apagarPasta(supabase, eu.familia_id);
  const { error } = await supabase.rpc('ra_apagar_familia', { p_confirmar: confirmar });
  if (error) return traduzirErro(error);
  esquecerSessoes();
  await supabase.auth.signOut();
  redirect('/login?apagado=1');
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
  const membro = uuid(fd.get('membro'));
  // Pai e Mãe definem para todos; o adulto acompanhado ("Outro usuário") define o próprio (Raio-X S27).
  if (eu?.papel !== 'gestor' && !(eu?.funcao === 'outro' && membro === eu?.id)) return { erro: 'Só os responsáveis podem fazer isso' };
  // Celular e Computador: o total é a soma; o aparelho em 0h00 não conta (fica vazio no previsto).
  const formato = 'aparelho';
  const m = lerMinutos(fd, formato); if (m.erro) return m;
  if (!m.min_celular) m.min_celular = null;
  if (!m.min_computador) m.min_computador = null;
  if (m.min_celular == null && m.min_computador == null) return { erro: 'Coloque o tempo do celular ou do computador.' };
  const umDia = fd.get('modo') === 'dia';
  const hoje = hojeISO();
  const inicio = data(fd.get('inicio')) || hoje;
  if (inicio < hoje) return { erro: 'Escolha hoje ou um dia depois' };
  let dias, fim = null;
  if (umDia) {
    dias = [new Date(inicio + 'T12:00:00Z').getUTCDay()]; fim = inicio;
  } else {
    dias = [...new Set(fd.getAll('dias').map(Number).filter((n) => n >= 0 && n <= 6))];
    if (!dias.length) return { erro: 'Escolha os dias da semana' };
    fim = data(fd.get('fim'));
    if (fim && fim < inicio) return { erro: 'O fim deve ser depois do início' };
  }
  const { error } = await supabase.from('ra_tela_previsto').insert({
    familia_id: eu.familia_id, membro_id: membro, formato, dias_semana: dias, vigencia_inicio: inicio, vigencia_fim: fim,
    fixado: !umDia && !fim, ...m, criado_por: eu.id,
  });
  if (error) return traduzirErro(error);
  await trocarPrevistosAntigos(supabase, eu, membro, { umDia, dias, inicio, substitui: uuid(fd.get('substitui')) });
  if (!umDia) await ajustarDiasTela(supabase, membro);
  revalidar();
  return { ok: true };
}

// O previsto novo substitui o antigo nos mesmos dias (Raio-X S14). O antigo para na véspera
// (ou some, se ainda nem tinha começado); os dias que sobram dele continuam valendo.
// Editando (substitui), o previsto editado sai inteiro. Os dias que já passaram ficam nos relatórios.
async function trocarPrevistosAntigos(supabase, eu, membro, { umDia, dias, inicio, substitui }) {
  const hoje = hojeISO();
  const { data: regras } = await supabase.from('ra_tela_previsto').select('*').eq('membro_id', membro)
    .or(`vigencia_fim.is.null,vigencia_fim.gte.${hoje}`).order('criado_em', { ascending: false });
  const [nova, ...antigas] = regras || [];
  if (!nova) return;
  const vespera = addDias(inicio, -1);
  for (const r of antigas) {
    const soUmDia = r.vigencia_fim != null && r.vigencia_fim === r.vigencia_inicio;
    const editada = r.id === substitui;
    if (umDia) {
      // "Só um dia" novo troca só o "só um dia" antigo da mesma data (ou o que está sendo editado).
      if (editada || (soUmDia && r.vigencia_inicio === inicio)) await supabase.from('ra_tela_previsto').delete().eq('id', r.id);
      continue;
    }
    if (soUmDia && !editada) continue;
    const comuns = r.dias_semana.filter((d) => dias.includes(d));
    if (!editada && !comuns.length) continue;
    if (r.vigencia_fim && r.vigencia_fim < inicio) continue;
    if (r.vigencia_inicio < inicio) await supabase.from('ra_tela_previsto').update({ vigencia_fim: vespera, fixado: false }).eq('id', r.id);
    else await supabase.from('ra_tela_previsto').delete().eq('id', r.id);
    const resto = editada ? [] : r.dias_semana.filter((d) => !dias.includes(d));
    if (resto.length) {
      await supabase.from('ra_tela_previsto').insert({
        familia_id: r.familia_id, membro_id: r.membro_id, formato: r.formato, dias_semana: resto,
        vigencia_inicio: r.vigencia_inicio > inicio ? r.vigencia_inicio : inicio, vigencia_fim: r.vigencia_fim, fixado: r.fixado,
        min_celular: r.min_celular, min_computador: r.min_computador, min_total: r.min_total, origem: r.origem, criado_por: eu.id,
      });
    }
  }
}

// Aba Tela › cartão "Lançamento": horário, "Pode adiar" e "Exige justificativa". Salva sozinho ao mudar (Raio-X S9).
// O horário novo vale também para as próximas pendentes.
export async function salvarLancamentoTela(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const membroId = uuid(fd.get('membro'));
  const h = hora(fd.get('tela_hora'));
  if (!h) return { erro: 'Escolha o horário de lançar o tempo de tela' };
  const { data: t, error } = await supabase.from('ra_tarefas').select('id, hora_inicio').eq('responsavel_id', membroId).eq('especial', 'tela').eq('ativa', true).maybeSingle();
  if (error) return traduzirErro(error);
  if (!t) return { erro: 'Ligue o tempo de tela desta pessoa primeiro.' };
  const outro = membroId !== eu.id;
  const { error: e2 } = await supabase.from('ra_tarefas').update({
    hora_inicio: h, permite_adiar: outro && fd.get('tela_adiar') === '1', exige_justificativa: outro && fd.get('tela_justificativa') === '1',
  }).eq('id', t.id);
  if (e2) return traduzirErro(e2);
  if (t.hora_inicio?.slice(0, 5) !== h) await supabase.from('ra_ocorrencias').update({ hora_inicio: h }).eq('tarefa_id', t.id).eq('status', 'pendente').gte('data', hojeISO());
  revalidar();
  return { ok: true };
}

export async function encerrarPrevisto(fd) {
  const supabase = await supabaseServer();
  const ontem = new Date(Date.now() - 86400000 - 3 * 3600000).toISOString().slice(0, 10);
  const { data: r } = await supabase.from('ra_tela_previsto').select('id, membro_id, vigencia_inicio').eq('id', uuid(fd.get('id'))).maybeSingle();
  if (!r) return;
  // Ainda nem começou: some de vez. Já valeu algum dia: para ontem (os relatórios continuam iguais).
  if (r.vigencia_inicio > ontem) await supabase.from('ra_tela_previsto').delete().eq('id', r.id);
  else await supabase.from('ra_tela_previsto').update({ vigencia_fim: ontem }).eq('id', r.id);
  await ajustarDiasTela(supabase, r.membro_id);
  revalidar();
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

// Meu perfil: a própria pessoa (no modo criança) escolhe o jeito de ver o beelo.
export async function salvarJeito(_, fd) {
  const j = String(fd.get('jeito') || '');
  if (!jeitoValido(j)) return { erro: 'Escolha um jeito' };
  return rpc('ra_meu_jeito', { p_jeito: j });
}

// Painel: Pai ou Mãe contam a idade (o app guarda só o ano aproximado). Sem jeito escolhido ainda,
// começa pelo da idade: até 9 anos Divertido, de 10 a 12 Calmo, 13 ou mais Como os adultos.
export async function salvarIdade(_, fd) {
  const supabase = await supabaseServer();
  const { data: eu } = await supabase.rpc('ra_eu');
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const id = uuid(fd.get('membro'));
  const idade = Number(fd.get('idade'));
  if (!id || !Number.isInteger(idade) || idade < 3 || idade > 17) return { erro: 'Escolha a idade' };
  const { data: m, error: e1 } = await supabase.from('ra_membros').select('id, jeito').eq('id', id).eq('familia_id', eu.familia_id).maybeSingle();
  if (e1) return traduzirErro(e1);
  if (!m) return { erro: 'Pessoa não encontrada' };
  const reg = { idade_ano: anoAgora() - idade, premios_ate8: idade <= 8 };
  if (!m.jeito) reg.jeito = jeitoPorIdade(idade);
  const { error } = await supabase.from('ra_membros').update(reg).eq('id', id).eq('familia_id', eu.familia_id);
  if (error) return traduzirErro(error);
  revalidar();
  return { ok: true, msg: 'Idade salva.' };
}

export async function salvarAvisos(_, fd) {
  const concluir = fd.get('concluir') === '1';
  return rpc('ra_minhas_notif', { p_prefs: {
    concluida: !concluir ? 'nenhuma' : fd.get('sem_foto') === '1' ? 'todas' : 'com_foto',
    justificativa: fd.get('justificativa') === '1', adiamento: fd.get('adiamento') === '1',
    tela: fd.get('tela') === '1', tarefa_filho: fd.get('tarefa_filho') === '1', chegada: fd.get('chegada') === '1',
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
