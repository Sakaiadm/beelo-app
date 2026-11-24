import AvisosConvite from '@/components/AvisosConvite';
import Link from 'next/link';
import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import { hojeISO, addDias, dataTitulo, statusExibido, diaSemana } from '@/lib/util';
import Tarefa from '@/components/Tarefa';
import Icone from '@/components/Icone';
import DicaFaixa from '@/components/DicaFaixa';
import { fatos, candidatosFilho } from '@/lib/dicas';
import { carregarDesafios, desafiosLigados, paraComemorar, vitrineDe } from '@/lib/desafiosDados';
import { perfil } from '@/lib/desafios';
import { DesafioCartao, Estrela, Hexagono } from '@/components/DesafioCartao';
import Comemorar from '@/components/Comemorar';

export const dynamic = 'force-dynamic';

export default async function Hoje({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia: fam } = await exigirMembro();
  const hoje = hojeISO();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || '') ? sp.d : hoje;
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  // Pai e Mãe abrem o dia de cada pessoa; a supervisora com o painel liberado também (começando pelo dela).
  const a = acesso(eu);
  const veTodos = gestor || a.painel;
  const alvo = veTodos ? (filhos.find((f) => f.id === sp.m) || (gestor ? filhos[0] : eu)) : eu;
  if (!alvo) return <main><div className="card">Cadastre as pessoas em Cadastros.</div></main>;

  // Semana de segunda a domingo (para a barra da semana). A busca já cobre os 7 dias antes, para as atrasadas.
  const seg = addDias(dia, -((diaSemana(dia) + 6) % 7)), dom = addDias(seg, 6);
  const lista = await ocorrencias(supabase, { de: addDias(dia, -7), ate: dom, membros: [alvo.id] });
  const comSt = lista.map((o) => ({ o, st: statusExibido(o, hoje) }));
  const daSemana = comSt.filter((x) => x.o.data >= seg && x.o.data <= dom && x.st !== 'adiada');
  const semFeitas = daSemana.filter((x) => x.st.startsWith('cumprida')).length;
  const prio = (a, b) => (b.o.tarefa?.prioritaria ? 1 : 0) - (a.o.tarefa?.prioritaria ? 1 : 0);
  const doDia = comSt.filter((x) => x.o.data === dia);
  const pendentesAntes = comSt.filter((x) => x.o.data < dia && (x.st === 'atrasada'));
  const fotos = await urlsFotos(supabase, lista.filter((o) => o.data <= dia).map((o) => o.foto_path));
  const feitas = doDia.filter((x) => x.st.startsWith('cumprida')).length;
  const total = doDia.filter((x) => x.st !== 'adiada').length;
  const semHora = doDia.filter((x) => !x.o.hora_inicio).sort(prio);
  const comHora = doDia.filter((x) => x.o.hora_inicio).sort(prio);
  const restantes = doDia.filter((x) => !x.st.startsWith('cumprida') && !['adiada', 'adiamento_pedido'].includes(x.st)).length;
  const estrelas = alvo.modo_crianca && total ? Math.round((feitas / total) * 5) : null;
  // Tarefa "Lançar tempo de tela" da própria pessoa: o lançamento abre ali mesmo, sem trocar de tela (Raio-X S19).
  const telaOcs = [...pendentesAntes, ...doDia].filter((x) => x.o.membro_id === eu.id && x.o.tarefa?.especial === 'tela' && !x.st.startsWith('cumprida') && x.o.data <= hoje);
  const telaDados = Object.fromEntries(await Promise.all(telaOcs.map(async (x) => {
    const d = addDias(x.o.data, -1);
    const [{ data: p }, { data: atual }] = await Promise.all([
      supabase.rpc('ra_tela_previsto_dia', { p_membro: eu.id, p_data: d }),
      supabase.from('ra_tela_real').select('*').eq('membro_id', eu.id).eq('data', d).maybeSingle(),
    ]);
    return [x.o.id, { data: d, previsto: p?.[0] || null, atual: atual || null, crianca: !gestor && !!eu.modo_crianca }];
  })));
  // Desafios (beta): o desafio da pessoa e o cofrinho logo abaixo do quadro azul, só no dia de hoje.
  const des = desafiosLigados(fam) && dia === hoje ? await carregarDesafios(supabase, { eu, membros }) : null;
  const desAlvo = des ? des.desafios.filter((d) => d.membro_id === alvo.id || !d.membro_id) : [];
  const pfAlvo = perfil(alvo);
  const cofre = des && pfAlvo !== 'j' && (desAlvo.some((d) => d.membro_id) || des.saldo[alvo.id]?.estrelas || des.saldo[alvo.id]?.semanas) ? vitrineDe(alvo, des.premios, des.saldo) : null;
  // Lista de desejos: o desejo aprovado que a pessoa está juntando aparece no cartão do desafio.
  const desejoMeta = cofre && !cofre.sugerida && cofre.meta?.membro_id === alvo.id ? cofre.meta : null;
  const desAprovado = des && alvo.id === eu.id ? des.desejos.find((x) => x.membro_id === eu.id && x.desejo === 'aprovado' && Date.now() - new Date(x.respondido_em).getTime() < 2 * 86400e3) : null;
  const props = (x) => ({ oc: x.o, st: x.st, dono: x.o.membro_id === eu.id, quemMarca: alvo.nome, gestor, confere: a.conferir, familia: eu.familia_id, fotoUrl: fotos[x.o.foto_path], hoje, ultima: dia === hoje && x.o.data === dia && restantes === 1, tela: telaDados[x.o.id] });

  return (
    <main className="estreito">
      {!gestor && dia === hoje && <DicaFaixa membro={eu.id} hoje={hoje} cands={candidatosFilho(fatos(comSt, eu.id, hoje), hoje)} />}
      <div className="cab">
        <div>
          <h1 className="titulo">{alvo.id !== eu.id ? `Dia de ${alvo.nome}` : `Olá, ${eu.nome}`}</h1>
          <p className="sub">{dataTitulo(dia)}</p>
        </div>
        <div className="acoes">
          <Link prefetch={false} className="btn sec peq" href={`/hoje?d=${addDias(dia, -1)}${veTodos ? `&m=${alvo.id}` : ''}`} aria-label="Dia anterior"><Icone nome="esq" tam={18} /></Link>
          {dia !== hoje && <Link prefetch={false} className="btn sec peq" href={`/hoje${veTodos ? `?m=${alvo.id}` : ''}`}>Hoje</Link>}
          <Link prefetch={false} className="btn sec peq" href={`/hoje?d=${addDias(dia, 1)}${veTodos ? `&m=${alvo.id}` : ''}`} aria-label="Próximo dia"><Icone nome="dir" tam={18} /></Link>
        </div>
      </div>

      <AvisosConvite chavePublica={process.env.VAPID_PUBLIC_KEY || ''} texto={gestor ? 'Saiba na hora quando alguém concluir uma tarefa, justificar ou pedir para adiar.' : 'Receba um aviso quando tiver novidade nas suas tarefas.'} />

      {veTodos && filhos.length > 1 && (
        <div className="abas" style={{ marginBottom: 14 }}>
          {filhos.map((f) => <Link prefetch={false} key={f.id} href={`/hoje?m=${f.id}&d=${dia}`} className={f.id === alvo.id ? 'ativo' : ''}>{f.nome}</Link>)}
        </div>
      )}

      <div className="kpi destaque" style={{ marginBottom: 14 }}>
        <small>{dia === hoje ? 'Seu dia' : 'Dia'}</small>
        <strong>{feitas} <span style={{ fontSize: 15, color: '#e6f0fe' }}>de {total} feitas</span></strong>
        <div className="barra" style={{ marginTop: 10, background: 'rgba(255,255,255,.25)' }}><div style={{ width: `${total ? (feitas / total) * 100 : 0}%`, background: '#fff' }} /></div>
        {estrelas != null && (
          <div className="estrelas" aria-label={`${estrelas} de 5 estrelas hoje`}>
            {[0, 1, 2, 3, 4].map((i) => <svg key={i} width="26" height="26" viewBox="0 0 24 24" className={i < estrelas ? 'on' : ''} aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>)}
            <span>{estrelas} de 5 estrelas hoje</span>
          </div>
        )}
        {daSemana.length > 0 && (
          <div className="semana-kpi">
            <div className="l"><span>Semana (seg. a dom.)</span><span><b>{semFeitas}</b> de {daSemana.length} feitas</span></div>
            <div className="barra"><div style={{ width: `${(semFeitas / daSemana.length) * 100}%` }} /></div>
          </div>
        )}
      </div>

      {des && alvo.id === eu.id && <Comemorar itens={paraComemorar(des.periodos, eu, des.desafios)} nome={eu.nome.split(' ')[0]} />}
      {desAprovado && <div className="aviso ok" role="status">Os pais aprovaram seu desejo: {desAprovado.nome}!</div>}
      {desAlvo.map((d) => (
        <DesafioCartao key={d.id} d={d} p={d.atual} href="/desafios">
          {desejoMeta && d.membro_id === alvo.id && ['estrelas', 'semanas'].includes(d.recompensa) && (
            <div className="frase">{desejoMeta.moeda === 'semanas' ? <Hexagono tam={18} /> : <Estrela tam={18} />}<span>Cumprindo este desafio: <b>{d.recompensa === 'semanas' ? '+1 semana' : `+${d.estrelas || 10}`} para {desejoMeta.nome}</b>.</span></div>
          )}
        </DesafioCartao>
      ))}
      {des && !gestor && alvo.id === eu.id && pfAlvo !== 'c' && !desAlvo.some((d) => d.membro_id) && <Link prefetch={false} className="btn sec bloco" style={{ borderStyle: 'dashed', marginBottom: 14 }} href="/desafios/novo"><Icone nome="mais" tam={18} />Escolher meu desafio da semana</Link>}
      {cofre && (
        <Link prefetch={false} href={alvo.id === eu.id ? '/desafios/cofrinho' : `/desafios/cofrinho?m=${alvo.id}`} className="card des-card">
          <div className="des-top"><span className="des-ic mel">{cofre.moeda === 'semanas' ? <Hexagono tam={24} /> : <Estrela tam={22} />}</span>
            <span><b>{cofre.moeda === 'semanas' ? 'Semanas conquistadas' : alvo.id === eu.id ? 'Meu cofrinho' : `Cofrinho de ${alvo.nome}`}</b><small>{cofre.tem} {cofre.moeda === 'semanas' ? (cofre.tem === 1 ? 'semana' : 'semanas') : 'estrelinhas guardadas'}</small></span>
            <span className="seta" style={{ color: 'var(--cinza)', fontSize: 20 }} aria-hidden="true">›</span></div>
          {cofre.meta && <div className="vit" style={{ borderTop: '1px solid var(--borda)', marginTop: 12, paddingBottom: 0 }}><span className="corpo"><b>{cofre.meta.nome}</b><small>{Math.min(cofre.tem, cofre.meta.custo)} de {cofre.meta.custo}{cofre.tem < cofre.meta.custo ? ` · faltam ${cofre.meta.custo - cofre.tem}` : ' · já dá para trocar!'}</small><div className="barra"><div style={{ width: `${Math.min(100, (cofre.tem / cofre.meta.custo) * 100)}%` }} /></div></span></div>}
        </Link>
      )}


      {pendentesAntes.length > 0 && <>
        <div className="grupo-titulo">Atrasadas de dias anteriores</div>
        {pendentesAntes.map((x) => <Tarefa key={x.o.id} {...props(x)} />)}
      </>}

      {semHora.length > 0 && <>
        <div className="grupo-titulo">Sem horário · qualquer hora do dia</div>
        {semHora.map((x) => <Tarefa key={x.o.id} {...props(x)} />)}
      </>}
      {comHora.length > 0 && <>
        <div className="grupo-titulo">Com horário</div>
        {comHora.map((x) => <Tarefa key={x.o.id} {...props(x)} />)}
      </>}
      {doDia.length === 0 && <div className="card vazio">Nenhuma tarefa neste dia.</div>}

      <Link prefetch={false} className="btn sec bloco" style={{ marginTop: 14, borderStyle: 'dashed' }} href="/tarefas/nova"><Icone nome="mais" tam={18} />{gestor ? 'Nova tarefa' : 'Adicionar minha tarefa'}</Link>
    </main>
  );
}
