'use client';
import { useState } from 'react';
import Form from './Form';
import { salvarTarefa } from '@/app/acoes';
import { DIAS_CURTO, hhmm } from '@/lib/util';

export default function TarefaForm({ t, filhos, categorias, gestor, hoje }) {
  const [tipo, setTipo] = useState(t?.tipo || 'recorrente');
  const [rec, setRec] = useState(t?.recorrencia || 'diaria');
  const [comHora, setComHora] = useState(!!t?.hora_inicio);
  return (
    <Form acao={salvarTarefa} className="card">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      <label htmlFor="titulo">Tarefa</label>
      <input id="titulo" name="titulo" required maxLength={100} defaultValue={t?.titulo} placeholder="Ex.: Arrumar o quarto" />
      <div className="linha">
        {gestor && (
          <div><label htmlFor="responsavel">Para quem</label>
            <select id="responsavel" name="responsavel" defaultValue={t?.responsavel_id || filhos[0]?.id} required>
              {filhos.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select></div>
        )}
        <div><label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" defaultValue={t?.categoria_id || ''}>
            <option value="">Sem categoria</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select></div>
      </div>
      <div className="linha">
        <div><label htmlFor="tipo">Tipo</label>
          <select id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="recorrente">Repete (diária/semanal…)</option><option value="pontual">Só uma vez</option>
          </select></div>
        <div><label htmlFor="data_inicio">{tipo === 'pontual' ? 'Data' : 'Começa em'}</label>
          <input id="data_inicio" type="date" name="data_inicio" defaultValue={t?.data_inicio || hoje} required /></div>
        {tipo === 'recorrente' && <div><label htmlFor="data_fim">Termina em (opcional)</label><input id="data_fim" type="date" name="data_fim" defaultValue={t?.data_fim || ''} /></div>}
      </div>
      {tipo === 'recorrente' && (
        <>
          <label htmlFor="recorrencia">Repete</label>
          <select id="recorrencia" name="recorrencia" value={rec} onChange={(e) => setRec(e.target.value)}>
            <option value="diaria">Todo dia</option><option value="dias_semana">Dias da semana escolhidos</option>
            <option value="semanal">Uma vez por semana (mesmo dia do início)</option><option value="mensal">Uma vez por mês (mesmo dia do início)</option>
          </select>
          {rec === 'dias_semana' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }} role="group" aria-label="Dias da semana">
              {DIAS_CURTO.map((d, i) => (
                <label key={i} className="check" style={{ margin: 0, border: '1px solid var(--campo)', borderRadius: 10, padding: '6px 10px' }}>
                  <input type="checkbox" name="dias" value={i} defaultChecked={t?.dias_semana?.includes(i) ?? (i > 0 && i < 6)} />{d}
                </label>
              ))}
            </div>
          )}
        </>
      )}
      <label className="check" style={{ marginTop: 16 }}>
        <input type="checkbox" checked={comHora} onChange={(e) => setComHora(e.target.checked)} />Tem horário definido
      </label>
      <input type="hidden" name="com_horario" value={comHora ? '1' : '0'} />
      {comHora ? (
        <div className="linha">
          <div><label htmlFor="hora_inicio">Início</label><input id="hora_inicio" type="time" name="hora_inicio" required defaultValue={hhmm(t?.hora_inicio)} /></div>
          <div><label htmlFor="hora_fim">Fim (opcional)</label><input id="hora_fim" type="time" name="hora_fim" defaultValue={hhmm(t?.hora_fim)} /></div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '6px 0 0' }}>
          Sem horário: vale o dia todo{gestor ? ' e o filho pode encaixar o horário dele.' : '. Você pode pôr horário depois, na tela Hoje.'}
        </p>
      )}
      <label className="check" style={{ marginTop: 14 }}><input type="checkbox" name="exige_foto" value="1" defaultChecked={t?.exige_foto} />Exige foto para concluir</label>
      <label htmlFor="descricao">Detalhes (opcional)</label>
      <textarea id="descricao" name="descricao" maxLength={1000} defaultValue={t?.descricao || ''} />
      <button className="btn bloco" style={{ marginTop: 16 }}>Salvar tarefa</button>
    </Form>
  );
}
