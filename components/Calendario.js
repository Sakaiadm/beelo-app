import { addDias, diaSemana, inicioMes, fimMes, mesAno, DIAS_CURTO } from '@/lib/util';

// Calendário mensal no estilo da pluviometria: a cor mostra o % cumprido no dia.
export default function Calendario({ mes, porDia, hoje, sel, link }) {
  const ini = inicioMes(mes), fim = fimMes(mes);
  const vazios = diaSemana(ini);
  const dias = [];
  for (let d = ini; d <= fim; d = addDias(d, 1)) dias.push(d);
  const nivel = (d) => {
    const x = porDia[d];
    if (!x || !x.total || d > hoje) return '';
    const p = x.feitas / x.total;
    return p >= 1 ? 'n4' : p >= 0.75 ? 'n3' : p >= 0.4 ? 'n2' : 'n1';
  };
  return (
    <div>
      <div className="cal-cab">
        <a href={link(addDias(ini, -1).slice(0, 8) + '01')} aria-label="Mês anterior">‹</a>
        <strong>{mesAno(ini)}</strong>
        <a href={link(addDias(fim, 1))} aria-label="Próximo mês">›</a>
      </div>
      <div className="cal">
        {DIAS_CURTO.map((d, i) => <span key={i} className="dsem">{d}</span>)}
        {Array.from({ length: vazios }).map((_, i) => <span key={'v' + i} className="fora" />)}
        {dias.map((d) => {
          const x = porDia[d];
          return (
            <a key={d} href={link(d, true)} className={`${nivel(d)} ${d === hoje ? 'hoje' : ''} ${d === sel ? 'sel' : ''}`}
               aria-label={`${Number(d.slice(8))}${x ? `: ${x.feitas} de ${x.total} feitas` : ''}`}>
              {Number(d.slice(8))}{x?.total ? <small>{x.feitas}/{x.total}</small> : null}
            </a>
          );
        })}
      </div>
      <div className="legenda">
        <span><i style={{ background: '#1a6fe0' }} />Tudo feito</span>
        <span><i style={{ background: '#9cc4f5' }} />Quase tudo</span>
        <span><i style={{ background: '#dceafc' }} />Metade</span>
        <span><i style={{ background: '#fbe3e5' }} />Pouco</span>
      </div>
    </div>
  );
}
