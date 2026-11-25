'use client';
// @arquivo  NovoDesafio.js: formulário de criar desafio.
// @tipo     componente
// @usa      ./Form, ./Icone, app/acoes-desafios, lib/desafios
// @decisao  26/11 Thomas: uma pessoa por vez (abas como as da Agenda), sem busca, assuntos em cartões e no máximo 2 "Pensados para…" no topo.
// @usado-por app/(app)/desafios/novo/page.js
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Form from './Form';
import Icone from './Icone';
import { criarDesafio } from '@/app/acoes-desafios';
import { DESAFIOS, GRUPOS, PREMIOS_FAMILIA, opcoesMeta, textoMeta, diasPorMeta } from '@/lib/desafios';

const DIAS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
// Texto e ícone de cada assunto do banco (cartões da primeira tela). @decisao 26/11 Thomas: a pessoa não sabe a palavra para buscar.
const ASSUNTO = {
  c: ['Constância', 'Dias em dia e tarefas feitas', 'hoje'],
  k: ['Uma categoria', 'Casa, cuidado, trabalho…', 'cCasa'],
  f: ['Movimento', 'Mexer o corpo', 'cEsporte'],
  e: ['Estudo', 'Lição, revisão, mochila', 'cEstudo'],
  l: ['Leitura', 'Ler um pouco todo dia', 'livro'],
  m: ['Combinados', 'Manhã, noite, casa e escola', 'check'],
  a: ['Autonomia', 'Fazer sem precisar de lembrete', 'lapis'],
  t: ['Tela', 'Usar a tela com equilíbrio', 'tela'],
  j: ['Família', 'Desafios para todos juntos', 'familia'],
  p: ['Adultos', 'Desafios pessoais', 'pessoa'],
};
const serve = (c, perfis) => perfis.every((p) => (p === 'familia' ? c.para === 'f' : c.para.includes(p)));

// Novo desafio: 1) para quem e qual (sugestões primeiro), 2) meta já sugerida, salvar. Três toques no caminho mais curto.
export default function NovoDesafio({ pessoas, inicial, euId = null, sugestoes, tema, gestor, voltar = '/desafios', catalogoInicial = null, sugestao = null }) {
  // Uma pessoa por vez. Abre com quem veio do link; senão, com quem está criando (Pai/Mãe); senão, a primeira da lista.
  const [quem, setQuem] = useState(inicial?.length ? inicial[0] : pessoas.some((p) => p.id === euId) ? euId : pessoas[0] ? pessoas[0].id : 'familia');
  const [grupo, setGrupo] = useState(null); // assunto aberto no banco (null = lista de assuntos)
  const [esc, setEsc] = useState(() => (catalogoInicial ? DESAFIOS.find((c) => c.id === catalogoInicial) || null : null)); // vindo da sugestão da criança
  const [meta, setMeta] = useState(() => (catalogoInicial ? DESAFIOS.find((c) => c.id === catalogoInicial)?.meta ?? null : null));
  const [coringa, setCoringa] = useState(true);
  const [premio, setPremio] = useState(PREMIOS_FAMILIA[0]);
  const familia = quem === 'familia';
  const sel = familia ? [] : pessoas.filter((p) => p.id === quem);
  const perfis = familia ? ['familia'] : [...new Set(sel.map((p) => p.perfil))];
  const lista = useMemo(() => DESAFIOS.filter((c) => serve(c, perfis) && (!c.tela || familia || sel.every((p) => p.tela_ativo))), [quem]); // eslint-disable-line react-hooks/exhaustive-deps
  const sugs = (sugestoes[familia ? 'familia' : quem] || []).map((s) => ({ ...s, c: DESAFIOS.find((c) => c.id === s.id) })).filter((s) => s.c && serve(s.c, perfis)).slice(0, 2); // no máximo 2, para os assuntos aparecerem logo abaixo

  function escolherQuem(id) { if (gestor) { setQuem(id); setGrupo(null); } }
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
          <input type="hidden" name="quem" value={quem} />
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
          <label style={{ marginTop: 0 }}>Para quem</label>
          <div className="seg pessoas" aria-label="Para quem">
            {pessoas.map((p) => <button type="button" key={p.id} className={quem === p.id ? 'on' : ''} aria-pressed={quem === p.id} onClick={() => escolherQuem(p.id)}>{p.nome}</button>)}
            <button type="button" className={familia ? 'on' : ''} aria-pressed={familia} onClick={() => escolherQuem('familia')}>Família toda</button>
          </div>
        </div>
      )}
      {sugs.length > 0 && (
        <div>
          <div className="grupo-titulo" style={{ marginTop: 4 }}>Pensados para {familia ? 'a família' : sel[0]?.nome}</div>
          {sugs.map((s) => (
            <button type="button" key={s.id + s.tag} className="cartao-l" onClick={() => escolher(s.c)}>
              <span className={`des-ic${s.c.para === 'f' ? ' mel' : ''}`}><Icone nome={s.c.icone || 'hoje'} tam={22} /></span>
              <span className="corpo"><span className="sug-tag">{s.tag}</span><b className="q">{s.c.t}</b><small className="por">{s.por || `${s.c.d} Meta: ${textoMeta(s.c)}.`}</small></span>
              <span className="seta" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      )}
      {grupo ? (
        <div>
          <div className="folha-cab" style={{ marginTop: 8 }}><button type="button" className="folha-volta" aria-label="Voltar aos assuntos" onClick={() => { setGrupo(null); window.scrollTo?.(0, 0); }}><Icone nome="esq" tam={24} /></button><h2>{ASSUNTO[grupo]?.[0] || grupo}</h2></div>
          <p className="sub" style={{ marginTop: 0 }}>Para {familia ? 'a família toda' : sel[0]?.nome} · toque em um desafio para escolher a meta</p>
          {lista.filter((c) => c.g === grupo).map(linha)}
        </div>
      ) : (
        <div>
          <div className="grupo-titulo" style={{ marginTop: 4 }}>Escolha pelo assunto</div>
          {GRUPOS.map(([g, t]) => {
            const n = lista.filter((c) => c.g === g).length;
            if (!n) return null;
            const [nome, frase, icone] = ASSUNTO[g] || [t, '', 'hoje'];
            return (
              <button type="button" key={g} className="cartao-l" onClick={() => { setGrupo(g); window.scrollTo?.(0, 0); }}>
                <span className={`des-ic${g === 'j' ? ' mel' : ''}`}><Icone nome={icone} tam={22} /></span>
                <span className="corpo"><b className="q">{nome}</b><small className="por">{frase}</small></span>
                <span className="contagem">{n}</span>
                <span className="seta" aria-hidden="true">›</span>
              </button>
            );
          })}
          {lista.length === 0 && <div className="card vazio">Nenhum desafio deste tipo para quem foi escolhido.</div>}
        </div>
      )}
    </div>
  );
}
