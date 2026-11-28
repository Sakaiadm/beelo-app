'use client';
// @arquivo  NovoPremio.js: botão "+ Prêmio" da Vitrine; abre a tela de novo prêmio (digitar ou escolher uma sugestão).
// @tipo     componente
// @usa      ./Form, ./Icone, app/acoes-desafios, lib/desafios (PREMIOS)
// @usado-por app/(app)/desafios/premios/page.js
// @decisao  27/11 Thomas: mesma mecânica de "+ Tarefa": "+ Prêmio" abre a tela com os campos e um botão Sugestões (lâmpada);
//           tocar numa sugestão só preenche nome e valor, que ainda dá para mudar. A sugestão continua na lista (a Vitrine ganha uma cópia).
import { useState } from 'react';
import Form from './Form';
import Icone from './Icone';
import { adicionarPremio } from '@/app/acoes-desafios';

const FAIXA = { ate8: 'até 8 anos', mais8: '9 anos ou mais', todos: 'qualquer idade', teen: 'adolescente' };
const CATS_CRIANCA = [
  ['Comidas e doces', ['s1', 's6', 's7', 's8', 's11', 's12', 's13', 's15', 's16', 's22', 'v1', 'v11', 'v14', 'v15']],
  ['Brincadeiras em casa', ['s2', 's3', 's4', 's5', 's9', 's10', 's14', 's17', 's18', 's19', 'v2', 'v9', 'v10', 'v20', 'g4']],
  ['Passeios', ['s21', 'v3', 'v4', 'v5', 'v6', 'v8', 'v13', 'v16', 'v17', 'v18', 'v19', 'v21', 'v22', 'g11']],
  ['Com a família', ['v12', 'g2', 'g5']],
  ['Presentes e festas', ['s20', 'g1', 'g3', 'g6', 'g7', 'g8', 'g10', 'g12', 'g13', 'g14', 'g15', 'g16', 'g17', 'g18']],
  ['Aprender', ['g9']],
];
const CATS_TEEN = [
  ['Escolhas em casa', ['u1', 'u2', 'u3', 'u4', 'u6', 'u8', 'u15', 'u17']],
  ['Amigos e liberdade', ['u7', 'u9', 'u10', 'u11', 'u13']],
  ['Tela e tecnologia', ['u5', 'u16', 'u18', 'x1', 'x2', 'x3']],
  ['Compras e estilo', ['u12', 'u14', 'x4']],
  ['Eventos e cursos', ['u19', 'u20', 'u21', 'x6']],
];


export default function NovoPremio({ itens, un, teen }) {
  const [aberto, setAberto] = useState(false);
  const [sug, setSug] = useState(null); // null | 'cats' | nome da categoria
  const [nome, setNome] = useState('');
  const [custo, setCusto] = useState(teen ? 2 : 30);
  const [faixa, setFaixa] = useState(teen ? 'teen' : 'todos');
  const cats = teen ? CATS_TEEN : CATS_CRIANCA;
  const nos = new Set(cats.flatMap(([, ids]) => ids));
  const grupos = [...cats.map(([n, ids]) => [n, itens.filter((p) => ids.includes(p.id))]), ['Outras ideias', itens.filter((p) => !nos.has(p.id))]].filter(([, l]) => l.length);
  const grupo = grupos.find(([n]) => n === sug);
  const usar = (p) => { setNome(p.nome); setCusto(p.custo); setFaixa(p.faixa); setSug(null); };
  const fechar = () => { setAberto(false); setSug(null); };
  return (
    <>
      <button type="button" className="btn peq" onClick={() => setAberto(true)}><Icone nome="mais" tam={18} cor="#fff" />Prêmio</button>
      {aberto && (
        <div className="folha" role="dialog" aria-modal="true" aria-label="Novo prêmio">
          <div className="folha-in">
            {sug ? (
              <>
                <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setSug(sug === 'cats' ? null : 'cats')}><Icone nome="esq" tam={26} /></button><h2>{grupo ? grupo[0] : 'Sugestões'}</h2></div>
                <div className="folha-lista">
                  {sug === 'cats' && grupos.map(([n, l]) => (
                    <button key={n} type="button" onClick={() => setSug(n)}><span>{n}</span><span aria-hidden="true" style={{ color: 'var(--cinza)' }}>{l.length} ›</span></button>
                  ))}
                  {grupo && grupo[1].map((p) => (
                    <button key={p.id} type="button" onClick={() => usar(p)}>
                      <span>{p.nome}<small style={{ display: 'block', color: 'var(--cinza)', fontSize: 'var(--f-apoio)' }}>{p.custo} {un} · {FAIXA[p.faixa]}</small></span><span aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={fechar}><Icone nome="esq" tam={26} /></button><h2>Novo prêmio</h2></div>
                <Form acao={adicionarPremio} aoConcluir={() => setTimeout(() => { fechar(); setNome(''); }, 900)}>
                  <div className="rot-sug">
                    <label htmlFor="np-nome" style={{ marginTop: 0 }}>Prêmio</label>
                    <button type="button" className="btn peq sugestao-btn" onClick={() => setSug('cats')}><Icone nome="lampada" tam={18} cor="#fff" />Sugestões</button>
                  </div>
                  <input id="np-nome" name="nome" required maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} placeholder={teen ? 'Ex.: escolher a pizza da sexta' : 'Ex.: passeio no shopping'} />
                  <label htmlFor="np-custo">{un[0].toUpperCase() + un.slice(1)}</label>
                  <input id="np-custo" name="custo" type="number" min="1" max="1000" inputMode="numeric" value={custo} onChange={(e) => setCusto(e.target.value)} />
                  {teen ? <input type="hidden" name="faixa" value="teen" /> : (
                    <>
                      <label htmlFor="np-faixa">Para</label>
                      <select id="np-faixa" name="faixa" value={faixa} onChange={(e) => setFaixa(e.target.value)}><option value="todos">Qualquer idade</option><option value="ate8">Até 8 anos</option><option value="mais8">9 anos ou mais</option></select>
                    </>
                  )}
                  <button className="btn bloco" style={{ marginTop: 18 }}>Acrescentar à Vitrine</button>
                </Form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
