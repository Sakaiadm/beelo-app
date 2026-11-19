'use client';
import { useState } from 'react';
import Form from './Form';
import Foto from './Foto';
import { salvarPrevisto, salvarTelaReal, proporTela } from '@/app/acoes';
import { fmtMin } from '@/lib/util';

const v = (m) => (m == null ? '' : fmtMin(m));

const SEG_SEX = [1, 2, 3, 4, 5];
const DIAS_NOME = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_ABREV = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
const ROTULO = { uma: 'Uma vez', diaria: 'Diariamente', semana: 'Seg. a Sex.' };

export function PrevistoForm({ membro, hoje }) {
  const [formato, setFormato] = useState('aparelho');
  const [opcao, setOpcao] = useState('semana'); // uma | diaria | semana | pers
  const [dias, setDias] = useState(SEG_SEX);
  const [folha, setFolha] = useState(null); // null | 'repetir' | 'pers'
  const [inicio, setInicio] = useState(hoje);
  const [fim, setFim] = useState('');
  const uma = opcao === 'uma';
  const modo = uma ? 'dia' : opcao === 'diaria' ? 'semana' : 'dias';
  const diasEnviados = opcao === 'semana' ? SEG_SEX : opcao === 'pers' ? dias : [];
  const resumo = opcao === 'pers' ? [...dias].sort().map((d) => DIAS_ABREV[d]).join(', ').replace(/, ([^,]*)$/, ' e $1') : ROTULO[opcao];
  const escolher = (o) => { setOpcao(o); setFolha(null); };
  const alternarDia = (d) => setDias((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]));
  const voltarPers = () => { if (dias.length === 0) setDias(SEG_SEX); setOpcao('pers'); setFolha('repetir'); };
  return (
    <Form acao={salvarPrevisto} okTxt="Previsto salvo.">
      <input type="hidden" name="membro" value={membro} />
      <input type="hidden" name="modo" value={modo} />
      <input type="hidden" name="fim" value={uma ? '' : fim} />
      {diasEnviados.map((d) => <input key={d} type="hidden" name="dias" value={d} />)}
      <div className="seg" role="radiogroup" aria-label="Formato">
        <button type="button" role="radio" aria-checked={formato === 'aparelho'} className={formato === 'aparelho' ? 'on' : ''} onClick={() => setFormato('aparelho')}>Celular e computador</button>
        <button type="button" role="radio" aria-checked={formato === 'total'} className={formato === 'total' ? 'on' : ''} onClick={() => setFormato('total')}>Só o total</button>
      </div>
      <input type="hidden" name="formato" value={formato} />
      {formato === 'aparelho' ? (
        <div className="linha">
          <div><label htmlFor={`pc-${membro}`}>Celular</label><input id={`pc-${membro}`} name="celular" placeholder="2h00" required /></div>
          <div><label htmlFor={`pp-${membro}`}>Computador</label><input id={`pp-${membro}`} name="computador" placeholder="1h00" required /></div>
        </div>
      ) : (
        <><label htmlFor={`pt-${membro}`}>Total do dia</label><input id={`pt-${membro}`} name="total" placeholder="3h00" required /></>
      )}
      <label htmlFor="repetir-tela">Repetir</label>
      <button id="repetir-tela" type="button" className="campo-botao" onClick={() => setFolha('repetir')}><span>{resumo}</span><span aria-hidden="true">›</span></button>
      <div className="linha">
        <div><label htmlFor={`pi-${membro}`}>{uma ? 'Dia' : 'Começa em'}</label><input id={`pi-${membro}`} type="date" name="inicio" min={hoje} value={inicio} onChange={(e) => setInicio(e.target.value)} required /></div>
        {!uma && (
          <div><label htmlFor={`pf-${membro}`}>Termina em</label>
            {fim ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input id={`pf-${membro}`} type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} />
                <button type="button" className="btn sec peq" onClick={() => setFim('')} aria-label="Nunca termina">Nunca</button>
              </div>
            ) : (
              <button id={`pf-${membro}`} type="button" className="campo-botao" onClick={() => setFim(inicio)}><span>Nunca</span><span aria-hidden="true">›</span></button>
            )}</div>
        )}
      </div>
      {(folha === 'repetir' || folha === 'pers') && (
        <div className="folha" role="dialog" aria-modal="true" aria-label={folha === 'pers' ? 'Personalizar' : 'Repetir'}>
          <div className="folha-in">
            <div className="folha-cab">
              <button type="button" className="folha-volta" aria-label="Voltar" onClick={folha === 'pers' ? voltarPers : () => setFolha(null)}>←</button>
              <h2>{folha === 'pers' ? 'Personalizar' : 'Repetir'}</h2>
            </div>
            {folha === 'repetir' && (
              <div className="folha-lista">
                {['uma', 'diaria', 'semana'].map((o) => (
                  <button key={o} type="button" className={opcao === o ? 'sel' : ''} onClick={() => escolher(o)}>{ROTULO[o]}</button>
                ))}
                <button type="button" className={opcao === 'pers' ? 'sel' : ''} onClick={() => { if (dias.length === 0) setDias(SEG_SEX); setFolha('pers'); }}>
                  <span>Personalizar{opcao === 'pers' ? ` · ${resumo}` : ''}</span><span aria-hidden="true">›</span>
                </button>
              </div>
            )}
            {folha === 'pers' && (
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
      <button className="btn bloco" style={{ marginTop: 14 }}>Salvar previsto</button>
    </Form>
  );
}

export function RealForm({ eu, data, previsto, atual, membroId, familia }) {
  const formato = previsto?.formato === 'total' ? 'total' : 'aparelho';
  return (
    <Form acao={salvarTelaReal} okTxt="Tempo de tela salvo.">
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="formato" value={formato} />
      <input type="hidden" name="membro" value={membroId} />
      {formato === 'total' ? (
        <div className="linha">
          <div><label>Previsto pelos pais</label><input value={previsto ? fmtMin(previsto.min_total) : 'Não definido'} readOnly disabled /></div>
          <div><label htmlFor="rt">Realizado (total)</label><input id="rt" name="total" placeholder="ex.: 2h30" defaultValue={v(atual?.min_total)} required /></div>
        </div>
      ) : (
        <>
          <div className="linha">
            <div><label>Celular previsto</label><input value={previsto ? fmtMin(previsto.min_celular) : 'Não definido'} readOnly disabled /></div>
            <div><label htmlFor="rc">Celular realizado</label><input id="rc" name="celular" placeholder="ex.: 2h10" defaultValue={v(atual?.min_celular)} required /></div>
          </div>
          <div style={{ marginTop: 8 }}><Foto nome="foto_celular" familia={familia} membro={eu} /></div>
          <div className="linha">
            <div><label>Computador previsto</label><input value={previsto ? fmtMin(previsto.min_computador) : 'Não definido'} readOnly disabled /></div>
            <div><label htmlFor="rp">Computador realizado</label><input id="rp" name="computador" placeholder="ex.: 45min" defaultValue={v(atual?.min_computador)} required /></div>
          </div>
        </>
      )}
      <div style={{ marginTop: 8 }}><Foto nome={formato === 'total' ? 'foto_celular' : 'foto_computador'} familia={familia} membro={eu} /></div>
      <label htmlFor="obs">Observação (opcional)</label>
      <input id="obs" name="obs" maxLength={300} defaultValue={atual?.obs || ''} placeholder="ex.: trabalho da faculdade no computador" />
      <button className="btn bloco" style={{ marginTop: 14 }}>Salvar</button>
    </Form>
  );
}

export function PropostaForm({ hoje, formato }) {
  return (
    <Form acao={proporTela} okTxt="Proposta enviada. Seus pais vão validar." limpar>
      <input type="hidden" name="formato" value={formato} />
      <label htmlFor="pdata">Dia</label>
      <input id="pdata" type="date" name="data" min={hoje} defaultValue={hoje} required />
      {formato === 'total' ? (
        <><label htmlFor="ptot">Total que você precisa</label><input id="ptot" name="total" placeholder="3h00" required /></>
      ) : (
        <div className="linha">
          <div><label htmlFor="pcel">Celular</label><input id="pcel" name="celular" placeholder="2h00" required /></div>
          <div><label htmlFor="ppc">Computador</label><input id="ppc" name="computador" placeholder="3h00" required /></div>
        </div>
      )}
      <label htmlFor="pmot">Motivo</label>
      <input id="pmot" name="motivo" required minLength={3} maxLength={500} placeholder="ex.: trabalho da faculdade" />
      <button className="btn sec" style={{ marginTop: 12 }}>Propor outro previsto</button>
    </Form>
  );
}
