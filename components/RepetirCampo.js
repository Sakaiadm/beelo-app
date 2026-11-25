'use client';
// @arquivo  RepetirCampo.js: campo "Repetir": Uma vez, Diariamente, Seg. a Sex., Personalizar.
// @tipo     componente
// @usa      ./Icone
// @usado-por components/TelaForms.js
import { useState } from 'react';
import Icone from './Icone';

// Campo "Repetir" com as mesmas opções das tarefas e do previsto de tela:
// Uma vez · Diariamente · Seg. a Sex. · Personalizar. Envia {nome}_opcao, {nome}_dias e {nome}_data.
const SEG_SEX = [1, 2, 3, 4, 5];
const DIAS_NOME = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_ABREV = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
const ROTULO = { uma: 'Uma vez', diaria: 'Diariamente', semana: 'Seg. a Sex.' };

export function opcaoDaTarefa(t) {
  if (!t) return { opcao: 'diaria', dias: SEG_SEX };
  if (t.tipo === 'pontual') return { opcao: 'uma', dias: SEG_SEX };
  if (t.recorrencia === 'dias_semana') {
    const d = [...(t.dias_semana || [])].sort();
    return d.join() === SEG_SEX.join() ? { opcao: 'semana', dias: SEG_SEX } : { opcao: 'pers', dias: d };
  }
  return { opcao: 'diaria', dias: SEG_SEX };
}

// Modo controlado (previsto de tela): passe opcao, dias e aoMudar(opcao, dias); semCampos não envia nada
// no formulário (a tela pai envia) e não mostra o campo de data de "Uma vez".
export default function RepetirCampo({ nome, rotulo = 'Repetir', inicial, dataInicial, hoje, opcao: opcaoC, dias: diasC, aoMudar, semCampos }) {
  const [opcaoS, setOpcaoS] = useState(inicial?.opcao || 'diaria');
  const [diasS, setDiasS] = useState(inicial?.dias || SEG_SEX);
  const opcao = opcaoC ?? opcaoS;
  const dias = diasC ?? diasS;
  const setOpcao = (o) => { setOpcaoS(o); aoMudar?.(o, dias); };
  const setDias = (f) => { const d = typeof f === 'function' ? f(dias) : f; setDiasS(d); aoMudar?.('pers', d); };
  const [dia, setDia] = useState(dataInicial || hoje);
  const [folha, setFolha] = useState(null); // null | 'repetir' | 'pers'
  const resumo = opcao === 'pers' ? [...dias].sort().map((d) => DIAS_ABREV[d]).join(', ').replace(/, ([^,]*)$/, ' e $1') : ROTULO[opcao];
  const escolher = (o) => { setOpcao(o); setFolha(null); };
  const alternarDia = (d) => setDias((x) => (x.includes(d) ? (x.length > 1 ? x.filter((y) => y !== d) : x) : [...x, d]));
  const diasEnviados = opcao === 'semana' ? SEG_SEX : opcao === 'pers' ? dias : [];
  return (
    <>
      {!semCampos && <input type="hidden" name={`${nome}_opcao`} value={opcao} />}
      {!semCampos && diasEnviados.map((d) => <input key={d} type="hidden" name={`${nome}_dias`} value={d} />)}
      <label htmlFor={`${nome}-rep`}>{rotulo}</label>
      <button id={`${nome}-rep`} type="button" className="campo-botao" onClick={() => setFolha('repetir')}><span>{resumo}</span><span aria-hidden="true">›</span></button>
      {opcao === 'uma' && !semCampos && (<><label htmlFor={`${nome}-dia`}>Dia</label><input id={`${nome}-dia`} type="date" name={`${nome}_data`} min={hoje} value={dia} onChange={(e) => setDia(e.target.value)} required /></>)}
      {folha && (
        <div className="folha" role="dialog" aria-modal="true" aria-label={folha === 'pers' ? 'Personalizar' : 'Repetir'}>
          <div className="folha-in">
            <div className="folha-cab">
              <button type="button" className="folha-volta" aria-label="Voltar" onClick={folha === 'pers' ? () => { setOpcao('pers'); setFolha('repetir'); } : () => setFolha(null)}><Icone nome="esq" tam={26} /></button>
              <h2>{folha === 'pers' ? 'Personalizar' : 'Repetir'}</h2>
            </div>
            {folha === 'repetir' ? (
              <div className="folha-lista">
                {['uma', 'diaria', 'semana'].map((o) => (
                  <button key={o} type="button" className={opcao === o ? 'sel' : ''} onClick={() => escolher(o)}>{ROTULO[o]}</button>
                ))}
                <button type="button" className={opcao === 'pers' ? 'sel' : ''} onClick={() => setFolha('pers')}>
                  <span>Personalizar{opcao === 'pers' ? ` · ${resumo}` : ''}</span><span aria-hidden="true">›</span>
                </button>
              </div>
            ) : (
              <div className="folha-lista">
                {DIAS_NOME.map((n, i) => ({ n, i })).sort((x, y) => ((x.i + 6) % 7) - ((y.i + 6) % 7)).map(({ n, i }) => (
                  <button key={i} type="button" role="checkbox" aria-checked={dias.includes(i)} onClick={() => alternarDia(i)}>
                    <span>{n}</span><span className={`bolinha ${dias.includes(i) ? 'on' : ''}`} aria-hidden="true">{dias.includes(i) ? '✓' : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
