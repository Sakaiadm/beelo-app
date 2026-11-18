import { exigirMembro } from '@/lib/sessao';
import { CORES_CAT, hhmm, DIAS_CURTO, dataCurta } from '@/lib/util';
import Icone from '@/components/Icone';

const REC = { diaria: 'Todo dia', semanal: 'Toda semana', mensal: 'Todo mês' };
function quando(t) {
  if (t.tipo === 'pontual') return `Em ${dataCurta(t.data_inicio)}`;
  if (t.recorrencia === 'dias_semana') return t.dias_semana.map((d) => DIAS_CURTO[d]).join(' ');
  return REC[t.recorrencia] || 'Repete';
}

export default async function Tarefas({ searchParams }) {
  const sp = await searchParams;
  const { supabase, eu, membros, gestor } = await exigirMembro();
  const { data } = await supabase.from('ra_tarefas').select('*, categoria:ra_categorias(nome, cor)').eq('ativa', true).order('titulo');
  const tarefas = data || [];
  const nome = Object.fromEntries(membros.map((m) => [m.id, m.nome]));
  const grupos = gestor
    ? membros.filter((m) => m.papel === 'filho').map((f) => ({ titulo: f.nome, itens: tarefas.filter((t) => t.responsavel_id === f.id) }))
    : [{ titulo: 'Criadas por você', itens: tarefas.filter((t) => t.criada_por === eu.id) }, { titulo: 'Dos seus pais', itens: tarefas.filter((t) => t.criada_por !== eu.id) }];
  return (
    <main>
      <div className="cab">
        <div><h1 className="titulo">{gestor ? 'Tarefas' : 'Minhas tarefas'}</h1><p className="sub">{gestor ? 'Toque numa tarefa para ver os detalhes. O lápis edita.' : 'Crie tarefas suas para organizar a rotina.'}</p></div>
        <a className="btn" href="/tarefas/nova"><Icone nome="mais" tam={18} cor="#fff" />Nova tarefa</a>
      </div>
      {sp.ok && <div className="aviso ok">Tarefa salva.</div>}
      {grupos.map((g) => (
        <div className="card" key={g.titulo}>
          <h2>{g.titulo} <span style={{ color: 'var(--cinza)', fontWeight: 600, fontSize: 14 }}>· {g.itens.length}</span></h2>
          {g.itens.length === 0 && <div className="vazio">Nenhuma tarefa.</div>}
          <div className="rolavel"><table><tbody>
            {g.itens.map((t) => {
              const [f, l] = CORES_CAT[t.categoria?.cor] || CORES_CAT.cinza;
              const pode = gestor || t.criada_por === eu.id;
              return (
                <tr key={t.id} className="clicavel">
                  <td className="acao-linha" style={{ width: 52 }}>{pode && <a className="btn sec peq icone" href={`/tarefas/${t.id}/editar`} aria-label={`Editar ${t.titulo}`} title="Editar"><Icone nome="lapis" tam={18} /></a>}</td>
                  <td style={{ fontWeight: 700 }}><a className="cobre" href={`/tarefas/${t.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{t.titulo}</a>
                    {t.criada_por === t.responsavel_id && gestor && <div style={{ fontSize: 12, color: 'var(--cinza)', fontWeight: 500 }}>criada por {nome[t.criada_por]}</div>}</td>
                  <td>{quando(t)}</td>
                  <td>{t.hora_inicio ? `${hhmm(t.hora_inicio)}${t.hora_fim ? '–' + hhmm(t.hora_fim) : ''}` : 'Sem horário'}</td>
                  <td>{t.exige_foto ? 'Com foto' : ''}</td>
                  <td className="num">{t.categoria && <span className="pilula" style={{ background: f, color: l }}>{t.categoria.nome}</span>}</td>
                </tr>
              );
            })}
          </tbody></table></div>
        </div>
      ))}
    </main>
  );
}
