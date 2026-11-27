// @arquivo  TelaEstrelas.js: os últimos 7 dias do tempo de tela em estrelas, para o modo criança (no lugar do gráfico).
// @tipo     componente
// @usa      ./Icone
// @usado-por app/(app)/tela/page.js
import Icone from './Icone';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// @decisao Thomas 27/11: criança não lê gráfico. Uma estrela por dia dentro do combinado; quem passou aparece só como um
// círculo neutro (sem vermelho, sem culpa); dia sem lançamento fica tracejado. Adolescente e adultos veem o gráfico.
// - dias: o mesmo formato de telaSemana (lib/tela.js).
export default function TelaEstrelas({ dias }) {
  let dentro = 0, contam = 0;
  const itens = dias.map((d) => {
    const p = d.prev?.total ?? null, r = d.real ? d.real.total ?? 0 : null;
    let est = 'sem';
    if (r != null) {
      if (p == null) est = 'neutro';
      else { contam++; if (r <= p) { est = 'ok'; dentro++; } else est = 'passou'; }
    }
    return { data: d.data, est, nome: DIAS[new Date(d.data + 'T12:00:00Z').getUTCDay()] };
  });
  return (
    <div className="card">
      <h2>Meus 7 dias</h2>
      <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '0 0 8px' }}>Estrela: você ficou dentro do combinado. Quem passou um pouquinho tenta de novo amanhã.</p>
      <div className="estrelas7" role="img" aria-label={`${dentro} de ${contam} dias dentro do combinado`}>
        {itens.map((x) => (
          <div key={x.data} className="est-dia">
            <span className={`est-bola ${x.est}`}>{x.est === 'ok' && <Icone nome="estrela" tam={22} cor="#fff" />}</span>
            <small>{x.nome}</small>
          </div>
        ))}
      </div>
      <p className="est-texto">{contam > 0 ? <><b>{dentro} de {contam} {contam === 1 ? 'dia' : 'dias'}</b> dentro do combinado</> : 'Lance o tempo de ontem para ganhar estrelas.'}</p>
      {contam > 0 && <div className="barra"><div style={{ width: `${Math.round((dentro / contam) * 100)}%`, background: '#F5B82E' }} /></div>}
    </div>
  );
}
