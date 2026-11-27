'use client';
// @arquivo  TelaForms.js: formulários do tempo de tela: previsto (com horários), regras de lançamento, lançar o real e propor mudança.
// @tipo     componente
// @usa      ./Form, ./Foto, ./TempoCampo, ./RelogioHora, ./RepetirCampo, app/acoes, lib/util, lib/aparelhos, lib/festa
// @usado-por app/(app)/tela/page.js, components/Tarefa.js
import { useRef, useState } from 'react';
import Link from 'next/link';
import Form from './Form';
import Foto from './Foto';
import TempoCampo from './TempoCampo';
import RelogioHora from './RelogioHora';
import RepetirCampo from './RepetirCampo';
import { salvarPrevisto, salvarTelaReal, proporTela, salvarLancamentoTela } from '@/app/acoes';
import { fmtMin, parseMin } from '@/lib/util';
import { aparelhosDo } from '@/lib/aparelhos';
import { prepararSom } from '@/lib/festa';

const TODOS = [0, 1, 2, 3, 4, 5, 6];
const SEG_SEX = [1, 2, 3, 4, 5];
const igual = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
const minOuZero = (t) => { const m = parseMin(t); return Number.isNaN(m) ? NaN : m || 0; };

// Opção do campo Repetir (mesmo padrão das tarefas) a partir dos dias do previsto.
const opcaoDosDias = (umDia, dias) => (umDia ? 'uma' : igual(dias, TODOS) ? 'diaria' : igual(dias, SEG_SEX) ? 'semana' : 'pers');

// Previsto: já vem com o atual (ou com a sugestão), dias no campo Repetir (igual às tarefas: Uma vez,
// Diariamente, Seg. a Sex., Personalizar), tempos prontos e "Mais opções" para começo e fim. Salvar um novo para os mesmos dias troca o antigo.
// - inicial: { cel, pc, dias, inicio, fim, umDia }  - substitui: id do previsto que está sendo editado
// - outros: [{ nome, cel, pc, dias }] para "Usar o mesmo de…" (Raio-X S31)
// - horarios: { hora, ate } da tarefa "Lançar tempo de tela" (só para os responsáveis): "Lançar sempre às" e "Pode lançar até" (Thomas 27/11)
export function PrevistoForm({ membro, hoje, inicial, substitui, outros = [], cancelarHref, horarios }) {
  const ini = inicial || { cel: 180, pc: null, dias: TODOS };
  const [versao, setVersao] = useState(0);
  const [listaCopiar, setListaCopiar] = useState(false); // com 2 ou mais pessoas, o botão abre uma lista curta
  const [cel, setCel] = useState(ini.cel || 0);
  const [pc, setPc] = useState(ini.pc || 0);
  const [dias, setDias] = useState(ini.dias?.length ? ini.dias : TODOS);
  const [umDia, setUmDia] = useState(!!ini.umDia);
  const [opcao, setOpcao] = useState(opcaoDosDias(!!ini.umDia, ini.dias?.length ? ini.dias : TODOS));
  const mudarRepetir = (o, d) => {
    setOpcao(o); setUmDia(o === 'uma');
    if (o === 'diaria') setDias(TODOS); else if (o === 'semana') setDias(SEG_SEX); else if (o === 'pers') setDias(d);
  };
  const [inicio, setInicio] = useState(ini.inicio && ini.inicio > hoje ? ini.inicio : hoje);
  const [fim, setFim] = useState(ini.fim && !ini.umDia ? ini.fim : '');
  const [base, setBase] = useState({ cel: ini.cel || null, pc: ini.pc || null });
  const total = (Number.isNaN(cel) ? 0 : cel) + (Number.isNaN(pc) ? 0 : pc);
  const zerado = total === 0;
  const copiar = (o) => { setBase({ cel: o.cel, pc: o.pc }); setCel(o.cel || 0); setPc(o.pc || 0); if (o.dias?.length) { setDias(o.dias); setUmDia(false); setOpcao(opcaoDosDias(false, o.dias)); } setVersao((v) => v + 1); };
  const modo = umDia ? 'dia' : 'dias';
  return (
    <Form acao={salvarPrevisto} okTxt="Previsto salvo.">
      <input type="hidden" name="membro" value={membro} />
      <input type="hidden" name="modo" value={modo} />
      <input type="hidden" name="fim" value={umDia ? '' : fim} />
      {substitui && <input type="hidden" name="substitui" value={substitui} />}
      {!umDia && dias.map((d) => <input key={d} type="hidden" name="dias" value={d} />)}
      {!substitui && outros.length > 0 && (
        <div className="usar-mesmo">
          <span>Usar o mesmo de</span>
          {outros.length === 1
            ? <button type="button" className="hoje-peq" onClick={() => copiar(outros[0])}>{outros[0].nome}</button>
            : <>
                <button type="button" className="hoje-peq" aria-expanded={listaCopiar} onClick={() => setListaCopiar((v) => !v)}>Copiar de…</button>
                {listaCopiar && <div className="usar-lista">{outros.map((o) => <button key={o.nome} type="button" onClick={() => { copiar(o); setListaCopiar(false); }}>{o.nome}</button>)}</div>}
              </>}
        </div>
      )}
      <div className="tempo-real"><div className="tempo-nome"><b>Celular</b></div>
        <TempoCampo key={`c${versao}`} id={`pc-${membro}`} name="celular" etiqueta="Celular" valor={base.cel} aoMudar={setCel} /></div>
      <div className="tempo-real"><div className="tempo-nome"><b>Computador</b></div>
        <TempoCampo key={`p${versao}`} id={`pp-${membro}`} name="computador" etiqueta="Computador" valor={base.pc} aoMudar={setPc} /></div>
      <p className="total-dia">Total do dia: <b>{fmtMin(total)}</b></p>
      <RepetirCampo nome={`rep-${membro}`} hoje={hoje} opcao={opcao} dias={opcao === 'pers' ? dias : SEG_SEX} aoMudar={mudarRepetir} semCampos />
      {horarios && (
        <div className="duas-campos">
          <div><label htmlFor={`hl-${membro}`}>Lançar sempre às</label>
            <RelogioHora id={`hl-${membro}`} name="tela_hora" rotulo="Lançar sempre às" defaultValue={horarios.hora || '08:00'} /></div>
          <div><label htmlFor={`ha-${membro}`}>Pode lançar até</label>
            <RelogioHora id={`ha-${membro}`} name="tela_ate" rotulo="Pode lançar até" defaultValue={horarios.ate || ''} vazio="Sem limite" /></div>
        </div>
      )}
      {umDia && <><label htmlFor={`pi-${membro}`}>Dia</label><input id={`pi-${membro}`} type="date" name="inicio" min={hoje} value={inicio} onChange={(e) => setInicio(e.target.value)} required /></>}
      {!umDia && <details className="mais-op" open={!!fim || inicio !== hoje || undefined}>
        <summary>Mais opções</summary>
        <div className="linha">
          <div><label htmlFor={`pi-${membro}`}>Começa em</label><input id={`pi-${membro}`} type="date" name="inicio" min={hoje} value={inicio} onChange={(e) => setInicio(e.target.value)} required /></div>
          {(
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
      </details>}
      {zerado && <p className="total-dia">Coloque o tempo do celular ou do computador.</p>}
      <button className="btn bloco" style={{ marginTop: zerado ? 10 : 14 }} disabled={zerado}>{substitui ? 'Salvar alteração' : 'Salvar previsto'}</button>
      {substitui && cancelarHref && <Link prefetch={false} className="btn sec bloco" style={{ marginTop: 8 }} href={cancelarHref}>Cancelar</Link>}
    </Form>
  );
}

// Regras de lançamento de outra pessoa: "Pode adiar" e "Exige justificativa". Salvam sozinhas ao mudar (Raio-X S9).
// O horário ("Lançar sempre às" e "Pode lançar até") agora fica dentro do "Lançar tempo previsto" (PrevistoForm).
export function LancamentoForm({ membro, adiar: adiar0, justificativa: just0 }) {
  const ref = useRef(null);
  const [adiar, setAdiar] = useState(!!adiar0);
  const [just, setJust] = useState(!!just0);
  const enviar = () => setTimeout(() => ref.current?.querySelector('form')?.requestSubmit(), 0);
  return (
    <div ref={ref}>
      <Form acao={salvarLancamentoTela} okTxt="Salvo.">
        <input type="hidden" name="membro" value={membro} />
        <input type="hidden" name="tela_regras" value="1" />
        {adiar && <input type="hidden" name="tela_adiar" value="1" />}
        {just && <input type="hidden" name="tela_justificativa" value="1" />}
        <div className="lin-chave"><span>Pode adiar<small>Pode pedir para lançar mais tarde</small></span>
          <button type="button" role="switch" aria-checked={adiar} aria-label="Pode adiar" className={`chave ${adiar ? 'on' : ''}`} onClick={() => { setAdiar(!adiar); enviar(); }} /></div>
        <div className="lin-chave"><span>Exige justificativa se atrasar</span>
          <button type="button" role="switch" aria-checked={just} aria-label="Exige justificativa se atrasar" className={`chave ${just ? 'on' : ''}`} onClick={() => { setJust(!just); enviar(); }} /></div>
      </Form>
    </div>
  );
}

// Lançar o tempo de ontem. O previsto aparece como texto ("de 2h00") ao lado do nome do aparelho (S20).
// crianca: "Quanto tempo você usou ontem?" com botões grandes (S25). aoConcluir: para a tarefa de Hoje (S19).
// @decisao Thomas 27/11: em TODO lançamento (tela, atividade do dia, visão do acompanhado) há dois ícones redondos azuis,
// câmera e galeria, ao lado dos tempos prontos; vale também para a criança. "Como achar?" virou "Como encontrar?".
export function RealForm({ eu, data, previsto, atual, membroId, familia, crianca, aoConcluir }) {
  const formato = previsto?.formato === 'total' ? 'total' : 'aparelho';
  const { cel, pc } = aparelhosDo(previsto);
  const [obs, setObs] = useState(!!atual?.obs);
  const [ajuda, setAjuda] = useState(false);
  const de = (m) => (previsto && m != null ? <small className="de-prev">de {fmtMin(m)}</small> : null);
  const campo = (id, name, nome, prev, valor, fotoNome) => (
    <div className="tempo-real">
      <div className="tempo-nome"><b>{nome}</b>{de(prev)}</div>
      <TempoCampo id={id} name={name} etiqueta={nome} valor={valor} grande={crianca}
        extra={<Foto nome={fotoNome} familia={familia} membro={eu} redondo />} />
    </div>
  );
  return (
    <Form acao={salvarTelaReal} okTxt={crianca ? 'Pronto! Tempo de tela lançado.' : 'Tempo de tela salvo.'} aoConcluir={aoConcluir}>
      <input type="hidden" name="data" value={data} />
      <input type="hidden" name="formato" value={formato} />
      <input type="hidden" name="membro" value={membroId} />
      {crianca && <p className="sub" style={{ margin: '0 0 6px', fontWeight: 700 }}>Quanto tempo você usou ontem?</p>}
      {formato === 'total' ? (
        campo(`rt-${data}`, 'total', 'Total', previsto?.min_total, atual?.min_total ?? null, 'foto_celular')
      ) : (
        <>
          {cel && campo(`rc-${data}`, 'celular', 'Celular', previsto?.min_celular, atual?.min_celular ?? null, 'foto_celular')}
          {pc && campo(`rp-${data}`, 'computador', 'Computador', previsto?.min_computador, atual?.min_computador ?? null, 'foto_computador')}
        </>
      )}
      {!crianca && (
        <div className="obs-linha">
          {!obs ? <button type="button" className="link-mais" onClick={() => setObs(true)}>+ Observação</button> : <span />}
          <button type="button" className="link-mais" aria-expanded={ajuda} onClick={() => setAjuda((v) => !v)}>Como encontrar?</button>
        </div>
      )}
      {!crianca && ajuda && <p className="como-achar-txt">Android: Configurações › Bem-estar digital.<br />iPhone: Ajustes › Tempo de Uso › Ver Todas as Atividades.</p>}
      {!crianca && obs && (<><label htmlFor={`obs-${data}`}>Observação</label>
        <input id={`obs-${data}`} name="obs" maxLength={300} defaultValue={atual?.obs || ''} placeholder="ex.: trabalho da faculdade no computador" /></>)}
      <button className="btn bloco" style={{ marginTop: 14 }} onPointerDown={prepararSom} onKeyDown={prepararSom}>Salvar</button>
    </Form>
  );
}

const MOTIVOS = ['Trabalho da escola', 'Filme em família', 'Viagem'];
const MAIS = [30, 60, 120].map((m) => ({ rotulo: '+' + fmtMin(m).replace('h00', 'h'), min: m }));

// Pedir mais tempo para um dia: começa no previsto de hoje e sobe de 30 em 30 minutos (S24).
export function PropostaForm({ hoje, previsto }) {
  const formato = previsto?.formato === 'total' ? 'total' : 'aparelho';
  const aparelhos = aparelhosDo(previsto);
  const [motivo, setMotivo] = useState('');
  return (
    <Form acao={proporTela} okTxt="Pedido enviado. Seus responsáveis vão responder." limpar>
      <input type="hidden" name="formato" value={formato} />
      <label htmlFor="pdata">Dia</label>
      <input id="pdata" type="date" name="data" min={hoje} defaultValue={hoje} required />
      {formato === 'total' ? (
        <TempoCampo id="ptot" name="total" rotulo="Total que você precisa" valor={previsto?.min_total ?? null} base={previsto?.min_total ?? 0} prontos={MAIS} required />
      ) : (<>
        {aparelhos.cel && <TempoCampo id="pcel" name="celular" rotulo="Celular" valor={previsto?.min_celular ?? null} base={previsto?.min_celular ?? 0} prontos={MAIS} required />}
        {aparelhos.pc && <TempoCampo id="ppc" name="computador" rotulo="Computador" valor={previsto?.min_computador ?? null} base={previsto?.min_computador ?? 0} prontos={MAIS} required />}
      </>)}
      <label htmlFor="pmot">Motivo</label>
      <div className="chips" style={{ marginBottom: 8 }}>{MOTIVOS.map((m) => <button key={m} type="button" className={motivo === m ? 'on' : ''} onClick={() => setMotivo(m)}>{m}</button>)}</div>
      <input id="pmot" name="motivo" required minLength={3} maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="ou escreva aqui" />
      <button className="btn sec" style={{ marginTop: 12 }}>Pedir mais tempo</button>
    </Form>
  );
}
