'use server';
// @arquivo  acoes-desafios.js: ações de Desafios, prêmios, cofrinho e desejos (beta, migração 0016/0017).
// @tipo     acao
// @usa      banco ra_familias, banco ra_premios, banco ra_membros, banco ra_desafios, banco ra_categorias, banco ra_tarefas, banco ra_ocorrencias, rpc ra_eu, rpc ra_gerar_ocorrencias, rpc ra_desafios_atualizar, rpc ra_desafio_encerrar, rpc ra_desafio_renovar, rpc ra_premio_pedir, rpc ra_premio_entregar, rpc ra_cofrinho_meta, rpc ra_desafio_visto, lib/supabase/server, lib/sessao, lib/rede, lib/util, lib/membros, lib/desafios
// Ações dos Desafios e prêmios (versão beta, SQL 0016).
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { esquecerSessoes } from '@/lib/sessao';
import { traduzirErro } from '@/lib/rede';
import { hojeISO, addDias, agoraHHMM } from '@/lib/util';
import { COLS_MEMBRO } from '@/lib/membros';
import { desafioDe, perfil, recompensaDe, diasPorMeta, opcoesMeta, PREMIOS, PREMIOS_FAMILIA, MAX_POR_PESSOA, CICLOS } from '@/lib/desafios';

function revalidar() { esquecerSessoes(); revalidatePath('/', 'layout'); }
const uuid = (v) => (/^[0-9a-f-]{36}$/i.test(String(v || '')) ? String(v) : null);
const txt = (fd, k, max = 80) => { const v = fd.get(k); return v == null ? null : String(v).trim().slice(0, max) || null; };
const semAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
const faltaSql = (e) => /ra_desafio|ra_premio|ra_cofrinho|desafios_beta|mural_visivel|premios_ate8|cofrinho_meta/.test(String(e?.message || ''));
const faltaSqlDesejos = (e) => /ra_desejo|desejo|membro_id/.test(String(e?.message || '')) && /function|column|schema cache/.test(String(e?.message || ''));
const erroDe = (e) => (faltaSql(e) ? { erro: 'Para usar os desafios, rode antes o SQL 0016 no Supabase.' } : traduzirErro(e));

async function quemSou(supabase) {
  const { data: eu } = await supabase.rpc('ra_eu');
  return eu?.id ? eu : null;
}
async function rpc(nome, args) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc(nome, args);
  if (error) return erroDe(error);
  revalidar();
  return { ok: true };
}

// ===== Ligar / ajustes (Pai e Mãe) =====
export async function ligarDesafios(_, fd) {
  const supabase = await supabaseServer();
  const eu = await quemSou(supabase);
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  // @regra Thomas 25/11: ligar/desligar o beta é SÓ do administrador geral (a chave de "voltar o sistema inteiro").
  // O banco também recusa (SQL 0025, gatilho em ra_familias); aqui a recusa vem antes, com mensagem clara.
  const { data: ehSuper } = await supabase.rpc('ra_sou_super');
  if (ehSuper !== true) return { erro: 'Só o administrador geral pode ligar ou desligar os desafios' };
  const ligar = fd.get('ligar') === '1';
  const { error } = await supabase.from('ra_familias').update({ desafios_beta: ligar }).eq('id', eu.familia_id);
  if (error) return erroDe(error);
  if (ligar) {
    // Vitrine pronta: os prêmios padrão de cada faixa entram sozinhos (os pais trocam depois, se quiserem).
    const { count } = await supabase.from('ra_premios').select('id', { count: 'exact', head: true });
    if (!count) {
      const { error: e2 } = await supabase.from('ra_premios').insert(PREMIOS.filter((p) => p.padrao).map((p) => ({
        familia_id: eu.familia_id, catalogo: p.id, nome: p.nome, custo: p.custo, moeda: p.moeda, faixa: p.faixa,
      })));
      if (e2) return erroDe(e2);
    }
  }
  revalidar();
  if (!ligar) redirect('/desafios');
  return { ok: true, msg: 'Desafios ligados.' };
}

export async function salvarAjustesDesafios(_, fd) {
  const supabase = await supabaseServer();
  const eu = await quemSou(supabase);
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const { error } = await supabase.from('ra_familias').update({ mural_visivel: fd.get('mural') === 'pais' ? 'pais' : 'todos' }).eq('id', eu.familia_id);
  if (error) return erroDe(error);
  for (const id of fd.getAll('crianca').map(uuid).filter(Boolean)) {
    const { error: e } = await supabase.from('ra_membros').update({ premios_ate8: fd.get(`ate8_${id}`) === '1' }).eq('id', id).eq('familia_id', eu.familia_id);
    if (e) return erroDe(e);
  }
  revalidar();
  return { ok: true, msg: 'Ajustes salvos.' };
}

// ===== Criar desafio (1 ou várias pessoas, ou a família toda) =====
export async function criarDesafio(_, fd) {
  const supabase = await supabaseServer();
  const eu = await quemSou(supabase);
  if (!eu) return { erro: 'Sem acesso' };
  const c = desafioDe(fd.get('catalogo'));
  if (!c) return { erro: 'Escolha um desafio' };
  const gestor = eu.papel === 'gestor';
  const { data: membros } = await supabase.from('ra_membros').select(COLS_MEMBRO).eq('familia_id', eu.familia_id).eq('ativo', true);
  const familia = fd.get('quem') === 'familia' || c.para === 'f';
  let alvos = familia ? [null] : fd.getAll('quem').map(uuid).filter(Boolean).map((id) => (membros || []).find((m) => m.id === id)).filter(Boolean);
  if (!gestor) {
    // Quem não é Pai ou Mãe escolhe só o próprio desafio (adolescente e adultos; a criança escolhe junto com os pais).
    if (familia || perfil(eu) === 'c') return { erro: 'Os responsáveis criam este desafio' };
    alvos = [eu];
  }
  if (!alvos.length) return { erro: 'Escolha para quem é o desafio' };
  const metas = opcoesMeta(c).map(([v]) => v);
  const meta = metas.includes(Number(fd.get('meta'))) ? Number(fd.get('meta')) : c.meta;

  const { data: ativos, error: e0 } = await supabase.from('ra_desafios').select('*').eq('ativo', true);
  if (e0) return erroDe(e0);
  for (const m of alvos) {
    // @regra o desafio que descansa (ciclo terminado) não conta no limite.
    const n = (ativos || []).filter((x) => !x.descansando_em && (x.membro_id || null) === (m?.id || null)).length;
    if (n >= (m ? MAX_POR_PESSOA : 1)) return { erro: m ? `${m.nome} já tem ${MAX_POR_PESSOA} desafios. Menos é mais: termine ou troque um para começar outro.` : 'A família já tem um desafio. Termine ou troque o atual para começar outro.' };
    if (c.tela && !m?.tela_ativo) return { erro: `Ligue o tempo de tela${m ? ` de ${m.nome}` : ''} para usar este desafio.` };
  }

  const { data: cats } = await supabase.from('ra_categorias').select('id, nome').eq('familia_id', eu.familia_id);
  const catPorNome = (nome) => (cats || []).find((x) => semAcentos(x.nome) === semAcentos(nome)) || null;
  async function categoria(nome) {
    if (!nome) return null;
    const ja = catPorNome(nome);
    if (ja || !gestor) return ja?.id || null;
    const { data } = await supabase.from('ra_categorias').insert({ familia_id: eu.familia_id, nome, cor: 'azul', ordem: 50 }).select('id, nome').maybeSingle();
    if (data) (cats || []).push(data);
    return data?.id || null;
  }

  const grupo = crypto.randomUUID();
  const hoje = hojeISO();
  const premioFamilia = txt(fd, 'premio') || PREMIOS_FAMILIA[0];
  for (const m of alvos) {
    const pf = m ? perfil(m) : 'familia';
    const reg = {
      familia_id: eu.familia_id, membro_id: m?.id || null, grupo, catalogo: c.id, titulo: c.t, descricao: c.d, icone: c.icone,
      tipo: c.tipo, alvo: c.alvo === 'tela' ? 'tarefa' : c.alvo, criterio: c.criterio, dias_semana: c.dsem || null, meta,
      periodo: c.periodo, coringa: fd.get('coringa') !== '0', recompensa: recompensaDe(pf), estrelas: 10,
      premio: pf === 'familia' ? premioFamilia : null, criado_por: eu.id, categorias: [],
    };
    // Categorias que contam.
    if (c.pior) {
      const pior = await categoriaMaisFraca(supabase, m?.id, hoje);
      if (!pior) return { erro: 'Ainda não há tarefas com categoria suficientes nas últimas 4 semanas. Escolha outro desafio.' };
      reg.categorias = [pior.id]; reg.titulo = `Foco em ${pior.nome}`; reg.descricao = `A categoria com menos tarefas feitas nas últimas 4 semanas.`;
    } else if (c.cats?.length) {
      for (const n of c.cats) { const id = c.alvo === 'combo' ? catPorNome(n)?.id : await categoria(n); if (id) reg.categorias.push(id); }
      if (c.alvo === 'combo' && reg.categorias.length < c.cats.length) return { erro: `Para este desafio, a família precisa das categorias ${c.cats.join(' e ')}.` };
    }
    // Tarefa ligada ao desafio: a própria tarefa (alvo tarefa) ou uma de reserva, quando ainda não há tarefa na categoria.
    const responsavel = m?.id || eu.id;
    if (c.alvo === 'tela') {
      const { data: t } = await supabase.from('ra_tarefas').select('id').eq('responsavel_id', responsavel).eq('especial', 'tela').eq('ativa', true).maybeSingle();
      if (!t) return { erro: 'Ligue o tempo de tela para usar este desafio.' };
      reg.tarefa_id = t.id;
    } else if (c.tarefa) {
      let precisa = c.alvo === 'tarefa';
      if (c.alvo === 'categoria') {
        const { count } = reg.categorias.length
          ? await supabase.from('ra_tarefas').select('id', { count: 'exact', head: true }).eq('responsavel_id', responsavel).eq('ativa', true).in('categoria_id', reg.categorias)
          : { count: 0 };
        precisa = !count;
      }
      if (precisa) {
        const r = await criarTarefa(supabase, eu, responsavel, c.tarefa, meta, await categoria(c.tarefa.cat));
        if (r.erro) return r;
        reg.tarefa_id = r.id;
      }
    }
    if (c.tarefaExtra) {
      const { count } = await supabase.from('ra_tarefas').select('id', { count: 'exact', head: true }).eq('responsavel_id', responsavel).eq('ativa', true).eq('titulo', c.tarefaExtra.t);
      if (!count) { const r = await criarTarefa(supabase, eu, responsavel, c.tarefaExtra, 1, await categoria(c.tarefaExtra.cat)); if (r.erro) return r; }
    }
    const { error } = await supabase.from('ra_desafios').insert(reg);
    if (error) return erroDe(error);
  }
  await supabase.rpc('ra_gerar_ocorrencias', { p_de: addDias(hoje, -7), p_ate: addDias(hoje, 40) });
  await supabase.rpc('ra_desafios_atualizar');
  // @decisao 25/11 Thomas: vindo de uma sugestão da criança, fecha a sugestão como "criado".
  const sug = uuid(fd.get('sugestao'));
  if (sug && gestor) await supabase.rpc('ra_desafio_sugestao_fechar', { p_id: sug, p_status: 'criado' });
  revalidar();
  return { ok: true }; // a própria tela abre /desafios?aviso=criado (recarga completa: o redirect aqui às vezes não abria a tela nova)
}

// Cria a tarefa que acompanha o desafio, com os dias conforme a meta (ex.: 3 vezes = seg., qua. e sex.).
async function criarTarefa(supabase, eu, responsavel, t, meta, categoriaId) {
  const hoje = hojeISO();
  const dias = t.dias || (t.rec ? null : diasPorMeta(meta));
  const rec = t.rec === 'mensal' ? 'mensal' : dias ? 'dias_semana' : 'diaria';
  const inicio = t.h && t.h < agoraHHMM() ? addDias(hoje, 1) : hoje;
  const reg = {
    familia_id: eu.familia_id, titulo: t.t, categoria_id: categoriaId, responsavel_id: responsavel, tipo: 'recorrente', recorrencia: rec,
    dias_semana: rec === 'dias_semana' ? dias : [], data_inicio: inicio, data_fim: null, hora_inicio: t.h || null, hora_fim: null,
    exige_foto: false, permite_adiar: true, exige_justificativa: false, criada_por: eu.id,
  };
  const { data, error } = await supabase.from('ra_tarefas').insert(reg).select('id').maybeSingle();
  if (error) return traduzirErro(error);
  return { id: data?.id };
}

// k15: categoria com menos tarefas feitas (em %) nas últimas 4 semanas, para a pessoa (ou a família).
async function categoriaMaisFraca(supabase, membroId, hoje) {
  let q = supabase.from('ra_ocorrencias').select('status, tarefa:ra_tarefas(categoria:ra_categorias(id, nome))')
    .gte('data', addDias(hoje, -28)).lt('data', hoje).neq('status', 'cancelada').neq('status', 'adiada');
  if (membroId) q = q.eq('membro_id', membroId);
  const { data } = await q;
  const conta = {};
  (data || []).forEach((o) => { const c = o.tarefa?.categoria; if (!c) return; const x = (conta[c.id] ||= { ...c, n: 0, f: 0 }); x.n++; if (o.status === 'cumprida') x.f++; });
  const lista = Object.values(conta).filter((x) => x.n >= 4).sort((a, b) => a.f / a.n - b.f / b.n);
  return lista[0] || null;
}

export async function encerrarDesafio(fd) {
  const r = await rpc('ra_desafio_encerrar', { p_id: uuid(fd.get('id')) });
  if (r.erro) return r;
  redirect('/desafios?aviso=encerrado');
}

// ═══ SEÇÃO: Fim do ciclo (SQL 0031) ═══════════════════════════════════
// @rpc ra_desafio_renovar: começa um ciclo novo (mesma meta, ou uma meta um passo acima em "Subir um nível").
// @decisao 26/11 Thomas: no fim do ciclo o desafio descansa e NÃO renova sozinho; os pais escolhem Renovar, Subir um nível ou Trocar.
export async function renovarDesafio(_, fd) {
  const semanas = Number(fd.get('semanas'));
  const meta = fd.get('meta') ? Number(fd.get('meta')) : null;
  const r = await rpc('ra_desafio_renovar', { p_id: uuid(fd.get('id')), p_semanas: CICLOS.includes(semanas) ? semanas : null, p_meta: meta > 0 && meta <= 100 ? meta : null });
  if (r.erro) return r;
  const supabase = await supabaseServer();
  await supabase.rpc('ra_desafios_atualizar'); // começa a contar a semana atual já na renovação
  revalidar();
  return { ok: true, msg: meta ? 'Nível novo! O ciclo começa nesta semana.' : 'Ciclo novo! Começa nesta semana.' };
}
// Trocar: encerra este e já abre a escolha de outro desafio para a mesma pessoa.
export async function trocarDesafio(fd) {
  const r = await rpc('ra_desafio_encerrar', { p_id: uuid(fd.get('id')) });
  if (r.erro) return r;
  const m = uuid(fd.get('membro'));
  redirect(m ? `/desafios/novo?m=${m}` : '/desafios/novo');
}

// Próximo nível em 1 toque (depois de 3 semanas seguidas cumpridas).
export async function subirMeta(_, fd) {
  const supabase = await supabaseServer();
  const meta = Number(fd.get('meta'));
  if (!(meta > 0 && meta <= 100)) return { erro: 'Meta inválida' };
  const { error } = await supabase.from('ra_desafios').update({ meta }).eq('id', uuid(fd.get('id')));
  if (error) return erroDe(error);
  await supabase.rpc('ra_desafios_atualizar');
  revalidar();
  return { ok: true, msg: 'Meta nova a partir desta semana.' };
}

// ===== Cofrinho e prêmios =====
export async function pedirPremio(_, fd) {
  const r = await rpc('ra_premio_pedir', { p_premio: uuid(fd.get('premio')), p_membro: uuid(fd.get('membro')) });
  return r.ok ? { ok: true, msg: 'Pronto! Agora é só esperar a entrega.' } : r;
}
export async function entregarPremio(_, fd) {
  return rpc('ra_premio_entregar', { p_pedido: uuid(fd.get('id')), p_entregue: fd.get('entregue') !== '0' });
}
export async function metaCofrinho(_, fd) {
  return rpc('ra_cofrinho_meta', { p_premio: uuid(fd.get('premio')), p_membro: uuid(fd.get('membro')) });
}
export async function desafioVisto(id) {
  const supabase = await supabaseServer();
  await supabase.rpc('ra_desafio_visto', { p_periodo: uuid(id) });
  revalidatePath('/hoje');
}

// Vitrine: tirar/voltar um prêmio, acrescentar do banco ou um prêmio próprio.
export async function alternarPremio(fd) {
  const supabase = await supabaseServer();
  await supabase.from('ra_premios').update({ ativo: fd.get('ativo') === '1' }).eq('id', uuid(fd.get('id')));
  revalidatePath('/desafios/premios');
}
export async function adicionarPremio(_, fd) {
  const supabase = await supabaseServer();
  const eu = await quemSou(supabase);
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const cat = PREMIOS.find((p) => p.id === fd.get('catalogo'));
  let reg;
  if (cat) {
    reg = { familia_id: eu.familia_id, catalogo: cat.id, nome: cat.nome, custo: cat.custo, moeda: cat.moeda, faixa: cat.faixa, ativo: true };
  } else {
    const nome = txt(fd, 'nome');
    const custo = Number(fd.get('custo'));
    const faixa = ['ate8', 'mais8', 'todos', 'teen'].includes(fd.get('faixa')) ? fd.get('faixa') : 'todos';
    if (!nome) return { erro: 'Dê um nome para o prêmio' };
    if (!(custo >= 1 && custo <= 1000)) return { erro: faixa === 'teen' ? 'Quantas semanas? (de 1 a 1000)' : 'Quantas estrelinhas? (de 1 a 1000)' };
    reg = { familia_id: eu.familia_id, catalogo: null, nome, custo: Math.round(custo), moeda: faixa === 'teen' ? 'semanas' : 'estrelas', faixa, ativo: true };
  }
  const ja = cat ? (await supabase.from('ra_premios').select('id').eq('catalogo', cat.id).maybeSingle()).data : null;
  const { error } = ja
    ? await supabase.from('ra_premios').update({ ativo: true }).eq('id', ja.id)
    : await supabase.from('ra_premios').insert(reg);
  if (error) return erroDe(error);
  revalidar();
  return { ok: true, msg: 'Prêmio na vitrine.' };
}

// ===== Lista de desejos (SQL 0017) =====
async function rpcDesejo(nome, args) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc(nome, args);
  if (error) return faltaSqlDesejos(error) ? { erro: 'Para usar a lista de desejos, rode antes o SQL 0017 no Supabase.' } : erroDe(error);
  revalidar();
  return { ok: true };
}
export async function sugerirDesejo(_, fd) {
  const nome = txt(fd, 'nome');
  if (!nome) return { erro: 'Escreva o que você quer.' };
  const r = await rpcDesejo('ra_desejo_sugerir', { p_nome: nome, p_foto: txt(fd, 'foto', 300) });
  return r.ok ? { ok: true, msg: 'Enviado! Seus responsáveis vão responder.' } : r;
}
export async function responderDesejo(_, fd) {
  const aprovar = fd.get('aprovar') === '1';
  const custo = Number(fd.get('custo'));
  if (aprovar && !(custo >= 1 && custo <= 1000)) return { erro: 'Escolha quanto o desejo vale.' };
  if (aprovar && !txt(fd, 'nome')) return { erro: 'Dê um nome para o prêmio.' };
  const r = await rpcDesejo('ra_desejo_responder', {
    p_id: uuid(fd.get('id')), p_aprovar: aprovar, p_nome: txt(fd, 'nome'), p_custo: aprovar ? Math.round(custo) : null,
    p_regra: txt(fd, 'regra', 200), p_resposta: txt(fd, 'resposta', 200),
  });
  return r.ok ? { ok: true, msg: aprovar ? 'Desejo aprovado. Já virou a meta do cofrinho.' : 'Resposta enviada.' } : r;
}
// Vitrine: os pais ajustam o nome e o preço de um prêmio (também dos desejos aprovados).
export async function editarPremio(_, fd) {
  const supabase = await supabaseServer();
  const eu = await quemSou(supabase);
  if (eu?.papel !== 'gestor') return { erro: 'Só os responsáveis podem fazer isso' };
  const nome = txt(fd, 'nome');
  const custo = Number(fd.get('custo'));
  if (!nome) return { erro: 'Dê um nome para o prêmio' };
  if (!(custo >= 1 && custo <= 1000)) return { erro: 'O valor vai de 1 a 1000.' };
  const { error } = await supabase.from('ra_premios').update({ nome, custo: Math.round(custo) }).eq('id', uuid(fd.get('id')));
  if (error) return erroDe(error);
  revalidar();
  return { ok: true, msg: 'Prêmio atualizado.' };
}

// ═══ SEÇÃO: Criança sugere desafio (SQL 0028) ═══
// @rpc ra_desafio_sugerir, ra_desafio_sugestao_fechar
export async function sugerirDesafio(_, fd) {
  const supabase = await supabaseServer();
  const eu = await quemSou(supabase);
  if (!eu || perfil(eu) !== 'c') return { erro: 'Quem sugere é a criança.' };
  const c = desafioDe(fd.get('catalogo'));
  if (!c || !c.para.includes('c')) return { erro: 'Escolha um desafio da lista.' };
  const { error } = await supabase.rpc('ra_desafio_sugerir', { p_catalogo: c.id, p_titulo: c.t });
  if (error) return /ra_desafio_sugerir|ra_desafio_sugestoes/.test(String(error.message)) && /function|schema cache|relation/.test(String(error.message)) ? { erro: 'Para sugerir desafios, rode antes o SQL 0028 no Supabase.' } : erroDe(error);
  revalidar();
  return { ok: true, msg: 'Enviado! Seus responsáveis vão responder.' };
}
export async function fecharSugestaoDesafio(_, fd) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('ra_desafio_sugestao_fechar', { p_id: uuid(fd.get('id')), p_status: 'agora_nao' });
  if (error) return erroDe(error);
  revalidar();
  return { ok: true };
}

// ═══ SEÇÃO: X do cartão de sugestão no Painel (SQL 0030) ═══
// @rpc ra_desafio_sugestao_dispensar
// @decisao Fecha só a sugestão daquela pessoa; ela volta em 14 dias (o banco guarda a data).
export async function dispensarSugestaoDesafio(membroId) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc('ra_desafio_sugestao_dispensar', { p_membro: uuid(membroId) });
  if (error) return /ra_desafio_sugestao_dispensar|ra_desafio_dispensas/.test(String(error.message)) && /function|schema cache|relation/.test(String(error.message)) ? { erro: 'Para fechar a sugestão, rode antes o SQL 0030 no Supabase.' } : erroDe(error);
  revalidar();
  return { ok: true };
}
