'use client';
// @arquivo  DecidirSemana.js: "a meta da semana não dá mais": Pegar mais leve | Manter | Trocar (mesmo padrão de botões do fim do ciclo).
// @tipo     componente (cliente)
// @usa      ./Form, ./ConfirmarBotao, app/acoes-desafios (decidirSemana, trocarDesafio), lib/desafios
// @usado-por app/(app)/desafios/page.js
// @decisao  28/11 Thomas: usar o padrão de botões do app (linha .des-acoes com btn peq / btn peq sec e ConfirmarBotao), sem inventar botão novo.
//           Quem decide é o Responsável (ou a própria pessoa no desafio dela). O que "mais leve" muda aparece ANTES, na linha abaixo.
import Form from './Form';
import ConfirmarBotao from './ConfirmarBotao';
import { decidirSemana, trocarDesafio } from '@/app/acoes-desafios';
import { maisLeve, termoDia } from '@/lib/desafios';

export default function DecidirSemana({ d, pf = 'j', quem = '' }) {
  const l = maisLeve(d);
  const T = termoDia(pf);
  const estrela = d.estrelas > 0 && d.recompensa === 'estrelas';
  const ganho = estrela ? ` e vale ${l.estrelas} estrelinhas em vez de ${d.estrelas}` : d.estrelas > 0 && d.recompensa === 'semanas' ? ' e o ganho diminui um pouco' : '';
  const campo = (decisao) => <><input type="hidden" name="id" value={d.id} /><input type="hidden" name="decisao" value={decisao} /></>;
  return (
    <>
      <p className="sub" style={{ margin: '12px 0 0', fontWeight: 700 }}>{quem ? `A semana de ${quem} não deu.` : 'A semana não deu.'} O que você prefere?</p>
      <div className="des-acoes">
        <Form acao={decidirSemana}>{campo('leve')}<button className="btn peq">Pegar mais leve</button></Form>
        <Form acao={decidirSemana}>{campo('manter')}<button className="btn peq sec">Manter</button></Form>
        <ConfirmarBotao acao={trocarDesafio} campos={{ id: d.id, membro: d.membro_id || '' }} rotulo="Trocar" titulo="Trocar de desafio?" nome={d.titulo}
          pergunta="Este desafio termina e você escolhe outro. O que já foi conquistado continua guardado." sim="Sim, trocar" icone="bloquear" />
      </div>
      <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>Mais leve: meta de {l.meta} {l.meta === 1 ? T.um : T.varios}{ganho}. Manter: continua com {d.meta}, a próxima semana começa do zero.</p>
    </>
  );
}
