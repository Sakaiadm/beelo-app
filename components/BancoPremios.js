'use client';
import { useState } from 'react';
import Form from './Form';
import Icone from './Icone';
import { adicionarPremio } from '@/app/acoes-desafios';

const FAIXA = { ate8: 'até 8 anos', mais8: '9 anos ou mais', todos: 'qualquer idade', teen: 'adolescente' };
const FAIXAS_ESTRELA = [['Até 20 estrelinhas', 0, 20], ['De 25 a 50', 21, 50], ['De 60 a 100', 51, 100], ['Acima de 100', 101, Infinity]];
const FAIXAS_SEMANA = [['1 semana', 0, 1], ['2 semanas', 2, 2], ['3 semanas ou mais', 3, Infinity]];
const sem = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Banco de prêmios fechado por faixa de preço, com busca; a linha inteira acrescenta o prêmio (Raio-X U91 e U92).
export default function BancoPremios({ itens, un, teen }) {
  const [q, setQ] = useState('');
  const faixas = teen ? FAIXAS_SEMANA : FAIXAS_ESTRELA;
  const achados = q.trim() ? itens.filter((p) => sem(p.nome).includes(sem(q.trim()))) : null;
  const linha = (p) => (
    <Form key={p.id} acao={adicionarPremio} simples>
      <input type="hidden" name="catalogo" value={p.id} />
      <button className="vit vit-linha" aria-label={`Acrescentar ${p.nome}`}>
        <span className="corpo"><b>{p.nome}</b><small>{p.custo} {un} · {FAIXA[p.faixa]}</small></span>
        <span className="mais-ic" aria-hidden="true"><Icone nome="mais" tam={18} cor="#fff" /></span>
      </button>
    </Form>
  );
  return (
    <div className="banco">
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar um prêmio" aria-label="Buscar um prêmio" />
      {achados ? (
        <div className="card" style={{ padding: '4px 18px' }}>
          {achados.length === 0 ? <div className="vazio">Nenhum prêmio com esse nome.</div> : achados.map(linha)}
        </div>
      ) : faixas.map(([nome, de, ate]) => {
        const l = itens.filter((p) => p.custo >= de && p.custo <= ate);
        if (!l.length) return null;
        return (
          <details key={nome} className="card banco-grupo">
            <summary><b>{nome}</b><span>{l.length}</span></summary>
            {l.map(linha)}
          </details>
        );
      })}
    </div>
  );
}
