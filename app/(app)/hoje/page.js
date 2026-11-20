import AvisosConvite from '@/components/AvisosConvite';
import Link from 'next/link';
import { exigirMembro } from '@/lib/sessao';
import { ocorrencias, urlsFotos } from '@/lib/dados';
import { hojeISO, addDias, dataLonga, statusExibido } from '@/lib/util';
import Tarefa from '@/components/Tarefa';
import Icone from '@/components/Icone';

export const dynamic = 'force-dynamic';

export default async function Hoje({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor, familia: fam } = await exigirMembro();
  const hoje = hojeISO();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || '') ? sp.d : hoje;
  const filhos = membros.filter((m) => m.papel === 'filho' && m.ativo);
  const alvo = gestor ? (filhos.find((f) => f.id === sp.m) || filhos[0]) : eu;
  if (!alvo) return <main><div className="card">Cadastre os filhos em Família.</div></main>;

  const lista = await ocorrencias(supabase, { de: addDias(dia, -7), ate: dia, membros: [alvo.id] });
  const comSt = lista.map((o) => ({ o, st: statusExibido(o, hoje) }));
  const doDia = comSt.filter((x) => x.o.data === dia);
  const pendentesAntes = comSt.filter((x) => x.o.data < dia && (x.st === 'atrasada'));
  const fotos = await urlsFotos(supabase, lista.map((o) => o.foto_path));
  const feitas = doDia.filter((x) => x.st.startsWith('cumprida')).length;
  const total = doDia.filter((x) => x.st !== 'adiada').length;
  const semHora = doDia.filter((x) => !x.o.hora_inicio);
  const comHora = doDia.filter((x) => x.o.hora_inicio);
  let lembrarTela = false;
  if (!gestor && eu.tela_ativo && dia === hoje) {
    const { data } = await supabase.from('ra_tela_real').select('id').eq('membro_id', eu.id).eq('data', addDias(hoje, -1)).maybeSingle();
    lembrarTela = !data;
  }
  const props = (x) => ({ oc: x.o, st: x.st, dono: x.o.membro_id === eu.id, quemMarca: alvo.nome, gestor, familia: eu.familia_id, fotoUrl: fotos[x.o.foto_path], hoje });

  return (
    <main className="estreito">
      <div className="cab">
        <div>
          <h1 className="titulo">{gestor ? `Dia de ${alvo.nome}` : `Olá, ${eu.nome}`}</h1>
          <p className="sub" style={{ textTransform: 'capitalize' }}>{dataLonga(dia)}</p>
        </div>
        <div className="acoes">
          <Link prefetch={false} className="btn sec peq" href={`/hoje?d=${addDias(dia, -1)}${gestor ? `&m=${alvo.id}` : ''}`} aria-label="Dia anterior"><Icone nome="esq" tam={18} /></Link>
          {dia !== hoje && <Link prefetch={false} className="btn sec peq" href={`/hoje${gestor ? `?m=${alvo.id}` : ''}`}>Hoje</Link>}
          <Link prefetch={false} className="btn sec peq" href={`/hoje?d=${addDias(dia, 1)}${gestor ? `&m=${alvo.id}` : ''}`} aria-label="Próximo dia"><Icone nome="dir" tam={18} /></Link>
        </div>
      </div>

      <AvisosConvite chavePublica={process.env.VAPID_PUBLIC_KEY || ''} texto={gestor ? 'Saiba na hora quando alguém concluir uma tarefa, justificar ou pedir para adiar.' : 'Receba um aviso quando tiver novidade nas suas tarefas.'} />

      {gestor && filhos.length > 1 && (
        <div className="abas" style={{ marginBottom: 14 }}>
          {filhos.map((f) => <Link prefetch={false} key={f.id} href={`/hoje?m=${f.id}&d=${dia}`} className={f.id === alvo.id ? 'ativo' : ''}>{f.nome}</Link>)}
        </div>
      )}

      <div className="kpi destaque" style={{ marginBottom: 14 }}>
        <small>{dia === hoje ? 'Seu dia' : 'Dia'}</small>
        <strong>{feitas} <span style={{ fontSize: 15, color: '#e6f0fe' }}>de {total} feitas</span></strong>
        <div className="barra" style={{ marginTop: 10, background: 'rgba(255,255,255,.25)' }}><div style={{ width: `${total ? (feitas / total) * 100 : 0}%`, background: '#fff' }} /></div>
      </div>

      {lembrarTela && <div className="aviso info">Falta lançar o tempo de tela de ontem. <Link prefetch={false} href="/tela">Lançar agora</Link></div>}

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
