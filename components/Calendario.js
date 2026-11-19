import Link from 'next/link';
import { addDias, diaSemana, inicioMes, fimMes, mesAno, DIAS_CURTO } from '@/lib/util';

export default function Calendario({ mes, porDia, hoje, sel, link }) {
  const ini = inicioMes(mes), fim = fimMes(mes);
  const vazios = diaSemana(ini);
  const dias = [];
  for (let d = ini; d <= fim; d = addDias(d, 1)) dias.push(d);
  const nivel = (d) => {
    const x = porDia[d];
    if (!x || !x.total || d > hoje) return '';
    const p = x.feitas / x.total;
    return p >= 1 ? 'n4' : 'n1';
  };
  return (
    <div>
      <div className="cal-cab">
        <Link prefetch={false} href={link(addDias(ini, -1).slice(0, 8) + '01')} aria-label="Mês anterior">‹</Link>
        <strong>{mesAno(ini)}</strong>
        <Link prefetch={false} href={link(addDias(fim, 1))} aria-label="Próximo mês">›</Link>
      </div>
      <div className="cal">
        {DIAS_CURTO.map((d, i) => <span key={i} className="dsem">{d}</span>)}
        {Array.from({ length: vazios }).map((_, i) => <span key={'v' + i} className="fora" />)}
        {dias.map((d) => {
          const x = porDia[d];
          return (
            <Link prefetch={false} key={d} href={link(d, true)} className={`${nivel(d)} ${d === hoje ? 'hoje' : ''} ${d === sel ? 'sel' : ''}`}
               aria-label={`${Number(d.slice(8))}${x ? `: ${x.feitas} de ${x.total} feitas` : ''}`}>
              {Number(d.slice(8))}{x?.total ? <small>{x.feitas}/{x.total}</small> : null}
            </Link>
          );
        })}
      </div>
      <div className="legenda">
        <span><i style={{ background: '#1a6fe0' }} />Tudo feito</span>
        <span><i style={{ background: '#fbe3e5', border: '1px solid #f3cfd2' }} />Falta</span>
      </div>
    </div>
  );
}
