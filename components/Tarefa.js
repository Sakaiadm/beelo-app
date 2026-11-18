'use client';
import { useState } from 'react';
import Icone from './Icone';
import Form from './Form';
import Foto from './Foto';
import { concluir, desfazer, justificar, pedirAdiamento, definirHorario, conferir } from '@/app/acoes';
import { CORES_CAT, STATUS_TXT, hhmm } from '@/lib/util';

const ICONE_STATUS = {
  cumprida: ['hoje', 'var(--ok)'], cumprida_atraso: ['hoje', 'var(--ok)'], justificada: ['hoje', 'var(--aviso)'],
  atrasada: ['alerta', 'var(--erro)'], nao_cumprida: ['alerta', 'var(--erro)'], adiamento_pedido: ['relogio', 'var(--aviso)'],
  adiada: ['relogio', 'var(--cinza)'], pendente: ['circulo', 'var(--cinza)'],
};

export default function Tarefa({ oc, st, dono, gestor, familia, fotoUrl, nomeMembro, hoje }) {
  const [aba, setAba] = useState(null);
  const cat = oc.tarefa?.categoria;
  const [fundo, letra] = CORES_CAT[cat?.cor] || CORES_CAT.cinza;
  const feita = st === 'cumprida' || st === 'cumprida_atraso';
  const atrasada = st === 'atrasada' || st === 'nao_cumprida';
  const [ic, cor] = ICONE_STATUS[st] || ICONE_STATUS.pendente;
  const horario = oc.hora_inicio ? `${hhmm(oc.hora_inicio)}${oc.hora_fim ? '–' + hhmm(oc.hora_fim) : ''}` : 'Sem horário';
  const podeConcluir = dono && !feita && st !== 'adiamento_pedido' && st !== 'adiada';
  const alternar = (a) => setAba(aba === a ? null : a);

  return (
    <div className={`tarefa ${feita ? 'feita' : ''} ${atrasada ? 'atrasada' : ''}`}>
      <div className="topo-t">
        {podeConcluir && !oc.tarefa?.exige_foto ? (
          <Form acao={concluir}><input type="hidden" name="oc" value={oc.id} />
            <button className="circulo" aria-label={`Concluir ${oc.tarefa?.titulo}`} title="Marcar como feita"><Icone nome={ic} cor={cor} tam={26} /></button>
          </Form>
        ) : podeConcluir ? (
          <button className="circulo" onClick={() => alternar('concluir')} aria-label={`Concluir ${oc.tarefa?.titulo} com foto`}><Icone nome={ic} cor={cor} tam={26} /></button>
        ) : (
          <span className="circulo"><Icone nome={ic} cor={cor} tam={26} rotulo={STATUS_TXT[st]} /></span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tt">{oc.tarefa?.titulo}</div>
          <div className="meta">
            {horario}{oc.horario_travado ? ' · definido pelos pais' : ''}
            {nomeMembro ? ` · ${nomeMembro}` : ''}
            {oc.data < hoje ? ` · ${oc.data.slice(8, 10)}/${oc.data.slice(5, 7)}` : ''}
            {st !== 'pendente' && !feita ? ` · ${STATUS_TXT[st]}` : ''}
            {st === 'cumprida_atraso' ? ' · com atraso' : ''}
            {oc.tarefa?.exige_foto && !feita ? ' · com foto' : ''}
            {oc.tarefa?.criada_por === oc.membro_id ? ' · criada pelo filho' : ''}
            {oc.conferido === 'conferido' ? ' · conferido' : ''}
          </div>
          {oc.justificativa && <div className="meta">Justificativa: “{oc.justificativa}”{oc.justificativa_status === 'aceita' ? ' (aceita)' : oc.justificativa_status === 'recusada' ? ' (recusada)' : ''}</div>}
        </div>
        {fotoUrl && <a href={fotoUrl} target="_blank" rel="noreferrer"><img src={fotoUrl} alt={`Foto de ${oc.tarefa?.titulo}`} className="foto-mini" style={{ width: 48, height: 48 }} /></a>}
        {cat && <span className="pilula" style={{ background: fundo, color: letra }}>{cat.nome}</span>}
      </div>

      {dono && (
        <div className="acoes" style={{ marginTop: 8 }}>
          {podeConcluir && oc.tarefa?.exige_foto && <button className="btn peq" onClick={() => alternar('concluir')}>Concluir com foto</button>}
          {podeConcluir && !oc.tarefa?.exige_foto && <button className="btn sec peq" onClick={() => alternar('concluir')}>Concluir com foto</button>}
          {atrasada && <button className="btn sec peq" onClick={() => alternar('justificar')}>Justificar</button>}
          {st === 'pendente' || st === 'atrasada' ? <button className="btn sec peq" onClick={() => alternar('adiar')}>Pedir adiamento</button> : null}
          {!feita && !oc.horario_travado && <button className="btn sec peq" onClick={() => alternar('horario')}>{oc.hora_inicio ? 'Mudar horário' : 'Pôr horário'}</button>}
          {feita && !oc.conferido && (
            <Form acao={desfazer}><input type="hidden" name="oc" value={oc.id} /><button className="btn sec peq">Desfazer</button></Form>
          )}
        </div>
      )}

      {gestor && feita && (
        <div className="acoes" style={{ marginTop: 8 }}>
          <Form acao={conferir}><input type="hidden" name="oc" value={oc.id} /><input type="hidden" name="valor" value="conferido" /><button className="btn sec peq" disabled={oc.conferido === 'conferido'}>Conferido</button></Form>
          <Form acao={conferir}><input type="hidden" name="oc" value={oc.id} /><input type="hidden" name="valor" value="refazer" /><button className="btn perigo peq">Pedir para refazer</button></Form>
        </div>
      )}

      {aba === 'concluir' && (
        <div className="painel-acao">
          <Form acao={concluir}>
            <input type="hidden" name="oc" value={oc.id} />
            <Foto familia={familia} membro={oc.membro_id} obrigatoria={oc.tarefa?.exige_foto} />
            <button className="btn" style={{ marginTop: 10 }}>Marcar como feita</button>
          </Form>
        </div>
      )}
      {aba === 'justificar' && (
        <div className="painel-acao">
          <Form acao={justificar} okTxt="Justificativa enviada aos pais.">
            <input type="hidden" name="oc" value={oc.id} />
            <label htmlFor={`j-${oc.id}`}>Por que atrasou?</label>
            <textarea id={`j-${oc.id}`} name="texto" required minLength={3} maxLength={500} />
            <button className="btn" style={{ marginTop: 10 }}>Enviar justificativa</button>
          </Form>
        </div>
      )}
      {aba === 'adiar' && (
        <div className="painel-acao">
          <Form acao={pedirAdiamento} okTxt="Pedido enviado. Os pais vão responder.">
            <input type="hidden" name="oc" value={oc.id} />
            <div className="linha">
              <div><label htmlFor={`d-${oc.id}`}>Nova data</label><input id={`d-${oc.id}`} type="date" name="data" min={hoje} required /></div>
              <div><label htmlFor={`h-${oc.id}`}>Novo horário (opcional)</label><input id={`h-${oc.id}`} type="time" name="hora" /></div>
            </div>
            <label htmlFor={`m-${oc.id}`}>Motivo</label>
            <textarea id={`m-${oc.id}`} name="motivo" required minLength={3} maxLength={500} />
            <button className="btn" style={{ marginTop: 10 }}>Pedir adiamento</button>
          </Form>
        </div>
      )}
      {aba === 'horario' && (
        <div className="painel-acao">
          <Form acao={definirHorario} okTxt="Horário salvo.">
            <input type="hidden" name="oc" value={oc.id} />
            <div className="linha">
              <div><label htmlFor={`i-${oc.id}`}>Início</label><input id={`i-${oc.id}`} type="time" name="inicio" defaultValue={hhmm(oc.hora_inicio)} /></div>
              <div><label htmlFor={`f-${oc.id}`}>Fim (opcional)</label><input id={`f-${oc.id}`} type="time" name="fim" defaultValue={hhmm(oc.hora_fim)} /></div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '8px 0 0' }}>Deixe em branco para “sem horário”.</p>
            <button className="btn" style={{ marginTop: 10 }}>Salvar horário</button>
          </Form>
        </div>
      )}
    </div>
  );
}
