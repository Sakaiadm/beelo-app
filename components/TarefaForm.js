'use client';
import Icone from './Icone';
import HorarioCampo from './HorarioCampo';
import Pessoas from './Pessoas';
import { useState } from 'react';
import Form from './Form';
import { salvarTarefa } from '@/app/acoes';
import { hhmm } from '@/lib/util';
import { SUGESTOES, IDADES, ICONE_CAT, resumoSugestao } from '@/lib/sugestoes';

// Sugestões que aparecem já na tela, abaixo do campo Tarefa (Raio-X U24).
const RAPIDAS = ['Arrumar a cama', 'Arrumar o quarto', 'Lavar a louça', 'Ler por 20 minutos', 'Escovar os dentes', 'Lição de casa'];

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

export default function TarefaForm({ t, filhos, categorias, gestor, hoje, voltar, euId, paraId }) {
  // Para quem (U21): ao criar, dá para marcar várias pessoas; ao editar, é uma só.
  const [para, setPara] = useState(() => [t?.responsavel_id || paraId || (filhos.find((f) => f.id !== euId) || filhos[0])?.id].filter(Boolean));
  const escolherPessoa = (id) => setPara((x) => (t?.id ? [id] : x.includes(id) ? (x.length > 1 ? x.filter((y) => y !== id) : x) : [...x, id]));
  const [opcao, setOpcao] = useState(opcaoInicial(t));
  const [dias, setDias] = useState(t?.recorrencia === 'dias_semana' && t.dias_semana?.length ? [...t.dias_semana] : SEG_SEX);
  const [folha, setFolha] = useState(null); // null | 'repetir' | 'pers'
  const [fim, setFim] = useState(t?.data_fim || '');
  const [titulo, setTitulo] = useState(t?.titulo || '');
  const [cat, setCat] = useState(t?.categoria_id || '');
  const [hora, setHora] = useState({ i: hhmm(t?.hora_inicio) || '', f: hhmm(t?.hora_fim) || '', n: 0 });
  const comHora = !!hora.i;
  const [adiar, setAdiar] = useState(t ? !!t.permite_adiar : false);
  const [justif, setJustif] = useState(!!t?.exige_justificativa);
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
    setHora((h) => ({ i: x.hora || '', f: '', n: h.n + 1 })); setFolha(null);
  };
  const catsSug = [...new Set(SUGESTOES.map((x) => x.cat))];
  const rapidas = RAPIDAS.map((n) => SUGESTOES.find((x) => x.nome === n)).filter(Boolean);
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
      <label htmlFor="titulo" style={{ marginTop: 0 }}>Tarefa</label>
      <input id="titulo" name="titulo" required maxLength={100} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Arrumar o quarto" />
      {!t?.id && (
        <div className="chips sug-rapidas" aria-label="Sugestões">
          {rapidas.map((x) => <button key={x.nome} type="button" onClick={() => usar(x)}>{x.nome}</button>)}
          <button type="button" className="ver-todas" onClick={() => setFolha('sug')}><Icone nome="lampada" tam={16} />Ver todas</button>
        </div>
      )}
      {gestor && <>
        <label>Para quem</label>
        <Pessoas rotulo="Para quem" multi={!t?.id} aoEscolher={escolherPessoa} itens={filhos.map((f) => ({ id: f.id, nome: f.id === euId ? 'Eu' : f.nome, cor: f.cor, on: para.includes(f.id) }))} />
        {para.map((id) => <input key={id} type="hidden" name="responsavel" value={id} />)}
      </>}
      <label htmlFor="repetir">Repetir</label>
      <button id="repetir" type="button" className="campo-botao" onClick={() => setFolha('repetir')}><span>{resumo}</span><span aria-hidden="true">›</span></button>
      <label htmlFor="horario">Horário</label>
      <HorarioCampo key={hora.n} inicio={hora.i} fim={hora.f} aoMudar={(i, f) => setHora((h) => ({ ...h, i, f }))} />
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
                  <span>{x.nome}<small style={{ display: 'block', color: 'var(--cinza)', fontSize: 'var(--f-apoio)' }}>{resumoSugestao(x)}</small></span><span aria-hidden="true">›</span>
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
      <details className="mais-op form-mais" open={!!t?.id && !!(t.descricao || t.exige_foto || t.prioritaria || t.data_fim)}>
        <summary>Mais opções</summary>
        <label>Categoria</label>
        {categorias.length <= 5 ? (
          <div className="seg" role="radiogroup" aria-label="Categoria">
            {[{ id: '', nome: 'Nenhuma' }, ...categorias].map((c) => <button key={c.id || 'x'} type="button" role="radio" aria-checked={cat === c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>{c.nome}</button>)}
          </div>
        ) : (
          <select id="categoria" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
            <option value="">Sem categoria</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}
        <input type="hidden" name="categoria" value={cat} />
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
        <div className="chaves-form">
          <label className="check"><input type="checkbox" name="exige_foto" value="1" checked={foto} onChange={(e) => setFoto(e.target.checked)} /><span>Exige foto para concluir{foto && <small>A foto precisa ser de hoje.</small>}</span></label>
          {gestor && <label className="check"><input type="checkbox" name="permite_adiar" value="1" checked={adiar} onChange={(e) => setAdiar(e.target.checked)} /><span>Pode adiar{adiar && <small>A pessoa pede e você aprova.</small>}</span></label>}
          {gestor && <label className="check"><input type="checkbox" name="exige_justificativa" value="1" checked={justif} onChange={(e) => setJustif(e.target.checked)} /><span>Exige justificativa se atrasar{justif && <small>Sem ela, a tarefa atrasada não conclui.</small>}</span></label>}
          <label className="check"><input type="checkbox" name="prioritaria" value="1" checked={prio} onChange={(e) => setPrio(e.target.checked)} /><span>Prioritária <Icone nome="bandeira" tam={16} cor="var(--prio)" />{prio && <small>Vem primeiro na lista.</small>}</span></label>
          {prio && comHora && (
            <div>
              <label style={{ marginTop: 0 }}>Lembrete extra</label>
              <LembreteExtra inicial={t?.lembrete_min} />
            </div>
          )}
        </div>
        <label htmlFor="descricao">Detalhes (opcional)</label>
        <textarea id="descricao" name="descricao" maxLength={1000} defaultValue={t?.descricao || ''} />
      </details>
      <button className="btn bloco" style={{ marginTop: 16 }}>Salvar tarefa</button>
    </Form>
  );
}

// Lembrete extra: 4 opções lado a lado (Raio-X V6: até 5 opções, sem lista suspensa).
function LembreteExtra({ inicial }) {
  const [v, setV] = useState(String(inicial || 15));
  const ops = [['15', '15 min'], ['30', '30 min'], ['60', '1 h'], ['0', 'Nenhum']];
  return (
    <>
      <div className="seg" role="radiogroup" aria-label="Lembrete extra">
        {ops.map(([k, r]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? 'on' : ''} onClick={() => setV(k)}>{r}</button>)}
      </div>
      <input type="hidden" name="lembrete_min" value={v} />
    </>
  );
}
