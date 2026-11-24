'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import HorarioCampo from './HorarioCampo';
import Icone from './Icone';
import Form from './Form';
import Foto from './Foto';
import { concluir, desfazer, justificar, pedirAdiamento, definirHorario, conferir } from '@/app/acoes';
import { CORES_CAT, STATUS_TXT, hhmm, DIAS, diaSemana, addDias } from '@/lib/util';
import Motivos from './Motivos';
import { useFila } from '@/lib/fila';
import { prepararSom, comemorar } from '@/lib/festa';
import { RealForm } from './TelaForms';

const ICONE_STATUS = {
  cumprida: ['hoje', 'var(--ok)'], cumprida_atraso: ['hoje', 'var(--ok)'], justificada: ['hoje', 'var(--aviso)'],
  atrasada: ['alerta', 'var(--erro)'], nao_cumprida: ['alerta', 'var(--erro)'], adiamento_pedido: ['relogio', 'var(--aviso)'],
  adiada: ['relogio', 'var(--cinza)'], pendente: ['circulo', 'var(--cinza)'],
};

export default function Tarefa({ oc, st: stServidor, dono, gestor, confere, familia, fotoUrl, nomeMembro, hoje, editarHref, quemMarca, ultima, tela, crianca }) {
  const [aba, setAba] = useState(null);
  const [festa, setFesta] = useState(false);
  // Sem internet: o que foi feito e está guardado no aparelho já aparece na tela, com o selo "Aguardando internet".
  const guardados = useFila().filter((x) => x.dados?.oc === oc.id);
  const ultimo = [...guardados].reverse().find((x) => x.tipo === 'concluir' || x.tipo === 'desfazer');
  const st = ultimo?.tipo === 'concluir' ? 'cumprida' : ultimo?.tipo === 'desfazer' ? 'pendente' : stServidor;
  const t = oc.tarefa?.titulo || 'tarefa';
  // Concluiu: animação discreta na bolinha, som curtinho e (modo criança) a mensagem alegre.
  const ref = useRef(null);
  const festejar = () => {
    const r = ref.current?.querySelector('.circulo')?.getBoundingClientRect();
    setAba(null); setFesta(true); setTimeout(() => setFesta(false), 1000);
    comemorar({ ultima, x: r ? r.left + r.width / 2 : null, y: r ? r.top + r.height / 2 : null });
  };
  const [aviso, setAviso] = useState('');
  const [aberto, setAberto] = useState(false);
  const [quando, setQuando] = useState(null);
  const cat = oc.tarefa?.categoria;
  const [fundo, letra] = CORES_CAT[cat?.cor] || CORES_CAT.cinza;
  const feita = st === 'cumprida' || st === 'cumprida_atraso';
  const atrasada = st === 'atrasada' || st === 'nao_cumprida';
  const [ic, cor] = ICONE_STATUS[st] || ICONE_STATUS.pendente;
  const temHora = !!oc.hora_inicio;
  const horario = temHora ? `${hhmm(oc.hora_inicio)}${oc.hora_fim ? '–' + hhmm(oc.hora_fim) : ''}` : 'Sem horário';
  const podeConcluir = dono && !feita && st !== 'adiamento_pedido' && st !== 'adiada';
  const futura = oc.data > hoje;
  const outraPessoa = (gestor || confere) && !dono;
  const alternar = (a) => setAba(aba === a ? null : a);
  const paraConferir = (gestor || confere) && !dono && feita && oc.conferido !== 'conferido';
  const selo = guardados.length ? ['Aguardando internet', 'aviso']
    : atrasada ? [STATUS_TXT[st], 'erro']
    : feita && oc.conferido === 'conferido' ? ['Conferido', 'conf']
    : paraConferir ? ['Para conferir', 'ok']
    : feita ? [STATUS_TXT[st], 'ok']
    : st !== 'pendente' ? [STATUS_TXT[st], 'aviso'] : null;

  return (
    <div ref={ref} className={`tarefa ${feita ? 'feita' : ''} ${atrasada ? 'atrasada' : ''} ${festa ? 'festa' : ''}`}>
      <div className="topo-t" onClick={(e) => { if (!e.target.closest('button, a, form, input, textarea, label')) setAberto(!aberto); }}>
        {futura && podeConcluir ? (
          <button type="button" className={`circulo${crianca ? ' grande' : ''}`} onClick={() => setAviso(`Esta tarefa é de ${DIAS[diaSemana(oc.data)]}, ${oc.data.slice(8, 10)}/${oc.data.slice(5, 7)}. Só dá para marcar como feita no próprio dia.`)} aria-label={`Marcar ${oc.tarefa?.titulo}`} title="Tarefa de outro dia"><Icone nome={ic} cor={cor} tam={crianca ? 40 : 26} /></button>
        ) : podeConcluir && oc.tarefa?.especial === 'tela' && tela ? (
          <button type="button" className={`circulo${crianca ? ' grande' : ''}`} onClick={() => alternar('tela')} aria-expanded={aba === 'tela'} aria-label="Lançar tempo de tela" title="Lançar tempo de tela"><Icone nome={ic} cor={cor} tam={crianca ? 40 : 26} /></button>
        ) : podeConcluir && oc.tarefa?.especial === 'tela' ? (
          <Link prefetch={false} className={`circulo${crianca ? ' grande' : ''}`} href="/tela" aria-label="Lançar tempo de tela" title="Lançar tempo de tela"><Icone nome={ic} cor={cor} tam={crianca ? 40 : 26} /></Link>
        ) : podeConcluir && !oc.tarefa?.exige_foto ? (
          <Form acao={concluir} fila="concluir" rotulo={`Concluir “${t}”`} discreto aoConcluir={festejar}><input type="hidden" name="oc" value={oc.id} />
            <button className={`circulo${crianca ? ' grande' : ''}`} onPointerDown={prepararSom} onKeyDown={prepararSom} aria-label={`Concluir ${oc.tarefa?.titulo}`} title="Marcar como feita"><Icone nome={ic} cor={cor} tam={crianca ? 40 : 26} /></button>
          </Form>
        ) : podeConcluir ? (
          <button className={`circulo${crianca ? ' grande' : ''}`} onClick={() => alternar('concluir')} aria-label={`Concluir ${oc.tarefa?.titulo} com foto`} title="Esta tarefa pede foto"><Icone nome={ic} cor={cor} tam={crianca ? 40 : 26} /></button>
        ) : outraPessoa && !feita && (st === 'pendente' || st === 'atrasada') ? (
          <button type="button" className={`circulo${crianca ? ' grande' : ''}`} onClick={() => setAviso(`Quem marca é ${quemMarca || 'a própria pessoa'}. Você confere depois que a tarefa for marcada.`)} aria-label={`Quem marca ${oc.tarefa?.titulo}`} title="Só a própria pessoa marca"><Icone nome={ic} cor={cor} tam={crianca ? 40 : 26} /></button>
        ) : (
          <span className={`circulo${crianca ? ' grande' : ''}`}><Icone nome={ic} cor={cor} tam={crianca ? 40 : 26} rotulo={STATUS_TXT[st]} /></span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tt">{oc.tarefa?.prioritaria && <span className="prio-ic" title="Prioritária"><Icone nome="bandeira" tam={15} cor="var(--prio)" rotulo="Prioritária" /></span>}{oc.tarefa?.titulo}</div>
          {(oc.tarefa?.especial === 'tela' || nomeMembro) && <div className="meta">{[oc.tarefa?.especial === 'tela' ? 'tempo de ontem' : '', nomeMembro || ''].filter(Boolean).join(' · ')}</div>}
          {(selo || cat || temHora) && (
            <div className="selos">
              {temHora && <span className="tg cz">{horario}</span>}
              {selo && <span className={`selo-st ${selo[1]}`}>{selo[0]}</span>}
              {cat && <span className="pilula" style={{ background: fundo, color: letra }}>{cat.nome}</span>}
            </div>
          )}
          {oc.tarefa?.exige_justificativa && atrasada && oc.data < hoje && !oc.justificativa && dono && <div className="meta" style={{ color: 'var(--erro)', fontWeight: 600 }}>Justifique o atraso para poder concluir.</div>}
        </div>
        {fotoUrl && <img src={fotoUrl} alt="" className="foto-mini" style={{ width: 44, height: 44 }} />}
        <button type="button" className={`abre ${aberto ? 'on' : ''}`} onClick={() => setAberto(!aberto)} aria-expanded={aberto}
          aria-label={`${aberto ? 'Fechar' : 'Ver'} detalhes de ${oc.tarefa?.titulo}`} title={aberto ? 'Fechar detalhes' : 'Ver detalhes'}><Icone nome="baixo" tam={22} /></button>
      </div>

      {aberto && (
        <div className="det">
          <div className="l"><span>Dia</span><span>{DIAS[diaSemana(oc.data)].replace(/^./, (c) => c.toUpperCase())}, {oc.data.slice(8, 10)}/{oc.data.slice(5, 7)}</span></div>
          <div className="l"><span>Horário</span><span>{horario}{oc.horario_travado ? ' · definido pelos pais' : ''}</span></div>
          <div className="l"><span>Situação</span><span>{STATUS_TXT[st]}{oc.conferido === 'conferido' ? ' · conferido' : oc.conferido === 'refazer' ? ' · pedido para refazer' : ''}</span></div>
          {oc.tarefa?.exige_foto && !feita && <div className="l"><span>Foto</span><span>Precisa de foto para concluir</span></div>}
          {oc.tarefa?.criada_por === oc.membro_id && <div className="l"><span>Origem</span><span>Criada pela própria pessoa</span></div>}
          {oc.justificativa && <div className="l"><span>Justificativa</span><span>“{oc.justificativa}”{oc.justificativa_status === 'aceita' ? ' (aceita)' : oc.justificativa_status === 'recusada' ? ' (recusada)' : ''}</span></div>}
          {fotoUrl && (
            <>
              <div className="l"><span>Foto</span><span>{oc.foto_tirada_em ? `tirada ${new Date(oc.foto_tirada_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })} às ${new Date(oc.foto_tirada_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}` : 'enviada'}</span></div>
              <a href={fotoUrl} target="_blank" rel="noreferrer"><img src={fotoUrl} alt={`Foto de ${oc.tarefa?.titulo}`} /></a>
            </>
          )}
          {((dono && !gestor && !crianca && ((st === 'pendente' || st === 'atrasada') && oc.tarefa?.permite_adiar || !feita && !oc.horario_travado)) || (dono && !gestor && feita && !oc.conferido) || editarHref) && (
            <div className="acoes">
              {dono && !gestor && !crianca && (st === 'pendente' || st === 'atrasada') && oc.tarefa?.permite_adiar ? <button type="button" className="btn sec peq" onClick={() => alternar('adiar')}>Adiar</button> : null}
              {dono && !gestor && !crianca && !feita && !oc.horario_travado && <button type="button" className="btn sec peq" onClick={() => alternar('horario')}>Horário</button>}
              {dono && !gestor && feita && !oc.conferido && (
                <Form acao={desfazer} fila="desfazer" rotulo={`Desfazer “${t}”`} discreto><input type="hidden" name="oc" value={oc.id} /><button className="btn sec peq">Desfazer</button></Form>
              )}
              {editarHref && <Link prefetch={false} className="btn sec peq" href={editarHref}><Icone nome="lapis" tam={16} />Editar</Link>}
            </div>
          )}
        </div>
      )}

      {aviso && <div className="aviso info" role="status" style={{ marginTop: 8, marginBottom: 0 }}>{aviso}</div>}

      {dono && !gestor && atrasada && (
        <div className="acoes" style={{ marginTop: 8 }}>
          <button type="button" className="btn sec peq" onClick={() => alternar('justificar')}>Justificar</button>
        </div>
      )}

      {paraConferir && (
        <div className="acoes" style={{ marginTop: 8 }}>
          <Form acao={conferir} fila="conferir" rotulo={`Conferir “${t}”`}><input type="hidden" name="oc" value={oc.id} /><input type="hidden" name="valor" value="conferido" /><button className="btn sec peq">Conferido</button></Form>
          <Form acao={conferir} fila="conferir" rotulo={`Pedir para refazer “${t}”`}><input type="hidden" name="oc" value={oc.id} /><input type="hidden" name="valor" value="refazer" /><button className="btn perigo peq">Pedir para refazer</button></Form>
        </div>
      )}

      {aba === 'tela' && tela && (
        <div className="painel-acao">
          <RealForm eu={oc.membro_id} membroId={oc.membro_id} familia={familia} data={tela.data} previsto={tela.previsto} atual={tela.atual} crianca={tela.crianca} aoConcluir={festejar} />
        </div>
      )}
      {aba === 'concluir' && (
        <div className="painel-acao">
          <Form acao={concluir} aoConcluir={festejar} msgSemInternet="Sem internet. Tarefas com foto só podem ser concluídas com internet. Tente de novo quando a conexão voltar.">
            <input type="hidden" name="oc" value={oc.id} />
            <Foto familia={familia} membro={oc.membro_id} obrigatoria={oc.tarefa?.exige_foto} soHoje />
            <button className="btn icone" onPointerDown={prepararSom} onKeyDown={prepararSom} style={{ marginTop: 10, width: 56 }} aria-label="Concluir" title="Concluir"><Icone nome="check" tam={24} cor="#fff" /></button>
          </Form>
        </div>
      )}
      {aba === 'justificar' && (
        <div className="painel-acao">
          <Form acao={justificar} fila="justificar" rotulo={`Justificativa de “${t}”`} okTxt="Justificativa enviada aos pais.">
            <input type="hidden" name="oc" value={oc.id} />
            <Motivos id={`j-${oc.id}`} name="texto" rotulo="Por que atrasou?" botao="Enviar justificativa" />
          </Form>
        </div>
      )}
      {aba === 'adiar' && (
        <div className="painel-acao">
          <Form acao={pedirAdiamento} fila="pedirAdiamento" rotulo={`Pedido para adiar “${t}”`} okTxt="Pedido enviado. Os pais vão responder.">
            <input type="hidden" name="oc" value={oc.id} />
            <label>Para quando?</label>
            <div className="chips" role="radiogroup" aria-label="Para quando?">
              {[['Amanhã', addDias(hoje, 1)], ['Depois de amanhã', addDias(hoje, 2)], ['Outro dia', 'outro']].map(([r, v]) => (
                <button key={v} type="button" role="radio" aria-checked={quando === v} className={quando === v ? 'on' : ''} onClick={() => setQuando(v)}>{r}</button>
              ))}
            </div>
            {quando && quando !== 'outro' && <input type="hidden" name="data" value={quando} />}
            {quando === 'outro' && (
              <div className="linha">
                <div><label htmlFor={`d-${oc.id}`}>Nova data</label><input id={`d-${oc.id}`} type="date" name="data" min={hoje} required /></div>
                <div><label htmlFor={`h-${oc.id}`}>Novo horário (opcional)</label><HorarioCampo id={`h-${oc.id}`} nomes={{ inicio: 'hora' }} /></div>
              </div>
            )}
            {quando && <Motivos id={`m-${oc.id}`} name="motivo" rotulo="Motivo" botao="Pedir para adiar" />}
          </Form>
        </div>
      )}
      {aba === 'horario' && (
        <div className="painel-acao">
          <Form acao={definirHorario} fila="definirHorario" rotulo={`Horário de “${t}”`} okTxt="Horário salvo.">
            <input type="hidden" name="oc" value={oc.id} />
            <label htmlFor={`i-${oc.id}`} style={{ marginTop: 0 }}>Horário</label>
            <HorarioCampo id={`i-${oc.id}`} inicio={hhmm(oc.hora_inicio) || ''} fim={hhmm(oc.hora_fim) || ''} nomes={{ inicio: 'inicio', fim: 'fim' }} />
            <button className="btn" style={{ marginTop: 10 }}>Salvar horário</button>
          </Form>
        </div>
      )}
    </div>
  );
}
