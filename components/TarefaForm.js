'use client';
// @arquivo  TarefaForm.js: formulário de criar/editar tarefa.
// @tipo     componente
// @usa      ./Icone, ./HorarioCampo, ./Form, app/acoes, lib/util, lib/sugestoes
// @usado-por app/(app)/tarefas/[id]/editar/page.js, app/(app)/tarefas/nova/page.js
// @decisao  "O que é": Tarefa ou Chegada (um toque de aviso aos pais, migração 0027). Só aparece para Pai e Mãe.
import Icone from './Icone';
import HorarioCampo from './HorarioCampo';
import { useState } from 'react';
import Form from './Form';
import { salvarTarefa } from '@/app/acoes';
import { hhmm } from '@/lib/util';
import { SUGESTOES, IDADES, ICONE_CAT, CHEGADAS, resumoSugestao } from '@/lib/sugestoes';


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
  const [opcao, setOpcao] = useState(opcaoInicial(t));
  const [dias, setDias] = useState(t?.recorrencia === 'dias_semana' && t.dias_semana?.length ? [...t.dias_semana] : SEG_SEX);
  const [folha, setFolha] = useState(null); // null | 'repetir' | 'pers'
  const [fim, setFim] = useState(t?.data_fim || '');
  const [titulo, setTitulo] = useState(t?.titulo || '');
  const [cat, setCat] = useState(t?.categoria_id || '');
  const [hora, setHora] = useState({ i: hhmm(t?.hora_inicio) || '', f: hhmm(t?.hora_fim) || '', n: 0 });
  const comHora = !!hora.i;
  const [adiar, setAdiar] = useState(t ? !!t.permite_adiar : false);
  const [livre, setLivre] = useState(t ? !!t.adiar_livre : false);
  const [justif, setJustif] = useState(!!t?.exige_justificativa);
  const [foto, setFoto] = useState(!!t?.exige_foto);
  const [prio, setPrio] = useState(!!t?.prioritaria);
  // Chegada (migração 0027): tarefa de um toque ("Cheguei"/"Tudo certo"). Só Pai e Mãe criam.
  const [chegada, setChegada] = useState(t?.especial === 'chegada');
  const [lembrarPessoa, setLembrarPessoa] = useState(t ? t.chegada_lembrar !== false : true);
  const [avisarPais, setAvisarPais] = useState(!!t?.chegada_avisar_pais);
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
  const listaSug = SUGESTOES.filter((x) => x.cat === fCat && (!fIdade || x.idade.includes(fIdade)));
  const voltarPers = () => { if (dias.length === 0) setDias(SEG_SEX); setOpcao('pers'); setFolha('repetir'); };
  return (
    <Form acao={salvarTarefa} className="card">
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <input type="hidden" name="tipo" value={uma ? 'pontual' : 'recorrente'} />
      <input type="hidden" name="chegada" value={chegada ? '1' : '0'} />
      <input type="hidden" name="era_chegada" value={t?.especial === 'chegada' ? '1' : '0'} />
      {gestor && (
        <>
          <label style={{ marginTop: 0 }}>O que é</label>
          <div className="seg" role="radiogroup" aria-label="O que é">
            <button type="button" role="radio" aria-checked={!chegada} className={!chegada ? 'on' : ''} onClick={() => setChegada(false)}>Tarefa</button>
            <button type="button" role="radio" aria-checked={chegada} className={chegada ? 'on' : ''} onClick={() => setChegada(true)}>Chegada</button>
          </div>
          {chegada && <p className="peq-cinza" style={{ margin: '-4px 0 6px' }}>Um toque em &quot;Cheguei&quot; avisa você. Sem rastrear o celular.</p>}
        </>
      )}
      <input type="hidden" name="recorrencia" value={opcao === 'semana' || opcao === 'pers' ? 'dias_semana' : opcao === 'uma' ? '' : opcao} />
      {diasEnviados.map((d) => <input key={d} type="hidden" name="dias" value={d} />)}
      <input type="hidden" name="data_fim" value={uma ? '' : fim} />
      {t?.id ? <label htmlFor="titulo" style={{ marginTop: gestor ? undefined : 0 }}>Tarefa</label> : chegada ? (
        // @regra Chegada: botão Sugestões abre a lista de destinos (lib/sugestoes.js CHEGADAS); um toque preenche o título.
        <div className="rot-sug">
          <label htmlFor="titulo" style={{ marginTop: gestor ? undefined : 0 }}>Tarefa</label>
          <button type="button" className="btn peq sugestao-btn" onClick={() => setFolha('cheg')}><Icone nome="lampada" tam={18} cor="#fff" />Sugestões</button>
        </div>
      ) : (
        <div className="rot-sug">
          <label htmlFor="titulo" style={{ marginTop: gestor ? undefined : 0 }}>Tarefa</label>
          <button type="button" className="btn peq sugestao-btn" onClick={() => setFolha('sug')}><Icone nome="lampada" tam={18} cor="#fff" />Sugestões</button>
        </div>
      )}
      <input id="titulo" name="titulo" required maxLength={100} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={chegada ? 'Ex.: Chegar na escola' : 'Ex.: Arrumar o quarto'} />
      {gestor && <>
        <label htmlFor="responsavel">Para quem</label>
        <select id="responsavel" name="responsavel" defaultValue={t?.responsavel_id || paraId || (filhos.find((f) => f.id !== euId) || filhos[0])?.id} required>
          {filhos.map((f) => <option key={f.id} value={f.id}>{f.id === euId ? `Eu mesmo (${f.nome})` : f.nome}</option>)}
        </select>
      </>}
      <label htmlFor="repetir">Repetir</label>
      <button id="repetir" type="button" className="campo-botao" onClick={() => setFolha('repetir')}><span>{resumo}</span><span aria-hidden="true">›</span></button>
      <label htmlFor="horario">{chegada ? 'Horário esperado (opcional)' : 'Horário'}</label>
      <HorarioCampo key={hora.n} inicio={hora.i} fim={hora.f} aoMudar={(i, f) => setHora((h) => ({ ...h, i, f }))} />
      {chegada && (
        <div className="chaves-form" style={{ marginTop: 14 }}>
          <label className="check"><input type="checkbox" name="chegada_lembrar" value="1" checked={lembrarPessoa} onChange={(e) => setLembrarPessoa(e.target.checked)} /><span>Lembrar a pessoa se não tocar<small style={{ display: 'block', color: 'var(--cinza)', fontWeight: 400 }}>15 minutos depois do horário. Só ela recebe.</small></span></label>
          <label className="check" style={{ marginTop: 12 }}><input type="checkbox" name="chegada_avisar_pais" value="1" checked={avisarPais} onChange={(e) => setAvisarPais(e.target.checked)} /><span>Avisar você se ainda não chegou<small style={{ display: 'block', color: 'var(--cinza)', fontWeight: 400 }}>30 minutos depois do horário, bem leve.</small></span></label>
        </div>
      )}
      {folha === 'cheg' && (
        <div className="folha" role="dialog" aria-modal="true" aria-label="Sugestões de chegada">
          <div className="folha-in">
            <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setFolha(null)}><Icone nome="esq" tam={26} /></button><h2>Sugestões de chegada</h2></div>
            <div className="folha-lista">
              {CHEGADAS.map((n) => (
                <button key={n} type="button" onClick={() => { setTitulo(n); setFolha(null); }}><span>{n}</span><span aria-hidden="true">›</span></button>
              ))}
            </div>
          </div>
        </div>
      )}
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
        {!chegada && <div className="chaves-form">
          <label className="check"><input type="checkbox" name="exige_foto" value="1" checked={foto} onChange={(e) => setFoto(e.target.checked)} /><span>Exige foto para concluir{foto && <small>A foto precisa ser de hoje.</small>}</span></label>
          {gestor && <label className="check"><input type="checkbox" name="permite_adiar" value="1" checked={adiar} onChange={(e) => setAdiar(e.target.checked)} /><span>Pode adiar{adiar && <small>{livre ? 'A pessoa pode adiar 1 dia sozinha, uma vez por semana.' : 'A pessoa pede e você aprova.'}</small>}</span></label>}
          {gestor && adiar && <label className="check"><input type="checkbox" name="adiar_livre" value="1" checked={livre} onChange={(e) => setLivre(e.target.checked)} /><span>Pode adiar 1 dia sem pedir<small>Uma vez por semana. Você só recebe o aviso.</small></span></label>}
          {gestor && <label className="check"><input type="checkbox" name="exige_justificativa" value="1" checked={justif} onChange={(e) => setJustif(e.target.checked)} /><span>Exige justificativa se atrasar{justif && <small>Sem ela, a tarefa atrasada não conclui.</small>}</span></label>}
          <label className="check"><input type="checkbox" name="prioritaria" value="1" checked={prio} onChange={(e) => setPrio(e.target.checked)} /><span>Prioritária <Icone nome="bandeira" tam={16} cor="var(--prio)" />{prio && <small>Vem primeiro na lista.</small>}</span></label>
          {prio && comHora && (
            <div>
              <label style={{ marginTop: 0 }}>Lembrete extra</label>
              <LembreteExtra inicial={t?.lembrete_min} />
            </div>
          )}
        </div>}
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
