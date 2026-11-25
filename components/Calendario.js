// @arquivo  Calendario.js: calendário do mês na Agenda.
// @tipo     componente
// @usa      lib/util
// @usado-por app/(app)/agenda/page.js, app/(app)/painel/page.js
import Link from 'next/link';
import { addDias, diaSemana, inicioMes, fimMes, mesAno, DIAS_CURTO } from '@/lib/util';

export default function Calendario({ mes, porDia, hoje, sel, link }) {
  const ini = inicioMes(mes), fim = fimMes(mes);
  // Semana sempre de segunda a domingo (Raio-X U15).
  const vazios = (diaSemana(ini) + 6) % 7;
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
        {[...DIAS_CURTO.slice(1), DIAS_CURTO[0]].map((d, i) => <span key={i} className="dsem">{d}</span>)}
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
        <span><i style={{ background: 'var(--cal-falta-fundo)', border: '1px solid var(--cal-falta-borda)' }} />Falta</span>
      </div>
    </div>
  );
}
