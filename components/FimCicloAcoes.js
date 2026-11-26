// @arquivo  FimCicloAcoes.js: botões do fim do ciclo de um desafio: Renovar, Subir um nível ou Trocar.
// @tipo     componente
// @usa      components/Form, components/ConfirmarBotao, app/acoes-desafios.js (renovarDesafio, trocarDesafio), lib/desafios
// @usado-por app/(app)/desafios/page.js
// @regra    26/11 Thomas: no fim do ciclo o desafio descansa e não renova sozinho; quem decide é Pai/Mãe (ou o adolescente, no próprio desafio).
// @cuidado  "Subir um nível" só aparece quando a pessoa cumpriu quase tudo (proximoNivel existe e 3/4 do ciclo cumprido).
import Form from './Form';
import ConfirmarBotao from './ConfirmarBotao';
import { renovarDesafio, trocarDesafio } from '@/app/acoes-desafios';
import { CICLOS, proximoNivel, textoMeta } from '@/lib/desafios';

export default function FimCicloAcoes({ d, c }) {
  const prox = proximoNivel(d);
  const foiBem = c.feitas >= Math.ceil(c.total * 0.75);
  return (
    <>
      <div className="des-acoes des-renovar">
        <Form acao={renovarDesafio} className="des-renovar">
          <input type="hidden" name="id" value={d.id} />
          <select name="semanas" defaultValue={c.total} aria-label="Duração do próximo ciclo">
            {CICLOS.map((n) => <option key={n} value={n}>{n} semanas</option>)}
          </select>
          <button className="btn peq">Renovar</button>
        </Form>
        {prox && foiBem && (
          <Form acao={renovarDesafio}>
            <input type="hidden" name="id" value={d.id} />
            <input type="hidden" name="semanas" value={c.total} />
            <input type="hidden" name="meta" value={prox} />
            <button className="btn peq sec" title={`Nova meta: ${textoMeta(d, prox)}`}>Subir um nível</button>
          </Form>
        )}
        <ConfirmarBotao acao={trocarDesafio} campos={{ id: d.id, membro: d.membro_id || '' }} rotulo="Trocar" titulo="Trocar de desafio?" nome={d.titulo}
          pergunta="Este desafio termina e você escolhe outro. O que já foi conquistado continua guardado." sim="Sim, trocar" icone="bloquear" />
      </div>
      <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '8px 0 0' }}>Sem resposta, o desafio fica descansando. Ele não renova sozinho.</p>
    </>
  );
}
