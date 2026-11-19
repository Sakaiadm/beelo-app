'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icone from './Icone';
import Form from './Form';
import Foto from './Foto';
import { concluir, desfazer, justificar, pedirAdiamento, definirHorario, conferir } from '@/app/acoes';
import { CORES_CAT, STATUS_TXT, hhmm, DIAS, diaSemana } from '@/lib/util';

const ICONE_STATUS = {
  cumprida: ['hoje', 'var(--ok)'], cumprida_atraso: ['hoje', 'var(--ok)'], justificada: ['hoje', 'var(--aviso)'],
  atrasada: ['alerta', 'var(--erro)'], nao_cumprida: ['alerta', 'var(--erro)'], adiamento_pedido: ['relogio', 'var(--aviso)'],
  adiada: ['relogio', 'var(--cinza)'], pendente: ['circulo', 'var(--cinza)'],
};

export default function Tarefa({ oc, st, dono, gestor, familia, fotoUrl, nomeMembro, hoje, editarHref, quemMarca }) {
  const [aba, setAba] = useState(null);
  const [aviso, setAviso] = useState('');
  const cat = oc.tarefa?.categoria;
  const [fundo, letra] = CORES_CAT[cat?.cor] || CORES_CAT.cinza;
  const feita = st === 'cumprida' || st === 'cumprida_atraso';
  const atrasada = st === 'atrasada' || st === 'nao_cumprida';
  const [ic, cor] = ICONE_STATUS[st] || ICONE_STATUS.pendente;
  const horario = oc.hora_inicio ? `${hhmm(oc.hora_inicio)}${oc.hora_fim ? '–' + hhmm(oc.hora_fim) : ''}` : 'Sem horário';
  const podeConcluir = dono && !feita && st !== 'adiamento_pedido' && st !== 'adiada';
  const futura = oc.data > hoje;
  const outraPessoa = gestor && !dono;
  const alternar = (a) => setAba(aba === a ? null : a);

  return (
    <div className={`tarefa ${feita ? 'feita' : ''} ${atrasada ? 'atrasada' : ''}`}>
      <div className="topo-t">
        {futura && podeConcluir ? (
          <button type="button" className="circulo" onClick={() => setAviso(`Esta tarefa é de ${DIAS[diaSemana(oc.data)]}, ${oc.data.slice(8, 10)}/${oc.data.slice(5, 7)}. Só dá para marcar como feita no próprio dia.`)} aria-label={`Marcar ${oc.tarefa?.titulo}`} title="Tarefa de outro dia"><Icone nome={ic} cor={cor} tam={26} /></button>
        ) : podeConcluir && !oc.tarefa?.exige_foto ? (
          <Form acao={concluir}><input type="hidden" name="oc" value={oc.id} />
            <button className="circulo" aria-label={`Concluir ${oc.tarefa?.titulo}`} title="Marcar como feita"><Icone nome={ic} cor={cor} tam={26} /></button>
          </Form>
        ) : podeConcluir ? (
          <button className="circulo" onClick={() => alternar('concluir')} aria-label={`Concluir ${oc.tarefa?.titulo} com foto`} title="Esta tarefa pede foto"><Icone nome={ic} cor={cor} tam={26} /></button>
        ) : outraPessoa && !feita && (st === 'pendente' || st === 'atrasada') ? (
          <button type="button" className="circulo" onClick={() => setAviso(`Quem marca é ${quemMarca || 'a própria pessoa'}. Você confere depois que a tarefa for marcada.`)} aria-label={`Quem marca ${oc.tarefa?.titulo}`} title="Só a própria pessoa marca"><Icone nome={ic} cor={cor} tam={26} /></button>
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
            {oc.foto_tirada_em ? ` · foto tirada ${new Date(oc.foto_tirada_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}
          </div>
          {oc.tarefa?.exige_justificativa && atrasada && !oc.justificativa && dono && <div className="meta" style={{ color: 'var(--erro)', fontWeight: 600 }}>Justifique o atraso para poder concluir.</div>}
          {oc.justificativa && <div className="meta">Justificativa: “{oc.justificativa}”{oc.justificativa_status === 'aceita' ? ' (aceita)' : oc.justificativa_status === 'recusada' ? ' (recusada)' : ''}</div>}
        </div>
        {fotoUrl && <a href={fotoUrl} target="_blank" rel="noreferrer"><img src={fotoUrl} alt={`Foto de ${oc.tarefa?.titulo}`} className="foto-mini" style={{ width: 48, height: 48 }} /></a>}
        {cat && <span className="pilula" style={{ background: fundo, color: letra }}>{cat.nome}</span>}
        {editarHref && <Link prefetch={false} className="btn sec peq icone lapis" href={editarHref} aria-label={`Editar ${oc.tarefa?.titulo}`} title="Editar"><Icone nome="lapis" tam={18} /></Link>}
      </div>

      {aviso && <div className="aviso erro" role="alert" style={{ marginTop: 8 }}>{aviso}</div>}

      {dono && !gestor && (
        <div className="acoes" style={{ marginTop: 8 }}>
          {atrasada && <button className="btn sec peq" onClick={() => alternar('justificar')}>Justificar</button>}
          {(st === 'pendente' || st === 'atrasada') && oc.tarefa?.permite_adiar ? <button className="btn sec peq" onClick={() => alternar('adiar')}>Adiar</button> : null}
          {!feita && !oc.horario_travado && <button className="btn sec peq" onClick={() => alternar('horario')}>Horário</button>}
          {feita && !oc.conferido && (
            <Form acao={desfazer}><input type="hidden" name="oc" value={oc.id} /><button className="btn sec peq">Desfazer</button></Form>
          )}
        </div>
      )}

      {gestor && !dono && feita && (
        <div className="acoes" style={{ marginTop: 8 }}>
          <Form acao={conferir}><input type="hidden" name="oc" value={oc.id} /><input type="hidden" name="valor" value="conferido" /><button className="btn sec peq" disabled={oc.conferido === 'conferido'}>Conferido</button></Form>
          <Form acao={conferir}><input type="hidden" name="oc" value={oc.id} /><input type="hidden" name="valor" value="refazer" /><button className="btn perigo peq">Pedir para refazer</button></Form>
        </div>
      )}

      {aba === 'concluir' && (
        <div className="painel-acao">
          <Form acao={concluir}>
            <input type="hidden" name="oc" value={oc.id} />
            <Foto familia={familia} membro={oc.membro_id} obrigatoria={oc.tarefa?.exige_foto} soHoje />
            <button className="btn icone" style={{ marginTop: 10, width: 56 }} aria-label="Concluir" title="Concluir"><Icone nome="check" tam={24} cor="#fff" /></button>
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
            <button className="btn" style={{ marginTop: 10 }}>Adiar</button>
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
