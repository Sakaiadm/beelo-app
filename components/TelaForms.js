'use client';
import { useState } from 'react';
import Form from './Form';
import Foto from './Foto';
import { salvarPrevisto, salvarTelaReal, proporTela } from '@/app/acoes';
import { DIAS_CURTO, fmtMin } from '@/lib/util';

const v = (m) => (m == null ? '' : fmtMin(m));

export function PrevistoForm({ membro, hoje }) {
  const [formato, setFormato] = useState('aparelho');
  const [modo, setModo] = useState('dias');
  return (
    <Form acao={salvarPrevisto} okTxt="Previsto salvo." limpar>
      <input type="hidden" name="membro" value={membro} />
      <label>Formato</label>
      <div className="abas" role="radiogroup">
        <a href="#" role="radio" aria-checked={formato === 'aparelho'} className={formato === 'aparelho' ? 'ativo' : ''} onClick={(e) => { e.preventDefault(); setFormato('aparelho'); }}>Por aparelho</a>
        <a href="#" role="radio" aria-checked={formato === 'total'} className={formato === 'total' ? 'ativo' : ''} onClick={(e) => { e.preventDefault(); setFormato('total'); }}>Só o total</a>
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
      <label htmlFor={`modo-${membro}`}>Vale para</label>
      <select id={`modo-${membro}`} name="modo" value={modo} onChange={(e) => setModo(e.target.value)}>
        <option value="dia">Um dia</option><option value="dias">Dias da semana escolhidos</option><option value="semana">Semana inteira</option>
      </select>
      {modo === 'dia' && <><label htmlFor={`pd-${membro}`}>Dia</label><input id={`pd-${membro}`} type="date" name="data" min={hoje} defaultValue={hoje} required /></>}
      {modo === 'dias' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }} role="group" aria-label="Dias da semana">
          {DIAS_CURTO.map((d, i) => (
            <label key={i} className="check" style={{ margin: 0, border: '1px solid var(--campo)', borderRadius: 10, padding: '6px 10px' }}>
              <input type="checkbox" name="dias" value={i} defaultChecked={i > 0 && i < 6} />{d}
            </label>
          ))}
        </div>
      )}
      {modo !== 'dia' && <label className="check" style={{ marginTop: 12 }}><input type="checkbox" name="fixado" value="1" defaultChecked />Fixar (repete toda semana até eu mudar)</label>}
      <button className="btn" style={{ marginTop: 14 }}>Salvar previsto</button>
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
