'use client';
// @arquivo  NovoDesafio.js: formulário de criar desafio.
// @tipo     componente
// @usa      ./Form, ./Icone, app/acoes-desafios, lib/desafios
// @usado-por app/(app)/desafios/novo/page.js
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Form from './Form';
import Icone from './Icone';
import { criarDesafio } from '@/app/acoes-desafios';
import { DESAFIOS, GRUPOS, PREMIOS_FAMILIA, opcoesMeta, textoMeta, diasPorMeta } from '@/lib/desafios';

const DIAS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const serve = (c, perfis) => perfis.every((p) => (p === 'familia' ? c.para === 'f' : c.para.includes(p)));

// Novo desafio: 1) para quem e qual (sugestões primeiro), 2) meta já sugerida, salvar. Três toques no caminho mais curto.
export default function NovoDesafio({ pessoas, inicial, sugestoes, tema, gestor, voltar = '/desafios', catalogoInicial = null, sugestao = null }) {
  const [quem, setQuem] = useState(inicial?.length ? inicial : pessoas[0] ? [pessoas[0].id] : ['familia']);
  const [busca, setBusca] = useState('');
  const [esc, setEsc] = useState(() => (catalogoInicial ? DESAFIOS.find((c) => c.id === catalogoInicial) || null : null)); // vindo da sugestão da criança
  const [meta, setMeta] = useState(() => (catalogoInicial ? DESAFIOS.find((c) => c.id === catalogoInicial)?.meta ?? null : null));
  const [coringa, setCoringa] = useState(true);
  const [premio, setPremio] = useState(PREMIOS_FAMILIA[0]);
  const familia = quem[0] === 'familia';
  const sel = familia ? [] : pessoas.filter((p) => quem.includes(p.id));
  const perfis = familia ? ['familia'] : [...new Set(sel.map((p) => p.perfil))];
  const lista = useMemo(() => DESAFIOS.filter((c) => serve(c, perfis) && (!c.tela || familia || sel.every((p) => p.tela_ativo))), [quem]); // eslint-disable-line react-hooks/exhaustive-deps
  const sem = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const achados = busca.trim() ? lista.filter((c) => sem(`${c.t} ${c.d || ''}`).includes(sem(busca.trim()))) : null;
  const sugs = (sugestoes[familia ? 'familia' : quem[0]] || []).map((s) => ({ ...s, c: DESAFIOS.find((c) => c.id === s.id) })).filter((s) => s.c && serve(s.c, perfis));

  function alternar(id) {
    if (!gestor) return;
    if (id === 'familia') { setQuem(['familia']); return; }
    const sem = quem.filter((x) => x !== 'familia');
    const novo = sem.includes(id) ? sem.filter((x) => x !== id) : [...sem, id];
    setQuem(novo.length ? novo : [id]);
  }
  function escolher(c) { setEsc(c); setMeta(c.meta); setCoringa(true); window.scrollTo?.(0, 0); }

  if (esc) {
    const ops = opcoesMeta(esc);
    const nomes = familia ? 'a família toda' : sel.map((p) => p.nome).join(', ');
    const crianca = sel.find((p) => p.perfil === 'c');
    const dias = esc.tarefa && !esc.tarefa.rec ? (esc.tarefa.dias || diasPorMeta(meta)) : null;
    const tarefaTxt = esc.tarefa && (esc.alvo === 'tarefa' || esc.alvo === 'categoria')
      ? `${esc.alvo === 'categoria' ? 'Se ainda não houver tarefa dessa categoria, o app' : 'O app'} cria a tarefa “${esc.tarefa.t}”${dias ? ` (${dias.map((d) => DIAS[d]).join(', ')})` : esc.tarefa.rec === 'mensal' ? ' (uma vez por mês)' : ' (todo dia)'}${familia ? ' para você marcar pela família' : ''}.`
      : null;
    return (
      <div className="folha-in" style={{ padding: 0 }}>
        <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setEsc(null)}><Icone nome="esq" tam={24} /></button><h2>{esc.t}</h2></div>
        <Form acao={criarDesafio} aoConcluir={() => window.location.assign('/desafios?aviso=criado')}>
          <input type="hidden" name="catalogo" value={esc.id} />
          {sugestao && <input type="hidden" name="sugestao" value={sugestao} />}
          {quem.map((q) => <input key={q} type="hidden" name="quem" value={q} />)}
          <input type="hidden" name="meta" value={meta ?? esc.meta} />
          <input type="hidden" name="coringa" value={coringa ? '1' : '0'} />
          {familia && <input type="hidden" name="premio" value={premio} />}
          <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
            <div className="des-top"><span className={`des-ic${familia ? ' mel' : ''}`}><Icone nome={esc.icone || 'hoje'} tam={22} /></span><span><b>{nomes}</b><small>{esc.d}</small></span></div>
            {ops.length > 1 && <>
              <label>Meta {esc.periodo === 'mes' ? 'do mês' : 'da semana'} <span style={{ fontWeight: 500 }}>(o app sugeriu {textoMeta(esc, esc.meta)})</span></label>
              <div className="chips">{ops.map(([v, t]) => <button type="button" key={v} className={(meta ?? esc.meta) === v ? 'on' : ''} aria-pressed={(meta ?? esc.meta) === v} onClick={() => setMeta(v)}>{t}</button>)}</div>
            </>}
            {familia && <>
              <label>Prêmio da família</label>
              <div className="chips">{PREMIOS_FAMILIA.slice(0, 6).map((p) => <button type="button" key={p} className={premio === p ? 'on' : ''} aria-pressed={premio === p} onClick={() => setPremio(p)}>{p}</button>)}</div>
              <select aria-label="Outro prêmio da família" style={{ marginTop: 10 }} value={PREMIOS_FAMILIA.slice(0, 6).includes(premio) ? '' : premio} onChange={(e) => e.target.value && setPremio(e.target.value)}>
                <option value="">Outros prêmios…</option>{PREMIOS_FAMILIA.slice(6).map((p) => <option key={p}>{p}</option>)}
              </select>
            </>}
            <p className="sub" style={{ fontSize: 'var(--f-apoio)', marginTop: 10 }}>
              {familia ? `Cumpriu a meta: ${premio} para todos.` : sel.map((p) => p.perfil === 'c' ? `${p.nome}: +10 estrelinhas no cofrinho.` : p.perfil === 'a' ? `${p.nome}: vale uma semana conquistada.` : `${p.nome}: acompanha o percentual.`).join(' ')}
              {sel.length > 1 && ' Cada um tem o próprio progresso e o próprio prêmio, sem comparar.'}
            </p>
            {tarefaTxt && <p className="sub" style={{ fontSize: 'var(--f-apoio)', marginTop: 6 }}>{tarefaTxt}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <label className="check" style={{ margin: 0 }}><input type="checkbox" checked disabled readOnly /> Começa de novo sozinho {esc.periodo === 'mes' ? 'todo mês' : 'toda semana'}</label>
              {['dias', 'seq', 'pct'].includes(esc.tipo) && <label className="check" style={{ margin: 0 }}><input type="checkbox" checked={coringa} onChange={(e) => setCoringa(e.target.checked)} /> Dia coringa: 1 dia difícil não conta</label>}
            </div>
          </div>
          {crianca && <div className="aviso info" style={{ margin: '14px 0 0' }}>Combinem juntos: pergunte {sel.length > 1 ? 'a cada um' : `ao ${crianca.nome}`} o que quer juntar no cofrinho.</div>}
          <button className="btn bloco" style={{ marginTop: 14 }}>Salvar desafio</button>
        </Form>
      </div>
    );
  }

  const linha = (c) => (
    <button type="button" key={c.id} className="cartao-l" onClick={() => escolher(c)}>
      <span className={`des-ic${c.para === 'f' ? ' mel' : ''}`}><Icone nome={c.icone || 'hoje'} tam={22} /></span>
      <span className="corpo"><b className="q">{c.t}</b><small className="por">{textoMeta(c)[0].toUpperCase() + textoMeta(c).slice(1)}</small></span>
      <span className="seta" aria-hidden="true">›</span>
    </button>
  );

  return (
    <div className="folha-in" style={{ padding: 0 }}>
      <div className="folha-cab"><Link prefetch={false} href={voltar} className="folha-volta" aria-label="Voltar"><Icone nome="esq" tam={24} /></Link><h2>Novo desafio</h2></div>
      {gestor && (
        <div>
          <label style={{ marginTop: 0 }}>Para quem <span style={{ fontWeight: 500 }}>(pode escolher mais de uma pessoa)</span></label>
          <div className="chips">
            {pessoas.map((p) => <button type="button" key={p.id} className={quem.includes(p.id) ? 'on' : ''} aria-pressed={quem.includes(p.id)} onClick={() => alternar(p.id)}>{p.nome}</button>)}
            <button type="button" className={familia ? 'on' : ''} aria-pressed={familia} onClick={() => alternar('familia')}>Família toda</button>
          </div>
          {sel.length > 1 && <p className="sub" style={{ fontSize: 'var(--f-apoio)' }}>Cada um terá o próprio desafio, com progresso e prêmio individuais.</p>}
        </div>
      )}
      {sugs.length > 0 && (
        <div>
          <div className="grupo-titulo" style={{ marginTop: 4 }}>Pensados para {familia ? 'a família' : sel.length === 1 ? sel[0].nome : 'eles'}</div>
          {sugs.map((s) => (
            <button type="button" key={s.id + s.tag} className="cartao-l" onClick={() => escolher(s.c)}>
              <span className={`des-ic${s.c.para === 'f' ? ' mel' : ''}`}><Icone nome={s.c.icone || 'hoje'} tam={22} /></span>
              <span className="corpo"><span className="sug-tag">{s.tag}</span><b className="q">{s.c.t}</b><small className="por">{s.por || `${s.c.d} Meta: ${textoMeta(s.c)}.`}</small></span>
              <span className="seta" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      )}
      <div>
        <div className="grupo-titulo" style={{ marginTop: 4 }}>Banco de desafios</div>
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar um desafio" aria-label="Buscar um desafio" style={{ marginBottom: 12 }} />
        {achados ? (<>
          {achados.map(linha)}
          {achados.length === 0 && <div className="card vazio">Nenhum desafio com esse nome para quem foi escolhido.</div>}
        </>) : (<>
          {GRUPOS.map(([g, t]) => {
            const l = lista.filter((c) => c.g === g);
            if (!l.length) return null;
            return (
              <details key={g} className="card banco-grupo">
                <summary><b>{t}</b><span>{l.length}</span></summary>
                {l.map(linha)}
              </details>
            );
          })}
          {lista.length === 0 && <div className="card vazio">Nenhum desafio deste tipo para quem foi escolhido.</div>}
        </>)}
      </div>
    </div>
  );
}
