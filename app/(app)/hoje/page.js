import AvisosConvite from '@/components/AvisosConvite';
import { visaoCrianca } from '@/lib/jeito';
import Link from 'next/link';
import { exigirMembro } from '@/lib/sessao';
import { acesso } from '@/lib/papeis';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import { hojeISO, addDias, dataTitulo, statusExibido, diaSemana } from '@/lib/util';
import Tarefa from '@/components/Tarefa';
import Icone from '@/components/Icone';
import LampadaFlutuante from '@/components/LampadaFlutuante';
import { fatos, candidatosFilho } from '@/lib/dicas';
import { carregarDesafios, desafiosLigados, paraComemorar, vitrineDe } from '@/lib/desafiosDados';
import { perfil } from '@/lib/desafios';
import { mensagem, Estrela, Hexagono } from '@/components/DesafioCartao';
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
  // Abas do dia: os filhos primeiro, depois você e os outros responsáveis (Raio-X E1).
  const pessoasDia = veTodos ? [...filhos, ...membros.filter((m) => m.ativo && m.papel !== 'filho')] : [];
  const alvo = veTodos ? (pessoasDia.find((f) => f.id === sp.m) || (gestor ? filhos[0] || eu : eu)) : eu;
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
  const estrelas = visaoCrianca(alvo) && total ? Math.round((feitas / total) * 5) : null;
  // Para a comemoração do fim do dia: dias seguidos com tudo feito (contando hoje) e os dias completos da semana.
  const diaOk = (d) => { const l = comSt.filter((x) => x.o.data === d && x.st !== 'adiada'); return l.length > 0 && l.every((x) => x.st.startsWith('cumprida')); };
  let seqAntes = 0; while (seqAntes < 7 && diaOk(addDias(hoje, -(seqAntes + 1)))) seqAntes++;
  const festaDia = { seq: seqAntes + 1, hj: (diaSemana(hoje) + 6) % 7, semana: [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = addDias(seg, i); return d < hoje && diaOk(d); }) };
  // Tarefa "Lançar tempo de tela" da própria pessoa: o lançamento abre ali mesmo, sem trocar de tela (Raio-X S19).
  const telaOcs = [...pendentesAntes, ...doDia].filter((x) => x.o.membro_id === eu.id && x.o.tarefa?.especial === 'tela' && !x.st.startsWith('cumprida') && x.o.data <= hoje);
  const telaDados = Object.fromEntries(await Promise.all(telaOcs.map(async (x) => {
    const d = addDias(x.o.data, -1);
    const [{ data: p }, { data: atual }] = await Promise.all([
      supabase.rpc('ra_tela_previsto_dia', { p_membro: eu.id, p_data: d }),
      supabase.from('ra_tela_real').select('*').eq('membro_id', eu.id).eq('data', d).maybeSingle(),
    ]);
    return [x.o.id, { data: d, previsto: p?.[0] || null, atual: atual || null, crianca: !gestor && visaoCrianca(eu) }];
  })));
  // Desafios (beta): o desafio da pessoa e o cofrinho logo abaixo do quadro azul, só no dia de hoje.
  const des = desafiosLigados(fam) && dia === hoje ? await carregarDesafios(supabase, { eu, membros }) : null;
  const desAlvo = des ? des.desafios.filter((d) => d.membro_id === alvo.id || !d.membro_id) : [];
  const pfAlvo = perfil(alvo);
  const cofre = des && pfAlvo !== 'j' && (desAlvo.some((d) => d.membro_id) || des.saldo[alvo.id]?.estrelas || des.saldo[alvo.id]?.semanas) ? vitrineDe(alvo, des.premios, des.saldo) : null;
  // Lista de desejos: o desejo aprovado que a pessoa está juntando aparece no cartão do desafio.
  const desejoMeta = cofre && !cofre.sugerida && cofre.meta?.membro_id === alvo.id ? cofre.meta : null;
  const desAprovado = des && alvo.id === eu.id ? des.desejos.find((x) => x.membro_id === eu.id && x.desejo === 'aprovado' && Date.now() - new Date(x.respondido_em).getTime() < 2 * 86400e3) : null;
  // Lista de criança (Raio-X U7): uma lista só, círculo grande e sem Adiar/Horário.
  const crianca = !gestor && alvo.id === eu.id && visaoCrianca(eu);
  // Editar direto no Hoje (U11): os pais editam tudo; cada pessoa edita a tarefa que ela mesma criou para si.
  const editar = (o) => o.tarefa?.especial === 'tela' ? (gestor ? `/tela?m=${o.membro_id}` : null) : gestor || (o.tarefa?.criada_por === eu.id && o.membro_id === eu.id) ? `/tarefas/${o.tarefa_id}/editar?${new URLSearchParams({ d: o.data, volta: `/hoje${veTodos ? `?m=${alvo.id}` : ''}` })}` : null;
  const props = (x) => ({ oc: x.o, st: x.st, dono: x.o.membro_id === eu.id, quemMarca: alvo.nome, gestor, confere: a.conferir, familia: eu.familia_id, fotoUrl: fotos[x.o.foto_path], hoje, ultima: dia === hoje && x.o.data === dia && restantes === 1, dia: festaDia, tela: telaDados[x.o.id], crianca, editarHref: editar(x.o) });
  const novaHref = `/tarefas/nova?${new URLSearchParams({ ...(dia !== hoje ? { d: dia } : {}), ...(gestor ? { m: alvo.id } : {}), volta: `/hoje${veTodos ? `?m=${alvo.id}` : ''}` })}`;
  const temLado = desAlvo.length > 0 || cofre || (des && !gestor && alvo.id === eu.id && pfAlvo !== 'c' && !desAlvo.some((d) => d.membro_id));

  return (
    <main className="estreito hoje-tela">
      <div className="cab">
        <div>
          <h1 className="titulo">{alvo.id !== eu.id ? `Dia de ${alvo.nome}` : `Olá, ${eu.nome}`}</h1>
          <p className="sub">{dataTitulo(dia)}</p>
        </div>
        {/* Hoje só com o dia de hoje (U10): os outros dias ficam na Agenda. */}
        {dia !== hoje && <Link prefetch={false} className="btn sec peq" href={`/hoje${veTodos ? `?m=${alvo.id}` : ''}`}>Voltar para hoje</Link>}
      </div>

      <AvisosConvite chavePublica={process.env.VAPID_PUBLIC_KEY || ''} texto={gestor ? 'Saiba na hora quando alguém concluir uma tarefa, justificar ou pedir para adiar.' : 'Receba um aviso quando tiver novidade nas suas tarefas.'} />

      {veTodos && pessoasDia.length > 1 && (
        // Pessoas em abas, no mesmo padrão da Agenda (pedido do Thomas, 24/11).
        <div className="seg pessoas" aria-label="Pessoa">
          {pessoasDia.map((f) => <Link prefetch={false} key={f.id} href={`/hoje?m=${f.id}${dia !== hoje ? `&d=${dia}` : ''}`} className={f.id === alvo.id ? 'on' : ''} aria-current={f.id === alvo.id ? 'page' : undefined}>{f.id === eu.id ? 'Eu' : f.nome}</Link>)}
        </div>
      )}

      {/* Tarefas primeiro (U1): o quadro azul vira uma faixa fina. */}
      <div className="faixa-dia" aria-label={`${feitas} de ${total} tarefas feitas`}>
        <div className="faixa-l"><b>{feitas} de {total} feitas</b>{daSemana.length > 0 && <small>Semana: {semFeitas} de {daSemana.length}</small>}</div>
        <div className="barra"><div style={{ width: `${total ? (feitas / total) * 100 : 0}%` }} /></div>
        {estrelas != null && (
          <div className="estrelas" aria-label={`${estrelas} de 5 estrelas hoje`}>
            {[0, 1, 2, 3, 4].map((i) => <svg key={i} width="22" height="22" viewBox="0 0 24 24" className={i < estrelas ? 'on' : ''} aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>)}
          </div>
        )}
      </div>

      {des && alvo.id === eu.id && <Comemorar itens={paraComemorar(des.periodos, eu, des.desafios)} nome={eu.nome.split(' ')[0]} crianca={!gestor && visaoCrianca(eu)} />}
      {desAprovado && <div className="aviso ok" role="status">Os pais aprovaram seu desejo: {desAprovado.nome}!</div>}

      <div className="hoje-grade">
        <section className="hoje-tarefas">
          {crianca ? (
            [...pendentesAntes, ...semHora, ...comHora].map((x) => <Tarefa key={x.o.id} {...props(x)} />)
          ) : <>
            {pendentesAntes.length > 0 && <>
              <div className="grupo-titulo">Ficou de outro dia</div>
              {pendentesAntes.map((x) => <Tarefa key={x.o.id} {...props(x)} />)}
            </>}
            {semHora.length > 0 && <>
              <div className="grupo-titulo">A qualquer hora</div>
              {semHora.map((x) => <Tarefa key={x.o.id} {...props(x)} />)}
            </>}
            {comHora.length > 0 && <>
              <div className="grupo-titulo">Com hora marcada</div>
              {comHora.map((x) => <Tarefa key={x.o.id} {...props(x)} />)}
            </>}
          </>}
          {doDia.length === 0 && <div className="card vazio">Nenhuma tarefa neste dia.</div>}
          <Link prefetch={false} className="btn sec bloco" style={{ marginTop: 14, borderStyle: 'dashed' }} href={novaHref}><Icone nome="mais" tam={18} />{gestor ? 'Nova tarefa' : 'Adicionar minha tarefa'}</Link>
        </section>

        {temLado && (
          <aside className="hoje-lado">
            {(desAlvo.length > 0 || cofre) && <div className="grupo-titulo">Desafios e conquistas</div>}
            {desAlvo.map((d) => (
              <Link prefetch={false} key={d.id} className="lin-des" href="/desafios">
                <span className={`des-ic${d.membro_id ? '' : ' mel'}`}><Icone nome={d.icone || 'hoje'} tam={20} /></span>
                <span className="corpo"><b>{d.membro_id ? d.titulo : `Família: ${d.titulo}`}</b><small>{mensagem(d, d.atual)}</small>
                  {desejoMeta && d.membro_id === alvo.id && ['estrelas', 'semanas'].includes(d.recompensa) && <small>Cumprindo: {d.recompensa === 'semanas' ? '+1 semana' : `+${d.estrelas || 10}`} para {desejoMeta.nome}</small>}</span>
                <i aria-hidden="true">›</i>
              </Link>
            ))}
            {cofre && (
              <Link prefetch={false} className="lin-des" href={alvo.id === eu.id ? '/desafios/cofrinho' : `/desafios/cofrinho?m=${alvo.id}`}>
                <span className="des-ic mel">{cofre.moeda === 'semanas' ? <Hexagono tam={22} /> : <Estrela tam={20} />}</span>
                <span className="corpo"><b>{cofre.moeda === 'semanas' ? 'Semanas conquistadas' : alvo.id === eu.id ? 'Meu cofrinho' : `Cofrinho de ${alvo.nome}`}</b>
                  <small>{cofre.tem} {cofre.moeda === 'semanas' ? (cofre.tem === 1 ? 'semana' : 'semanas') : 'estrelinhas'}{cofre.meta ? ` · ${cofre.meta.nome}: ${Math.min(cofre.tem, cofre.meta.custo)} de ${cofre.meta.custo}` : ''}</small></span>
                <i aria-hidden="true">›</i>
              </Link>
            )}
            {des && !gestor && alvo.id === eu.id && pfAlvo !== 'c' && !desAlvo.some((d) => d.membro_id) && <Link prefetch={false} className="btn sec bloco" style={{ borderStyle: 'dashed', marginBottom: 14 }} href="/desafios/novo"><Icone nome="mais" tam={18} />Escolher meu desafio da semana</Link>}
          </aside>
        )}
      </div>
      {/* Ideia do dia: bolinha amarela flutuante no canto direito (L1 + balão B2). */}
      {!gestor && dia === hoje && <LampadaFlutuante membro={eu.id} hoje={hoje} cands={candidatosFilho(fatos(comSt, eu.id, hoje), hoje)} />}
    </main>
  );
}
