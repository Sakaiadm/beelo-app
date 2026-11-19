'use client';
import { useState } from 'react';
import Form from './Form';
import { salvarTarefa } from '@/app/acoes';
import { DIAS_CURTO, hhmm } from '@/lib/util';

const SEG_SEX = [1, 2, 3, 4, 5];
const DIAS_NOME = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_ABREV = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
const ROTULO = { uma: 'Uma vez', diaria: 'Diariamente', semana: 'Seg. a Sex.', semanal: 'Toda semana (mesmo dia do início)', mensal: 'Todo mês (mesmo dia do início)' };

function opcaoInicial(t) {
  if (!t) return 'diaria';
  if (t.tipo === 'pontual') return 'uma';
  if (t.recorrencia === 'diaria') return 'diaria';
  if (t.recorrencia === 'semanal') return 'semanal';
  if (t.recorrencia === 'mensal') return 'mensal';
  const d = [...(t.dias_semana || [])].sort().join();
  return d === SEG_SEX.join() ? 'semana' : 'pers';
}

export default function TarefaForm({ t, filhos, categorias, gestor, hoje }) {
  const [opcao, setOpcao] = useState(opcaoInicial(t));
  const [dias, setDias] = useState(t?.recorrencia === 'dias_semana' && t.dias_semana?.length ? [...t.dias_semana] : SEG_SEX);
  const [folha, setFolha] = useState(null); // null | 'repetir' | 'pers'
  const [fim, setFim] = useState(t?.data_fim || '');
  const [comHora, setComHora] = useState(!!t?.hora_inicio);
  const uma = opcao === 'uma';
  const diasEnviados = opcao === 'semana' ? SEG_SEX : opcao === 'pers' ? dias : [];
  const resumo = opcao === 'pers'
    ? [...dias].sort().map((d) => DIAS_ABREV[d]).join(', ').replace(/, ([^,]*)$/, ' e $1')
    : ROTULO[opcao];
  const escolher = (o) => { setOpcao(o); setFolha(null); };
  const alternarDia = (d) => setDias((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]));
  const voltarPers = () => { if (dias.length === 0) setDias(SEG_SEX); setOpcao('pers'); setFolha('repetir'); };
  return (
    <Form acao={salvarTarefa} className="card">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      <input type="hidden" name="tipo" value={uma ? 'pontual' : 'recorrente'} />
      <input type="hidden" name="recorrencia" value={opcao === 'semana' || opcao === 'pers' ? 'dias_semana' : opcao === 'uma' ? '' : opcao} />
      {diasEnviados.map((d) => <input key={d} type="hidden" name="dias" value={d} />)}
      <input type="hidden" name="data_fim" value={uma ? '' : fim} />
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
      <label htmlFor="repetir">Repetir</label>
      <button id="repetir" type="button" className="campo-botao" onClick={() => setFolha('repetir')}><span>{resumo}</span><span aria-hidden="true">›</span></button>
      <div className="linha">
        <div><label htmlFor="data_inicio">{uma ? 'Data' : 'Começa em'}</label>
          <input id="data_inicio" type="date" name="data_inicio" defaultValue={t?.data_inicio || hoje} required /></div>
        {!uma && (
          <div><label htmlFor="fim_data">Termina em</label>
            {fim ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="fim_data" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
                <button type="button" className="btn sec peq" onClick={() => setFim('')} aria-label="Nunca termina">Nunca</button>
              </div>
            ) : (
              <button id="fim_data" type="button" className="campo-botao" onClick={() => setFim(t?.data_inicio || hoje)}><span>Nunca</span><span aria-hidden="true">›</span></button>
            )}</div>
        )}
      </div>
      {folha && (
        <div className="folha" role="dialog" aria-modal="true" aria-label={folha === 'pers' ? 'Personalizar' : 'Repetir'}>
          <div className="folha-in">
            <div className="folha-cab">
              <button type="button" className="folha-volta" aria-label="Voltar" onClick={folha === 'pers' ? voltarPers : () => setFolha(null)}>←</button>
              <h2>{folha === 'pers' ? 'Personalizar' : 'Repetir'}</h2>
            </div>
            {folha === 'repetir' && (
              <>
                <div className="folha-lista">
                  {['uma', 'diaria', 'semana'].map((o) => (
                    <button key={o} type="button" className={opcao === o ? 'sel' : ''} onClick={() => escolher(o)}>{ROTULO[o]}</button>
                  ))}
                  <button type="button" className={opcao === 'pers' ? 'sel' : ''} onClick={() => { if (dias.length === 0) setDias(SEG_SEX); setFolha('pers'); }}>
                    <span>Personalizar{opcao === 'pers' ? ` · ${resumo}` : ''}</span><span aria-hidden="true">›</span>
                  </button>
                </div>
                <div className="folha-lista">
                  {['semanal', 'mensal'].map((o) => (
                    <button key={o} type="button" className={opcao === o ? 'sel' : ''} onClick={() => escolher(o)}>{ROTULO[o]}</button>
                  ))}
                </div>
              </>
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
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label className="check"><input type="checkbox" name="exige_foto" value="1" defaultChecked={t?.exige_foto} />Exige foto para concluir</label>
        {gestor && <label className="check"><input type="checkbox" name="permite_adiar" value="1" defaultChecked={t?.permite_adiar} />Pode adiar</label>}
        {gestor && <label className="check"><input type="checkbox" name="exige_justificativa" value="1" defaultChecked={t?.exige_justificativa} />Exige justificativa se atrasar</label>}
      </div>
      <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '8px 0 0' }}>Tudo desligado: o filho conclui com um toque, sem foto, e não pode adiar. Foto: precisa ser de hoje. Justificativa: sem ela, a tarefa atrasada não conclui.</p>
      <label htmlFor="descricao">Detalhes (opcional)</label>
      <textarea id="descricao" name="descricao" maxLength={1000} defaultValue={t?.descricao || ''} />
      <button className="btn bloco" style={{ marginTop: 16 }}>Salvar tarefa</button>
    </Form>
  );
}
