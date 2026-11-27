// @arquivo  TotalOntem.js: balão azul com o total do tempo de tela de ontem (ou "Ainda não lançado").
// @tipo     componente
// @usa      lib/util, lib/tela
// @usado-por app/(app)/tela/page.js
import { fmtMin } from '@/lib/util';
import { totalReal } from '@/lib/tela';

// Sem lançamento: texto pequeno e sutil. Com lançamento: o total grande (ex.: 3h30) e a divisão por aparelho (Thomas 27/11).
// - atual: linha de ra_tela_real do dia (ou null).  titulo: "Total de ontem" ou "Total de 12/11".
export default function TotalOntem({ atual, titulo = 'Total de ontem' }) {
  if (!atual) {
    return (
      <div className="total-ontem vazio" role="status">
        <div><small>{titulo}</small><span className="nao">Ainda não lançado</span></div>
        <em>Abra “Lançar” aqui embaixo</em>
      </div>
    );
  }
  const partes = [atual.min_celular != null && `Celular ${fmtMin(atual.min_celular)}`, atual.min_computador != null && `Computador ${fmtMin(atual.min_computador)}`].filter(Boolean);
  return (
    <div className="total-ontem" role="status">
      <div><small>{titulo}</small><strong>{fmtMin(totalReal(atual))}</strong></div>
      {partes.length > 0 && <em>{partes.map((t) => <span key={t}>{t}</span>)}</em>}
    </div>
  );
}
