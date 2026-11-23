'use client';
import Icone from './Icone';
import HoraFim from './HoraFim';
import { useState } from 'react';
import Form from './Form';
import { salvarTarefa } from '@/app/acoes';
import { hhmm } from '@/lib/util';
import { SUGESTOES, IDADES, ICONE_CAT, resumoSugestao } from '@/lib/sugestoes';

const SEG_SEX = [1, 2, 3, 4, 5];
const DIAS_NOME = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIAS_ABREV = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
const NOME_CURTO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const ARTIGO = ['no', 'na', 'na', 'na', 'na', 'na', 'no'];
function rotulos(inicio) {
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(inicio || '') ? new Date(inicio + 'T12:00:00Z') : null;
  const ds = dt ? dt.getUTCDay() : null;
  return {
    uma: 'Uma vez', diaria: 'Diariamente', semana: 'Seg. a Sex.',
    semanal: ds == null ? 'Toda semana' : `Toda semana, ${ARTIGO[ds]} ${NOME_CURTO[ds]}`,
    mensal: dt ? `Todo mês, no dia ${dt.getUTCDate()}` : 'Todo mês',
  };
}

function opcaoInicial(t) {
  if (!t) return 'diaria';
  if (t.tipo === 'pontual') return 'uma';
  if (t.recorrencia === 'diaria') return 'diaria';
  if (t.recorrencia === 'semanal') return 'semanal';
  if (t.recorrencia === 'mensal') return 'mensal';
  const d = [...(t.dias_semana || [])].sort().join();
  return d === SEG_SEX.join() ? 'semana' : 'pers';
}

export default function TarefaForm({ t, filhos, categorias, gestor, hoje, voltar, euId }) {
  const [opcao, setOpcao] = useState(opcaoInicial(t));
  const [dias, setDias] = useState(t?.recorrencia === 'dias_semana' && t.dias_semana?.length ? [...t.dias_semana] : SEG_SEX);
  const [folha, setFolha] = useState(null); // null | 'repetir' | 'pers'
  const [fim, setFim] = useState(t?.data_fim || '');
  const [comHora, setComHora] = useState(!!t?.hora_inicio);
  const [titulo, setTitulo] = useState(t?.titulo || '');
  const [cat, setCat] = useState(t?.categoria_id || '');
  const [horaIni, setHoraIni] = useState(hhmm(t?.hora_inicio));
  const [horaFim, setHoraFim] = useState(hhmm(t?.hora_fim));
  const [foto, setFoto] = useState(!!t?.exige_foto);
  const [prio, setPrio] = useState(!!t?.prioritaria);
  const [fCat, setFCat] = useState('Casa');
  const [fIdade, setFIdade] = useState('');
  const [inicio, setInicio] = useState(t?.data_inicio || hoje);
  const ROTULO = rotulos(inicio);
  const uma = opcao === 'uma';
  const diasEnviados = opcao === 'semana' ? SEG_SEX : opcao === 'pers' ? dias : [];
  const resumo = opcao === 'pers'
    ? [...dias].sort().map((d) => DIAS_ABREV[d]).join(', ').replace(/, ([^,]*)$/, ' e $1')
    : ROTULO[opcao];
  const escolher = (o) => { setOpcao(o); setFolha(null); };
  // Personalizar precisa de pelo menos um dia: o último não desmarca (e a tela explica).
  const [umDia, setUmDia] = useState(false);
  const alternarDia = (d) => {
    if (dias.includes(d) && dias.length === 1) { setUmDia(true); return; }
    setUmDia(false); setDias((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]));
  };
  const usar = (x) => {
    setTitulo(x.nome); setOpcao(x.rec); setDias(x.dias || SEG_SEX); setFoto(!!x.foto);
    setCat(categorias.find((c) => c.nome.toLowerCase().startsWith(x.cat.toLowerCase()))?.id || '');
    setComHora(!!x.hora); setHoraIni(x.hora || ''); setHoraFim(''); setFolha(null);
  };
  const catsSug = [...new Set(SUGESTOES.map((x) => x.cat))];
  const listaSug = SUGESTOES.filter((x) => x.cat === fCat && (!fIdade || x.idade.includes(fIdade)));
  const voltarPers = () => { if (dias.length === 0) setDias(SEG_SEX); setOpcao('pers'); setFolha('repetir'); };
  return (
    <Form acao={salvarTarefa} className="card">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <input type="hidden" name="tipo" value={uma ? 'pontual' : 'recorrente'} />
      <input type="hidden" name="recorrencia" value={opcao === 'semana' || opcao === 'pers' ? 'dias_semana' : opcao === 'uma' ? '' : opcao} />
      {diasEnviados.map((d) => <input key={d} type="hidden" name="dias" value={d} />)}
      <input type="hidden" name="data_fim" value={uma ? '' : fim} />
      {t?.id ? <label htmlFor="titulo">Tarefa</label> : (
        <div className="rot-sug">
          <label htmlFor="titulo">Tarefa</label>
          <button type="button" className="btn peq sugestao-btn" onClick={() => setFolha('sug')}><Icone nome="lampada" tam={18} cor="#fff" />Sugestões</button>
        </div>
      )}
      <input id="titulo" name="titulo" required maxLength={100} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Arrumar o quarto" />
      <div className="linha">
        {gestor && (
          <div><label htmlFor="responsavel">Para quem</label>
            <select id="responsavel" name="responsavel" defaultValue={t?.responsavel_id || (filhos.find((f) => f.id !== euId) || filhos[0])?.id} required>
              {filhos.map((f) => <option key={f.id} value={f.id}>{f.id === euId ? `Eu mesmo (${f.nome})` : f.nome}</option>)}
            </select></div>
        )}
        <div><label htmlFor="categoria">Categoria</label>
          <select id="categoria" name="categoria" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Sem categoria</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select></div>
      </div>
      <label htmlFor="repetir">Repetir</label>
      <button id="repetir" type="button" className="campo-botao" onClick={() => setFolha('repetir')}><span>{resumo}</span><span aria-hidden="true">›</span></button>
      <div className="linha">
        <div><label htmlFor="data_inicio">{uma ? 'Data' : 'Começa em'}</label>
          <input id="data_inicio" type="date" name="data_inicio" value={inicio} onChange={(e) => setInicio(e.target.value)} required /></div>
        {!uma && (
          <div><label htmlFor="fim_data">Termina em</label>
            {fim ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="fim_data" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
                <button type="button" className="btn sec peq" onClick={() => setFim('')} aria-label="Nunca termina">Nunca</button>
              </div>
            ) : (
              <button id="fim_data" type="button" className="campo-botao" onClick={() => setFim(inicio)}><span>Nunca</span><span aria-hidden="true">›</span></button>
            )}</div>
        )}
      </div>
      {folha === 'sug' && (
        <div className="folha" role="dialog" aria-modal="true" aria-label="Sugestões">
          <div className="folha-in">
            <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setFolha(null)}><Icone nome="esq" tam={26} /></button><h2>Sugestões</h2></div>
            <div className="grade-cat" role="group" aria-label="Categoria">
              {catsSug.map((c) => <button key={c} type="button" className={fCat === c ? 'on' : ''} aria-pressed={fCat === c} onClick={() => setFCat(c)}><Icone nome={ICONE_CAT[c] || 'etiqueta'} tam={22} larg={1.8} /><span>{c}</span></button>)}
            </div>
            <div className="seg" role="group" aria-label="Idade">
              <button type="button" className={fIdade === '' ? 'on' : ''} aria-pressed={fIdade === ''} onClick={() => setFIdade('')}>Todas</button>
              {IDADES.map(([k, n]) => <button key={k} type="button" className={fIdade === k ? 'on' : ''} aria-pressed={fIdade === k} onClick={() => setFIdade(k)}>{n}</button>)}
            </div>
            <div className="folha-lista">
              {listaSug.length === 0 && <div style={{ padding: 16, color: 'var(--cinza)' }}>Nenhuma sugestão para essa idade nesta categoria.</div>}
              {listaSug.map((x) => (
                <button key={x.nome} type="button" onClick={() => usar(x)}>
                  <span>{x.nome}<small style={{ display: 'block', color: 'var(--cinza)', fontSize: 13 }}>{resumoSugestao(x)}</small></span><span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {(folha === 'repetir' || folha === 'pers') && (
        <div className="folha" role="dialog" aria-modal="true" aria-label={folha === 'pers' ? 'Personalizar' : 'Repetir'}>
          <div className="folha-in">
            <div className="folha-cab">
              <button type="button" className="folha-volta" aria-label="Voltar" onClick={folha === 'pers' ? voltarPers : () => setFolha(null)}><Icone nome="esq" tam={26} /></button>
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
              </>
            )}
            {folha === 'pers' && (
              <div className="folha-lista">
                {DIAS_NOME.map((n, i) => ({ n, i })).sort((x, y) => ((x.i + 6) % 7) - ((y.i + 6) % 7)).map(({ n, i }) => (
                  <button key={i} type="button" role="checkbox" aria-checked={dias.includes(i)} onClick={() => alternarDia(i)}>
                    <span>{n}</span><span className={`bolinha ${dias.includes(i) ? 'on' : ''}`} aria-hidden="true">{dias.includes(i) ? '✓' : ''}</span>
                  </button>
                ))}
                {umDia && <p className="ajuda" role="status" style={{ padding: '8px 16px', margin: 0 }}>Escolha pelo menos um dia.</p>}
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
          <div><label htmlFor="hora_inicio">Início</label><input id="hora_inicio" type="time" name="hora_inicio" required value={horaIni} onChange={(e) => setHoraIni(e.target.value)} /></div>
          <div><label htmlFor="hora_fim">Fim (opcional)</label><HoraFim id="hora_fim" name="hora_fim" value={horaFim || ''} onChange={setHoraFim} /></div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '6px 0 0' }}>
          Sem horário: vale o dia todo{gestor ? ' e o filho pode encaixar o horário dele.' : '. Você pode pôr horário depois, na tela Hoje.'}
        </p>
      )}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label className="check"><input type="checkbox" name="exige_foto" value="1" checked={foto} onChange={(e) => setFoto(e.target.checked)} />Exige foto para concluir</label>
        {gestor && <label className="check"><input type="checkbox" name="permite_adiar" value="1" defaultChecked={t?.permite_adiar} />Pode adiar</label>}
        {gestor && <label className="check"><input type="checkbox" name="exige_justificativa" value="1" defaultChecked={t?.exige_justificativa} />Exige justificativa se atrasar</label>}
        <label className="check"><input type="checkbox" name="prioritaria" value="1" checked={prio} onChange={(e) => setPrio(e.target.checked)} />Prioritária <Icone nome="bandeira" tam={16} cor="var(--prio)" /></label>
        {prio && (comHora ? (
          <div>
            <label htmlFor="lembrete_min" style={{ marginTop: 0 }}>Lembrete extra</label>
            <select id="lembrete_min" name="lembrete_min" defaultValue={t?.lembrete_min || 15}>
              <option value="15">15 min antes do horário</option>
              <option value="30">30 min antes do horário</option>
              <option value="60">1 h antes do horário</option>
              <option value="0">Sem lembrete extra</option>
            </select>
          </div>
        ) : <p className="ajuda" style={{ margin: 0 }}>Ganha a bandeirinha e vem primeiro na lista. O lembrete extra só vale para tarefa com horário.</p>)}
      </div>
      <p style={{ fontSize: 13, color: 'var(--cinza)', margin: '8px 0 0' }}>Tudo desligado: o filho conclui com um toque, sem foto, e não pode adiar. Foto: precisa ser de hoje. Justificativa: sem ela, a tarefa atrasada não conclui.</p>
      <label htmlFor="descricao">Detalhes (opcional)</label>
      <textarea id="descricao" name="descricao" maxLength={1000} defaultValue={t?.descricao || ''} />
      <button className="btn bloco" style={{ marginTop: 16 }}>Salvar tarefa</button>
    </Form>
  );
}
