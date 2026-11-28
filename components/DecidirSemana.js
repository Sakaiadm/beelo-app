'use client';
// @arquivo  DecidirSemana.js: cartão "a meta da semana não dá mais": Pegar mais leve | Manter | Trocar de desafio.
// @tipo     componente (cliente)
// @usa      ./Form, app/acoes-desafios (decidirSemana), lib/desafios
// @usado-por app/(app)/desafios/page.js
// @decisao  28/11 Thomas: quem decide é o Responsável (ou a própria pessoa no desafio dela). "Mais leve" mostra ANTES a meta e o ganho novos.
import Form from './Form';
import { decidirSemana } from '@/app/acoes-desafios';
import { maisLeve, termoDia } from '@/lib/desafios';

export default function DecidirSemana({ d, pf = 'j', quem = '' }) {
  const l = maisLeve(d);
  const T = termoDia(pf);
  const estrela = d.estrelas > 0 && d.recompensa === 'estrelas';
  const moeda = d.estrelas > 0 && d.recompensa === 'semanas';
  const ganho = estrela ? `, vale ${l.estrelas} estrelinhas em vez de ${d.estrelas}` : moeda ? ', o ganho também diminui um pouco' : '';
  const botao = (decisao, rotulo, detalhe, sec = true) => (
    <Form acao={decidirSemana}>
      <input type="hidden" name="id" value={d.id} /><input type="hidden" name="decisao" value={decisao} />
      <button className={`btn bloco${sec ? ' sec' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', height: 'auto', padding: '10px 14px', textAlign: 'left' }}>
        <b>{rotulo}</b><small style={{ fontWeight: 500, opacity: .85 }}>{detalhe}</small>
      </button>
    </Form>
  );
  return (
    <div className="decide-semana" style={{ marginTop: 12 }}>
      <p style={{ margin: '0 0 8px', fontWeight: 700 }}>{quem ? `A semana de ${quem} não deu.` : 'A semana não deu.'} O que você prefere?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {botao('leve', 'Pegar mais leve', `Meta de ${l.meta} ${l.meta === 1 ? T.um : T.varios}${ganho}.`, false)}
        {botao('manter', 'Manter como está', `Continua com ${d.meta} ${T.varios}. A próxima semana começa do zero.`)}
        {botao('trocar', 'Trocar de desafio', 'Escolher outro na lista do beelo.')}
      </div>
    </div>
  );
}
